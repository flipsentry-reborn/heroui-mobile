import { Ionicons } from "@expo/vector-icons";
import type { JSX } from "react";
import { View } from "react-native";
import { router, type Href } from "expo-router";
import { Typography } from "heroui-native";

import { BrandButton } from "@/components/ui/brand-button";
import { OnboardingOptionCard } from "@/features/onboarding/onboarding-option-card";
import { OnboardingShell } from "@/features/onboarding/onboarding-shell";
import { ONBOARDING_TEXT } from "@/features/onboarding/onboarding-theme";
import {
  ONBOARDING_TOTAL_STEPS,
  type QuizOption,
} from "@/features/onboarding/quiz-options";

type QuizChoiceStepProps = {
  step: number;
  title: string;
  subtitle?: string;
  options: QuizOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  nextHref: Href;
};

export function QuizChoiceStep({
  step,
  title,
  subtitle,
  options,
  selectedId,
  onSelect,
  nextHref,
}: QuizChoiceStepProps): JSX.Element {
  return (
    <OnboardingShell
      step={step}
      totalSteps={ONBOARDING_TOTAL_STEPS}
      title={title}
      subtitle={subtitle}
      onBack={() => router.back()}
      footer={
        <BrandButton
          className="min-h-12 w-full rounded-full"
          isDisabled={selectedId == null}
          onPress={() => router.push(nextHref)}
        >
          <BrandButton.Label>Continue</BrandButton.Label>
        </BrandButton>
      }
    >
      <View className="gap-3">
        {options.map((option) => {
          const selected = selectedId === option.id;
          return (
            <OnboardingOptionCard
              key={option.id}
              selected={selected}
              onPress={() => onSelect(option.id)}
              className="flex-row items-center gap-3 px-4 py-4"
            >
              <View className="flex-1">
                <Typography
                  type="body"
                  weight="semibold"
                  style={{ color: ONBOARDING_TEXT }}
                >
                  {option.label}
                </Typography>
              </View>
              <Ionicons
                name={selected ? "checkmark-circle" : "ellipse-outline"}
                size={22}
                color={selected ? "#FAFAFA" : "#A1A1AA"}
              />
            </OnboardingOptionCard>
          );
        })}
      </View>
    </OnboardingShell>
  );
}
