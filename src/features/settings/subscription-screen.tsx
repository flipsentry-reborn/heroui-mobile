import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
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
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Button,
  ScrollShadow,
  useThemeColor,
  useToast,
} from "heroui-native";
import { useUniwind } from "uniwind";

import { HeroBoltIcon } from "@/features/settings/hero-bolt-icon";
import { SubscriptionPlansSkeleton } from "@/features/settings/settings-skeletons";
import { SubscriptionParticleField } from "@/features/settings/subscription-particles";
import {
  PLAN_ACCENTS,
  PLAN_GLOW_GRADIENT,
  SUBSCRIPTION_DARK_BACKGROUND,
} from "@/features/settings/subscription-theme";
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
import { store } from "@/store/store";

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
        start={PLAN_GLOW_GRADIENT.start}
        end={PLAN_GLOW_GRADIENT.end}
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
      />
      <SubscriptionParticleField />

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
  const router = useRouter();
  const { toast } = useToast();
  const { theme } = useUniwind();
  const isDark = theme === "dark";
  const [foreground, muted, background] = useThemeColor([
    "foreground",
    "muted",
    "background",
  ]);
  /** Near-black wash in dark; theme background in light. */
  const pageBackground = isDark ? SUBSCRIPTION_DARK_BACKGROUND : background;
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
      await store.subscriptionStore.load();
      await store.searchStore.loadSearchGroups();
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

  return (
    <View
      className="flex-1"
      style={{ paddingTop: insets.top, backgroundColor: pageBackground }}
    >
      <View className="px-3 pb-1 pt-1">
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          className="h-10 w-10 items-center justify-center rounded-full"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={foreground} />
        </Pressable>
      </View>
      <ScrollShadow
        className="flex-1"
        LinearGradientComponent={LinearGradient}
        color={pageBackground}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-4 px-4 pt-2"
          contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
          showsVerticalScrollIndicator={false}
        >
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
                Find deals faster.
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
                Pick your plan.
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
              More search slots and quicker alerts as you scale from Starter to
              Master.
            </Text>
          </View>

          {loading ? (
            <SubscriptionPlansSkeleton />
          ) : (
            <>
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
            </>
          )}
        </ScrollView>
      </ScrollShadow>
    </View>
  );
}
