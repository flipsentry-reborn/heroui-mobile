import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState, type JSX } from "react";
import { View } from "react-native";

import { FeedForYouPage } from "@/features/feed/feed-for-you-page";
import { FeedScrollable } from "@/features/feed/feed-scrollable";
import {
  FeedSoldControls,
  type SoldStatusFilter,
} from "@/features/feed/feed-sold-controls";
import type { FeedCategoryKey } from "@/mocks/data/feed";
import { getFeed, toggleFavorite } from "@/mocks/services/feed";
import type { FeedItem as FeedModel } from "@/models/feed";

interface FeedCategoryPageProps {
  category: string;
  query: string;
  /** Bumps when favorites change elsewhere so Saved / lists stay in sync. */
  syncToken?: number;
  onPressItem?: (id: string) => void;
  onOpenCategory?: (key: FeedCategoryKey) => void;
  onFavoriteChange?: () => void;
}

/**
 * One feed page per category. Inside PagerView it stays mounted so scroll
 * position is preserved when swiping away and back.
 */
export function FeedCategoryPage({
  category,
  query,
  syncToken = 0,
  onPressItem,
  onOpenCategory,
  onFavoriteChange,
}: FeedCategoryPageProps): JSX.Element {
  const isSold = category === "sold";
  const [items, setItems] = useState<FeedModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [soldStatus, setSoldStatus] = useState<SoldStatusFilter>("all");
  const [maxDays, setMaxDays] = useState<number | null>(null);
  const hasLoaded = useRef(false);
  const skipNextSync = useRef(true);

  const load = useCallback(
    async (opts?: { refresh?: boolean; silent?: boolean }) => {
      if (category === "for-you") return;
      if (opts?.refresh) setRefreshing(true);
      else if (!opts?.silent) setLoading(true);
      try {
        const data = await getFeed({
          category,
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
    [category, query, isSold, soldStatus, maxDays],
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
      const updated = await toggleFavorite(id);
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
        topInset={isSold ? 4 : 14}
        shadowSize={16}
      />
    </View>
  );
}
