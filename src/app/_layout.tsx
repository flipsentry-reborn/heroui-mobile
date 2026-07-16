import type { JSX } from "react";
import { useEffect } from "react";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { HeroUINativeProvider, useThemeColor } from "heroui-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useUniwind } from "uniwind";

import { applyAppearance } from "@/lib/appearance";
import { initialSettingsState } from "@/mocks/data/settings";
import { getSettings } from "@/mocks/services/settings";

import "../global.css";

SplashScreen.preventAutoHideAsync().catch(() => {});

// Match mock default before first paint
applyAppearance(initialSettingsState.preferences.appearance);

function RootLayoutContent(): JSX.Element {
  const background = useThemeColor("background");
  const { theme } = useUniwind();

  useEffect(() => {
    void getSettings().then((settings) => {
      applyAppearance(settings.preferences.appearance);
    });
  }, []);

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: background },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="feed/[id]"
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
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
    </>
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
