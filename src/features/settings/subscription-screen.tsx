import {
  BottomSheetFooter,
  BottomSheetScrollView,
  type BottomSheetFooterProps,
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import type { JSX } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Linking, Platform, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BottomSheet,
  Button,
  Checkbox,
  Chip,
  ControlField,
  Description,
  Label,
  Skeleton,
  Tabs,
  Typography,
  useToast,
} from "heroui-native";

import type {
  BillingPeriod,
  SubscriptionPlan,
  SubscriptionTier,
} from "@/mocks/data/subscription";
import { formatMoney } from "@/mocks/data/subscription";
import {
  getSubscription,
  mockRestorePurchases,
  mockSubscribe,
} from "@/mocks/services/subscription";

/** Flip when Adapty / store yearly products ship. */
const YEARLY_ENABLED = false;

function priceFor(plan: SubscriptionPlan, period: BillingPeriod): string {
  return formatMoney(period === "weekly" ? plan.weeklyPrice : plan.yearlyPrice);
}

function periodCopy(period: BillingPeriod): string {
  return period === "weekly" ? "week" : "year";
}

function PlanIncludes({ plan }: { plan: SubscriptionPlan }): JSX.Element {
  return (
    <View className="items-center gap-2.5 px-4 pb-4 pt-1">
      <View className="mb-0.5 h-px w-full bg-white/10" />
      <Typography
        type="body-xs"
        weight="semibold"
        className="text-center text-[#1DB954]"
      >
        {plan.displayName} includes
      </Typography>
      <View className="flex-row flex-wrap items-center justify-center gap-2">
        <Chip size="sm" variant="soft" color="default">
          <Chip.Label>Instant {plan.credits.instant}</Chip.Label>
        </Chip>
        <Chip size="sm" variant="soft" color="default">
          <Chip.Label>5 min {plan.credits.fiveMin}</Chip.Label>
        </Chip>
        <Chip size="sm" variant="soft" color="default">
          <Chip.Label>15 min {plan.credits.fifteenMin}</Chip.Label>
        </Chip>
      </View>
      {/* Centered block, left-aligned rows so checkmarks share one vertical line */}
      <View className="items-start gap-2 self-center">
        {plan.features.map((feature) => (
          <View key={feature} className="flex-row items-center gap-2">
            <Ionicons name="checkmark-circle" size={15} color="#1DB954" />
            <Typography type="body-xs" className="text-foreground/90">
              {feature}
            </Typography>
          </View>
        ))}
      </View>
    </View>
  );
}

