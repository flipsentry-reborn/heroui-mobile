import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState, type JSX } from "react";
import { View } from "react-native";

import { FeedForYouPage } from "@/features/feed/feed-for-you-page";
import { FeedScrollable } from "@/features/feed/feed-scrollable";
import {
  FeedSoldControls,
  type SoldStatusFilter,
} from "@/features/feed/feed-sold-controls";
import agent from "@/api/agent";
import type { FeedItem as FeedModel } from "@/models/feed";
import { useStore } from "@/store/store";

interface FeedCategoryPageProps {
  category: string;
  groupIds?: string[];
  query: string;
  /** Bumps when favorites change elsewhere so Saved / lists stay in sync. */
  syncToken?: number;
  onPressItem?: (id: string) => void;
  onOpenCategory?: (key: string) => void;
  onFavoriteChange?: () => void;
}

/**
 * One feed page per category. Inside PagerView it stays mounted so scroll
 * position is preserved when swiping away and back.
 */
export function FeedCategoryPage({
  category,
  groupIds: groupIdsProp,
  query,
  syncToken = 0,
  onPressItem,
  onOpenCategory,
  onFavoriteChange,
}: FeedCategoryPageProps): JSX.Element {
  const { searchStore } = useStore();
  const isSold = category === "sold";
  const groupIds =
    groupIdsProp ?? searchStore.groupIdsForCategory(category);
  const [items, setItems] = useState<FeedModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [soldStatus, setSoldStatus] = useState<SoldStatusFilter>("all");
  /** Sold defaults to last 1 day; null = "Days" (no chip / backend default). */
  const [maxDays, setMaxDays] = useState<number | null>(1);
  const hasLoaded = useRef(false);
  const skipNextSync = useRef(true);

  const load = useCallback(
    async (opts?: { refresh?: boolean; silent?: boolean }) => {
      if (category === "for-you") return;
      if (opts?.refresh) setRefreshing(true);
      else if (!opts?.silent) setLoading(true);
      try {
        const data = await agent.Feed.list({
          category,
          groupIds,
          query,
          ...(isSold ? { soldStatus, maxDays } : {}),
        });
        setItems(data);
        hasLoaded.current = true;
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [category, groupIds, query, isSold, soldStatus, maxDays],
  );

  useFocusEffect(
    useCallback(() => {
      if (category === "for-you") return;
      void load({ silent: hasLoaded.current });
    }, [category, load]),
  );

  useEffect(() => {
    if (category === "for-you") return;
    if (skipNextSync.current) {
      skipNextSync.current = false;
      return;
    }
    void load({ silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- syncToken-only
  }, [syncToken]);

  const handleToggleFavorite = useCallback(
    async (id: string) => {
      const updated = await agent.Feed.toggleFavorite(id);
      if (!updated) return;
      setItems((prev) => {
        if (category === "saved" && !updated.isFavorite) {
          return prev.filter((item) => item.id !== id);
        }
        return prev.map((item) => (item.id === id ? updated : item));
      });
      onFavoriteChange?.();
    },
    [category, onFavoriteChange],
  );

  if (category === "for-you") {
    return (
      <FeedForYouPage
        query={query}
        syncToken={syncToken}
        onPressItem={onPressItem}
        onOpenCategory={onOpenCategory}
        onFavoriteChange={onFavoriteChange}
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
      <FeedScrollable
        items={items}
        loading={loading}
        refreshing={refreshing}
        onRefresh={() => {
          void load({ refresh: true });
        }}
        onPressItem={onPressItem}
        onToggleFavorite={(id) => {
          void handleToggleFavorite(id);
        }}
        topInset={4}
        shadowSize={16}
      />
    </View>
  );
}
