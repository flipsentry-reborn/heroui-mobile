import type { JSX } from "react";
import { useEffect, useMemo, useRef } from "react";
import { View } from "react-native";
import { DarkTheme, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useThemeColor } from "heroui-native";
import { useUniwind, Uniwind } from "uniwind";

import { SUBSCRIPTION_DARK_BACKGROUND } from "@/features/settings/subscription-theme";

/**
 * Auth stack: near-black canvas + force Uniwind dark so Input/field tokens
 * match in-app dark fields (no white boxes on #060606).
 * Also pins status / system chrome + nav theme to the same #060606 so
 * slide/back gestures don't flash the elevated dark wash.
 */
export default function AuthLayout(): JSX.Element {
  const { theme } = useUniwind();
  const background = useThemeColor("background");
  const foreground = useThemeColor("foreground");
  const border = useThemeColor("border");
  const previousThemeRef = useRef(theme);

  const authNavigationTheme = useMemo(
    () => ({
      ...DarkTheme,
      colors: {
        ...DarkTheme.colors,
        primary: foreground,
        background: SUBSCRIPTION_DARK_BACKGROUND,
        card: SUBSCRIPTION_DARK_BACKGROUND,
        text: foreground,
        border,
        notification: foreground,
      },
    }),
    [border, foreground],
  );

  useEffect(() => {
    previousThemeRef.current = theme;
    /** Capture pre-auth theme background before forcing dark. */
    const restoreBackground = background;
    Uniwind.setTheme("dark");
    void SystemUI.setBackgroundColorAsync(SUBSCRIPTION_DARK_BACKGROUND);
    return () => {
      const prev = previousThemeRef.current;
      if (prev === "light" || prev === "dark" || prev === "system") {
        Uniwind.setTheme(prev);
      }
      void SystemUI.setBackgroundColorAsync(restoreBackground);
    };
    // Only on mount/unmount — don't re-run when theme flips while on auth.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Root layout syncs SystemUI to elevated dark `--background`; re-pin auth canvas.
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(SUBSCRIPTION_DARK_BACKGROUND);
  }, [background]);

  return (
    <ThemeProvider value={authNavigationTheme}>
      <View
        style={{ flex: 1, backgroundColor: SUBSCRIPTION_DARK_BACKGROUND }}
      >
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: SUBSCRIPTION_DARK_BACKGROUND },
            animation: "slide_from_right",
            animationTypeForReplace: "push",
            gestureEnabled: true,
            fullScreenGestureEnabled: true,
          }}
        >
          <Stack.Screen name="welcome" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="verify" />
          <Stack.Screen name="forgot-password" />
        </Stack>
      </View>
    </ThemeProvider>
  );
}
