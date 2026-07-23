import type { JSX } from "react";
import { useEffect } from "react";
import { AppState } from "react-native";
import { Redirect, Tabs, type Href } from "expo-router";
import { observer } from "mobx-react-lite";
import { useThemeColor } from "heroui-native";

import { AppTabBar } from "@/components/app-tab-bar";
import { BottomChromeProvider } from "@/contexts/bottom-chrome-context";
import { useStore } from "@/store/store";

const TabsLayout = observer(function TabsLayout(): JSX.Element {
  const background = useThemeColor("background");
  const { userStore, commonStore } = useStore();

  // Soft restore when JWT survived an API outage but user profile never loaded.
  useEffect(() => {
    if (!userStore.bootstrapped || !commonStore.token || userStore.isLoggedIn) {
      return;
    }

    const tryRestore = () => {
      if (!commonStore.token || userStore.isLoggedIn) return;
      void userStore.restoreSession().catch(() => {
        // Toast already queued inside getUser for unreachable errors.
      });
    };

    // Avoid racing the bootstrap unreachable toast; retry on foreground / shortly after.
    const timer = setTimeout(tryRestore, 12_000);
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") tryRestore();
    });

    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, [userStore, userStore.bootstrapped, userStore.isLoggedIn, commonStore.token]);

  if (userStore.bootstrapped && !userStore.hasSession) {
    return <Redirect href={"/welcome" as Href} />;
  }

  if (
    userStore.bootstrapped &&
    userStore.isLoggedIn &&
    !userStore.isPhoneVerified
  ) {
    return <Redirect href={"/verify" as Href} />;
  }

  return (
    <BottomChromeProvider>
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
    </BottomChromeProvider>
  );
});

export default TabsLayout;
