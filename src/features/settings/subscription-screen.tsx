import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { JSX } from "react";
import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Skeleton, useThemeColor, useToast } from "heroui-native";

import { HeroBoltIcon } from "@/features/settings/hero-bolt-icon";
import { PLAN_ACCENTS } from "@/features/settings/subscription-theme";
import { Fonts } from "@/lib/fonts";
import type {
  SubscriptionPlan,
  SubscriptionTier,
} from "@/mocks/data/subscription";
import { formatPlanPrice } from "@/mocks/data/subscription";
import {
  getSubscription,
  mockRestorePurchases,
  mockSubscribe,
} from "@/mocks/services/subscription";

interface ParticleSeed {
  key: string;
  /** 0-1 from left */
  x: number;
  /** 0-1 from top */
  y: number;
  size: number;
  duration: number;
  delay: number;
  driftX: number;
  driftY: number;
}

/** Sparse particles biased to the top-right (HeroUI pricing glow zone). */
const PARTICLE_SEEDS: readonly ParticleSeed[] = Array.from(
  { length: 18 },
  (_, i) => {
    const t = i / 17;
    // Bias: mostly right (0.45-1.0) and top (0-0.55)
    const x = 0.48 + Math.abs(Math.sin(i * 2.7)) * 0.48;
    const y = Math.abs(Math.cos(i * 1.9)) * 0.5;
    return {
      key: `p-${i}`,
      x,
      y,
      size: 1.5 + (i % 4) * 0.7,
      duration: 2800 + (i % 5) * 700,
      delay: i * 120,
      driftX: -8 - t * 10,
      driftY: 10 + (i % 3) * 6,
    };
  },
);

function MovingParticle({ seed }: { seed: ParticleSeed }): JSX.Element {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      seed.delay,
      withRepeat(
        withSequence(
          withTiming(1, {
            duration: seed.duration,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(0, {
            duration: seed.duration,
            easing: Easing.inOut(Easing.sin),
          }),
        ),
        -1,
        false,
      ),
    );
  }, [progress, seed.delay, seed.duration]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.15 + progress.value * 0.7,
    transform: [
      { translateX: progress.value * seed.driftX },
      { translateY: progress.value * seed.driftY },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          left: `${seed.x * 100}%`,
          top: `${seed.y * 100}%`,
          width: seed.size,
          height: seed.size,
          borderRadius: seed.size,
          backgroundColor: "white",
        },
        style,
      ]}
    />
  );
}

function ParticleField(): JSX.Element {
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        overflow: "hidden",
      }}
    >
      {PARTICLE_SEEDS.map((seed) => (
        <MovingParticle key={seed.key} seed={seed} />
      ))}
    </View>
  );
}

const FEATURE_STAGGER_MS = 70;
const FEATURE_ENTER_MS = 380;

function FeatureRow({
  feature,
  index,
}: {
  feature: string;
  index: number;
}): JSX.Element {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * FEATURE_STAGGER_MS)
        .duration(FEATURE_ENTER_MS)
        .easing(Easing.out(Easing.cubic))}
      className="flex-row items-start gap-2.5"
    >
      <Ionicons
        name="checkmark"
        size={16}
        color="rgba(255,255,255,0.85)"
        style={{ marginTop: 2 }}
      />
      <Text
        style={{
          flex: 1,
          fontFamily: Fonts.headingRegular,
          fontSize: 14,
          lineHeight: 20,
          color: "rgba(255,255,255,0.85)",
        }}
      >
        {feature}
      </Text>
    </Animated.View>
  );
}

