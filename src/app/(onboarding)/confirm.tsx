import { Redirect, type Href } from "expo-router";
import { observer } from "mobx-react-lite";

import { ConfirmStep } from "@/features/onboarding/steps/confirm-step";
import { useStore } from "@/store/store";

const ConfirmRoute = observer(function ConfirmRoute() {
  const { onboardingStore } = useStore();

  if (!onboardingStore.canContinueWhat) {
    return <Redirect href={"/(onboarding)/what" as Href} />;
  }

  return <ConfirmStep />;
});

export default ConfirmRoute;
