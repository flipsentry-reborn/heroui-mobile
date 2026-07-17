import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import type { JSX } from "react";
import { useCallback, useState } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Typography, useThemeColor } from "heroui-native";

import { BrandButton } from "@/components/ui/brand-button";
import { HomePlanCreditsCard } from "@/features/home/home-plan-credits-card";
import { SearchBottomSheet } from "@/features/home/search-bottom-sheet";
import type { HomeState } from "@/mocks/data/home";
import type { SubscriptionPlan } from "@/mocks/data/subscription";
import { getHome } from "@/mocks/services/home";
import {
  formatLocationLabel,
  getLocationDraft,
} from "@/mocks/services/location";
import { getSubscription } from "@/mocks/services/subscription";

export function HomeScreen(): JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [accentForeground] = useThemeColor(["accent-foreground"]);
  const [state, setState] = useState<HomeState | null>(null);
  const [activePlan, setActivePlan] = useState<SubscriptionPlan | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [locationLabel, setLocationLabel] = useState(() =>
    formatLocationLabel(getLocationDraft()),
  );

  const load = useCallback(async () => {
    const [home, sub] = await Promise.all([getHome(), getSubscription()]);
    setState(home);
    const plan =
      sub.hasActiveSubscription && sub.currentTier != null
        ? (sub.plans.find((p) => p.id === sub.currentTier) ?? null)
        : null;
    setActivePlan(plan);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
      setLocationLabel(formatLocationLabel(getLocationDraft()));
      return () => {
        setCreateOpen(false);
      };
    }, [load]),
  );

  if (!state) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Typography type="body-sm" className="text-muted">
          Loading searches...
        </Typography>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-[110px] pt-2"
      >
        <HomePlanCreditsCard
          homePlan={state.plan}
          subscriptionPlan={activePlan}
          onPress={() => router.push("/settings/subscription")}
        />

        <View className="mx-3 mb-2 gap-2">
          <BrandButton
            className="min-h-12 w-full"
            onPress={() => setCreateOpen(true)}
          >
            <Ionicons name="add" size={18} color={accentForeground} />
            <BrandButton.Label>New Search</BrandButton.Label>
          </BrandButton>
          <Button
            variant="secondary"
            className="min-h-11 w-full"
            onPress={() => router.push("/home-card-examples")}
          >
            <Button.Label>Compare card layouts</Button.Label>
          </Button>
        </View>
      </ScrollView>

      <SearchBottomSheet
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        locationLabel={locationLabel}
        onLocationLabelChange={setLocationLabel}
      />
    </View>
  );
}
