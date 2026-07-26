import { Ionicons } from "@expo/vector-icons";
import { observer } from "mobx-react-lite";
import type { JSX } from "react";
import { View } from "react-native";
import { router, type Href } from "expo-router";
import { Input, Label, TextField, Typography } from "heroui-native";

import { BrandButton } from "@/components/ui/brand-button";
import {
  AUTH_CONTROL_BACKGROUND,
  AUTH_PLACEHOLDER_COLOR,
} from "@/features/auth/auth-theme";
import {
  OnboardingIconWell,
  OnboardingOptionCard,
} from "@/features/onboarding/onboarding-option-card";
import { OnboardingShell } from "@/features/onboarding/onboarding-shell";
import {
  ONBOARDING_TEXT,
  ONBOARDING_TEXT_DIM,
} from "@/features/onboarding/onboarding-theme";
import { ONBOARDING_TOTAL_STEPS } from "@/features/onboarding/quiz-options";
import type { SearchType } from "@/mocks/data/home";
import { useStore } from "@/store/store";

const OPTIONS: Array<{
  type: SearchType;
  label: string;
  hint: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  {
    type: "car",
    label: "Cars",
    hint: "Any make",
    icon: "car-outline",
  },
  {
    type: "iphone",
    label: "iPhones",
    hint: "All models",
    icon: "phone-portrait-outline",
  },
  {
    type: "custom",
    label: "Custom",
    hint: "Your keyword",
    icon: "search-outline",
  },
];

export const WhatStep = observer(function WhatStep(): JSX.Element {
  const { onboardingStore } = useStore();

  return (
    <OnboardingShell
      step={1}
      totalSteps={ONBOARDING_TOTAL_STEPS}
      title="What are you looking for?"
      subtitle="Pick a category. A few quick questions, then your first search."
      footer={
        <BrandButton
          className="min-h-12 w-full rounded-full"
          isDisabled={!onboardingStore.canContinueWhat}
          onPress={() => router.push("/(onboarding)/volume" as Href)}
        >
          <BrandButton.Label>Continue</BrandButton.Label>
        </BrandButton>
      }
    >
      <View className="gap-3">
        {OPTIONS.map((option) => {
          const selected = onboardingStore.draft.searchType === option.type;
          return (
            <OnboardingOptionCard
              key={option.type}
              selected={selected}
              onPress={() => onboardingStore.setSearchType(option.type)}
              className="flex-row items-center gap-3 px-4 py-4"
            >
              <OnboardingIconWell>
                <Ionicons name={option.icon} size={22} color="#FAFAFA" />
              </OnboardingIconWell>
              <View className="flex-1 gap-0.5">
                <Typography
                  type="body"
                  weight="semibold"
                  style={{ color: ONBOARDING_TEXT }}
                >
                  {option.label}
                </Typography>
                <Typography
                  type="body-sm"
                  style={{ color: ONBOARDING_TEXT_DIM }}
                >
                  {option.hint}
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

      {onboardingStore.draft.searchType === "custom" ? (
        <TextField className="mt-2">
          <Label style={{ color: ONBOARDING_TEXT_DIM }}>Keyword</Label>
          <Input
            value={onboardingStore.draft.customQuery}
            onChangeText={(text: string) =>
              onboardingStore.setCustomQuery(text)
            }
            placeholder="e.g. MacBook Pro, sofa, scooter"
            placeholderTextColor={AUTH_PLACEHOLDER_COLOR}
            autoCorrect={false}
            className="h-12 rounded-2xl border-transparent shadow-none"
            style={{
              backgroundColor: AUTH_CONTROL_BACKGROUND,
              color: "#FAFAFA",
            }}
          />
        </TextField>
      ) : null}
    </OnboardingShell>
  );
});
