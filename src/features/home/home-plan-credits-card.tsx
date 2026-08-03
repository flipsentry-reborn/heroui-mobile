import { Ionicons } from "@expo/vector-icons";
import type { JSX } from "react";
import { Pressable, Text, View } from "react-native";
import { Chip } from "heroui-native";

import { HeroBoltIcon } from "@/features/settings/hero-bolt-icon";
import { SubscriptionCardBackdrop } from "@/features/settings/subscription-card-backdrop";
import {
  NOT_SUBSCRIBED_ICON_STROKE,
  NOT_SUBSCRIBED_PALETTE,
  PLAN_ACCENTS,
} from "@/features/settings/subscription-theme";
import { Fonts } from "@/lib/fonts";
import type { HomePlan } from "@/mocks/data/home";
import type { SubscriptionPlan } from "@/mocks/data/subscription";
import { formatIntervalLabel } from "@/mocks/services/home";

/** Matches location sheet Instant speed affordance. */
const INSTANT_YELLOW = "#eab308";

interface HomePlanCreditsCardProps {
  homePlan: HomePlan;
  subscriptionPlan: SubscriptionPlan | null;
  onPress: () => void;
}

/** Search credits on the subscription plan accent background. */
export function HomePlanCreditsCard({
  homePlan,
  subscriptionPlan,
  onPress,
}: HomePlanCreditsCardProps): JSX.Element {
  const isSubscribed = subscriptionPlan != null;
  const palette = isSubscribed
    ? PLAN_ACCENTS[subscriptionPlan.accent]
    : NOT_SUBSCRIBED_PALETTE;
  const title = subscriptionPlan?.displayName ?? "Not subscribed";

  return (
    <Pressable
      onPress={onPress}
      className={
        isSubscribed
          ? "mx-3 mb-3 overflow-hidden rounded-3xl border border-white/15"
          : "mx-3 mb-3 overflow-hidden rounded-3xl border border-black/10"
      }
    >
      <SubscriptionCardBackdrop
        palette={palette}
        showParticles={isSubscribed}
      />

      <View className="gap-2.5 p-[15px]">
        <View className="flex-row items-center gap-2">
          <HeroBoltIcon
            from={palette.iconFrom}
            to={palette.iconTo}
            boltFill={palette.boltFill}
            stroke={isSubscribed ? undefined : NOT_SUBSCRIBED_ICON_STROKE}
            size={22}
          />
          <Text
            style={{
              flex: 1,
              fontFamily: Fonts.heading,
              fontSize: 18,
              lineHeight: 24,
              letterSpacing: -0.3,
              color: palette.text,
            }}
          >
            {title}
          </Text>
        </View>

        <View>
          <Text
            style={{
              fontFamily: Fonts.heading,
              fontSize: 22,
              lineHeight: 28,
              color: palette.text,
            }}
          >
            {homePlan.usedSearches} / {homePlan.maxSearches}
          </Text>
          <Text
            style={{
              fontFamily: Fonts.headingRegular,
              fontSize: 11,
              color: palette.textMuted,
            }}
          >
            used searches
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-1.5">
          {homePlan.credits.map((c) => {
            const isInstant = c.intervalSeconds === 60;
            const used = Math.max(0, c.total - c.remaining);
            return (
              <Chip
                key={c.intervalSeconds}
                size="sm"
                variant="secondary"
                color="default"
                className={
                  isSubscribed
                    ? "flex-row items-center gap-1 border border-white/12 bg-white/10 px-2.5 py-1"
                    : "flex-row items-center gap-1 border border-black/10 bg-black/5 px-2.5 py-1"
                }
              >
                {isInstant ? (
                  <Ionicons name="flash" size={12} color={INSTANT_YELLOW} />
                ) : null}
                <Chip.Label
                  className={
                    isSubscribed
                      ? "text-[11px] text-white"
                      : "text-[11px] text-black"
                  }
                >
                  {formatIntervalLabel(c.intervalSeconds)}: {used}/{c.total}
                </Chip.Label>
              </Chip>
            );
          })}
        </View>
      </View>
    </Pressable>
  );
}