function PlanOptionRow({
  plan,
  period,
  selected,
  isCurrent,
  onSelect,
}: {
  plan: SubscriptionPlan;
  period: BillingPeriod;
  selected: boolean;
  isCurrent: boolean;
  onSelect: () => void;
}): JSX.Element {
  const price = priceFor(plan, period);
  const description =
    period === "yearly"
      ? `${plan.maxSearches} searches · ${formatMoney(plan.yearlyPrice / 12)}/mo avg`
      : `${plan.maxSearches} active searches · ${price}/${periodCopy(period)}`;

  const [contentHeight, setContentHeight] = useState(0);
  const open = useSharedValue(selected ? 1 : 0);
  const skipFirstAnim = useRef(true);

  useEffect(() => {
    if (contentHeight <= 0) return;

    if (skipFirstAnim.current) {
      open.value = selected ? 1 : 0;
      skipFirstAnim.current = false;
      return;
    }

    open.value = withTiming(selected ? 1 : 0, {
      duration: 380,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    });
  }, [contentHeight, open, selected]);

  const accordionStyle = useAnimatedStyle(() => ({
    height: contentHeight > 0 ? open.value * contentHeight : 0,
    opacity: interpolate(open.value, [0, 0.4, 1], [0, 0.65, 1]),
    transform: [{ translateY: interpolate(open.value, [0, 1], [-6, 0]) }],
    overflow: "hidden" as const,
  }));

  return (
    <View className="relative pt-2.5">
      {plan.badge ? (
        <View className="absolute right-3 top-0 z-20">
          <Chip size="sm" variant="soft" color="accent" className="bg-[#1DB954]">
            <Chip.Label className="text-[10px] text-[#04140A]">{plan.badge}</Chip.Label>
          </Chip>
        </View>
      ) : null}

      <View
        className={`rounded-2xl border ${
          selected
            ? "border-[#1DB954] bg-[#1DB954]/10"
            : "border-white/10 bg-white/5"
        }`}
      >
        <ControlField
          isSelected={selected}
          onSelectedChange={(value) => {
            if (value) onSelect();
          }}
          className="relative rounded-none border-0 bg-transparent px-4 py-3.5"
        >
          {/* Centered copy; checkbox stays on the right */}
          <View className="min-w-0 flex-1 items-center gap-0.5 px-8">
            <View className="flex-row flex-wrap items-center justify-center gap-2">
              <Label className="text-center text-base font-semibold text-foreground">
                {plan.displayName}
              </Label>
              {isCurrent ? (
                <Chip size="sm" variant="soft" color="success">
                  <Chip.Label>Current</Chip.Label>
                </Chip>
              ) : null}
              {period === "yearly" ? (
                <Chip size="sm" variant="soft" color="accent">
                  <Chip.Label>Save {plan.yearlySavePercent}%</Chip.Label>
                </Chip>
              ) : null}
            </View>
            <Description className="text-center text-muted">{description}</Description>
            <Typography
              type="body-sm"
              weight="bold"
              className="mt-0.5 text-center text-foreground"
            >
              {price}
              <Typography type="body-xs" className="text-muted">
                {" "}
                / {periodCopy(period)}
              </Typography>
            </Typography>
          </View>
          <View className="absolute right-4 top-0 bottom-0 justify-center">
            <ControlField.Indicator>
              <Checkbox>
                <Checkbox.Indicator
                  className="bg-[#1DB954]"
                  iconProps={{ size: 16, color: "#04140A" }}
                />
              </Checkbox>
            </ControlField.Indicator>
          </View>
        </ControlField>

        <View
          pointerEvents="none"
          style={{ position: "absolute", opacity: 0, left: 0, right: 0 }}
          onLayout={(e) => {
            const next = Math.ceil(e.nativeEvent.layout.height);
            if (next > 0 && next !== contentHeight) setContentHeight(next);
          }}
        >
          <PlanIncludes plan={plan} />
        </View>

        <Animated.View style={accordionStyle}>
          <PlanIncludes plan={plan} />
        </Animated.View>
      </View>
    </View>
  );
}

