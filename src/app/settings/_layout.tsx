import type { JSX } from "react";
import { Stack } from "expo-router";

export default function SettingsStackLayout(): JSX.Element {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: "#121212" },
        headerTintColor: "#FFFFFF",
        headerTitleStyle: { fontWeight: "600" },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: "#121212" },
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
      <Stack.Screen name="delete-account" options={{ title: "Delete Account" }} />
    </Stack>
  );
}
