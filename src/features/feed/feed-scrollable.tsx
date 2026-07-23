import { Ionicons } from "@expo/vector-icons";
import { FlashList, type FlashListRef, type ListRenderItem } from "@shopify/flash-list";
import { observer } from "mobx-react-lite";
import type { JSX } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  RefreshControl,
  View,
} from "react-native";
import { EmptyState } from "heroui-native-pro";
import { SkeletonGroup, Spinner, useThemeColor } from "heroui-native";
import { useUniwind, withUniwind } from "uniwind";

import { useBottomChrome } from "@/contexts/bottom-chrome-context";
import { FEED_GRID_DRAW_DISTANCE } from "@/features/feed/feed-flash-list";
import { FeedItem } from "@/features/feed/feed-item";
import type { FeedItem as FeedModel } from "@/models/feed";
import { useStore } from "@/store/store";

const StyledIonicons = withUniwind(Ionicons);

/** Past this offset, live prepends freeze so taps don't miss in a multi-col grid. */
const SCROLLED_THRESHOLD = 48;

interface FeedScrollableProps {
  items: FeedModel[];
  loading: boolean;
  refreshing: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  /** Category key — enables freeze / scroll-to-top for grid pages. */
  category?: string;
  /** True when this page is the active pager tab. */
  isActive?: boolean;
  onRefresh: () => void;
  onEndReached?: () => void;
  onPressItem?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  /** Extra space above the first row so cards aren’t flush under the header. */
  topInset?: number;
  bottomInset?: number;
}

/** Matches FeedItem: grid card, 168px (2-col) / 240px (1-col) image. */
function FeedSkeleton({ columns }: { columns: 1 | 2 }): JSX.Element {
  const count = columns === 1 ? 4 : 6;
  const imageH = columns === 1 ? "h-[212px]" : "h-[168px]";
  return (
    <SkeletonGroup
      isLoading
      isSkeletonOnly
      className="flex-row flex-wrap pt-1"
    >
      {Array.from({ length: count }, (_, key) => (
        <View
          key={key}
          className={`px-px ${columns === 1 ? "mb-2.5 w-full" : "mb-0.5 w-1/2"}`}
        >
          <View className="overflow-hidden rounded-lg">
            <SkeletonGroup.Item className={`${imageH} w-full rounded-lg`} />
            <View className="gap-0.5 px-1.5 pb-1.5 pt-1">
              <View className="flex-row items-center gap-1.5">
                <SkeletonGroup.Item className="h-4 w-14 rounded-md" />
                <SkeletonGroup.Item className="h-3 w-16 rounded-md" />
              </View>
              <SkeletonGroup.Item className="h-4 w-full rounded-md" />
              <SkeletonGroup.Item className="h-3 w-28 rounded-md" />
            </View>
          </View>
        </View>
      ))}
    </SkeletonGroup>
  );
}

function findSequenceStart(
  haystack: FeedModel[],
  needle: FeedModel[],
): number {
  if (needle.length === 0) return 0;
  const firstId = needle[0]?.id;
  if (!firstId) return -1;
  for (let i = 0; i <= haystack.length - needle.length; i += 1) {
    if (haystack[i]?.id !== firstId) continue;
    let match = true;
    for (let j = 1; j < needle.length; j += 1) {
      if (haystack[i + j]?.id !== needle[j]?.id) {
        match = false;
        break;
      }
    }
    if (match) return i;
  }
  return -1;
}

