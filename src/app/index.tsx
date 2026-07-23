import { Redirect, type Href } from "expo-router";
import { observer } from "mobx-react-lite";
import type { JSX } from "react";
import { View } from "react-native";
import { Spinner } from "heroui-native";

import { useStore } from "@/store/store";

/**
 * Auth gate: welcome → login/register → verify phone → tabs.
 * Session is keyed on JWT presence so a temporary API outage does not look like logout.
 */
const IndexGate = observer(function IndexGate(): JSX.Element {
  const { userStore, commonStore } = useStore();

  if (!userStore.bootstrapped || !commonStore.appLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Spinner size="lg" />
      </View>
    );
  }

  if (!userStore.hasSession) {
    return <Redirect href={"/welcome" as Href} />;
  }

  // Token exists but /api/user failed (network/5xx) — enter app; toast is shown from root.
  if (!userStore.isLoggedIn) {
    return <Redirect href={"/feed" as Href} />;
  }

  if (!userStore.isPhoneVerified) {
    return <Redirect href={"/verify" as Href} />;
  }

  return <Redirect href={"/feed" as Href} />;
});

export default IndexGate;
