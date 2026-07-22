import type { JSX } from "react";
import { View } from "react-native";
import { router, type Href } from "expo-router";
import { Button } from "heroui-native";

import { AUTH_CONTROL_BACKGROUND } from "@/features/auth/auth-theme";
import { AuthShell } from "@/features/auth/auth-shell";
import { BrandButton } from "@/components/ui/brand-button";

/**
 * Auth entry — choose Login or Register, then push into those screens.
 */
export function WelcomeScreen(): JSX.Element {
  return (
    <AuthShell
      title="Welcome to FlipSentry"
      subtitle="Log in or create an account to continue."
      contentAlign="center"
    >
      <View className="w-full gap-3">
        <BrandButton
          className="min-h-12 w-full rounded-full"
          onPress={() => router.push("/login" as Href)}
        >
          <BrandButton.Label>Log in</BrandButton.Label>
        </BrandButton>
        <Button
          variant="secondary"
          className="min-h-12 w-full rounded-full border-0"
          style={{ backgroundColor: AUTH_CONTROL_BACKGROUND }}
          onPress={() => router.push("/register" as Href)}
        >
          <Button.Label className="text-foreground">Create account</Button.Label>
        </Button>
      </View>
    </AuthShell>
  );
}
