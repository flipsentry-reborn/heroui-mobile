import type { JSX } from "react";
import { Stack } from "expo-router";
import { useThemeColor } from "heroui-native";
import { useUniwind } from "uniwind";

import { SUBSCRIPTION_DARK_BACKGROUND } from "@/features/settings/subscription-theme";

export default function SettingsStackLayout(): JSX.Element {
  const background = useThemeColor("background");
  const foreground = useThemeColor("foreground");
  const { theme } = useUniwind();
  const subscriptionBackground =
    theme === "dark" ? SUBSCRIPTION_DARK_BACKGROUND : background;

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: background },
        headerTintColor: foreground,
        headerTitleStyle: { fontWeight: "600" },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: background },
      }}
    >
      <Stack.Screen name="profile" options={{ title: "Profile" }} />
      <Stack.Screen name="notification" options={{ title: "Notification" }} />
      <Stack.Screen
        name="subscription"
        options={{
          headerShown: false,
          contentStyle: { backgroundColor: subscriptionBackground },
        }}
      />
      <Stack.Screen name="blocked-sellers" options={{ title: "Blocked Sellers" }} />
    </Stack>
  );
}
