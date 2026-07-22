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
  useToast,
} from "heroui-native";

import { USE_MOCK } from "@/api/config";
import { AuthField, AuthHint } from "@/features/auth/auth-field";
import { AuthShell } from "@/features/auth/auth-shell";
import { MOCK_ACCOUNT_CREDENTIALS } from "@/mocks/services/account";
import { useStore } from "@/store/store";

function errorMessage(error: unknown): string {
  if (Array.isArray(error)) return error.join(", ");
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}

export const VerifyScreen = observer(function VerifyScreen(): JSX.Element {
  const { userStore } = useStore();
  const { toast } = useToast();
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
      title="Verify phone"
      subtitle="Confirm your number to unlock searches and feed"
    >
      <View className="gap-4">
        {!isCodeSent ? (
          <>
            <AuthField
              label="Phone number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              placeholder="2345678901"
            />
            <AuthHint>{`+${callingCode} · ${fullPhone}`}</AuthHint>
            <Button
              variant="primary"
              isDisabled={
                submitting || phoneNumber.replace(/\D/g, "").length < 7
              }
              onPress={() => void onSend()}
            >
              {submitting ? <Spinner size="sm" /> : null}
              <Button.Label>Send code</Button.Label>
            </Button>
          </>
        ) : (
          <>
            <Typography className="text-muted text-sm">
              Enter the code sent to {formattedPhone}
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
              onPress={() => void onVerify()}
            >
              {submitting ? <Spinner size="sm" /> : null}
              <Button.Label>Verify</Button.Label>
            </Button>
            <Button
              variant="ghost"
              isDisabled={countdown > 0 || submitting}
              onPress={() => void onSend()}
            >
              <Button.Label>
                {countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
              </Button.Label>
            </Button>
          </>
        )}

        {error ? (
          <Typography className="text-danger text-sm text-center">
            {error}
          </Typography>
        ) : null}

        <Button
          variant="secondary"
          onPress={() => void userStore.logout()}
        >
          <Button.Label>Sign out</Button.Label>
        </Button>
      </View>
    </AuthShell>
  );
});
