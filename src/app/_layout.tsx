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
import { KeyboardProvider } from "react-native-keyboard-controller";
import { useUniwind } from "uniwind";

import { setUnauthorizedHandler } from "@/api/http/client";
import { prefetchAiEstimationIcon } from "@/components/icons/ai-estimation-icon";
import {
  applyAppearance,
  loadCachedAppearance,
} from "@/lib/appearance";
import { StoreProvider, store } from "@/store/store";

import "../global.css";

SplashScreen.preventAutoHideAsync().catch(() => {});

setUnauthorizedHandler(() => {
  void store.userStore.logout({ skipNavigate: false });
});

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
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen
            name="(tabs)"
            options={{
              contentStyle: { backgroundColor: background },
            }}
          />
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
      // Warm the hot-path AI sparkle decode in parallel with boot work.
      const iconPrefetch = prefetchAiEstimationIcon();
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
      try {
        await iconPrefetch;
      } catch {
        // Falls back to the bundled require on first paint.
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
  // KeyboardProvider: HeroUI Native–recommended keyboard avoidance
  // (react-native-keyboard-controller) for auth forms and TextFields.
  // statusBarTranslucent + navigationBarTranslucent: without these, the
  // provider pads top/bottom to mimic a non-edge-to-edge RN app, which
  // doubles safe-area insets on screens (huge notch gap after login work).
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider statusBarTranslucent navigationBarTranslucent>
        <HeroUINativeProvider
          config={{
            devInfo: { stylingPrinciples: false },
          }}
        >
          <StoreProvider>
            <RootLayoutContent />
          </StoreProvider>
        </HeroUINativeProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
