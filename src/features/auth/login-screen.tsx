import { observer } from "mobx-react-lite";
import type { JSX } from "react";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router, type Href } from "expo-router";
import {
  Button,
  Spinner,
  useThemeColor,
} from "heroui-native";

import { USE_MOCK } from "@/api/config";
import { AuthField, AuthHint } from "@/features/auth/auth-field";
import { LoginPhoneSheet } from "@/features/auth/login-phone-sheet";
import {
  AuthFooterLink,
  AuthOrDivider,
  AuthShell,
} from "@/features/auth/auth-shell";
import { AUTH_CONTROL_BACKGROUND } from "@/features/auth/auth-theme";
import { BrandButton } from "@/components/ui/brand-button";
import { Fonts } from "@/lib/fonts";
import { toUserErrorMessage } from "@/lib/user-error-message";
import { MOCK_ACCOUNT_CREDENTIALS } from "@/mocks/services/account";
import { useStore } from "@/store/store";

/**
 * Login — email form on-page; phone OTP opens HeroUI bottom sheet
 * (Avatar + InputOTP groups, see `login-phone-sheet`).
 */
export const LoginScreen = observer(function LoginScreen(): JSX.Element {
  const { userStore } = useStore();
  const [accentForeground, muted, danger] = useThemeColor([
    "accent-foreground",
    "muted",
    "danger",
  ]);

  const [email, setEmail] = useState(
    USE_MOCK ? MOCK_ACCOUNT_CREDENTIALS.email : "",
  );
  const [password, setPassword] = useState(
    USE_MOCK ? MOCK_ACCOUNT_CREDENTIALS.password : "",
  );
  const [phoneSheetOpen, setPhoneSheetOpen] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onEmailLogin = async () => {
    setError("");
    setSubmitting(true);
    try {
      await userStore.login({ email: email.trim(), password });
    } catch (e) {
      setError(toUserErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <AuthShell
        title="Log in to your account"
        subtitle="Welcome back! Please enter your details."
        onBack={() => router.back()}
        footer={
          <AuthFooterLink
            prompt="Don't have an account?"
            actionLabel="Sign up"
            onPress={() => router.push("/register" as Href)}
          />
        }
      >
        <View className="gap-4">
          <AuthField
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            textContentType="emailAddress"
            placeholder="Email"
          />
          <AuthField
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="password"
            placeholder="Password"
          />
          <Pressable
            onPress={() => router.push("/forgot-password" as Href)}
            className="self-end"
          >
            <Text
              style={{
                fontFamily: Fonts.headingRegular,
                fontSize: 14,
                lineHeight: 20,
                color: muted,
              }}
            >
              Forgot password?
            </Text>
          </Pressable>

          <BrandButton
            className="min-h-12 w-full rounded-full"
            isDisabled={submitting || !email || !password}
            onPress={() => void onEmailLogin()}
          >
            {submitting ? <Spinner size="sm" color={accentForeground} /> : null}
            <BrandButton.Label>Login</BrandButton.Label>
          </BrandButton>

          <AuthOrDivider />

          <Button
            variant="secondary"
            className="min-h-12 w-full rounded-full border-0"
            style={{ backgroundColor: AUTH_CONTROL_BACKGROUND }}
            onPress={() => {
              setError("");
              setPhoneSheetOpen(true);
            }}
          >
            <Button.Label className="text-foreground">
              Login with Phone Number
            </Button.Label>
          </Button>

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
        </View>
      </AuthShell>

      <LoginPhoneSheet
        visible={phoneSheetOpen}
        onClose={() => setPhoneSheetOpen(false)}
      />
    </>
  );
});
