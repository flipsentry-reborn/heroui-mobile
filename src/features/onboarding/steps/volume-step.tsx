import { observer } from "mobx-react-lite";
import type { JSX } from "react";
import { Redirect, type Href } from "expo-router";

import { VOLUME_OPTIONS } from "@/features/onboarding/quiz-options";
import { QuizChoiceStep } from "@/features/onboarding/steps/quiz-choice-step";
import { useStore } from "@/store/store";

export const VolumeStep = observer(function VolumeStep(): JSX.Element {
  const { onboardingStore } = useStore();
  const searchType = onboardingStore.draft.searchType;

  if (!onboardingStore.canContinueWhat || searchType == null) {
    return <Redirect href={"/(onboarding)/what" as Href} />;
  }

  return (
    <QuizChoiceStep
      step={2}
      title="How many do you flip per month?"
      options={VOLUME_OPTIONS[searchType]}
      selectedId={onboardingStore.draft.volumeId}
      onSelect={(id) => onboardingStore.setVolumeId(id)}
      nextHref={"/(onboarding)/margin" as Href}
    />
  );
});
