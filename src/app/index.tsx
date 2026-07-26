import { Redirect, type Href } from "expo-router";
import { observer } from "mobx-react-lite";
import type { JSX } from "react";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { Spinner } from "heroui-native";

import { useStore } from "@/store/store";

/**
 * Auth gate: welcome → login/register → verify phone → onboarding? → tabs.
 * Session is keyed on JWT presence so a temporary API outage does not look like logout.
 */
const IndexGate = observer(function IndexGate(): JSX.Element {
  const { userStore, commonStore, onboardingStore } = useStore();
  const [target, setTarget] = useState<Href | null>(null);

  useEffect(() => {
    if (!userStore.bootstrapped || !commonStore.appLoaded) {
      setTarget(null);
      return;
    }

    if (!userStore.hasSession) {
      setTarget("/welcome" as Href);
      return;
    }

    if (!userStore.isLoggedIn) {
      setTarget("/feed" as Href);
      return;
    }

    if (!userStore.isPhoneVerified) {
      setTarget("/verify" as Href);
      return;
    }

    let cancelled = false;
    setTarget(null);
    void (async () => {
      if (onboardingStore.shouldShow == null) {
        await onboardingStore.hydrateGate();
      }
      if (cancelled) return;
      setTarget(
        onboardingStore.shouldShow === true
          ? ("/(onboarding)/what" as Href)
          : ("/feed" as Href),
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [
    userStore.bootstrapped,
    userStore.hasSession,
    userStore.isLoggedIn,
    userStore.isPhoneVerified,
    commonStore.appLoaded,
    onboardingStore,
    onboardingStore.shouldShow,
  ]);

  if (target == null) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Spinner size="lg" />
      </View>
    );
  }

  return <Redirect href={target} />;
});

export default IndexGate;
