import { Ionicons } from "@expo/vector-icons";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import type { JSX } from "react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardController } from "react-native-keyboard-controller";
import {
  Avatar,
  BottomSheet,
  Button,
  Description,
  InputOTP,
  Label,
  REGEXP_ONLY_DIGITS,
  Spinner,
  Typography,
  useBottomSheet,
  useBottomSheetAwareHandlers,
  useThemeColor,
  useToast,
  type InputOTPRef,
} from "heroui-native";
import { withUniwind } from "uniwind";

import { USE_MOCK } from "@/api/config";
import { AuthPhoneField } from "@/features/auth/auth-phone-field";
import { BrandButton } from "@/components/ui/brand-button";
import {
  SHEET_BACKGROUND_CLASS_NAME,
  SHEET_CONTENT_CLASS_NAME,
  SHEET_CONTENT_CONTAINER_CLASS_NAME,
} from "@/features/home/sheet-chrome";
import { SheetShell } from "@/features/home/sheet-shell";
import { Fonts } from "@/lib/fonts";
import { toUserErrorMessage } from "@/lib/user-error-message";
import { MOCK_ACCOUNT_CREDENTIALS } from "@/mocks/services/account";
import { useStore } from "@/store/store";

const StyledBottomSheetScrollView = withUniwind(BottomSheetScrollView);

type SheetStep = "phone" | "otp";

