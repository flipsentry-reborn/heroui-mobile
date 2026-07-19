import type { JSX } from "react";
import { Stack } from "expo-router";
import { useThemeColor } from "heroui-native";

export default function CommunityStackLayout(): JSX.Element {
  const background = useThemeColor("background");

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: background },
        animation: "slide_from_right",
        gestureEnabled: true,
      }}
    />
  );
}
