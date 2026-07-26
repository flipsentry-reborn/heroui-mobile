import { Ionicons } from "@expo/vector-icons";
import { observer } from "mobx-react-lite";
import type { JSX } from "react";
import { View } from "react-native";
import { router, type Href } from "expo-router";
import { Typography, useThemeColor } from "heroui-native";

import { BrandButton } from "@/components/ui/brand-button";
import {
  OnboardingIconWell,
  OnboardingOptionCard,
} from "@/features/onboarding/onboarding-option-card";
import { OnboardingShell } from "@/features/onboarding/onboarding-shell";
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
    hint: "Marketplace vehicles near you",
    icon: "car-outline",
  },
  {
    type: "iphone",
    label: "iPhones",
    hint: "Track specific models",
    icon: "phone-portrait-outline",
  },
  {
    type: "custom",
    label: "Custom",
    hint: "Any keyword search",
    icon: "search-outline",
  },
];

export const WhatStep = observer(function WhatStep(): JSX.Element {
  const { onboardingStore } = useStore();
  const [muted, foreground] = useThemeColor(["muted", "foreground"]);

  const onSkip = async () => {
    await onboardingStore.skip();
    router.replace("/feed" as Href);
  };

  return (
    <OnboardingShell
      step={1}
      title="What are you hunting?"
      subtitle="We'll set up your first FlipSentry search from this."
      onSkip={() => void onSkip()}
      footer={
        <BrandButton
          className="min-h-12 w-full rounded-full"
          isDisabled={!onboardingStore.canContinueWhat}
          onPress={() => router.push("/(onboarding)/where" as Href)}
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
                <Ionicons name={option.icon} size={22} color={foreground} />
              </OnboardingIconWell>
              <View className="flex-1 gap-0.5">
                <Typography
                  type="body"
                  weight="semibold"
                  className="text-foreground"
                >
                  {option.label}
                </Typography>
                <Typography type="body-sm" className="text-muted">
                  {option.hint}
                </Typography>
              </View>
              <Ionicons
                name={selected ? "checkmark-circle" : "ellipse-outline"}
                size={22}
                color={selected ? foreground : muted}
              />
            </OnboardingOptionCard>
          );
        })}
      </View>
    </OnboardingShell>
  );
});
