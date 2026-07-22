import type { JSX } from "react";
import { Stack } from "expo-router";
import { useThemeColor } from "heroui-native";

export default function AuthLayout(): JSX.Element {
  const background = useThemeColor("background");

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: background },
        animation: "fade",
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="verify" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
