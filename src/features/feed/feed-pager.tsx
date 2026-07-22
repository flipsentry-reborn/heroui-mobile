import type { JSX, RefObject } from "react";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import PagerView, {
  type PagerViewOnPageSelectedEvent,
} from "react-native-pager-view";

import type { FeedCategoryDef } from "@/features/feed/build-feed-categories";
import { FeedCategoryPage } from "@/features/feed/feed-category-page";

interface FeedPagerProps {
  pagerRef: RefObject<PagerView | null>;
  categories: FeedCategoryDef[];
  activeCategory: string;
  searchText: string;
  onCategoryChange: (key: string) => void;
  onPressItem?: (id: string) => void;
  onOpenCategory?: (key: string) => void;
}

export function FeedPager({
  pagerRef,
  categories,
  activeCategory,
  searchText,
  onCategoryChange,
  onPressItem,
  onOpenCategory,
}: FeedPagerProps): JSX.Element {
  const [visited, setVisited] = useState<Set<string>>(
    () => new Set<string>([activeCategory]),
  );

  useEffect(() => {
    setVisited((prev) => {
      if (prev.has(activeCategory)) return prev;
      const next = new Set(prev);
      next.add(activeCategory);
      return next;
    });
  }, [activeCategory]);

  const swipeEnabled = activeCategory !== "for-you";

  useEffect(() => {
    pagerRef.current?.setScrollEnabled(swipeEnabled);
  }, [pagerRef, swipeEnabled]);

  const handlePageSelected = useCallback(
    (e: PagerViewOnPageSelectedEvent) => {
      const key = categories[e.nativeEvent.position]?.key;
      if (!key || key === activeCategory) return;
      onCategoryChange(key);
    },
    [activeCategory, categories, onCategoryChange],
  );

  const initialPage = Math.max(
    0,
    categories.findIndex((c) => c.key === activeCategory),
  );
  const categoriesKey = categories.map((c) => c.key).join("|");

  return (
    <PagerView
      key={categoriesKey}
      ref={pagerRef}
      style={{ flex: 1 }}
      initialPage={initialPage}
      offscreenPageLimit={1}
      scrollEnabled={swipeEnabled}
      onPageSelected={handlePageSelected}
    >
      {categories.map((category) => (
        <View key={category.key} collapsable={false} style={{ flex: 1 }}>
          {visited.has(category.key) ? (
            <FeedCategoryPage
              category={category.key}
              groupIds={category.groupIds}
              query={searchText}
              onPressItem={onPressItem}
              onOpenCategory={onOpenCategory}
            />
          ) : (
            <View style={{ flex: 1 }} />
          )}
        </View>
      ))}
    </PagerView>
  );
}
