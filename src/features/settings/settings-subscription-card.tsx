import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { JSX } from "react";
import { Pressable, Text, View } from "react-native";
import { Button } from "heroui-native";

import { HeroBoltIcon } from "@/features/settings/hero-bolt-icon";
import { SubscriptionParticleField } from "@/features/settings/subscription-particles";
import { PLAN_ACCENTS } from "@/features/settings/subscription-theme";
import { Fonts } from "@/lib/fonts";
import type { SubscriptionPlan } from "@/mocks/data/subscription";
import { formatPlanPrice } from "@/mocks/data/subscription";

interface SettingsSubscriptionCardProps {
  plan: SubscriptionPlan | null;
  onPress: () => void;
}

/** Active plan card (Britti + plan accent) or Subscribe CTA when free. */
export function SettingsSubscriptionCard({
  plan,
  onPress,
}: SettingsSubscriptionCardProps): JSX.Element {
  if (plan == null) {
    return (
      <View className="mx-3 mb-4 overflow-hidden rounded-3xl border border-white/10">
        <LinearGradient
          colors={["#12081f", "#0a0614", "#050505"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
        />
        <LinearGradient
          colors={["rgba(117, 56, 248, 0.45)", "transparent"]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0.15, y: 0.9 }}
          style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
        />
        <SubscriptionParticleField />
        <View className="gap-3 p-4">
          <View className="flex-row items-center gap-2">
            <HeroBoltIcon from="#7538F8" to="#F690EC" size={22} />
            <Text
              style={{
                flex: 1,
                fontFamily: Fonts.heading,
                fontSize: 18,
                lineHeight: 24,
                letterSpacing: -0.3,
                color: "#FFFFFF",
              }}
            >
              Become a Hero.
            </Text>
          </View>
          <Text
            style={{
              fontFamily: Fonts.headingRegular,
              fontSize: 13,
              lineHeight: 18,
              color: "rgba(255,255,255,0.65)",
            }}
          >
            Unlock alerts, searches, and deal scores.
          </Text>
          <Button
            variant="primary"
            size="sm"
            className="w-full bg-white"
            onPress={onPress}
          >
            <Button.Label className="text-sm text-black">
              Subscribe
            </Button.Label>
          </Button>
        </View>
      </View>
    );
  }

  const palette = PLAN_ACCENTS[plan.accent];

  return (
    <Pressable
      onPress={onPress}
      className="mx-3 mb-4 overflow-hidden rounded-3xl border border-white/10"
    >
      <LinearGradient
        colors={palette.gradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
      />
      <LinearGradient
        colors={[palette.glow, "transparent"]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.15, y: 0.9 }}
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
      />
      <SubscriptionParticleField />
      <View className="gap-3 p-5">
        <View className="flex-row items-center gap-2.5">
          <HeroBoltIcon
            from={palette.iconFrom}
            to={palette.iconTo}
            size={26}
          />
          <Text
            style={{
              flex: 1,
              fontFamily: Fonts.heading,
              fontSize: 22,
              lineHeight: 28,
              letterSpacing: -0.3,
              color: "#FFFFFF",
            }}
          >
            {plan.displayName}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color="rgba(255,255,255,0.55)"
          />
        </View>
        <View className="flex-row items-end justify-between gap-3">
          <View className="gap-0.5">
            <Text
              style={{
                fontFamily: Fonts.heading,
                fontSize: 28,
                lineHeight: 32,
                letterSpacing: -0.8,
                color: "#FFFFFF",
              }}
            >
              {formatPlanPrice(plan)}
            </Text>
            <Text
              style={{
                fontFamily: Fonts.headingRegular,
                fontSize: 12,
                color: "rgba(255,255,255,0.45)",
              }}
            >
              Current plan
            </Text>
          </View>
          {plan.badge ? (
            <View className="rounded-full bg-[#FBBF24] px-2.5 py-1">
              <Text
                style={{
                  fontFamily: Fonts.headingSemi,
                  fontSize: 11,
                  color: "#000000",
                }}
              >
                {plan.badge}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
