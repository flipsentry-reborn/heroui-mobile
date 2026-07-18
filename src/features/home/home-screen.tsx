import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { observer } from "mobx-react-lite";
import type { JSX } from "react";
import { useCallback, useState } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Typography, useThemeColor } from "heroui-native";

import { BrandButton } from "@/components/ui/brand-button";
import { HomePlanCreditsCard } from "@/features/home/home-plan-credits-card";
import { SearchBottomSheet } from "@/features/home/search-bottom-sheet";
import { SearchCards } from "@/features/home/search-cards";
import type { SearchGroup } from "@/mocks/data/home";
import {
  formatLocationLabel,
  getLocationDraft,
} from "@/mocks/services/location";
import { useStore } from "@/store/store";

export const HomeScreen = observer(function HomeScreen(): JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { searchStore, subscriptionStore } = useStore();
  const [accentForeground] = useThemeColor(["accent-foreground"]);
  const [createOpen, setCreateOpen] = useState(false);
  const [locationLabel, setLocationLabel] = useState(() =>
    formatLocationLabel(getLocationDraft()),
  );

  useFocusEffect(
    useCallback(() => {
      void subscriptionStore.load();
      void searchStore.loadSearchGroups();
      setLocationLabel(formatLocationLabel(getLocationDraft()));
      return () => {
        setCreateOpen(false);
      };
    }, [searchStore, subscriptionStore]),
  );

  const handleDelete = useCallback(
    async (group: SearchGroup) => {
      await searchStore.deleteSearchGroup(group.id);
    },
    [searchStore],
  );

  const handleNewSearch = () => {
    if (!searchStore.canCreateSearch) {
      router.push("/settings/subscription");
      return;
    }
    setCreateOpen(true);
  };

  if (searchStore.loadingInitial) {
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
          homePlan={searchStore.homePlan}
          subscriptionPlan={subscriptionStore.activePlan}
          onPress={() => router.push("/settings/subscription")}
        />

        <View className="mx-3 mb-3">
          <BrandButton
            className="min-h-12 w-full"
            onPress={handleNewSearch}
          >
            <Ionicons name="add" size={18} color={accentForeground} />
            <BrandButton.Label>
              {searchStore.canCreateSearch ? "New Search" : "Upgrade for slots"}
            </BrandButton.Label>
          </BrandButton>
        </View>

        <SearchCards groups={searchStore.searchGroups} onDelete={handleDelete} />
      </ScrollView>

      <SearchBottomSheet
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        locationLabel={locationLabel}
        onLocationLabelChange={setLocationLabel}
      />
    </View>
  );
});
