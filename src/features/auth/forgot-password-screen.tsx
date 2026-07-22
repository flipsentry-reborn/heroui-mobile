import type { JSX } from "react";
import { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { Button, Spinner, Typography, useToast } from "heroui-native";

import { AuthField } from "@/features/auth/auth-field";
import { AuthShell } from "@/features/auth/auth-shell";
import { useStore } from "@/store/store";

function errorMessage(error: unknown): string {
  if (Array.isArray(error)) return error.join(", ");
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}

export function ForgotPasswordScreen(): JSX.Element {
  const { userStore } = useStore();
  const { toast } = useToast();
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
    >
      <View className="gap-4">
        <AuthField
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          placeholder="you@example.com"
        />
        <Button
          variant="primary"
          isDisabled={submitting || !email.trim()}
          onPress={() => void onSubmit()}
        >
          {submitting ? <Spinner size="sm" /> : null}
          <Button.Label>Send reset link</Button.Label>
        </Button>
        <Button variant="secondary" onPress={() => router.back()}>
          <Button.Label>Back to login</Button.Label>
        </Button>
        {error ? (
          <Typography className="text-danger text-sm text-center">
            {error}
          </Typography>
        ) : null}
      </View>
    </AuthShell>
  );
}
