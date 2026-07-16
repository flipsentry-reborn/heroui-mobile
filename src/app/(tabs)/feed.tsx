import { useRouter } from "expo-router";
import { useCallback, useRef, useState, type JSX } from "react";
import { View } from "react-native";
import type PagerView from "react-native-pager-view";

import { FeedHeader } from "@/features/feed/feed-header";
import { FeedPager } from "@/features/feed/feed-pager";
import {
  FEED_CATEGORIES,
  type FeedCategoryKey,
} from "@/mocks/data/feed";

export default function FeedScreen(): JSX.Element {
  const router = useRouter();
  const pagerRef = useRef<PagerView>(null);
  const [searchText, setSearchText] = useState("");
  const [activeCategory, setActiveCategory] = useState<FeedCategoryKey>("all");

  const handleCategorySelect = useCallback((key: FeedCategoryKey) => {
    setActiveCategory(key);
    const index = FEED_CATEGORIES.findIndex((c) => c.key === key);
    if (index >= 0) {
      pagerRef.current?.setPage(index);
    }
  }, []);

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
        onCategorySelect={handleCategorySelect}
      />
      <FeedPager
        pagerRef={pagerRef}
        activeCategory={activeCategory}
        searchText={searchText}
        onCategoryChange={setActiveCategory}
        onPressItem={handlePressItem}
      />
    </View>
  );
}