export function SubscriptionScreen(): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { toast } = useToast();
  const [sheetOpen, setSheetOpen] = useState(false);
  const openedRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [period, setPeriod] = useState<BillingPeriod>("weekly");
  const [currentTier, setCurrentTier] = useState<SubscriptionTier | null>(null);
  const [selected, setSelected] = useState<SubscriptionTier>("hunter");
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [footerHeight, setFooterHeight] = useState(132);

  useEffect(() => {
    if (openedRef.current) return;
    openedRef.current = true;
    const t = setTimeout(() => setSheetOpen(true), 220);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    void getSubscription().then((next) => {
      setPlans(next.plans);
      setCurrentTier(next.currentTier);
      setSelected(next.currentTier ?? "hunter");
      setLoading(false);
    });
  }, []);

  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === selected) ?? null,
    [plans, selected],
  );

  const closeAndBack = useCallback(() => {
    setSheetOpen(false);
    router.back();
  }, [router]);

  const handleSubscribe = useCallback(async () => {
    try {
      setBusy(true);
      const next = await mockSubscribe(selected);
      setCurrentTier(next.currentTier);
      toast.show({
        variant: "success",
        label: `${selectedPlan?.displayName ?? "Plan"} · ${period}`,
        description: "Mock only — no IAP in this build.",
        duration: 2600,
      });
    } catch {
      toast.show({ variant: "danger", label: "Subscribe failed", duration: 2200 });
    } finally {
      setBusy(false);
    }
  }, [period, selected, selectedPlan?.displayName, toast]);

  const handleRestore = useCallback(async () => {
    try {
      setBusy(true);
      await mockRestorePurchases();
      toast.show({
        variant: "success",
        label: "Purchases restored",
        description: "Mock only.",
        duration: 2200,
      });
    } finally {
      setBusy(false);
    }
  }, [toast]);

  const isCurrentSelected = currentTier != null && selected === currentTier;

  const renderFooter = useCallback(
    (props: BottomSheetFooterProps) => (
      <BottomSheetFooter {...props} bottomInset={0}>
        <View
          onLayout={(e) => {
            const next = Math.ceil(e.nativeEvent.layout.height);
            if (next > 0) {
              setFooterHeight((prev) => (prev === next ? prev : next));
            }
          }}
          className="gap-2 border-t border-white/10 px-4 pt-3"
          style={{
            paddingBottom: Math.max(insets.bottom, 14),
            backgroundColor: "#121212",
          }}
        >
          <Button
            variant="primary"
            className="min-h-14 rounded-2xl bg-[#1DB954]"
            isDisabled={busy || loading || isCurrentSelected}
            onPress={() => void handleSubscribe()}
          >
            <Button.Label className="text-lg font-bold text-[#04140A]">
              {isCurrentSelected
                ? "You're on this plan"
                : selectedPlan
                  ? `Continue · ${priceFor(selectedPlan, period)}/${periodCopy(period)}`
                  : "Continue"}
            </Button.Label>
          </Button>
          <Button
            variant="ghost"
            className="min-h-10"
            isDisabled={busy}
            onPress={() => void handleRestore()}
          >
            <Button.Label className="text-muted">Restore purchases</Button.Label>
          </Button>
        </View>
      </BottomSheetFooter>
    ),
    [
      busy,
      handleRestore,
      handleSubscribe,
      insets.bottom,
      isCurrentSelected,
      loading,
      period,
      selectedPlan,
    ],
  );

  return (
    <View className="flex-1 bg-black/70">
      <BottomSheet
        isOpen={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) router.back();
        }}
      >
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content
            snapPoints={["92%"]}
            enableDynamicSizing={false}
            enableOverDrag={false}
            handleClassName="hidden"
            backgroundClassName="bg-background"
            contentContainerClassName="h-full overflow-hidden rounded-t-3xl p-0"
            footerComponent={renderFooter}
          >
            <BottomSheet.Close className="absolute right-4 top-4 z-20" />

            {loading ? (
              <View className="gap-3 p-4 pt-14">
                <Skeleton className="h-24 rounded-2xl" />
                <Skeleton className="h-12 rounded-xl" />
                <Skeleton className="h-24 rounded-2xl" />
                <Skeleton className="h-24 rounded-2xl" />
              </View>
            ) : (
              <BottomSheetScrollView
                contentContainerStyle={{
                  // Keep plan list clear of the sticky Continue / Restore footer
                  paddingBottom: footerHeight + 20,
                }}
              >
                {/* Hero — toast-style fade: transparent top → green bottom */}
                <View className="relative overflow-hidden">
                  <LinearGradient
                    colors={[
                      "rgba(29,185,84,0)",
                      "rgba(29,185,84,0.45)",
                      "#1DB954",
                    ]}
                    locations={[0, 0.5, 1]}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={{
                      minHeight: 108,
                      justifyContent: "flex-end",
                      alignItems: "center",
                      paddingHorizontal: 20,
                      paddingBottom: 14,
                      paddingTop: 44,
                    }}
                  >
                    <View className="mb-1.5 flex-row items-center gap-1.5 rounded-full border border-white/25 bg-black/20 px-2.5 py-1">
                      <Ionicons name="diamond" size={12} color="#fff" />
                      <Typography type="body-xs" weight="semibold" className="text-white">
                        FlipSentry Premium
                      </Typography>
                    </View>
                    <Typography type="h4" weight="bold" className="text-center text-white">
                      Unlock more deals
                    </Typography>
                    <Typography type="body-xs" className="mt-0.5 text-center text-white/85">
                      Pick the hunt speed that fits you.
                    </Typography>
                  </LinearGradient>
                </View>

                <View className="gap-4 px-4 pt-4">
                  <Tabs
                    value={period}
                    onValueChange={(v) => {
                      if (v === "yearly" && !YEARLY_ENABLED) {
                        toast.show({
                          label: "Coming soon",
                          description: "Yearly plans aren't available yet.",
                          duration: 2400,
                        });
                        return;
                      }
                      setPeriod(v as BillingPeriod);
                    }}
                    className="gap-3"
                  >
                    <Tabs.List className="h-11 w-full rounded-xl bg-white/5 p-1">
                      <Tabs.Indicator className="rounded-lg bg-[#1DB954]" />
                      <Tabs.Trigger value="weekly" className="h-9 flex-1">
                        {({ isSelected }) => (
                          <Tabs.Label
                            className={
                              isSelected
                                ? "font-bold text-[#04140A]"
                                : "font-medium text-muted"
                            }
                          >
                            Weekly
                          </Tabs.Label>
                        )}
                      </Tabs.Trigger>
                      <Tabs.Trigger value="yearly" className="h-9 flex-1 opacity-75">
                        {({ isSelected }) => (
                          <View className="flex-row items-center justify-center gap-1.5">
                            <Tabs.Label
                              className={
                                isSelected && YEARLY_ENABLED
                                  ? "font-bold text-[#04140A]"
                                  : "font-medium text-muted"
                              }
                            >
                              Yearly
                            </Tabs.Label>
                            {!YEARLY_ENABLED ? (
                              <View className="rounded-full bg-white/10 px-1.5 py-0.5">
                                <Typography
                                  type="body-xs"
                                  weight="semibold"
                                  className="text-[10px] text-muted"
                                >
                                  Soon
                                </Typography>
                              </View>
                            ) : (
                              <Tabs.Label
                                className={
                                  isSelected
                                    ? "font-bold text-[#04140A]"
                                    : "font-medium text-muted"
                                }
                              >
                                · Save
                              </Tabs.Label>
                            )}
                          </View>
                        )}
                      </Tabs.Trigger>
                    </Tabs.List>

                    <Tabs.Content value="weekly" className="gap-3">
                      {plans.map((plan) => (
                        <PlanOptionRow
                          key={`weekly-${plan.id}`}
                          plan={plan}
                          period="weekly"
                          selected={selected === plan.id}
                          isCurrent={currentTier === plan.id}
                          onSelect={() => setSelected(plan.id)}
                        />
                      ))}
                    </Tabs.Content>

                    {YEARLY_ENABLED ? (
                      <Tabs.Content value="yearly" className="gap-3">
                        {plans.map((plan) => (
                          <PlanOptionRow
                            key={`yearly-${plan.id}`}
                            plan={plan}
                            period="yearly"
                            selected={selected === plan.id}
                            isCurrent={currentTier === plan.id}
                            onSelect={() => setSelected(plan.id)}
                          />
                        ))}
                      </Tabs.Content>
                    ) : null}
                  </Tabs>

                  <View className="flex-row flex-wrap items-center justify-center gap-x-3 gap-y-1 pb-2">
                    <Typography
                      type="body-xs"
                      className="text-muted underline"
                      onPress={() => void Linking.openURL("https://flipsentry.com/terms")}
                    >
                      Terms
                    </Typography>
                    <Typography type="body-xs" className="text-muted">
                      ·
                    </Typography>
                    <Typography
                      type="body-xs"
                      className="text-muted underline"
                      onPress={() => void Linking.openURL("https://flipsentry.com/privacy")}
                    >
                      Privacy
                    </Typography>
                    <Typography type="body-xs" className="text-muted">
                      ·
                    </Typography>
                    <Typography
                      type="body-xs"
                      className="text-muted underline"
                      onPress={() => {
                        const url =
                          Platform.OS === "ios"
                            ? "https://apps.apple.com/account/subscriptions"
                            : "https://play.google.com/store/account/subscriptions";
                        void Linking.openURL(url);
                      }}
                    >
                      Manage
                    </Typography>
                  </View>
                </View>
              </BottomSheetScrollView>
            )}
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>

      {!sheetOpen ? (
        <Button variant="ghost" className="mt-20 self-center" onPress={closeAndBack}>
          <Button.Label className="text-white">Close</Button.Label>
        </Button>
      ) : null}
    </View>
  );
}
