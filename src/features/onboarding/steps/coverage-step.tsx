import { Ionicons } from "@expo/vector-icons";
import { observer } from "mobx-react-lite";
import type { JSX } from "react";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { router, type Href } from "expo-router";
import { Typography, useThemeColor } from "heroui-native";

import { BrandButton } from "@/components/ui/brand-button";
import { SEARCH_PLATFORMS } from "@/features/home/search-bottom-sheet-platforms-sheet";
import { OnboardingOptionCard } from "@/features/onboarding/onboarding-option-card";
import { OnboardingShell } from "@/features/onboarding/onboarding-shell";
import { ONBOARDING_RADIUS_PRESETS } from "@/features/onboarding/map-answers-to-create";
import {
  ONBOARDING_BORDER_IDLE,
  ONBOARDING_CHIP_SELECTED_FILL,
} from "@/features/onboarding/onboarding-theme";
import { useStore } from "@/store/store";

export const CoverageStep = observer(function CoverageStep(): JSX.Element {
  const { onboardingStore } = useStore();
  const [foreground, muted] = useThemeColor(["foreground", "muted"]);

  useEffect(() => {
    if (onboardingStore.draft.searchType == null) {
      router.replace("/(onboarding)/what" as Href);
      return;
    }
    if (!onboardingStore.canContinueWhere) {
      router.replace("/(onboarding)/where" as Href);
    }
  }, [onboardingStore.draft.searchType, onboardingStore.canContinueWhere]);

  useEffect(() => {
    if (!onboardingStore.canContinueWhere) return;
    void onboardingStore.refreshAssignedLocations();
  }, [
    onboardingStore.canContinueWhere,
    onboardingStore.draft.location?.id,
    onboardingStore.draft.location?.latitude,
    onboardingStore.draft.location?.longitude,
    onboardingStore.draft.radiusMiles,
  ]);

  const onSkip = async () => {
    await onboardingStore.skip();
    router.replace("/feed" as Href);
  };

  return (
    <OnboardingShell
      step={3}
      title="Platforms & distance"
      subtitle="We'll watch the closest cities inside your radius — Instant on the first, 3 min on the next two."
      onBack={() => router.back()}
      onSkip={() => void onSkip()}
      footer={
        <BrandButton
          className="min-h-12 w-full rounded-full"
          isDisabled={!onboardingStore.canContinueCoverage}
          onPress={() => router.push("/(onboarding)/criteria" as Href)}
        >
          <BrandButton.Label>Continue</BrandButton.Label>
        </BrandButton>
      }
    >
      <View className="gap-2.5">
        <Typography type="body-sm" weight="semibold" className="text-foreground">
          Platforms
        </Typography>
        <Typography type="body-xs" className="text-muted">
          Nearby cities start on Facebook. Extra platforms can be added later from
          Home.
        </Typography>
        <View className="flex-row flex-wrap gap-2">
          {SEARCH_PLATFORMS.map((platform) => {
            const selected = onboardingStore.draft.platforms.includes(
              platform.id,
            );
            const locked = platform.id === "facebook";
            return (
              <OnboardingOptionCard
                key={platform.id}
                selected={selected}
                disabled={locked}
                pill
                onPress={() => onboardingStore.togglePlatform(platform.id)}
                className="px-3.5 py-2"
              >
                <Typography
                  type="body-sm"
                  weight="semibold"
                  className="text-foreground"
                >
                  {platform.label}
                </Typography>
              </OnboardingOptionCard>
            );
          })}
        </View>
      </View>

      <View className="gap-2.5">
        <Typography type="body-sm" weight="semibold" className="text-foreground">
          How far?
        </Typography>
        <View className="flex-row flex-wrap gap-3">
          {ONBOARDING_RADIUS_PRESETS.map((miles) => {
            const selected = onboardingStore.draft.radiusMiles === miles;
            return (
              <View key={miles} className="min-w-[28%] flex-1">
                <OnboardingOptionCard
                  selected={selected}
                  onPress={() => onboardingStore.setRadiusMiles(miles)}
                  className="items-center px-4 py-4"
                >
                  <Typography
                    type="body"
                    weight="semibold"
                    className="text-foreground"
                  >
                    {miles} mi
                  </Typography>
                </OnboardingOptionCard>
              </View>
            );
          })}
        </View>
      </View>

      <View className="gap-2.5">
        <Typography type="body-sm" weight="semibold" className="text-foreground">
          Cities we&apos;ll watch
        </Typography>
        {onboardingStore.nearbyLoading ? (
          <View className="items-center py-4">
            <ActivityIndicator color={foreground} />
          </View>
        ) : (
          <View className="gap-2">
            {onboardingStore.draft.assignedLocations.map((row, index) => (
              <Animated.View
                key={`${row.location.id}-${row.runIntervalSeconds}`}
                entering={FadeInDown.delay(index * 50).duration(320)}
              >
                <OnboardingOptionCard className="flex-row items-center gap-3 px-3.5 py-3.5">
                  <Ionicons name="location-outline" size={18} color={muted} />
                  <View className="flex-1 gap-0.5">
                    <Typography type="body" className="text-foreground">
                      {row.location.displayName || row.location.name}
                    </Typography>
                    <Typography type="body-xs" className="text-muted">
                      {row.location.distanceMiles != null &&
                      row.location.distanceMiles > 0
                        ? `${row.location.distanceMiles.toFixed(1)} mi away`
                        : "Center"}
                    </Typography>
                  </View>
                  <View
                    className="rounded-full px-2.5 py-1"
                    style={{
                      backgroundColor: ONBOARDING_CHIP_SELECTED_FILL,
                      borderWidth: 1,
                      borderColor: ONBOARDING_BORDER_IDLE,
                    }}
                  >
                    <Typography
                      type="body-xs"
                      weight="semibold"
                      className="text-foreground"
                    >
                      {row.speedLabel}
                    </Typography>
                  </View>
                </OnboardingOptionCard>
              </Animated.View>
            ))}
            {onboardingStore.draft.assignedLocations.length === 0 ? (
              <Animated.View entering={FadeIn.duration(240)}>
                <Typography type="body-sm" className="text-muted">
                  No cities found. Try a larger radius.
                </Typography>
              </Animated.View>
            ) : null}
            <Typography type="body-xs" className="text-muted">
              Only these three use slots (1 Instant + 2 × 3 min). Extra cities stay
              hidden so you keep search capacity.
            </Typography>
          </View>
        )}
      </View>

      {onboardingStore.lastError ? (
        <Typography type="body-sm" className="text-center text-danger">
          {onboardingStore.lastError}
        </Typography>
      ) : null}
    </OnboardingShell>
  );
});
