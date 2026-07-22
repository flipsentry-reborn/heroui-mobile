import type { JSX } from "react";
import { useEffect } from "react";
import { Redirect, Tabs, type Href } from "expo-router";
import { observer } from "mobx-react-lite";
import { useThemeColor } from "heroui-native";

import { AppTabBar } from "@/components/app-tab-bar";
import { useStore } from "@/store/store";

const TabsLayout = observer(function TabsLayout(): JSX.Element {
  const background = useThemeColor("background");
  const { userStore, commonStore } = useStore();

  useEffect(() => {
    // Soft guard if session expires while on tabs
  }, [userStore.isLoggedIn]);

  if (userStore.bootstrapped && (!commonStore.token || !userStore.isLoggedIn)) {
    return <Redirect href={"/welcome" as Href} />;
  }

  if (userStore.bootstrapped && userStore.isLoggedIn && !userStore.isPhoneVerified) {
    return <Redirect href={"/verify" as Href} />;
  }

  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...(props as any)} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: background },
      }}
    >
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="feed" options={{ title: "Feed" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
      <Tabs.Screen name="community" options={{ title: "Community" }} />
    </Tabs>
  );
});

export default TabsLayout;
