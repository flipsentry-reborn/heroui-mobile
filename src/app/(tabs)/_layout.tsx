import type { JSX } from "react";
import { Tabs } from "expo-router";

import { SpotifyTabBar } from "@/components/spotify-tab-bar";

export default function TabsLayout(): JSX.Element {
  return (
    <Tabs
      tabBar={(props) => <SpotifyTabBar {...(props as any)} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: "#121212" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="feed" options={{ title: "Feed" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
      <Tabs.Screen name="help" options={{ title: "Help" }} />
    </Tabs>
  );
}