export const FeedScrollable = observer(function FeedScrollable({
  items,
  loading,
  refreshing,
  loadingMore = false,
  hasMore = false,
  category,
  isActive = false,
  onRefresh,
  onEndReached,
  onPressItem,
  onToggleFavorite,
  topInset = 4,
  bottomInset = 96,
}: FeedScrollableProps): JSX.Element {
  const { feedStore } = useStore();
  const numColumns: 1 | 2 = feedStore.layoutMode === "list" ? 1 : 2;
  const { onFeedScroll, onFeedScrollEnd, resetTabBar } = useBottomChrome();
  const accent = useThemeColor("accent");
  const { theme } = useUniwind();
  const indicatorStyle = theme === "dark" ? "white" : "black";
  const listRef = useRef<FlashListRef<FeedModel>>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [frozenItems, setFrozenItems] = useState<FeedModel[] | null>(null);
  const isScrolledRef = useRef(false);
  const lastScrollY = useRef(0);
  const isActiveRef = useRef(isActive);
  isActiveRef.current = isActive;

  const renderItem = useCallback<ListRenderItem<FeedModel>>(
    ({ item }) => (
      <FeedItem
        feed={item}
        layout={numColumns === 1 ? "list" : "grid"}
        onPress={onPressItem}
        onToggleFavorite={onToggleFavorite}
      />
    ),
    [numColumns, onPressItem, onToggleFavorite],
  );

  const keyExtractor = useCallback((item: FeedModel) => item.id, []);

  const handleEndReached = useCallback(() => {
    if (!onEndReached || loadingMore || !hasMore || loading || refreshing) {
      return;
    }
    onEndReached();
  }, [hasMore, loading, loadingMore, onEndReached, refreshing]);

  const revealTop = useCallback(() => {
    if (category) {
      feedStore.flushDeferredBucket(category);
    }
    setFrozenItems(null);
    setIsScrolled(false);
    isScrolledRef.current = false;
    lastScrollY.current = 0;
    resetTabBar();
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [category, feedStore, resetTabBar]);

  // Active category owns scroll-to-top (re-tap Feed tab).
  useEffect(() => {
    if (!isActive || !category || category === "for-you") {
      return;
    }
    feedStore.registerScrollToTop(revealTop);
    return () => {
      feedStore.registerScrollToTop(null);
    };
  }, [category, feedStore, isActive, revealTop]);

  // Sync store freeze flag for live SignalR deferral.
  useEffect(() => {
    if (!category || category === "for-you" || !isActive) return;
    feedStore.setBucketFrozen(category, isScrolled);
  }, [category, feedStore, isActive, isScrolled]);

  // Clear freeze when leaving the page.
  useEffect(() => {
    if (isActive || !category) return;
    feedStore.setBucketFrozen(category, false);
    setFrozenItems(null);
    setIsScrolled(false);
    isScrolledRef.current = false;
  }, [category, feedStore, isActive]);

  // While scrolled: freeze visible rows; still allow infinite-scroll tails.
  useEffect(() => {
    if (!isScrolled) {
      if (frozenItems !== null) setFrozenItems(null);
      return;
    }

    if (frozenItems === null) {
      setFrozenItems(items);
      return;
    }

    const start = findSequenceStart(items, frozenItems);
    if (start === -1) {
      setFrozenItems(items);
      return;
    }

    const tail = items.slice(start + frozenItems.length);
    if (tail.length > 0) {
      setFrozenItems([...frozenItems, ...tail]);
    }
  }, [frozenItems, isScrolled, items]);

  const listData = useMemo(() => {
    if (isScrolled && frozenItems) return frozenItems;
    return items;
  }, [frozenItems, isScrolled, items]);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      const scrolled = y > SCROLLED_THRESHOLD;
      if (scrolled !== isScrolledRef.current) {
        isScrolledRef.current = scrolled;
        setIsScrolled(scrolled);
        if (!scrolled && category) {
          feedStore.flushDeferredBucket(category);
          setFrozenItems(null);
        }
      }

      // Twitter-style tab bar auto-hide (active page only).
      if (isActiveRef.current) {
        const scrollDiff = y - lastScrollY.current;
        onFeedScroll(scrollDiff, y);
      }
      lastScrollY.current = y;
    },
    [category, feedStore, onFeedScroll],
  );

  const handleScrollEnd = useCallback(() => {
    if (isActiveRef.current) {
      onFeedScrollEnd();
    }
  }, [onFeedScrollEnd]);

  const handleRefresh = useCallback(() => {
    if (category) {
      feedStore.clearDeferredBucket(category);
      feedStore.setBucketFrozen(category, false);
    }
    setFrozenItems(null);
    setIsScrolled(false);
    isScrolledRef.current = false;
    onRefresh();
  }, [category, feedStore, onRefresh]);

  if (loading && items.length === 0) {
    return (
      <View className="flex-1" style={{ paddingTop: topInset }}>
        <FeedSkeleton columns={numColumns} />
      </View>
    );
  }

  return (
    <View className="flex-1">
      <FlashList
        key={`feed-${numColumns}`}
        ref={listRef}
        data={listData}
        extraData={`${numColumns}:${listData.length}:${listData[0]?.id ?? ""}`}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={numColumns}
        drawDistance={FEED_GRID_DRAW_DISTANCE}
        contentContainerStyle={{
          paddingTop: topInset,
          paddingBottom: bottomInset,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={accent}
          />
        }
        onScroll={handleScroll}
        onScrollEndDrag={handleScrollEnd}
        onMomentumScrollEnd={handleScrollEnd}
        scrollEventThrottle={16}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.55}
        ListFooterComponent={
          loadingMore ? (
            <View className="items-center py-6">
              <Spinner size="lg" color={accent} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState className="px-6 py-12">
            <EmptyState.Header>
              <EmptyState.Media variant="icon">
                <StyledIonicons
                  name="grid-outline"
                  size={20}
                  className="text-muted"
                />
              </EmptyState.Media>
              <EmptyState.Title>No listings yet</EmptyState.Title>
              <EmptyState.Description>
                Try another filter or clear your search to see mock deals.
              </EmptyState.Description>
            </EmptyState.Header>
          </EmptyState>
        }
        showsVerticalScrollIndicator
        indicatorStyle={indicatorStyle}
        persistentScrollbar={Platform.OS === "android"}
      />
    </View>
  );
});
