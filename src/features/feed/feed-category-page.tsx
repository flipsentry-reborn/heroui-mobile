import { useFocusEffect } from "expo-router";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useRef, useState, type JSX } from "react";
import { View } from "react-native";
import { Typography } from "heroui-native";

import {
  FeedBestPicksControls,
  type BestPicksSortBy,
} from "@/features/feed/feed-best-picks-controls";
import { FeedForYouPage } from "@/features/feed/feed-for-you-page";
import { FeedScrollable } from "@/features/feed/feed-scrollable";
import {
  FeedSoldControls,
  type SoldStatusFilter,
} from "@/features/feed/feed-sold-controls";
import { useStore } from "@/store/store";

interface FeedCategoryPageProps {
  category: string;
  groupIds?: string[];
  query: string;
  isActive?: boolean;
  onPressItem?: (id: string) => void;
  onOpenCategory?: (key: string) => void;
}

function sortDirFor(sortBy: BestPicksSortBy): "asc" | "desc" {
  return sortBy === "distance" ? "asc" : "desc";
}

/**
 * One feed page per category. Observes FeedStore lists (HTTP + SignalR).
 */
export const FeedCategoryPage = observer(function FeedCategoryPage({
  category,
  query,
  isActive = false,
  onPressItem,
  onOpenCategory,
}: FeedCategoryPageProps): JSX.Element {
  const { feedStore, searchStore } = useStore();
  const isSold = category === "sold";
  const isBestPicks = category === "best-picks";
  const filterTab = searchStore.filterTabs.find((tab) => tab.key === category);
  const [soldStatus, setSoldStatus] = useState<SoldStatusFilter>("all");
  const [maxDays, setMaxDays] = useState<number | null>(1);
  const [bestPicksSortBy, setBestPicksSortBy] =
    useState<BestPicksSortBy>("buysignal");
  const [bestPicksMaxHours, setBestPicksMaxHours] = useState<number | null>(6);
  const [refreshing, setRefreshing] = useState(false);
  const skipQueryEffect = useRef(true);

  const items = feedStore.getList(category);
  const loading =
    feedStore.isBucketLoading(category) && items.length === 0;
  const loadingMore = feedStore.isBucketLoadingMore(category);
  const hasMore = feedStore.hasMore(category);

  const bestPicksSortDir = sortDirFor(bestPicksSortBy);

  const load = useCallback(
    async (opts?: { refresh?: boolean; fromControls?: boolean }) => {
      if (category === "for-you") return;
      // Sold / Best Picks chips share one bucket key — wipe so skeleton shows
      // while the new filter params refetch (otherwise stale cards stay up).
      if (opts?.fromControls && (isSold || isBestPicks)) {
        feedStore.clearBucketList(category);
      }
      if (opts?.refresh && !opts.fromControls) setRefreshing(true);
      try {
        await feedStore.loadBucket(category, {
          query,
          force: opts?.refresh || opts?.fromControls,
          ...(isSold ? { soldStatus, maxDays } : {}),
          ...(isBestPicks
            ? {
                bestPicksSortBy,
                bestPicksSortDir,
                bestPicksMaxHours,
              }
            : {}),
        });
      } finally {
        setRefreshing(false);
      }
    },
    [
      bestPicksMaxHours,
      bestPicksSortBy,
      bestPicksSortDir,
      category,
      feedStore,
      isBestPicks,
      isSold,
      maxDays,
      query,
      soldStatus,
    ],
  );

  const loadMore = useCallback(() => {
    if (category === "for-you") return;
    void feedStore.loadMore(category, {
      query,
      ...(isSold ? { soldStatus, maxDays } : {}),
      ...(isBestPicks
        ? {
            bestPicksSortBy,
            bestPicksSortDir,
            bestPicksMaxHours,
          }
        : {}),
    });
  }, [
    bestPicksMaxHours,
    bestPicksSortBy,
    bestPicksSortDir,
    category,
    feedStore,
    isBestPicks,
    isSold,
    maxDays,
    query,
    soldStatus,
  ]);

  useFocusEffect(
    useCallback(() => {
      if (category === "for-you") return;
      void load();
    }, [category, load]),
  );

  useEffect(() => {
    if (category === "for-you") return;
    if (skipQueryEffect.current) {
      skipQueryEffect.current = false;
      return;
    }
    void load({ refresh: true, fromControls: true });
  }, [
    category,
    load,
    query,
    soldStatus,
    maxDays,
    bestPicksSortBy,
    bestPicksMaxHours,
  ]);

  const handleToggleFavorite = useCallback(
    async (id: string) => {
      await feedStore.toggleFavorite(id);
    },
    [feedStore],
  );

  if (category === "for-you") {
    return (
      <FeedForYouPage
        query={query}
        isActive={isActive}
        onPressItem={onPressItem}
        onOpenCategory={onOpenCategory}
      />
    );
  }

  return (
    <View className="flex-1">
      {isSold ? (
        <FeedSoldControls
          statusFilter={soldStatus}
          maxDays={maxDays}
          onStatusChange={setSoldStatus}
          onDaysChange={setMaxDays}
        />
      ) : null}
      {isBestPicks ? (
        <FeedBestPicksControls
          sortBy={bestPicksSortBy}
          maxHours={bestPicksMaxHours}
          onSortChange={setBestPicksSortBy}
          onHoursChange={setBestPicksMaxHours}
        />
      ) : null}
      <FeedScrollable
        items={items}
        loading={loading}
        refreshing={refreshing}
        loadingMore={loadingMore}
        hasMore={hasMore}
        category={category}
        isActive={isActive}
        onRefresh={() => {
          void load({ refresh: true });
        }}
        onEndReached={loadMore}
        onPressItem={onPressItem}
        onToggleFavorite={(id) => {
          void handleToggleFavorite(id);
        }}
        emptyTitle={
          isSold
            ? "No sold listings yet"
            : filterTab
              ? "No items matched yet"
              : "No listings yet"
        }
        emptyDescription={
          isSold
            ? "Mark listings as sold to track them here."
            : filterTab
              ? "Deals will show up here as soon as this search finds a match."
              : "Pull to refresh, or try another category."
        }
        listHeader={
          filterTab ? (
            <View className="px-3 pb-2 pt-1">
              <Typography
                type="body"
                weight="bold"
                className="font-extrabold text-foreground"
                numberOfLines={1}
              >
                Showing {filterTab.label} Items
              </Typography>
            </View>
          ) : null
        }
        topInset={4}
      />
    </View>
  );
});
