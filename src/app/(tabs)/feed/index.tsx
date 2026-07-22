import { useRouter } from "expo-router";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useRef, useState, type JSX } from "react";
import { View } from "react-native";
import type PagerView from "react-native-pager-view";

import { FeedHeader } from "@/features/feed/feed-header";
import { FeedPager } from "@/features/feed/feed-pager";
import { FeedQuickFilterPage } from "@/features/feed/feed-quick-filter-page";
import { useStore } from "@/store/store";

const FeedScreen = observer(function FeedScreen(): JSX.Element {
  const router = useRouter();
  const { searchStore, feedStore } = useStore();
  const pagerRef = useRef<PagerView>(null);
  const [searchText, setSearchText] = useState("");
  const [activeCategory, setActiveCategory] = useState("for-you");
  const [quickFilterOpen, setQuickFilterOpen] = useState(false);

  const categories = searchStore.feedCategories;

  useEffect(() => {
    if (!searchStore.hasLoadedFeedTabAvailability) {
      void searchStore.loadFeedTabAvailability();
    }
  }, [searchStore]);

  useEffect(() => {
    feedStore.setActiveCategory(activeCategory);
  }, [activeCategory, feedStore]);

  useEffect(() => {
    if (categories.some((c) => c.key === activeCategory)) return;
    setActiveCategory("for-you");
    pagerRef.current?.setPage(0);
  }, [activeCategory, categories]);

  const handleCategorySelect = useCallback(
    (key: string) => {
      setQuickFilterOpen(false);
      setActiveCategory(key);
      const index = categories.findIndex((c) => c.key === key);
      if (index >= 0) {
        pagerRef.current?.setPage(index);
      }
    },
    [categories],
  );

  const handlePressItem = useCallback(
    (id: string) => {
      void feedStore.markClicked(id);
      router.push({ pathname: "/listing/[id]", params: { id } });
    },
    [feedStore, router],
  );

  return (
    <View className="flex-1 bg-background">
      <FeedHeader
        searchText={searchText}
        onSearchChange={setSearchText}
        categories={categories}
        activeCategory={activeCategory}
        onCategorySelect={handleCategorySelect}
        quickFilterActive={quickFilterOpen}
        onQuickFilterPress={() => setQuickFilterOpen((open) => !open)}
      />
      {quickFilterOpen ? (
        <FeedQuickFilterPage />
      ) : (
        <FeedPager
          pagerRef={pagerRef}
          categories={categories}
          activeCategory={activeCategory}
          searchText={searchText}
          onCategoryChange={setActiveCategory}
          onOpenCategory={handleCategorySelect}
          onPressItem={handlePressItem}
        />
      )}
    </View>
  );
});

export default FeedScreen;
