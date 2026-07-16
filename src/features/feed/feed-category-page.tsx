import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState, type JSX } from "react";

import { FeedScrollable } from "@/features/feed/feed-scrollable";
import { getFeed, toggleFavorite } from "@/mocks/services/feed";
import type { FeedItem as FeedModel } from "@/models/feed";

interface FeedCategoryPageProps {
  category: string;
  query: string;
  onPressItem?: (id: string) => void;
}

/** Category list page (All, Top Rated, user searches, …). */
export function FeedCategoryPage({
  category,
  query,
  onPressItem,
}: FeedCategoryPageProps): JSX.Element {
  const [items, setItems] = useState<FeedModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoaded = useRef(false);

  const load = useCallback(
    async (opts?: { refresh?: boolean; silent?: boolean }) => {
      if (opts?.refresh) setRefreshing(true);
      else if (!opts?.silent) setLoading(true);
      try {
        const data = await getFeed({ category, query });
        setItems(data);
        hasLoaded.current = true;
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [category, query],
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
      topInset={14}
      shadowSize={16}
    />
  );
}
