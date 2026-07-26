import { Ionicons } from "@expo/vector-icons";
import { observer } from "mobx-react-lite";
import type { JSX } from "react";
import { Text, View } from "react-native";
import { router, type Href } from "expo-router";
import { Spinner, Typography, useThemeColor } from "heroui-native";

import { BrandButton } from "@/components/ui/brand-button";
import {
  OnboardingIconWell,
  OnboardingOptionCard,
} from "@/features/onboarding/onboarding-option-card";
import { OnboardingShell } from "@/features/onboarding/onboarding-shell";
import { DEFAULT_ONBOARDING_RADIUS } from "@/features/onboarding/map-answers-to-create";
import { ONBOARDING_TOTAL_STEPS } from "@/features/onboarding/quiz-options";
import { DEFAULT_ONBOARDING_CENTER } from "@/features/onboarding/resolve-device-location";
import { Fonts } from "@/lib/fonts";
import type { SearchType } from "@/mocks/data/home";
import { useStore } from "@/store/store";

function categoryLabel(
  searchType: SearchType | null,
  customQuery: string,
): string {
  if (searchType === "car") return "Cars · any make";
  if (searchType === "iphone") return "iPhones · all models";
  if (searchType === "custom") {
    const q = customQuery.trim();
    return q.length > 0 ? `“${q}”` : "Custom keyword";
  }
  return "Your category";
}

export const ConfirmStep = observer(function ConfirmStep(): JSX.Element {
  const { onboardingStore } = useStore();
  const [foreground, muted, accentFg, danger] = useThemeColor([
    "foreground",
    "muted",
    "accent-foreground",
    "danger",
  ]);

  const onStart = async () => {
    const ok = await onboardingStore.finish();
    if (ok) router.replace("/feed" as Href);
  };

  return (
    <OnboardingShell
      step={5}
      totalSteps={ONBOARDING_TOTAL_STEPS}
      title="Built for speed"
      subtitle="New posts hit your feed as soon as Marketplace lists them."
      onBack={() => router.back()}
      footer={
        <>
          <BrandButton
            className="min-h-12 w-full rounded-full"
            isDisabled={onboardingStore.submitting}
            onPress={() => void onStart()}
          >
            {onboardingStore.submitting ? (
              <Spinner size="sm" color={accentFg} />
            ) : null}
            <BrandButton.Label>
              {onboardingStore.submitting
                ? "Creating…"
                : "Create first search"}
            </BrandButton.Label>
          </BrandButton>
          {onboardingStore.lastError ? (
            <Text
              style={{
                fontFamily: Fonts.headingRegular,
                fontSize: 14,
                lineHeight: 20,
                color: danger,
                textAlign: "center",
              }}
            >
              {onboardingStore.lastError}
            </Text>
          ) : null}
        </>
      }
    >
      <OnboardingOptionCard
        selected
        className="flex-row items-center gap-3 px-4 py-4"
      >
        <OnboardingIconWell>
          <Ionicons name="flash" size={22} color={foreground} />
        </OnboardingIconWell>
        <Typography type="body" weight="semibold" className="text-foreground">
          Instant + 3 min
        </Typography>
      </OnboardingOptionCard>

      <View className="mt-2 gap-4 px-1">
        <View className="flex-row items-center gap-3">
          <OnboardingIconWell>
            <Ionicons
              name={
                onboardingStore.draft.searchType === "car"
                  ? "car-outline"
                  : onboardingStore.draft.searchType === "iphone"
                    ? "phone-portrait-outline"
                    : "search-outline"
              }
              size={20}
              color={foreground}
            />
          </OnboardingIconWell>
          <View className="flex-1 gap-0.5">
            <Typography type="body-sm" className="text-muted">
              Looking for
            </Typography>
            <Typography type="body" weight="medium" className="text-foreground">
              {categoryLabel(
                onboardingStore.draft.searchType,
                onboardingStore.draft.customQuery,
              )}
            </Typography>
          </View>
        </View>

        <View className="flex-row items-center gap-3">
          <OnboardingIconWell>
            <Ionicons name="location-outline" size={20} color={foreground} />
          </OnboardingIconWell>
          <View className="flex-1 gap-0.5">
            <Typography type="body-sm" className="text-muted">
              Area
            </Typography>
            <Typography type="body" weight="medium" className="text-foreground">
              {DEFAULT_ONBOARDING_CENTER.displayName} ·{" "}
              {DEFAULT_ONBOARDING_RADIUS} miles
            </Typography>
          </View>
        </View>

        <View className="flex-row items-center gap-3">
          <OnboardingIconWell>
            <Ionicons name="logo-facebook" size={20} color={foreground} />
          </OnboardingIconWell>
          <View className="flex-1 gap-0.5">
            <Typography type="body-sm" className="text-muted">
              Where
            </Typography>
            <Typography type="body" weight="medium" className="text-foreground">
              Facebook Marketplace
            </Typography>
            <Typography type="body-sm" style={{ color: muted }}>
              5 live searches across nearby cities
            </Typography>
          </View>
        </View>
      </View>
    </OnboardingShell>
  );
});
