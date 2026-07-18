import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState, type JSX } from "react";
import { View } from "react-native";

import { FeedScrollable } from "@/features/feed/feed-scrollable";
import {
  FeedSoldControls,
  type SoldStatusFilter,
} from "@/features/feed/feed-sold-controls";
import { getFeed, toggleFavorite } from "@/mocks/services/feed";
import type { FeedItem as FeedModel } from "@/models/feed";

interface FeedCategoryPageProps {
  category: string;
  query: string;
  onPressItem?: (id: string) => void;
}

/** Category list page (All, Top Rated, Sold, user searches, …). */
export function FeedCategoryPage({
  category,
  query,
  onPressItem,
}: FeedCategoryPageProps): JSX.Element {
  const isSold = category === "sold";
  const [items, setItems] = useState<FeedModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [soldStatus, setSoldStatus] = useState<SoldStatusFilter>("all");
  const [maxDays, setMaxDays] = useState<number | null>(null);
  const hasLoaded = useRef(false);

  const load = useCallback(
    async (opts?: { refresh?: boolean; silent?: boolean }) => {
      if (opts?.refresh) setRefreshing(true);
      else if (!opts?.silent) setLoading(true);
      try {
        const data = await getFeed({
          category,
          query,
          ...(isSold
            ? { soldStatus, maxDays }
            : {}),
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
      void load({ silent: hasLoaded.current });
    }, [load]),
  );

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
    },
    [category],
  );

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
