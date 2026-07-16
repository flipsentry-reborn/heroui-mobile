import type { JSX } from "react";
import { Stack } from "expo-router";
import { useThemeColor } from "heroui-native";

export default function SettingsStackLayout(): JSX.Element {
  const background = useThemeColor("background");
  const foreground = useThemeColor("foreground");

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
          title: "Subscription",
          headerShown: false,
          presentation: "transparentModal",
          animation: "fade",
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
      <Stack.Screen name="blocked-sellers" options={{ title: "Blocked Sellers" }} />
    </Stack>
  );
}
