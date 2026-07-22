import { Redirect, type Href } from "expo-router";
import { observer } from "mobx-react-lite";
import type { JSX } from "react";
import { View } from "react-native";
import { Spinner } from "heroui-native";

import { useStore } from "@/store/store";

/**
 * Auth gate: login → verify phone → tabs.
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

  if (!userStore.isLoggedIn || !commonStore.token) {
    return <Redirect href={"/login" as Href} />;
  }

  if (!userStore.isPhoneVerified) {
    return <Redirect href={"/verify" as Href} />;
  }

  return <Redirect href={"/feed" as Href} />;
});

export default IndexGate;
