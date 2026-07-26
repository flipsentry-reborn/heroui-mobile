import { observer } from "mobx-react-lite";
import type { JSX } from "react";
import { Redirect, type Href } from "expo-router";

import { MARGIN_OPTIONS } from "@/features/onboarding/quiz-options";
import { QuizChoiceStep } from "@/features/onboarding/steps/quiz-choice-step";
import { useStore } from "@/store/store";

export const MarginStep = observer(function MarginStep(): JSX.Element {
  const { onboardingStore } = useStore();
  const searchType = onboardingStore.draft.searchType;

  if (!onboardingStore.canContinueWhat || searchType == null) {
    return <Redirect href={"/(onboarding)/what" as Href} />;
  }
  if (onboardingStore.draft.volumeId == null) {
    return <Redirect href={"/(onboarding)/volume" as Href} />;
  }

  return (
    <QuizChoiceStep
      step={3}
      title="What's your average profit per flip?"
      options={MARGIN_OPTIONS[searchType]}
      selectedId={onboardingStore.draft.marginId}
      onSelect={(id) => onboardingStore.setMarginId(id)}
      nextHref={"/(onboarding)/tried" as Href}
    />
  );
});