function PlanCard({
  plan,
  busy,
  isCurrent,
  expanded,
  onToggle,
  onSelect,
}: {
  plan: SubscriptionPlan;
  busy: boolean;
  isCurrent: boolean;
  expanded: boolean;
  onToggle: () => void;
  onSelect: () => void;
}): JSX.Element {
  const palette = PLAN_ACCENTS[plan.accent];
  const chevron = useSharedValue(0);

  useEffect(() => {
    chevron.value = withTiming(expanded ? 1 : 0, {
      duration: 320,
      easing: Easing.out(Easing.cubic),
    });
  }, [chevron, expanded]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevron.value * 180}deg` }],
  }));

  return (
    <Animated.View
      layout={LinearTransition.duration(420).easing(Easing.out(Easing.cubic))}
      className="overflow-hidden rounded-3xl border border-white/10"
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
      <ParticleField />

      <Pressable onPress={onToggle} className="gap-5 p-5">
        <View className="gap-2">
          <View className="flex-row items-center gap-2.5">
            <HeroBoltIcon from={palette.iconFrom} to={palette.iconTo} size={26} />
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
            <Animated.View style={chevronStyle}>
              <Ionicons
                name="chevron-down"
                size={18}
                color="rgba(255,255,255,0.55)"
              />
            </Animated.View>
          </View>
          <Text
            style={{
              fontFamily: Fonts.headingRegular,
              fontSize: 14,
              lineHeight: 20,
              color: "rgba(255,255,255,0.65)",
            }}
          >
            {plan.description}
          </Text>
        </View>

        <View className="gap-1">
          <Text
            style={{
              fontFamily: Fonts.heading,
              fontSize: 40,
              lineHeight: 44,
              letterSpacing: -1,
              color: "#FFFFFF",
            }}
          >
            {formatPlanPrice(plan)}
          </Text>
          <Text
            style={{
              fontFamily: Fonts.headingRegular,
              fontSize: 12,
              lineHeight: 16,
              color: "rgba(255,255,255,0.45)",
            }}
          >
            {plan.priceNote}
          </Text>
        </View>

        {expanded ? (
          <Animated.View
            key={`${plan.id}-specs`}
            entering={FadeIn.duration(280).easing(Easing.out(Easing.cubic))}
            exiting={FadeOut.duration(160)}
            layout={LinearTransition.duration(360)}
            className="gap-4"
          >
            <View className="gap-2.5">
              {plan.features.map((feature, index) => (
                <FeatureRow key={feature} feature={feature} index={index} />
              ))}
            </View>

            <Animated.View
              entering={FadeInDown.delay(
                plan.features.length * FEATURE_STAGGER_MS + 40,
              )
                .duration(FEATURE_ENTER_MS)
                .easing(Easing.out(Easing.cubic))}
              className="gap-1 border-t border-white/10 pt-4"
            >
              <Text
                style={{
                  fontFamily: Fonts.headingSemi,
                  fontSize: 14,
                  lineHeight: 20,
                  color: "rgba(255,255,255,0.9)",
                }}
              >
                {plan.renewalTitle}
              </Text>
              <Text
                style={{
                  fontFamily: Fonts.headingRegular,
                  fontSize: 12,
                  lineHeight: 18,
                  color: "rgba(255,255,255,0.45)",
                }}
              >
                {plan.renewalNote}
              </Text>
            </Animated.View>
          </Animated.View>
        ) : (
          <Animated.View
            key={`${plan.id}-hint`}
            entering={FadeIn.duration(220)}
            exiting={FadeOut.duration(120)}
          >
            <Text
              style={{
                fontFamily: Fonts.headingRegular,
                fontSize: 12,
                color: "rgba(255,255,255,0.4)",
              }}
            >
              Tap to see what's included
            </Text>
          </Animated.View>
        )}

        <Button
          variant={plan.featured ? "primary" : "secondary"}
          className={
            plan.featured
              ? "min-h-12 w-full rounded-full bg-white"
              : "min-h-12 w-full rounded-full border-0 bg-white/10"
          }
          isDisabled={busy || isCurrent}
          onPress={onSelect}
        >
          <Button.Label
            className={
              plan.featured
                ? "font-semibold text-black"
                : "font-semibold text-white"
            }
          >
            {isCurrent ? "Current plan" : plan.ctaLabel}
          </Button.Label>
        </Button>
      </Pressable>
    </Animated.View>
  );
}

export function SubscriptionScreen(): JSX.Element {
  const insets = useSafeAreaInsets();
  const { toast } = useToast();
  const [foreground, muted] = useThemeColor(["foreground", "muted"]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [currentTier, setCurrentTier] = useState<SubscriptionTier | null>(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>(
    [],
  );
  const [expandedId, setExpandedId] = useState<SubscriptionTier | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const next = await getSubscription();
      setCurrentTier(next.currentTier);
      setSubscriptionPlans(next.plans);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSubscribe = async (tier: SubscriptionTier) => {
    setBusy(true);
    try {
      const next = await mockSubscribe(tier);
      setCurrentTier(next.currentTier);
      toast.show({
        variant: "success",
        label: "Subscribed",
        description: `You're on ${next.plans.find((p) => p.id === tier)?.displayName ?? "the plan"}`,
        duration: 2500,
      });
    } catch {
      Alert.alert("Error", "Could not complete purchase");
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async () => {
    setBusy(true);
    try {
      await mockRestorePurchases();
      toast.show({
        variant: "default",
        label: "Purchases restored",
        duration: 2000,
      });
      await load();
    } catch {
      Alert.alert("Error", "Could not restore purchases");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 gap-4 bg-background px-4 pt-4">
        <Skeleton className="h-56 rounded-3xl" />
        <Skeleton className="h-56 rounded-3xl" />
        <Skeleton className="h-56 rounded-3xl" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-4 px-4 pt-2"
      contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
      showsVerticalScrollIndicator={false}
    >
      {/* HeroUI Pro pricing header - Britti Sans (heroSans) + zinc hierarchy */}
      <View className="mb-3 items-center gap-3 px-2 pt-1">
        <View className="items-center">
          <Text
            style={{
              fontFamily: Fonts.heading,
              fontSize: 34,
              lineHeight: 40,
              letterSpacing: -0.6,
              color: foreground,
              textAlign: "center",
            }}
          >
            Become a Hero.
          </Text>
          <Text
            style={{
              fontFamily: Fonts.heading,
              fontSize: 34,
              lineHeight: 40,
              letterSpacing: -0.6,
              color: "#71717A",
              textAlign: "center",
            }}
          >
            Ship with confidence.
          </Text>
        </View>
        <Text
          style={{
            fontFamily: Fonts.headingRegular,
            fontSize: 16,
            lineHeight: 24,
            color: muted,
            textAlign: "center",
            paddingHorizontal: 8,
          }}
        >
          Pick your stack. Start building products you're proud to ship.
        </Text>
      </View>

      {subscriptionPlans.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          busy={busy}
          isCurrent={currentTier === plan.id}
          expanded={expandedId === plan.id}
          onToggle={() =>
            setExpandedId((id) => (id === plan.id ? null : plan.id))
          }
          onSelect={() => void handleSubscribe(plan.id)}
        />
      ))}

      <Button
        variant="ghost"
        className="mt-1 self-center"
        isDisabled={busy}
        onPress={() => void handleRestore()}
      >
        <Button.Label className="font-normal text-muted">
          Restore purchases
        </Button.Label>
      </Button>
    </ScrollView>
  );
}
