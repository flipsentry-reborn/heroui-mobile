import type { JSX } from "react";
import { Stack } from "expo-router";
import { useThemeColor } from "heroui-native";

export default function HelpStackLayout(): JSX.Element {
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
      <Stack.Screen name="[topic]" options={{ title: "Help" }} />
    </Stack>
  );
}
