import type { JSX } from "react";
import { useEffect, useRef } from "react";
import { Stack } from "expo-router";
import { useUniwind, Uniwind } from "uniwind";

import { SUBSCRIPTION_DARK_BACKGROUND } from "@/features/settings/subscription-theme";

/**
 * Auth stack: near-black canvas + force Uniwind dark so Input/field tokens
 * match in-app dark fields (no white boxes on #060606).
 */
export default function AuthLayout(): JSX.Element {
  const { theme } = useUniwind();
  const previousThemeRef = useRef(theme);

  useEffect(() => {
    previousThemeRef.current = theme;
    Uniwind.setTheme("dark");
    return () => {
      const prev = previousThemeRef.current;
      if (prev === "light" || prev === "dark" || prev === "system") {
        Uniwind.setTheme(prev);
      }
    };
    // Only on mount/unmount — don't re-run when theme flips while on auth.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: SUBSCRIPTION_DARK_BACKGROUND },
        animation: "fade",
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="verify" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
