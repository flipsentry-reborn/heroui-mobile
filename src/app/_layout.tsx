import type { JSX } from "react";
import { useEffect, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import { StatusBar } from "expo-status-bar";
import { HeroUINativeProvider, useThemeColor } from "heroui-native";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useUniwind } from "uniwind";

import {
  applyAppearance,
  loadCachedAppearance,
} from "@/lib/appearance";
import { StoreProvider, store } from "@/store/store";

import "../global.css";

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootLayoutContent(): JSX.Element {
  const background = useThemeColor("background");
  const foreground = useThemeColor("foreground");
  const card = useThemeColor("surface");
  const border = useThemeColor("border");
  const { theme } = useUniwind();
  const isDark = theme === "dark";

  const navigationTheme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        // Native stack uses these during push/pop - default is white without ThemeProvider
        primary: foreground,
        background,
        card,
        text: foreground,
        border,
        notification: foreground,
      },
    };
  }, [background, border, card, foreground, isDark]);

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(background);
  }, [background]);

  // Root + stack container must share theme bg — otherwise pop/gesture reveals black/white under screens.
  const rootStyle = useMemo(
    () => ({ flex: 1 as const, backgroundColor: background }),
    [background],
  );

  return (
    <ThemeProvider value={navigationTheme}>
      <View style={rootStyle}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: background },
          }}
        >
          <Stack.Screen
            name="(tabs)"
            options={{
              contentStyle: { backgroundColor: background },
            }}
          />
          <Stack.Screen
            name="listing/[id]"
            options={{
              // Twitter/X-style: cross-fade, not horizontal slide
              animation: "fade",
              animationDuration: 220,
              gestureEnabled: true,
              animationMatchesGesture: true,
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
          <Stack.Screen
            name="community"
            options={{
              headerShown: false,
              animation: "slide_from_right",
              gestureEnabled: true,
            }}
          />
        </Stack>
      </View>
      <StatusBar style={isDark ? "light" : "dark"} />
    </ThemeProvider>
  );
}

export default function RootLayout(): JSX.Element | null {
  const [fontsLoaded, fontError] = useFonts({
    ...Ionicons.font,
    "BrittiSans-Regular": require("../../assets/fonts/BrittiSans-Regular.ttf"),
    "BrittiSans-Medium": require("../../assets/fonts/BrittiSans-Medium.ttf"),
    "BrittiSans-SemiBold": require("../../assets/fonts/BrittiSans-SemiBold.ttf"),
    "BrittiSans-Bold": require("../../assets/fonts/BrittiSans-Bold.ttf"),
  });
  const [bootReady, setBootReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const cached = await loadCachedAppearance();
        if (!cancelled) applyAppearance(cached ?? "dark");
      } catch {
        if (!cancelled) applyAppearance("dark");
      }
      try {
        await store.hydrate();
      } catch {
        // Mock hydrate is best-effort; screens reload on focus.
      }
      if (!cancelled) setBootReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const ready = bootReady && (fontsLoaded || fontError != null);

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  // GestureHandlerRootView must wrap HeroUINativeProvider so BottomSheet /
  // Dialog portals (PortalHost siblings of app content) still get gestures.
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider
        config={{
          devInfo: { stylingPrinciples: false },
        }}
      >
        <StoreProvider>
          <RootLayoutContent />
        </StoreProvider>
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
