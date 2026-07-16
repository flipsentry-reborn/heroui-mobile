import { Stack } from "expo-router";
import type { JSX } from "react";
import { useThemeColor } from "heroui-native";

export default function FeedLayout(): JSX.Element {
  const background = useThemeColor("background");

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen
        name="c/[category]"
        options={{
          animation: "slide_from_right",
          gestureEnabled: true,
        }}
      />

    </Stack>
  );
}
