import { observer } from "mobx-react-lite";
import type { JSX } from "react";
import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { router, type Href } from "expo-router";
import {
  Button,
  InputOTP,
  REGEXP_ONLY_DIGITS,
  Spinner,
  Typography,
  useThemeColor,
  useToast,
} from "heroui-native";

import { USE_MOCK } from "@/api/config";
import { AuthPhoneField } from "@/features/auth/auth-phone-field";
import { AuthShell } from "@/features/auth/auth-shell";
import { BrandButton } from "@/components/ui/brand-button";
import { MOCK_ACCOUNT_CREDENTIALS } from "@/mocks/services/account";
import { useStore } from "@/store/store";

function errorMessage(error: unknown): string {
  if (Array.isArray(error)) return error.join(", ");
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}

/** Post-auth phone verification (register / email login without confirmed number). */
export const VerifyScreen = observer(function VerifyScreen(): JSX.Element {
  const { userStore } = useStore();
  const { toast } = useToast();
  const [accentForeground] = useThemeColor(["accent-foreground"]);
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
    if (!userStore.bootstrapped) return;
    if (!userStore.isLoggedIn) {
      router.replace("/login" as Href);
    } else if (userStore.isPhoneVerified) {
      router.replace("/feed" as Href);
    }
  }, [
    userStore.bootstrapped,
    userStore.isLoggedIn,
    userStore.isPhoneVerified,
  ]);

  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  const fullPhone = useMemo(
    () => `+${callingCode}${phoneNumber.replace(/\D/g, "")}`,
    [callingCode, phoneNumber],
  );

  const onSend = async () => {
    setError("");
    setSubmitting(true);
    try {
      await userStore.sendPhoneVerification(fullPhone);
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

  const onVerify = async () => {
    setError("");
    setSubmitting(true);
    try {
      await userStore.verifyPhone(formattedPhone, otp);
      router.replace("/feed" as Href);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title={isCodeSent ? "Enter verification code" : "Verify phone"}
      subtitle={
        isCodeSent
          ? `We sent a code to ${formattedPhone}`
          : "Confirm your number to unlock searches and feed"
      }
    >
      <View className="gap-4">
        {!isCodeSent ? (
          <>
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
              onPress={() => void onSend()}
            >
              {submitting ? <Spinner size="sm" color={accentForeground} /> : null}
              <BrandButton.Label>Continue</BrandButton.Label>
            </BrandButton>
            <Typography type="body-xs" className="text-center text-muted">
              By tapping continue, you consent to receiving security codes from
              FlipSentry via SMS.
            </Typography>
          </>
        ) : (
          <>
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
            <BrandButton
              className="min-h-12 w-full rounded-full"
              isDisabled={submitting || otp.length !== 6}
              onPress={() => void onVerify()}
            >
              {submitting ? <Spinner size="sm" color={accentForeground} /> : null}
              <BrandButton.Label>Verify</BrandButton.Label>
            </BrandButton>
            <Button
              variant="ghost"
              isDisabled={countdown > 0 || submitting}
              onPress={() => void onSend()}
            >
              <Button.Label>
                {countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
              </Button.Label>
            </Button>
            <Button variant="ghost" onPress={() => setIsCodeSent(false)}>
              <Button.Label>Change number</Button.Label>
            </Button>
          </>
        )}

        {error ? (
          <Typography type="body-sm" className="text-center text-danger">
            {error}
          </Typography>
        ) : null}

        <Button
          variant="secondary"
          className="min-h-12 w-full rounded-full bg-surface-secondary"
          onPress={() => void userStore.logout()}
        >
          <Button.Label className="text-foreground">Sign out</Button.Label>
        </Button>
      </View>
    </AuthShell>
  );
});
