import { useRouter } from "expo-router";
import { useCallback, useEffect, useState, type JSX } from "react";
import { View } from "react-native";

import { FeedHeader } from "@/features/feed/feed-header";
import { FeedScrollable } from "@/features/feed/feed-scrollable";
import type { FeedCategoryKey } from "@/mocks/data/feed";
import { getFeed, toggleFavorite } from "@/mocks/services/feed";
import type { FeedItem as FeedModel } from "@/models/feed";

export default function FeedScreen(): JSX.Element {
  const router = useRouter();
  const [items, setItems] = useState<FeedModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [activeCategory, setActiveCategory] = useState<FeedCategoryKey>("all");

  const loadFeed = useCallback(
    async (opts?: { refresh?: boolean }) => {
      if (opts?.refresh) setRefreshing(true);
      else setLoading(true);
      try {
        const data = await getFeed({
          category: activeCategory,
          query: searchText,
        });
        setItems(data);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeCategory, searchText],
  );

  useEffect(() => {
    void loadFeed();
  }, [loadFeed]);

  const handleToggleFavorite = useCallback(async (id: string) => {
    const updated = await toggleFavorite(id);
    if (!updated) return;
    setItems((prev) => {
      if (activeCategory === "saved" && !updated.isFavorite) {
        return prev.filter((item) => item.id !== id);
      }
      return prev.map((item) => (item.id === id ? updated : item));
    });
  }, [activeCategory]);

  const handlePressItem = useCallback(
    (id: string) => {
      router.push({ pathname: "/feed/[id]", params: { id } });
    },
    [router],
  );

  return (
    <View className="flex-1 bg-background">
      <FeedHeader
        searchText={searchText}
        onSearchChange={setSearchText}
        activeCategory={activeCategory}
        onCategorySelect={setActiveCategory}
      />
      <FeedScrollable
        items={items}
        loading={loading}
        refreshing={refreshing}
        onRefresh={() => {
          void loadFeed({ refresh: true });
        }}
        onPressItem={handlePressItem}
        onToggleFavorite={(id) => {
          void handleToggleFavorite(id);
        }}
      />
    </View>
  );
}
