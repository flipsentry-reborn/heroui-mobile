import type { JSX } from "react";
import { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { Button, Spinner, Typography, useThemeColor, useToast } from "heroui-native";

import { AuthField } from "@/features/auth/auth-field";
import { AUTH_CONTROL_BACKGROUND } from "@/features/auth/auth-theme";
import { AuthShell } from "@/features/auth/auth-shell";
import { BrandButton } from "@/components/ui/brand-button";
import { useStore } from "@/store/store";

function errorMessage(error: unknown): string {
  if (Array.isArray(error)) return error.join(", ");
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}

export function ForgotPasswordScreen(): JSX.Element {
  const { userStore } = useStore();
  const { toast } = useToast();
  const [accentForeground] = useThemeColor(["accent-foreground"]);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setError("");
    setSubmitting(true);
    try {
      await userStore.forgotPassword(email.trim());
      toast.show({
        variant: "default",
        label: "Check your email",
        description: "If an account exists, reset instructions were sent.",
        duration: 3500,
      });
      router.back();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Forgot password"
      subtitle="We'll email you a reset link if the account exists"
      onBack={() => router.back()}
    >
      <View className="gap-4">
        <AuthField
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          placeholder="Email"
        />
        <BrandButton
          className="min-h-12 w-full rounded-full"
          isDisabled={submitting || !email.trim()}
          onPress={() => void onSubmit()}
        >
          {submitting ? <Spinner size="sm" color={accentForeground} /> : null}
          <BrandButton.Label>Send reset link</BrandButton.Label>
        </BrandButton>
        <Button
          variant="secondary"
          className="min-h-12 w-full rounded-full border-0"
          style={{ backgroundColor: AUTH_CONTROL_BACKGROUND }}
          onPress={() => router.back()}
        >
          <Button.Label className="text-foreground">Back to login</Button.Label>
        </Button>
        {error ? (
          <Typography type="body-sm" className="text-center text-danger">
            {error}
          </Typography>
        ) : null}
      </View>
    </AuthShell>
  );
}
