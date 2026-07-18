import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { observer } from "mobx-react-lite";
import type { JSX } from "react";
import { useCallback, useState } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Typography, useThemeColor, useToast } from "heroui-native";

import { BrandButton } from "@/components/ui/brand-button";
import { HomePlanCreditsCard } from "@/features/home/home-plan-credits-card";
import { showSearchActionProgress } from "@/features/home/search-action-progress-toast";
import { SearchBottomSheet } from "@/features/home/search-bottom-sheet";
import { SearchCards } from "@/features/home/search-cards";
import type { SearchGroup } from "@/mocks/data/home";
import {
  formatLocationLabel,
  getLocationDraft,
} from "@/mocks/services/location";
import { cityFromLocation } from "@/mocks/services/home";
import { useStore } from "@/store/store";

function actionTitle(group: SearchGroup): string {
  if (group.searchType === "car") return "Cars";
  if (group.searchType === "iphone") return "Iphones";
  return group.customLabel ?? cityFromLocation(group.locationName);
}

export const HomeScreen = observer(function HomeScreen(): JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { toast } = useToast();
  const { searchStore, subscriptionStore } = useStore();
  const [accentForeground] = useThemeColor(["accent-foreground"]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<SearchGroup | null>(null);
  const [locationLabel, setLocationLabel] = useState(() =>
    formatLocationLabel(getLocationDraft()),
  );

  useFocusEffect(
    useCallback(() => {
      void subscriptionStore.load();
      void searchStore.loadSearchGroups();
      setLocationLabel(formatLocationLabel(getLocationDraft()));
      return () => {
        setSheetOpen(false);
        setEditingGroup(null);
      };
    }, [searchStore, subscriptionStore]),
  );

  const handleDelete = useCallback(
    (group: SearchGroup) => {
      showSearchActionProgress(toast, {
        kind: "delete",
        title: actionTitle(group),
        onCommit: () => searchStore.deleteSearchGroup(group.id),
      });
    },
    [searchStore, toast],
  );

  const handleEdit = useCallback((group: SearchGroup) => {
    setEditingGroup(group);
    setSheetOpen(true);
  }, []);

  const handleToggle = useCallback(
    (group: SearchGroup, active: boolean) => {
      showSearchActionProgress(toast, {
        kind: active ? "start" : "pause",
        title: actionTitle(group),
        onCommit: async () => {
          const updated = await searchStore.setGroupActive(group.id, active);
          return updated != null;
        },
      });
    },
    [searchStore, toast],
  );

  const handleNewSearch = () => {
    if (!searchStore.canCreateSearch) {
      router.push("/settings/subscription");
      return;
    }
    setEditingGroup(null);
    setSheetOpen(true);
  };

  const handleSheetClose = () => {
    setSheetOpen(false);
    setEditingGroup(null);
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

        <SearchCards
          groups={searchStore.searchGroups}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggle={handleToggle}
        />
      </ScrollView>

      <SearchBottomSheet
        visible={sheetOpen}
        onClose={handleSheetClose}
        locationLabel={locationLabel}
        onLocationLabelChange={setLocationLabel}
        editingGroup={editingGroup}
      />
    </View>
  );
});
