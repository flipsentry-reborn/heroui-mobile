import type { JSX } from "react";
import { useEffect, useMemo } from "react";
import { useFonts } from "expo-font";
import { DarkTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import { StatusBar } from "expo-status-bar";
import { HeroUINativeProvider, useThemeColor } from "heroui-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Uniwind } from "uniwind";

import "../global.css";

SplashScreen.preventAutoHideAsync().catch(() => {});

// App is dark-only — lock Uniwind before first paint
Uniwind.setTheme("dark");

function RootLayoutContent(): JSX.Element {
  const background = useThemeColor("background");
  const foreground = useThemeColor("foreground");
  const card = useThemeColor("surface");
  const border = useThemeColor("border");

  const navigationTheme = useMemo(
    () => ({
      ...DarkTheme,
      colors: {
        ...DarkTheme.colors,
        // Native stack uses these during push/pop - default is white without ThemeProvider
        primary: foreground,
        background,
        card,
        text: foreground,
        border,
        notification: foreground,
      },
    }),
    [background, border, card, foreground],
  );

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(background);
  }, [background]);

  return (
    <ThemeProvider value={navigationTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: background },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="listing/[id]"
          options={{
            animation: "slide_from_right",
            gestureEnabled: true,
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            headerShown: false,
            animation: "slide_from_right",
            gestureEnabled: true,
          }}
        />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}

export default function RootLayout(): JSX.Element | null {
  const [fontsLoaded, fontError] = useFonts({
    "BrittiSans-Regular": require("../../assets/fonts/BrittiSans-Regular.ttf"),
    "BrittiSans-Medium": require("../../assets/fonts/BrittiSans-Medium.ttf"),
    "BrittiSans-SemiBold": require("../../assets/fonts/BrittiSans-SemiBold.ttf"),
    "BrittiSans-Bold": require("../../assets/fonts/BrittiSans-Bold.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded || fontError != null) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && fontError == null) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider
        config={{
          devInfo: { stylingPrinciples: false },
        }}
      >
        <RootLayoutContent />
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
