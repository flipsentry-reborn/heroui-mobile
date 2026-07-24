import { observer } from "mobx-react-lite";
import type { JSX } from "react";
import { useEffect, useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { router, type Href } from "expo-router";
import {
  Button,
  Spinner,
  Typography,
  useThemeColor,
  useToast,
} from "heroui-native";
import Animated, {
  Easing,
  FadeInDown,
  FadeOutUp,
  LinearTransition,
} from "react-native-reanimated";

import { USE_MOCK } from "@/api/config";
import { AuthField, AuthHint } from "@/features/auth/auth-field";
import { AuthInputOtp } from "@/features/auth/auth-input-otp";
import { AuthPhoneField } from "@/features/auth/auth-phone-field";
import { AuthOrDivider, AuthShell } from "@/features/auth/auth-shell";
import { AUTH_CONTROL_BACKGROUND } from "@/features/auth/auth-theme";
import { BrandButton } from "@/components/ui/brand-button";
import { MOCK_ACCOUNT_CREDENTIALS } from "@/mocks/services/account";
import { useStore } from "@/store/store";

const SOFT_ENTER = FadeInDown.duration(320).easing(Easing.out(Easing.cubic));
const SOFT_EXIT = FadeOutUp.duration(180).easing(Easing.in(Easing.cubic));
const SOFT_LAYOUT = LinearTransition.duration(280).easing(
  Easing.out(Easing.cubic),
);

function errorMessage(error: unknown): string {
  if (Array.isArray(error)) return error.join(", ");
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/**
 * Login — email/phone identifier first, then secret (password or OTP)
 * with a soft reveal. Switch methods via secondary CTA.
 */
export const LoginScreen = observer(function LoginScreen(): JSX.Element {
  const { userStore } = useStore();
  const { toast } = useToast();
  const [accentForeground] = useThemeColor(["accent-foreground"]);

  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");
  /** Email: identifier → password. Phone: phone → OTP after send. */
  const [emailStep, setEmailStep] = useState<"identifier" | "password">(
    "identifier",
  );

  const [email, setEmail] = useState(
    USE_MOCK ? MOCK_ACCOUNT_CREDENTIALS.email : "",
  );
  const [password, setPassword] = useState(
    USE_MOCK ? MOCK_ACCOUNT_CREDENTIALS.password : "",
  );
  const [phoneNumber, setPhoneNumber] = useState(
    USE_MOCK ? "2345678901" : "",
  );
  const [callingCode, setCallingCode] = useState("1");
  const [countryIso2, setCountryIso2] = useState("US");
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [formattedPhone, setFormattedPhone] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  const fullPhone = useMemo(
    () => `+${callingCode}${phoneNumber.replace(/\D/g, "")}`,
    [callingCode, phoneNumber],
  );

  const switchMethod = (next: "email" | "phone") => {
    setLoginMethod(next);
    setError("");
    setIsCodeSent(false);
    setOtp("");
    setEmailStep("identifier");
  };

  const onEmailContinue = () => {
    setError("");
    if (!isValidEmail(email)) {
      setError("Enter a valid email");
      return;
    }
    setEmailStep("password");
  };

  const onEmailLogin = async () => {
    setError("");
    setSubmitting(true);
    try {
      await userStore.login({ email: email.trim(), password });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const onSendPhoneCode = async () => {
    setError("");
    setSubmitting(true);
    try {
      await userStore.sendPhoneLoginCode(fullPhone);
      setFormattedPhone(fullPhone);
      setIsCodeSent(true);
      setCountdown(30);
      toast.show({
        variant: "default",
        label: "Code sent",
        description: USE_MOCK
          ? `Use OTP ${MOCK_ACCOUNT_CREDENTIALS.otp}`
          : "Check your SMS",
        duration: 3000,
      });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const onVerifyPhone = async () => {
    setError("");
    setSubmitting(true);
    try {
      await userStore.verifyPhoneLogin(formattedPhone, otp);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const title =
    loginMethod === "email"
      ? "Log in to your account"
      : isCodeSent
        ? "Enter verification code"
        : "Log in to your account";

  const subtitle =
    loginMethod === "email"
      ? emailStep === "password"
        ? "Enter your password to continue."
        : "Welcome back! Please enter your details."
      : isCodeSent
        ? `We sent a code to ${formattedPhone}`
        : "Welcome back! Please enter your details.";

  return (
    <AuthShell
      title={title}
      subtitle={subtitle}
      onBack={() => router.back()}
    >
      {loginMethod === "email" ? (
        <Animated.View layout={SOFT_LAYOUT} className="gap-4">
          <AuthField
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            textContentType="emailAddress"
            placeholder="Email"
            returnKeyType={emailStep === "identifier" ? "next" : "done"}
            onSubmitEditing={() => {
              if (emailStep === "identifier") onEmailContinue();
            }}
          />

          {emailStep === "password" ? (
            <Animated.View
              key="email-password-step"
              entering={SOFT_ENTER}
              exiting={SOFT_EXIT}
              layout={SOFT_LAYOUT}
              className="gap-4"
            >
              <AuthField
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textContentType="password"
                placeholder="Password"
                autoFocus
                returnKeyType="go"
                onSubmitEditing={() => {
                  if (password) void onEmailLogin();
                }}
              />
              <Pressable
                onPress={() => router.push("/forgot-password" as Href)}
                className="self-end"
              >
                <Typography type="body-sm" className="text-muted">
                  Forgot password?
                </Typography>
              </Pressable>

              <BrandButton
                className="min-h-12 w-full rounded-full"
                isDisabled={submitting || !email || !password}
                onPress={() => void onEmailLogin()}
              >
                {submitting ? (
                  <Spinner size="sm" color={accentForeground} />
                ) : null}
                <BrandButton.Label>Login</BrandButton.Label>
              </BrandButton>
            </Animated.View>
          ) : (
            <Animated.View
              key="email-continue-step"
              entering={SOFT_ENTER}
              exiting={SOFT_EXIT}
              layout={SOFT_LAYOUT}
            >
              <BrandButton
                className="min-h-12 w-full rounded-full"
                isDisabled={!email.trim()}
                onPress={onEmailContinue}
              >
                <BrandButton.Label>Continue</BrandButton.Label>
              </BrandButton>
            </Animated.View>
          )}

          <AuthOrDivider />

          <Button
            variant="secondary"
            className="min-h-12 w-full rounded-full border-0"
            style={{ backgroundColor: AUTH_CONTROL_BACKGROUND }}
            onPress={() => switchMethod("phone")}
          >
            <Button.Label className="text-foreground">
              Login with Phone Number
            </Button.Label>
          </Button>
        </Animated.View>
      ) : !isCodeSent ? (
        <Animated.View layout={SOFT_LAYOUT} className="gap-4">
          <AuthPhoneField
            nationalNumber={phoneNumber}
            onNationalNumberChange={setPhoneNumber}
            callingCode={callingCode}
            onCallingCodeChange={setCallingCode}
            countryIso2={countryIso2}
            onCountryIso2Change={setCountryIso2}
            placeholder="Phone number"
          />

          <BrandButton
            className="min-h-12 w-full rounded-full"
            isDisabled={
              submitting || phoneNumber.replace(/\D/g, "").length < 7
            }
            onPress={() => void onSendPhoneCode()}
          >
            {submitting ? <Spinner size="sm" color={accentForeground} /> : null}
            <BrandButton.Label>Continue</BrandButton.Label>
          </BrandButton>

          <AuthOrDivider />

          <Button
            variant="secondary"
            className="min-h-12 w-full rounded-full border-0"
            style={{ backgroundColor: AUTH_CONTROL_BACKGROUND }}
            onPress={() => switchMethod("email")}
          >
            <Button.Label className="text-foreground">
              Login with Email
            </Button.Label>
          </Button>
        </Animated.View>
      ) : (
        <Animated.View
          key="phone-otp-step"
          entering={SOFT_ENTER}
          layout={SOFT_LAYOUT}
          className="gap-4"
        >
          <AuthInputOtp value={otp} onChange={setOtp} />

          <BrandButton
            className="min-h-12 w-full rounded-full"
            isDisabled={submitting || otp.length !== 6}
            onPress={() => void onVerifyPhone()}
          >
            {submitting ? <Spinner size="sm" color={accentForeground} /> : null}
            <BrandButton.Label>Verify & sign in</BrandButton.Label>
          </BrandButton>

          <Button
            variant="ghost"
            isDisabled={countdown > 0 || submitting}
            onPress={() => void onSendPhoneCode()}
          >
            <Button.Label>
              {countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
            </Button.Label>
          </Button>

          <Button variant="ghost" onPress={() => setIsCodeSent(false)}>
            <Button.Label>Change number</Button.Label>
          </Button>
        </Animated.View>
      )}

      {error ? (
        <Typography type="body-sm" className="text-center text-danger">
          {error}
        </Typography>
      ) : null}

      {USE_MOCK ? (
        <View className="gap-1 pt-2">
          <AuthHint>
            {`Mock: ${MOCK_ACCOUNT_CREDENTIALS.email} / ${MOCK_ACCOUNT_CREDENTIALS.password}`}
          </AuthHint>
          <AuthHint>
            {`Phone ${MOCK_ACCOUNT_CREDENTIALS.phone} · OTP ${MOCK_ACCOUNT_CREDENTIALS.otp}`}
          </AuthHint>
        </View>
      ) : null}
    </AuthShell>
  );
});
