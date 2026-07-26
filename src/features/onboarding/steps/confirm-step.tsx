import { Ionicons } from "@expo/vector-icons";
import { observer } from "mobx-react-lite";
import type { JSX } from "react";
import { Text, View } from "react-native";
import { router, type Href } from "expo-router";
import { Spinner, Typography } from "heroui-native";

import PlatformIcon from "@/components/icons/PlatformIcon";
import { BrandButton } from "@/components/ui/brand-button";
import {
  OnboardingIconWell,
  OnboardingOptionCard,
} from "@/features/onboarding/onboarding-option-card";
import { OnboardingShell } from "@/features/onboarding/onboarding-shell";
import { DEFAULT_ONBOARDING_RADIUS } from "@/features/onboarding/map-answers-to-create";
import { ONBOARDING_TOTAL_STEPS } from "@/features/onboarding/quiz-options";
import { DEFAULT_ONBOARDING_CENTER } from "@/features/onboarding/resolve-device-location";
import {
  ONBOARDING_TEXT,
  ONBOARDING_TEXT_DIM,
} from "@/features/onboarding/onboarding-theme";
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
              <Spinner size="sm" color="#060606" />
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
                color: "#F87171",
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
          <Ionicons name="flash" size={22} color="#FAFAFA" />
        </OnboardingIconWell>
        <Typography
          type="body"
          weight="semibold"
          style={{ color: ONBOARDING_TEXT }}
        >
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
              color="#FAFAFA"
            />
          </OnboardingIconWell>
          <View className="flex-1 gap-0.5">
            <Typography type="body-sm" style={{ color: ONBOARDING_TEXT_DIM }}>
              Looking for
            </Typography>
            <Typography
              type="body"
              weight="medium"
              style={{ color: ONBOARDING_TEXT }}
            >
              {categoryLabel(
                onboardingStore.draft.searchType,
                onboardingStore.draft.customQuery,
              )}
            </Typography>
          </View>
        </View>

        <View className="flex-row items-center gap-3">
          <OnboardingIconWell>
            <Ionicons name="location-outline" size={20} color="#FAFAFA" />
          </OnboardingIconWell>
          <View className="flex-1 gap-0.5">
            <Typography type="body-sm" style={{ color: ONBOARDING_TEXT_DIM }}>
              Area
            </Typography>
            <Typography
              type="body"
              weight="medium"
              style={{ color: ONBOARDING_TEXT }}
            >
              {DEFAULT_ONBOARDING_CENTER.displayName} ·{" "}
              {DEFAULT_ONBOARDING_RADIUS} miles
            </Typography>
          </View>
        </View>

        <View className="flex-row items-center gap-3">
          <OnboardingIconWell>
            <PlatformIcon platform="facebook" size={20} />
          </OnboardingIconWell>
          <View className="flex-1 gap-0.5">
            <Typography type="body-sm" style={{ color: ONBOARDING_TEXT_DIM }}>
              Where
            </Typography>
            <Typography
              type="body"
              weight="medium"
              style={{ color: ONBOARDING_TEXT }}
            >
              Facebook Marketplace
            </Typography>
          </View>
        </View>
      </View>
    </OnboardingShell>
  );
});
