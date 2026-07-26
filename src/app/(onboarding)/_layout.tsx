import type { JSX } from "react";
import { useEffect, useMemo, useRef } from "react";
import { View } from "react-native";
import { observer } from "mobx-react-lite";
import {
  DarkTheme,
  Redirect,
  Stack,
  ThemeProvider,
  type Href,
} from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useThemeColor } from "heroui-native";
import { Uniwind, useUniwind } from "uniwind";

import { SUBSCRIPTION_DARK_BACKGROUND } from "@/features/settings/subscription-theme";
import { useStore } from "@/store/store";

/**
 * Onboarding is designed for the near-black canvas. Force Uniwind dark while
 * this stack is mounted so light appearance doesn't invert text/field tokens.
 */
const OnboardingLayout = observer(function OnboardingLayout(): JSX.Element {
  const { userStore } = useStore();
  const { theme } = useUniwind();
  const background = useThemeColor("background");
  const foreground = useThemeColor("foreground");
  const border = useThemeColor("border");
  const previousThemeRef = useRef(theme);

  const onboardingNavigationTheme = useMemo(
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
    // Only on mount/unmount — don't re-run when theme flips while onboarding.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(SUBSCRIPTION_DARK_BACKGROUND);
  }, [background]);

  if (userStore.bootstrapped && !userStore.hasSession) {
    return <Redirect href={"/welcome" as Href} />;
  }

  if (
    userStore.bootstrapped &&
    userStore.isLoggedIn &&
    !userStore.isPhoneVerified
  ) {
    return <Redirect href={"/verify" as Href} />;
  }

  return (
    <ThemeProvider value={onboardingNavigationTheme}>
      <View
        style={{ flex: 1, backgroundColor: SUBSCRIPTION_DARK_BACKGROUND }}
      >
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "fade_from_bottom",
            animationDuration: 360,
            gestureEnabled: true,
            contentStyle: { backgroundColor: SUBSCRIPTION_DARK_BACKGROUND },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="what" />
          <Stack.Screen name="volume" />
          <Stack.Screen name="margin" />
          <Stack.Screen name="tried" />
          <Stack.Screen name="confirm" />
          {/* Legacy routes → what */}
          <Stack.Screen name="where" />
          <Stack.Screen name="coverage" />
          <Stack.Screen name="criteria" />
          <Stack.Screen name="radius" />
        </Stack>
      </View>
    </ThemeProvider>
  );
});

export default OnboardingLayout;
