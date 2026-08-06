import { useFocusEffect, useRouter } from "expo-router";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useRef, useState, type JSX } from "react";
import { View } from "react-native";
import type PagerView from "react-native-pager-view";

import { FilterApplyingDialog } from "@/features/feed/filter-applying-dialog";
import { FeedCategoryPickerFab } from "@/features/feed/feed-category-picker";
import { FeedHeader } from "@/features/feed/feed-header";
import { FeedPager } from "@/features/feed/feed-pager";
import { useBottomChrome } from "@/contexts/bottom-chrome-context";
import { debugLog } from "@/lib/debug-log";
import { useLockedRouterPush } from "@/lib/use-locked-router-push";
import { useStore } from "@/store/store";

const FEED_OPEN_LOG = "FeedOpen";

const FeedScreen = observer(function FeedScreen(): JSX.Element {
  const router = useRouter();
  const pushOnce = useLockedRouterPush();
  const { searchStore, feedStore } = useStore();
  const { resetTabBar } = useBottomChrome();
  const pagerRef = useRef<PagerView>(null);
  const [searchText, setSearchText] = useState("");
  const [activeCategory, setActiveCategory] = useState("for-you");

  const categories = searchStore.feedCategories;

  useEffect(() => {
    if (!searchStore.hasLoadedFeedTabAvailability) {
      void searchStore.loadFeedTabAvailability();
    }
  }, [searchStore]);

  useFocusEffect(
    useCallback(() => {
      void feedStore.beginFilterApplyIfNeeded();
      // Category picker is a root stack screen — sync selection on return.
      const fromPicker = feedStore.activeCategory;
      setActiveCategory((current) => {
        if (
          !fromPicker ||
          fromPicker === current ||
          !categories.some((c) => c.key === fromPicker)
        ) {
          return current;
        }
        resetTabBar();
        const index = categories.findIndex((c) => c.key === fromPicker);
        if (index >= 0) {
          pagerRef.current?.setPage(index);
        }
        return fromPicker;
      });
    }, [categories, feedStore, resetTabBar]),
  );

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
      setActiveCategory(key);
      resetTabBar();
      const index = categories.findIndex((c) => c.key === key);
      if (index >= 0) {
        pagerRef.current?.setPage(index);
      }
    },
    [categories, resetTabBar],
  );

  const handleCategoryChange = useCallback(
    (key: string) => {
      setActiveCategory(key);
      resetTabBar();
    },
    [resetTabBar],
  );

  const handleFiltersPress = useCallback(() => {
    resetTabBar();
    router.push("/filters");
  }, [resetTabBar, router]);

  const handlePressItem = useCallback(
    (id: string) => {
      const t0 = Date.now();
      debugLog.info(FEED_OPEN_LOG, "handlePressItem → push", {
        id,
        source: "feed-index",
        t: t0,
      });
      // Navigate first; defer store mutation so list observers don't block the transition.
      // pushOnce ignores rapid re-taps until this screen regains focus.
      pushOnce({ pathname: "/listing/[id]", params: { id } });
      debugLog.info(FEED_OPEN_LOG, "handlePressItem push queued", {
        id,
        ms: Date.now() - t0,
        t: Date.now(),
      });
      requestIdleCallback(
        () => {
          debugLog.info(FEED_OPEN_LOG, "deferred markClicked", {
            id,
            sincePressMs: Date.now() - t0,
            t: Date.now(),
          });
          void feedStore.markClicked(id);
        },
        { timeout: 1000 },
      );
    },
    [feedStore, pushOnce],
  );

  return (
    <View className="flex-1 bg-background">
      <FeedHeader
        searchText={searchText}
        onSearchChange={setSearchText}
        categories={categories}
        activeCategory={activeCategory}
        onCategorySelect={handleCategorySelect}
        onFiltersPress={handleFiltersPress}
      />
      <FeedPager
        pagerRef={pagerRef}
        categories={categories}
        activeCategory={activeCategory}
        searchText={searchText}
        onCategoryChange={handleCategoryChange}
        onOpenCategory={handleCategorySelect}
        onPressItem={handlePressItem}
      />
      <FeedCategoryPickerFab />
      <FilterApplyingDialog />
    </View>
  );
});

export default FeedScreen;
