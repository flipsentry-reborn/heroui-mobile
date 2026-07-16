import type { JSX } from "react";
import { Tabs } from "expo-router";
import { useThemeColor } from "heroui-native";

import { SpotifyTabBar } from "@/components/spotify-tab-bar";

export default function TabsLayout(): JSX.Element {
  const background = useThemeColor("background");

  return (
    <Tabs
      tabBar={(props) => <SpotifyTabBar {...(props as any)} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="feed" options={{ title: "Feed" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
      <Tabs.Screen name="help" options={{ title: "Help" }} />
    </Tabs>
  );
}
