import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { observer } from "mobx-react-lite";
import type { JSX } from "react";
import { useCallback, useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeColor, useToast } from "heroui-native";

import { BrandButton } from "@/components/ui/brand-button";
import { HomePlanCreditsCard } from "@/features/home/home-plan-credits-card";
import { HomeScreenSkeleton } from "@/features/home/home-skeletons";
import { showSearchActionProgress } from "@/features/home/search-action-progress-toast";
import { SearchBottomSheet } from "@/features/home/search-bottom-sheet";
import { SearchCards } from "@/features/home/search-cards";
import type { SearchEditSection } from "@/features/home/search-edit-section";
import {
  SearchStatusSegment,
  type SearchStatusFilter,
} from "@/features/home/search-status-segment";
import type { SearchGroup } from "@/mocks/data/home";
import {
  formatLocationLabel,
  getLocationDraft,
} from "@/mocks/services/location";
import { cityFromLocation, isGroupPaused } from "@/mocks/services/home";
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
  const [sheetMounted, setSheetMounted] = useState(false);
  const [editingGroup, setEditingGroup] = useState<SearchGroup | null>(null);
  const [editSection, setEditSection] = useState<SearchEditSection | null>(
    null,
  );
  const [statusFilter, setStatusFilter] =
    useState<SearchStatusFilter>("all");
  const [locationLabel, setLocationLabel] = useState(() =>
    formatLocationLabel(getLocationDraft()),
  );

  const { allGroups, activeGroups, pausedGroups } = useMemo(() => {
    const all = searchStore.searchGroups;
    const active: SearchGroup[] = [];
    const paused: SearchGroup[] = [];
    for (const group of all) {
      if (isGroupPaused(group)) paused.push(group);
      else active.push(group);
    }
    return {
      allGroups: all,
      activeGroups: active,
      pausedGroups: paused,
    };
  }, [searchStore.searchGroups]);

  const showSkeleton = !searchStore.hasLoaded;

  useFocusEffect(
    useCallback(() => {
      void subscriptionStore.load();
      void searchStore.loadSearchGroups();
      setLocationLabel(formatLocationLabel(getLocationDraft()));
      return () => {
        setSheetOpen(false);
        setEditingGroup(null);
        setEditSection(null);
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
    setEditSection(null);
    setSheetMounted(true);
    setSheetOpen(true);
  };

  const handleEditAndOpen = useCallback(
    (group: SearchGroup, section?: SearchEditSection) => {
      setEditingGroup(group);
      setEditSection(section ?? null);
      setSheetMounted(true);
      setSheetOpen(true);
    },
    [],
  );

  const handleSheetClose = () => {
    setSheetOpen(false);
    setEditingGroup(null);
    setEditSection(null);
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-[110px] pt-2"
        stickyHeaderIndices={
          !showSkeleton && allGroups.length > 0 ? [2] : undefined
        }
      >
        {showSkeleton ? (
          <HomeScreenSkeleton />
        ) : (
          <>
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
                  {searchStore.canCreateSearch
                    ? "New Search"
                    : "Upgrade for slots"}
                </BrandButton.Label>
              </BrandButton>
            </View>

            {allGroups.length > 0 ? (
              <SearchStatusSegment
                value={statusFilter}
                onValueChange={setStatusFilter}
                allCount={allGroups.length}
                activeCount={activeGroups.length}
                pausedCount={pausedGroups.length}
              />
            ) : null}

            <SearchCards
              groups={allGroups}
              statusFilter={statusFilter}
              emptyMessage={
                allGroups.length === 0
                  ? "No searches yet"
                  : statusFilter === "paused"
                    ? "No paused searches"
                    : statusFilter === "active"
                      ? "No active searches"
                      : "No searches yet"
              }
              onEdit={handleEditAndOpen}
              onDelete={handleDelete}
              onToggle={handleToggle}
            />
          </>
        )}
      </ScrollView>

      {sheetMounted ? (
        <SearchBottomSheet
          visible={sheetOpen}
          onClose={handleSheetClose}
          locationLabel={locationLabel}
          onLocationLabelChange={setLocationLabel}
          editingGroup={editingGroup}
          initialSection={editSection}
        />
      ) : null}
    </View>
  );
});
