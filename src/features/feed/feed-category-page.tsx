import { useFocusEffect } from "expo-router";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useRef, useState, type JSX } from "react";
import { View } from "react-native";

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
  onPressItem?: (id: string) => void;
  onOpenCategory?: (key: string) => void;
}

/**
 * One feed page per category. Observes FeedStore lists (HTTP + SignalR).
 */
export const FeedCategoryPage = observer(function FeedCategoryPage({
  category,
  query,
  onPressItem,
  onOpenCategory,
}: FeedCategoryPageProps): JSX.Element {
  const { feedStore } = useStore();
  const isSold = category === "sold";
  const [soldStatus, setSoldStatus] = useState<SoldStatusFilter>("all");
  const [maxDays, setMaxDays] = useState<number | null>(1);
  const [refreshing, setRefreshing] = useState(false);
  const skipQueryEffect = useRef(true);

  const items = feedStore.getList(category);
  const loading =
    feedStore.isBucketLoading(category) && items.length === 0;

  const load = useCallback(
    async (opts?: { refresh?: boolean }) => {
      if (category === "for-you") return;
      if (opts?.refresh) setRefreshing(true);
      try {
        if (category === "best-picks") {
          await feedStore.refreshIfDirty(category, {
            query,
            force: opts?.refresh,
          });
        } else {
          await feedStore.loadBucket(category, {
            query,
            force: opts?.refresh,
            ...(isSold ? { soldStatus, maxDays } : {}),
          });
        }
      } finally {
        setRefreshing(false);
      }
    },
    [category, feedStore, isSold, maxDays, query, soldStatus],
  );

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
    void load({ refresh: true });
  }, [category, load, query, soldStatus, maxDays]);

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
});
