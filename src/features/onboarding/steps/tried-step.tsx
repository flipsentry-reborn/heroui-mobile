import { observer } from "mobx-react-lite";
import type { JSX } from "react";
import { Redirect, type Href } from "expo-router";

import { TRIED_OTHER_OPTIONS } from "@/features/onboarding/quiz-options";
import { QuizChoiceStep } from "@/features/onboarding/steps/quiz-choice-step";
import { useStore } from "@/store/store";

export const TriedStep = observer(function TriedStep(): JSX.Element {
  const { onboardingStore } = useStore();

  if (!onboardingStore.canContinueWhat) {
    return <Redirect href={"/(onboarding)/what" as Href} />;
  }
  if (onboardingStore.draft.volumeId == null) {
    return <Redirect href={"/(onboarding)/volume" as Href} />;
  }
  if (onboardingStore.draft.marginId == null) {
    return <Redirect href={"/(onboarding)/margin" as Href} />;
  }

  const selectedId =
    onboardingStore.draft.triedOtherApps == null
      ? null
      : onboardingStore.draft.triedOtherApps
        ? "yes"
        : "no";

  return (
    <QuizChoiceStep
      step={4}
      title="Have you tried other flipping apps?"
      options={TRIED_OTHER_OPTIONS}
      selectedId={selectedId}
      onSelect={(id) => onboardingStore.setTriedOtherApps(id === "yes")}
      nextHref={"/(onboarding)/confirm" as Href}
    />
  );
});