function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  const match = cleaned.match(/^(\d{1})(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `+${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
  }
  return phone;
}

function PhoneStepFields({
  phoneNumber,
  setPhoneNumber,
  callingCode,
  setCallingCode,
  countryIso2,
  setCountryIso2,
}: {
  phoneNumber: string;
  setPhoneNumber: (value: string) => void;
  callingCode: string;
  setCallingCode: (value: string) => void;
  countryIso2: string;
  setCountryIso2: (value: string) => void;
}): JSX.Element {
  const { onFocus, onBlur } = useBottomSheetAwareHandlers();

  return (
    <AuthPhoneField
      nationalNumber={phoneNumber}
      onNationalNumberChange={setPhoneNumber}
      callingCode={callingCode}
      onCallingCodeChange={setCallingCode}
      countryIso2={countryIso2}
      onCountryIso2Change={setCountryIso2}
      placeholder="Phone number"
      onFocus={onFocus}
      onBlur={onBlur}
    />
  );
}

/**
 * HeroUI Native OTP-in-sheet pattern:
 * Avatar icon + title/description + grouped InputOTP slots + separator.
 * @see heroui-native example `bottom-sheet/with-otp-input.tsx`
 */
const BottomSheetInputOTP = memo(function BottomSheetInputOTP({
  otpRef,
  value,
  onChange,
  onComplete,
  phoneNumber,
  isInvalid,
}: {
  otpRef: React.RefObject<InputOTPRef | null>;
  value: string;
  onChange: (value: string) => void;
  onComplete: (code: string) => void;
  phoneNumber: string;
  isInvalid?: boolean;
}): JSX.Element {
  const { onFocus, onBlur } = useBottomSheetAwareHandlers();
  const [success] = useThemeColor(["success"]);

  return (
    <View className="items-center gap-6">
      <Avatar size="lg" alt="Verification" className="bg-success/15">
        <Avatar.Fallback className="bg-success/15">
          <Ionicons name="shield-checkmark" size={28} color={success} />
        </Avatar.Fallback>
      </Avatar>

      <View className="items-center gap-1 px-2">
        <Label className="text-center text-2xl font-semibold">
          Verify your phone number
        </Label>
        <Description className="text-center text-base text-muted">
          We sent a verification code to
        </Description>
        <Text
          style={{
            marginTop: 4,
            fontFamily: Fonts.headingSemi,
            fontSize: 16,
            lineHeight: 24,
            textAlign: "center",
            color: success,
          }}
        >
          {formatPhoneNumber(phoneNumber)}
        </Text>
      </View>

      <View className="w-full items-center">
        <InputOTP
          ref={otpRef}
          variant="secondary"
          maxLength={6}
          pattern={REGEXP_ONLY_DIGITS}
          value={value}
          onChange={onChange}
          onComplete={onComplete}
          onFocus={onFocus}
          onBlur={onBlur}
          isInvalid={isInvalid}
        >
          <InputOTP.Group>
            <InputOTP.Slot index={0} />
            <InputOTP.Slot index={1} />
            <InputOTP.Slot index={2} />
          </InputOTP.Group>
          <InputOTP.Separator />
          <InputOTP.Group>
            <InputOTP.Slot index={3} />
            <InputOTP.Slot index={4} />
            <InputOTP.Slot index={5} />
          </InputOTP.Group>
        </InputOTP>
      </View>
    </View>
  );
});

function LoginPhoneSheetContent(): JSX.Element {
  const { userStore } = useStore();
  const { toast } = useToast();
  const { onOpenChange } = useBottomSheet();
  const insets = useSafeAreaInsets();
  const [accentForeground, muted, danger, success] = useThemeColor([
    "accent-foreground",
    "muted",
    "danger",
    "success",
  ]);

  const otpRef = useRef<InputOTPRef>(null);
  const [step, setStep] = useState<SheetStep>("phone");
  const [phoneNumber, setPhoneNumber] = useState(
    USE_MOCK ? "2345678901" : "",
  );
  const [callingCode, setCallingCode] = useState("1");
  const [countryIso2, setCountryIso2] = useState("US");
  const [formattedPhone, setFormattedPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fullPhone = useMemo(
    () => `+${callingCode}${phoneNumber.replace(/\D/g, "")}`,
    [callingCode, phoneNumber],
  );

  useEffect(() => {
    if (countdown <= 0) return;
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  const dismiss = useCallback(() => {
    KeyboardController.dismiss();
    onOpenChange(false);
  }, [onOpenChange]);

  const onSendCode = useCallback(async () => {
    setError("");
    setSubmitting(true);
    try {
      await userStore.sendPhoneLoginCode(fullPhone);
      setFormattedPhone(fullPhone);
      setOtp("");
      otpRef.current?.clear();
      setCountdown(30);
      setStep("otp");
      toast.show({
        variant: "default",
        label: "Code sent",
        description: USE_MOCK
          ? `Use OTP ${MOCK_ACCOUNT_CREDENTIALS.otp}`
          : "Check your SMS",
        duration: 3000,
      });
    } catch (e) {
      setError(toUserErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }, [fullPhone, toast, userStore]);

  const onVerify = useCallback(
    async (code: string) => {
      if (code.length !== 6 || submitting) return;
      setError("");
      setSubmitting(true);
      try {
        await userStore.verifyPhoneLogin(formattedPhone, code);
        dismiss();
      } catch (e) {
        setError(toUserErrorMessage(e));
        setOtp("");
        otpRef.current?.clear();
      } finally {
        setSubmitting(false);
      }
    },
    [dismiss, formattedPhone, submitting, userStore],
  );

  const onResend = useCallback(() => {
    if (countdown > 0 || submitting) return;
    void onSendCode();
  }, [countdown, onSendCode, submitting]);

  return (
    <BottomSheet.Content
      className={SHEET_CONTENT_CLASS_NAME}
      backgroundClassName={SHEET_BACKGROUND_CLASS_NAME}
      handleComponent={null}
      contentContainerClassName={SHEET_CONTENT_CONTAINER_CLASS_NAME}
      onClose={() => {
        KeyboardController.dismiss();
        setStep("phone");
        setOtp("");
        setError("");
        setCountdown(0);
      }}
    >
      <View className="flex-row items-center justify-between px-5 pb-1 pt-4">
        <Typography type="body" weight="semibold">
          {step === "phone" ? "Phone login" : "Verification"}
        </Typography>
        <BottomSheet.Close />
      </View>

      <StyledBottomSheetScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="gap-6 px-5 pt-2"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        {step === "phone" ? (
          <View className="gap-6">
            <View className="items-center gap-4">
              <Avatar size="lg" alt="Phone" className="bg-success/15">
                <Avatar.Fallback className="bg-success/15">
                  <Ionicons
                    name="phone-portrait-outline"
                    size={28}
                    color={success}
                  />
                </Avatar.Fallback>
              </Avatar>
              <View className="items-center gap-1 px-2">
                <Label className="text-center text-2xl font-semibold">
                  Log in with phone
                </Label>
                <Description className="text-center text-base text-muted">
                  We'll text you a one-time code to sign in.
                </Description>
              </View>
            </View>

            <PhoneStepFields
              phoneNumber={phoneNumber}
              setPhoneNumber={setPhoneNumber}
              callingCode={callingCode}
              setCallingCode={setCallingCode}
              countryIso2={countryIso2}
              setCountryIso2={setCountryIso2}
            />

            <BrandButton
              className="min-h-12 w-full rounded-full"
              isDisabled={
                submitting || phoneNumber.replace(/\D/g, "").length !== 10
              }
              onPress={() => void onSendCode()}
            >
              {submitting ? (
                <Spinner size="sm" color={accentForeground} />
              ) : null}
              <BrandButton.Label>Send code</BrandButton.Label>
            </BrandButton>
          </View>
        ) : (
          <View className="gap-6">
            <BottomSheetInputOTP
              otpRef={otpRef}
              value={otp}
              onChange={setOtp}
              onComplete={(code) => void onVerify(code)}
              phoneNumber={formattedPhone}
              isInvalid={!!error}
            />

            <View className="gap-3">
              <BrandButton
                className="min-h-12 w-full rounded-full"
                isDisabled={submitting || otp.length !== 6}
                onPress={() => void onVerify(otp)}
              >
                {submitting ? (
                  <Spinner size="sm" color={accentForeground} />
                ) : null}
                <BrandButton.Label>
                  {submitting ? "Verifying..." : "Verify code"}
                </BrandButton.Label>
              </BrandButton>

              <View className="flex-row items-center justify-center">
                <Text
                  style={{
                    fontFamily: Fonts.headingRegular,
                    fontSize: 14,
                    lineHeight: 20,
                    color: muted,
                  }}
                >
                  Didn't receive the code?
                </Text>
                <Button
                  variant="ghost"
                  size="sm"
                  isDisabled={countdown > 0 || submitting}
                  onPress={onResend}
                >
                  <Button.Label>
                    {countdown > 0 ? `Resend in ${countdown}s` : "Resend"}
                  </Button.Label>
                </Button>
              </View>

              <Button
                variant="ghost"
                size="sm"
                isDisabled={submitting}
                onPress={() => {
                  setStep("phone");
                  setOtp("");
                  setError("");
                }}
              >
                <Button.Label>Change number</Button.Label>
              </Button>
            </View>

            <Text
              style={{
                fontFamily: Fonts.headingRegular,
                fontSize: 12,
                lineHeight: 18,
                color: muted,
                textAlign: "center",
              }}
            >
              By continuing, you agree to receive SMS messages for verification.
              Message and data rates may apply.
            </Text>
          </View>
        )}

        {error ? (
          <Text
            style={{
              fontFamily: Fonts.headingRegular,
              fontSize: 14,
              lineHeight: 20,
              color: danger,
              textAlign: "center",
            }}
          >
            {error}
          </Text>
        ) : null}
      </StyledBottomSheetScrollView>
    </BottomSheet.Content>
  );
}

export function LoginPhoneSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}): JSX.Element {
  return (
    <SheetShell visible={visible} onClose={onClose}>
      <LoginPhoneSheetContent />
    </SheetShell>
  );
}
