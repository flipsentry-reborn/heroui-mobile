import { observer } from "mobx-react-lite";
import type { JSX } from "react";
import { useEffect, useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { router, type Href } from "expo-router";
import {
  Button,
  InputOTP,
  REGEXP_ONLY_DIGITS,
  Spinner,
  Tabs,
  Typography,
  useToast,
} from "heroui-native";

import { AuthField, AuthHint } from "@/features/auth/auth-field";
import { AuthShell } from "@/features/auth/auth-shell";
import { USE_MOCK } from "@/api/config";
import { MOCK_ACCOUNT_CREDENTIALS } from "@/mocks/services/account";
import { useStore } from "@/store/store";

function errorMessage(error: unknown): string {
  if (Array.isArray(error)) return error.join(", ");
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}

export const LoginScreen = observer(function LoginScreen(): JSX.Element {
  const { userStore } = useStore();
  const { toast } = useToast();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");

  const [email, setEmail] = useState(
    USE_MOCK ? MOCK_ACCOUNT_CREDENTIALS.email : "",
  );
  const [password, setPassword] = useState(
    USE_MOCK ? MOCK_ACCOUNT_CREDENTIALS.password : "",
  );
  const [phoneNumber, setPhoneNumber] = useState(
    USE_MOCK ? "2345678901" : "",
  );
  const [callingCode] = useState("1");
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [formattedPhone, setFormattedPhone] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Register fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [allowNotifications, setAllowNotifications] = useState(true);

  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  const fullPhone = useMemo(
    () => `+${callingCode}${phoneNumber.replace(/\D/g, "")}`,
    [callingCode, phoneNumber],
  );

  const onEmailLogin = async () => {
    setError("");
    setSubmitting(true);
    try {
      await userStore.login({
        email: email.trim(),
        password,
      });
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

  const onRegister = async () => {
    setError("");
    if (regPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (regPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setSubmitting(true);
    try {
      await userStore.register({
        email: regEmail.trim(),
        password: regPassword,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        allowSmsAndEmailNotifications: allowNotifications,
      });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title={mode === "login" ? "Welcome back" : "Create account"}
      subtitle={
        mode === "login"
          ? "Sign in with email or phone"
          : "Start flipping smarter"
      }
    >
      <Tabs
        value={mode}
        onValueChange={(v) => {
          setMode(v as "login" | "register");
          setError("");
          setIsCodeSent(false);
        }}
        className="mb-6"
      >
        <Tabs.List className="bg-surface w-full">
          <Tabs.Trigger value="login" className="flex-1">
            <Tabs.Label>Login</Tabs.Label>
          </Tabs.Trigger>
          <Tabs.Trigger value="register" className="flex-1">
            <Tabs.Label>Create Account</Tabs.Label>
          </Tabs.Trigger>
          <Tabs.Indicator />
        </Tabs.List>
      </Tabs>

      {mode === "login" ? (
        <View className="gap-4">
          <View className="flex-row gap-2">
            <Button
              variant={loginMethod === "email" ? "primary" : "secondary"}
              size="sm"
              className="flex-1"
              onPress={() => {
                setLoginMethod("email");
                setIsCodeSent(false);
                setError("");
              }}
            >
              Email
            </Button>
            <Button
              variant={loginMethod === "phone" ? "primary" : "secondary"}
              size="sm"
              className="flex-1"
              onPress={() => {
                setLoginMethod("phone");
                setError("");
              }}
            >
              Phone
            </Button>
          </View>

          {loginMethod === "email" ? (
            <>
              <AuthField
                label="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                textContentType="emailAddress"
                placeholder="you@example.com"
              />
              <AuthField
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textContentType="password"
                placeholder="••••••••"
              />
              <Pressable onPress={() => router.push("/forgot-password" as Href)}>
                <Typography className="text-muted text-sm self-end">
                  Forgot password?
                </Typography>
              </Pressable>
              <Button
                variant="primary"
                isDisabled={submitting || !email || !password}
                onPress={() => void onEmailLogin()}
              >
                {submitting ? <Spinner size="sm" /> : null}
                <Button.Label>Sign in</Button.Label>
              </Button>
            </>
          ) : !isCodeSent ? (
            <>
              <AuthField
                label="Phone number"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                placeholder="2345678901"
              />
              <AuthHint>{`Country code +${callingCode} · E.164: ${fullPhone}`}</AuthHint>
              <Button
                variant="primary"
                isDisabled={submitting || phoneNumber.replace(/\D/g, "").length < 7}
                onPress={() => void onSendPhoneCode()}
              >
                {submitting ? <Spinner size="sm" /> : null}
                <Button.Label>Send code</Button.Label>
              </Button>
            </>
          ) : (
            <>
              <Typography className="text-muted text-sm">
                Enter the 6-digit code sent to {formattedPhone}
              </Typography>
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={setOtp}
                pattern={REGEXP_ONLY_DIGITS}
              >
                <InputOTP.Group>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTP.Slot key={i} index={i} />
                  ))}
                </InputOTP.Group>
              </InputOTP>
              <Button
                variant="primary"
                isDisabled={submitting || otp.length !== 6}
                onPress={() => void onVerifyPhone()}
              >
                {submitting ? <Spinner size="sm" /> : null}
                <Button.Label>Verify & sign in</Button.Label>
              </Button>
              <Button
                variant="ghost"
                isDisabled={countdown > 0 || submitting}
                onPress={() => void onSendPhoneCode()}
              >
                <Button.Label>
                  {countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
                </Button.Label>
              </Button>
            </>
          )}
        </View>
      ) : (
        <View className="gap-4">
          <AuthField
            label="First name"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
            placeholder="Alex"
          />
          <AuthField
            label="Last name"
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
            placeholder="Rivera"
          />
          <AuthField
            label="Email"
            value={regEmail}
            onChangeText={setRegEmail}
            keyboardType="email-address"
            placeholder="you@example.com"
          />
          <AuthField
            label="Password"
            value={regPassword}
            onChangeText={setRegPassword}
            secureTextEntry
            placeholder="At least 6 characters"
          />
          <AuthField
            label="Confirm password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholder="Repeat password"
          />
          <Pressable
            className="flex-row items-center gap-2 py-1"
            onPress={() => setAllowNotifications((v) => !v)}
          >
            <View
              className={`h-5 w-5 rounded border items-center justify-center ${
                allowNotifications
                  ? "bg-accent border-accent"
                  : "border-border bg-transparent"
              }`}
            >
              {allowNotifications ? (
                <Typography className="text-accent-foreground text-xs">
                  ✓
                </Typography>
              ) : null}
            </View>
            <Typography className="text-foreground text-sm flex-1">
              Allow SMS and email notifications
            </Typography>
          </Pressable>
          <Button
            variant="primary"
            isDisabled={
              submitting ||
              !firstName ||
              !lastName ||
              !regEmail ||
              !regPassword
            }
            onPress={() => void onRegister()}
          >
            {submitting ? <Spinner size="sm" /> : null}
            <Button.Label>Create account</Button.Label>
          </Button>
        </View>
      )}

      {error ? (
        <Typography className="text-danger text-sm mt-4 text-center">
          {error}
        </Typography>
      ) : null}

      {USE_MOCK && mode === "login" ? (
        <View className="mt-6 gap-1">
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
