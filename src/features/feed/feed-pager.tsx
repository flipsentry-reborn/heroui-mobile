import type { JSX, RefObject } from "react";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import PagerView, {
  type PagerViewOnPageSelectedEvent,
} from "react-native-pager-view";

import { FeedCategoryPage } from "@/features/feed/feed-category-page";
import {
  FEED_CATEGORIES,
  type FeedCategoryKey,
} from "@/mocks/data/feed";

interface FeedPagerProps {
  pagerRef: RefObject<PagerView | null>;
  activeCategory: FeedCategoryKey;
  searchText: string;
  onCategoryChange: (key: FeedCategoryKey) => void;
  onPressItem?: (id: string) => void;
  onOpenCategory?: (key: FeedCategoryKey) => void;
}

export function FeedPager({
  pagerRef,
  activeCategory,
  searchText,
  onCategoryChange,
  onPressItem,
  onOpenCategory,
}: FeedPagerProps): JSX.Element {
  const [visited, setVisited] = useState<Set<FeedCategoryKey>>(
    () => new Set<FeedCategoryKey>([activeCategory]),
  );
  const [syncToken, setSyncToken] = useState(0);

  useEffect(() => {
    setVisited((prev) => {
      if (prev.has(activeCategory)) return prev;
      const next = new Set(prev);
      next.add(activeCategory);
      return next;
    });
  }, [activeCategory]);

  const handlePageSelected = useCallback(
    (e: PagerViewOnPageSelectedEvent) => {
      const key = FEED_CATEGORIES[e.nativeEvent.position]?.key;
      if (!key || key === activeCategory) return;
      onCategoryChange(key);
    },
    [activeCategory, onCategoryChange],
  );

  return (
    <PagerView
      ref={pagerRef}
      style={{ flex: 1 }}
      initialPage={FEED_CATEGORIES.findIndex((c) => c.key === activeCategory)}
      offscreenPageLimit={1}
      // For You has horizontal shelf scrolls - disable pager swipe there
      scrollEnabled={activeCategory !== "for-you"}
      onPageSelected={handlePageSelected}
    >
      {FEED_CATEGORIES.map((category) => (
        <View key={category.key} collapsable={false} style={{ flex: 1 }}>
          {visited.has(category.key) ? (
            <FeedCategoryPage
              category={category.key}
              query={searchText}
              syncToken={syncToken}
              onPressItem={onPressItem}
              onOpenCategory={onOpenCategory}
              onFavoriteChange={() => setSyncToken((n) => n + 1)}
            />
          ) : (
            <View style={{ flex: 1 }} />
          )}
        </View>
      ))}
    </PagerView>
  );
}
