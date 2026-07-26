import type { JSX } from "react";
import { Redirect, Stack, type Href } from "expo-router";
import { observer } from "mobx-react-lite";

import { SUBSCRIPTION_DARK_BACKGROUND } from "@/features/settings/subscription-theme";
import { useStore } from "@/store/store";

const OnboardingLayout = observer(function OnboardingLayout(): JSX.Element {
  const { userStore } = useStore();

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
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade_from_bottom",
        animationDuration: 360,
        gestureEnabled: true,
        contentStyle: { backgroundColor: SUBSCRIPTION_DARK_BACKGROUND },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="what" />
      <Stack.Screen name="where" />
      <Stack.Screen name="coverage" />
      <Stack.Screen name="criteria" />
      <Stack.Screen name="radius" />
    </Stack>
  );
});

export default OnboardingLayout;
