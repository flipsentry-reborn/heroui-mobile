import { LinearGradient } from "expo-linear-gradient";
import type { JSX } from "react";
import { Pressable, Text, View } from "react-native";
import { Chip } from "heroui-native";

import { HeroBoltIcon } from "@/features/settings/hero-bolt-icon";
import { SubscriptionParticleField } from "@/features/settings/subscription-particles";
import {
  NOT_SUBSCRIBED_ICON_STROKE,
  NOT_SUBSCRIBED_PALETTE,
  PLAN_ACCENTS,
  PLAN_GLOW_GRADIENT,
} from "@/features/settings/subscription-theme";
import { Fonts } from "@/lib/fonts";
import type { HomePlan } from "@/mocks/data/home";
import type { SubscriptionPlan } from "@/mocks/data/subscription";
import { formatIntervalLabel } from "@/mocks/services/home";

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
          ? "mx-3 mb-3 overflow-hidden rounded-3xl border border-white/10"
          : "mx-3 mb-3 overflow-hidden rounded-3xl border border-black/10"
      }
    >
      <LinearGradient
        colors={palette.gradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
      />
      <LinearGradient
        colors={[palette.glow, "transparent"]}
        start={PLAN_GLOW_GRADIENT.start}
        end={PLAN_GLOW_GRADIENT.end}
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
      />
      {isSubscribed ? <SubscriptionParticleField /> : null}

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
            active searches
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-1.5">
          {homePlan.credits.map((c) => (
            <Chip
              key={c.intervalSeconds}
              size="sm"
              variant="secondary"
              color="default"
              className={
                isSubscribed
                  ? "border border-white/12 bg-white/10 px-2.5 py-1"
                  : "border border-black/10 bg-black/5 px-2.5 py-1"
              }
            >
              <Chip.Label
                className={
                  isSubscribed
                    ? "text-[11px] text-white"
                    : "text-[11px] text-black"
                }
              >
                {formatIntervalLabel(c.intervalSeconds)}: {c.remaining}/{c.total}
              </Chip.Label>
            </Chip>
          ))}
        </View>
      </View>
    </Pressable>
  );
}
