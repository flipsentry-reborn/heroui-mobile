import { observer } from "mobx-react-lite";
import type { JSX } from "react";
import { useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { router, type Href } from "expo-router";
import { Checkbox, Spinner, useThemeColor } from "heroui-native";

import { AuthField } from "@/features/auth/auth-field";
import {
  AuthFooterLink,
  AuthShell,
} from "@/features/auth/auth-shell";
import { BrandButton } from "@/components/ui/brand-button";
import { Fonts } from "@/lib/fonts";
import { toUserErrorMessage } from "@/lib/user-error-message";
import { useStore } from "@/store/store";

const TERMS_URL = "https://flipsentry.com/terms";
const PRIVACY_URL = "https://flipsentry.com/privacy";

/**
 * Register — mobile-app flow (email account → then /verify for phone).
 * Visual layout matches mockup: logo, title, fields, pill Continue, footer Sign in.
 */
export const RegisterScreen = observer(function RegisterScreen(): JSX.Element {
  const { userStore } = useStore();
  const [accentForeground, foreground, muted, danger] = useThemeColor([
    "accent-foreground",
    "foreground",
    "muted",
    "danger",
  ]);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [allowNotifications, setAllowNotifications] = useState(true);
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /** For now: only min length — no complexity rules. */
  const validatePassword = (value: string) => {
    if (!value) {
      setPasswordError("");
      return;
    }
    setPasswordError(
      value.length < 8 ? "Password must be at least 8 characters" : "",
    );
  };

  const onRegister = async () => {
    setError("");
    if (!acceptedPolicies) {
      setError("Please accept the Terms and Privacy Policy");
      return;
    }
    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    setSubmitting(true);
    try {
      await userStore.register({
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        allowSmsAndEmailNotifications: allowNotifications,
      });
      // userStore navigates to /verify
    } catch (e) {
      setError(toUserErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit =
    firstName.trim() &&
    lastName.trim() &&
    email.trim() &&
    password.length >= 8 &&
    confirmPassword.length > 0 &&
    !passwordError &&
    acceptedPolicies;

  return (
    <AuthShell
      title="Create an account"
      subtitle="Please enter your details."
      onBack={() => router.back()}
      footer={
        <AuthFooterLink
          prompt="Already have an account?"
          actionLabel="Sign in"
          onPress={() => router.push("/login" as Href)}
        />
      }
    >
      <View className="gap-4">
        <AuthField
          label="First name"
          value={firstName}
          onChangeText={setFirstName}
          autoCapitalize="words"
          placeholder="First name"
        />
        <AuthField
          label="Last name"
          value={lastName}
          onChangeText={setLastName}
          autoCapitalize="words"
          placeholder="Last name"
        />
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
          onChangeText={(text) => {
            setPassword(text);
            validatePassword(text);
          }}
          secureTextEntry
          textContentType="newPassword"
          placeholder="Password"
        />
        {passwordError ? (
          <Text
            style={{
              marginTop: -8,
              fontFamily: Fonts.headingRegular,
              fontSize: 12,
              lineHeight: 16,
              color: danger,
            }}
          >
            {passwordError}
          </Text>
        ) : null}
        <AuthField
          label="Confirm password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          textContentType="newPassword"
          placeholder="Confirm password"
        />

        <Pressable
          onPress={() => setAllowNotifications((v) => !v)}
          className="flex-row items-center gap-3 py-1"
        >
          <View
            className={`h-5 w-5 items-center justify-center rounded-md border border-border ${
              allowNotifications ? "bg-accent" : "bg-field"
            }`}
          >
            {allowNotifications ? (
              <Text
                style={{
                  fontFamily: Fonts.headingSemi,
                  fontSize: 12,
                  color: accentForeground,
                }}
              >
                ✓
              </Text>
            ) : null}
          </View>
          <Text
            style={{
              flex: 1,
              fontFamily: Fonts.headingRegular,
              fontSize: 14,
              lineHeight: 20,
              color: foreground,
            }}
          >
            Allow SMS and email notifications
          </Text>
        </Pressable>

        <View className="flex-row items-start gap-3 py-1">
          <Checkbox
            isSelected={acceptedPolicies}
            onSelectedChange={setAcceptedPolicies}
            className="mt-0.5"
          />
          <Text
            style={{
              flex: 1,
              fontFamily: Fonts.headingRegular,
              fontSize: 14,
              lineHeight: 20,
              color: foreground,
            }}
          >
            I agree to the{" "}
            <Text
              style={{
                fontFamily: Fonts.headingSemi,
                fontSize: 14,
                lineHeight: 20,
                color: foreground,
                textDecorationLine: "underline",
              }}
              onPress={() => void Linking.openURL(TERMS_URL)}
            >
              Terms
            </Text>{" "}
            and{" "}
            <Text
              style={{
                fontFamily: Fonts.headingSemi,
                fontSize: 14,
                lineHeight: 20,
                color: foreground,
                textDecorationLine: "underline",
              }}
              onPress={() => void Linking.openURL(PRIVACY_URL)}
            >
              Privacy Policy
            </Text>
          </Text>
        </View>

        <BrandButton
          className="min-h-12 w-full rounded-full"
          isDisabled={submitting || !canSubmit}
          onPress={() => void onRegister()}
        >
          {submitting ? <Spinner size="sm" color={accentForeground} /> : null}
          <BrandButton.Label>Continue</BrandButton.Label>
        </BrandButton>

        <Text
          style={{
            fontFamily: Fonts.headingRegular,
            fontSize: 12,
            lineHeight: 16,
            color: muted,
            textAlign: "center",
          }}
        >
          By tapping continue, you consent to receiving security codes from
          FlipSentry via SMS after sign-up.
        </Text>

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
      </View>
    </AuthShell>
  );
});
