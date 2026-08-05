import { Ionicons } from "@expo/vector-icons";
import {
  FlashList,
  type ListRenderItem,
} from "@shopify/flash-list";
import { useFocusEffect, useRouter } from "expo-router";
import { observer } from "mobx-react-lite";
import type { JSX } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  RefreshControl,
  Platform,
  ScrollView,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";
import {
  Accordion,
  AccordionLayoutTransition,
  PressableFeedback,
  SkeletonGroup,
  Surface,
  Typography,
  useThemeColor,
} from "heroui-native";
import { Badge } from "heroui-native-pro";
import { useUniwind, withUniwind } from "uniwind";

import { useBottomChrome } from "@/contexts/bottom-chrome-context";
import {
  hasActiveScoreTierFilter,
  type FeedDisplayPrefs,
  type ScoreTierKey,
} from "@/domain/feed-display-prefs";
import { FEED_SHELF_LIMIT } from "@/domain/feed-routing";
import { ValuationTierBadge } from "@/features/feed/feed-badge";
import { FeedCategoryBadge } from "@/features/feed/feed-category-badge";
import {
  FEED_RAIL_DRAW_DISTANCE,
  FEED_RAIL_ROW_HEIGHT,
} from "@/features/feed/feed-flash-list";
import { FeedItem } from "@/features/feed/feed-item";
import { feedCategoryHref } from "@/features/feed/feed-nav";
import { formatMinProfitLabel } from "@/features/feed/min-profit-slider";
import type { FeedItem as FeedModel, ValuationTier } from "@/models/feed";
import type { UserFilter } from "@/models/user-filter";
import { useStore } from "@/store/store";

const StyledIonicons = withUniwind(Ionicons);
const StyledAnimatedView = withUniwind(Animated.View);

/**
 * Snappier than HeroUI default (mass 4) — FlashList cells can't join layout
 * transitions, so For You uses ScrollView + this spring for expand/collapse.
 */
const FOR_YOU_ACCORDION_LAYOUT = LinearTransition.springify()
  .damping(70)
  .stiffness(1000)
  .mass(2);

/** Best Picks + Your Filters — recessed darker panel (shared). */
function forYouInsetShelfClass(roundTop: boolean, roundBottom: boolean): string {
  return [
    "w-full overflow-hidden rounded-none bg-surface-inset px-0 py-2",
    roundTop ? "rounded-tl-2xl" : "",
    roundBottom ? "rounded-bl-2xl" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function selectedFiltersLabel(count: number): string {
  return count === 1
    ? "1 Filter Is Selected"
    : `${count} Filters Are Selected`;
}

const SELECTED_FILTER_DOT_VISIBLE = 5;

/** Worst → best — match filters sheet order for deal chips. */
const BANNER_SCORE_TIERS: {
  key: ScoreTierKey;
  tier: ValuationTier;
  label: string;
}[] = [
  { key: "showBad", tier: "overpriced", label: "Bad" },
  { key: "showFair", tier: "fairPrice", label: "Fair" },
  { key: "showGood", tier: "goodValue", label: "Good" },
  { key: "showGreat", tier: "greatDeal", label: "Great" },
];

function SelectedFiltersBanner({
  filters,
  displayPrefs,
  onPress,
}: {
  filters: UserFilter[];
  displayPrefs: FeedDisplayPrefs;
  onPress: () => void;
}): JSX.Element {
  const minProfitActive = displayPrefs.minProfit > 0;
  const scoreActive = hasActiveScoreTierFilter(displayPrefs);
  const activeTiers = scoreActive
    ? BANNER_SCORE_TIERS.filter((option) => displayPrefs[option.key])
    : [];
  const visible = filters.slice(0, SELECTED_FILTER_DOT_VISIBLE);
  const overflow = filters.length - visible.length;
  const hasSavedFilters = filters.length > 0;
  const dealSummaryParts: string[] = [];
  if (minProfitActive) {
    dealSummaryParts.push(formatMinProfitLabel(displayPrefs.minProfit));
  }
  if (scoreActive) {
    dealSummaryParts.push(
      activeTiers.length > 0
        ? activeTiers.map((t) => t.label).join(", ")
        : "No scores",
    );
  }
  const accessibilityLabel = [
    hasSavedFilters ? selectedFiltersLabel(filters.length) : null,
    dealSummaryParts.length > 0
      ? `Deal filters: ${dealSummaryParts.join(", ")}`
      : null,
    "Tap to manage filters.",
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <PressableFeedback
      onPress={onPress}
      className="mx-3 mt-3 mb-0 overflow-hidden rounded-2xl border border-border bg-surface-secondary"
      animation={{ scale: { value: 0.99 } }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <View className="gap-2 px-3 py-2.5">
        <View className="flex-row items-center gap-2.5">
          {hasSavedFilters ? (
            <View className="flex-row items-center">
              {visible.map((filter, index) => (
                <View
                  key={filter.id}
                  className={`h-5 w-5 rounded-full border-2 border-border ${
                    index === 0 ? "" : "-ml-2.5"
                  }`}
                  style={{
                    backgroundColor: filter.color,
                    zIndex: visible.length - index,
                  }}
                />
              ))}
              {overflow > 0 ? (
                <View className="z-0 -ml-2.5 h-5 min-w-5 items-center justify-center rounded-full border-2 border-border bg-default px-1">
                  <Typography className="text-[9px] leading-none text-muted">
                    +{overflow}
                  </Typography>
                </View>
              ) : null}
            </View>
          ) : null}
          <Typography
            type="body"
            weight="semibold"
            className="min-w-0 flex-1 text-[14px] text-foreground"
            numberOfLines={1}
          >
            {hasSavedFilters
              ? selectedFiltersLabel(filters.length)
              : "Deal filters active"}
          </Typography>
          <StyledIonicons
            name="chevron-forward"
            size={16}
            className="text-muted"
          />
        </View>

        {minProfitActive || scoreActive ? (
          <View className="flex-row flex-wrap items-center gap-1.5">
            {minProfitActive ? (
              <View className="h-5 flex-row items-center gap-1 rounded-md bg-violet-600/85 px-1.5">
                <StyledIonicons
                  name="trending-up"
                  size={11}
                  className="text-violet-100"
                />
                <Typography className="text-xs font-extrabold leading-none text-violet-100">
                  {formatMinProfitLabel(displayPrefs.minProfit)}
                </Typography>
              </View>
            ) : null}
            {activeTiers.map((option) => (
              <ValuationTierBadge
                key={option.key}
                tier={option.tier}
                scale="default"
              />
            ))}
          </View>
        ) : null}
      </View>
    </PressableFeedback>
  );
}

interface FeedForYouPageProps {
  query: string;
  /** True when this page is the active pager tab. */
  isActive?: boolean;
  onPressItem?: (id: string) => void;
  onOpenCategory?: (key: string) => void;
}

type ShelfDef = {
  key: string;
  label: string;
  badge?: string;
  isAccordion?: boolean;
  isExpandedGroup?: boolean;
  featured?: boolean;
};

type ForYouRow =
  | { type: "accordion"; key: string; shelf: ShelfDef }
  | { type: "expanded-group"; key: string; shelf: ShelfDef }
  | {
      type: "featured";
      key: string;
      shelf: ShelfDef;
      items: FeedModel[];
      pending: boolean;
    }
  | {
      type: "shelf";
      key: string;
      shelf: ShelfDef;
      items: FeedModel[];
      pending: boolean;
    };

function isInsetForYouRow(row: ForYouRow): boolean {
  return row.type === "featured" || row.type === "expanded-group";
}

/** Matches FeedItem rail footprint (187×168 image + text). */
function ShelfCardSkeletonRail(): JSX.Element {
  return (
    <SkeletonGroup
      isLoading
      isSkeletonOnly
      className="flex-row px-3"
      style={{ height: FEED_RAIL_ROW_HEIGHT }}
    >
      {[0, 1, 2].map((key) => (
        <View key={key} className="mr-2" style={{ width: 187 }}>
          <SkeletonGroup.Item
            className="w-full rounded-lg"
            style={{ height: 168 }}
          />
          <View className="mt-1 gap-0.5 px-0.5">
            <SkeletonGroup.Item className="h-4 w-16 rounded-md" />
            <SkeletonGroup.Item className="h-4 w-full rounded-md" />
            <SkeletonGroup.Item className="h-3 w-24 rounded-md" />
          </View>
        </View>
      ))}
    </SkeletonGroup>
  );
}

function ShelfRail({
  items,
  onPressItem,
  onToggleFavorite,
  contentPadding = 12,
  /**
   * Accordion expand mounts content mid-animation — FlashList init delays
   * height, so use a plain ScrollView there for immediate layout.
   */
  lightweight = false,
}: {
  items: FeedModel[];
  onPressItem?: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  contentPadding?: number;
  lightweight?: boolean;
}): JSX.Element {
  const renderItem = useCallback<ListRenderItem<FeedModel>>(
    ({ item }) => (
      <FeedItem
        feed={item}
        layout="rail"
        onPress={onPressItem}
        onToggleFavorite={onToggleFavorite}
      />
    ),
    [onPressItem, onToggleFavorite],
  );

  const keyExtractor = useCallback((item: FeedModel) => item.id, []);

  if (lightweight) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled
        directionalLockEnabled
        disableIntervalMomentum
        decelerationRate="fast"
        style={{ height: FEED_RAIL_ROW_HEIGHT }}
        contentContainerStyle={{ paddingHorizontal: contentPadding }}
      >
        {items.map((item) => (
          <FeedItem
            key={item.id}
            feed={item}
            layout="rail"
            onPress={onPressItem}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </ScrollView>
    );
  }

  return (
    <FlashList
      data={items}
      horizontal
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      drawDistance={FEED_RAIL_DRAW_DISTANCE}
      showsHorizontalScrollIndicator={false}
      // Fixed height so nested horizontal lists don't collapse before measure.
      style={{ height: FEED_RAIL_ROW_HEIGHT }}
      contentContainerStyle={{
        paddingHorizontal: contentPadding,
      }}
      nestedScrollEnabled
      directionalLockEnabled
      disableIntervalMomentum
      decelerationRate="fast"
    />
  );
}

function ShelfHeader({
  shelf,
  onPress,
}: {
  shelf: ShelfDef;
  onPress: () => void;
}): JSX.Element {
  return (
    <PressableFeedback
      onPress={onPress}
      className="mb-1.5 flex-row items-center justify-between px-3 py-0.5"
      animation={{ scale: { value: 0.99 } }}
      accessibilityRole="button"
      accessibilityLabel={`Open ${shelf.label}`}
    >
      <Badge.Anchor className={shelf.badge ? "pr-7" : undefined}>
        <View className="flex-row items-center gap-0.5">
          <Typography
            type="body"
            weight="bold"
            className="font-bold text-foreground"
          >
            {shelf.label}
          </Typography>
          {shelf.key === "price-drop" ? (
            <StyledIonicons
              name="arrow-down"
              size={16}
              className="text-foreground"
            />
          ) : null}
        </View>
        {shelf.badge ? <FeedCategoryBadge label={shelf.badge} /> : null}
      </Badge.Anchor>
      <StyledIonicons
        name="chevron-forward"
        size={18}
        className="text-muted"
      />
    </PressableFeedback>
  );
}

export const FeedForYouPage = observer(function FeedForYouPage({
  query,
  isActive = false,
  onPressItem,
  onOpenCategory,
}: FeedForYouPageProps): JSX.Element {
  const router = useRouter();
  const { searchStore, feedStore, filterStore } = useStore();
  const { onFeedScroll, onFeedScrollEnd } = useBottomChrome();
  const forYouShelves = searchStore.forYouShelves;
  const yourSearchChildren = searchStore.yourSearchChildren;
  const yourFilterChildren = searchStore.yourFilterChildren;
  const selectedFilters = filterStore.activeFilters;
  const displayPrefs = filterStore.displayPrefs;
  const dealPrefsCount = filterStore.activeDisplayPrefsCount;
  const showSelectedFiltersBanner =
    selectedFilters.length > 0 || dealPrefsCount > 0;
  const yourSearchesExpanded = feedStore.yourSearchesExpanded;
  const feedCategoryKeys = useMemo(
    () => new Set(searchStore.feedCategories.map((c) => c.key)),
    [searchStore.feedCategories],
  );
  const accent = useThemeColor("accent");
  const { theme } = useUniwind();
  const indicatorStyle = theme === "dark" ? "white" : "black";
  const [refreshing, setRefreshing] = useState(false);
  const skipQueryEffect = useRef(true);
  const lastScrollY = useRef(0);
  const isActiveRef = useRef(isActive);
  isActiveRef.current = isActive;

  const openCategory = useCallback(
    (key: string) => {
      if (
        key === "for-you" ||
        key === "your-searches" ||
        key === "your-filters"
      ) {
        return;
      }
      if (onOpenCategory && feedCategoryKeys.has(key)) {
        onOpenCategory(key);
        return;
      }
      router.push(feedCategoryHref(key));
    },
    [feedCategoryKeys, onOpenCategory, router],
  );

  const groupChildrenFor = useCallback(
    (shelfKey: string) => {
      if (shelfKey === "your-filters") return yourFilterChildren;
      return yourSearchChildren;
    },
    [yourFilterChildren, yourSearchChildren],
  );

  const shelfKeys = useMemo(() => {
    const keys: string[] = [];
    for (const shelf of forYouShelves) {
      if (shelf.isAccordion || shelf.isExpandedGroup) {
        for (const child of groupChildrenFor(shelf.key)) {
          keys.push(child.key);
        }
      } else if (shelf.key !== "your-searches" && shelf.key !== "your-filters") {
        keys.push(shelf.key);
      }
    }
    return keys;
  }, [forYouShelves, groupChildrenFor]);

  const load = useCallback(
    async (opts?: { refresh?: boolean }) => {
      if (opts?.refresh) setRefreshing(true);
      try {
        if (opts?.refresh || feedStore.isBucketDirty("best-picks")) {
          await feedStore.refreshIfDirty("best-picks", {
            force: true,
            limit: FEED_SHELF_LIMIT,
            asShelf: true,
            query,
          });
        }
        await feedStore.loadForYouShelves(shelfKeys, {
          query,
          force: opts?.refresh,
        });
      } finally {
        setRefreshing(false);
      }
    },
    [feedStore, query, shelfKeys],
  );

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useEffect(() => {
    if (skipQueryEffect.current) {
      skipQueryEffect.current = false;
      return;
    }
    void load({ refresh: true });
  }, [load, query]);

  const onToggleFavorite = useCallback(
    (id: string) => {
      void feedStore.toggleFavorite(id);
    },
    [feedStore],
  );

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      if (isActiveRef.current) {
        const scrollDiff = y - lastScrollY.current;
        onFeedScroll(scrollDiff, y);
      }
      lastScrollY.current = y;
    },
    [onFeedScroll],
  );

  const handleScrollEnd = useCallback(() => {
    if (isActiveRef.current) {
      onFeedScrollEnd();
    }
  }, [onFeedScrollEnd]);

  // Build during render (not useMemo) so MobX observer tracks getShelf / hydrate.
  const rows: ForYouRow[] = [];
  for (const shelf of forYouShelves) {
    if (shelf.isExpandedGroup) {
      rows.push({ type: "expanded-group", key: shelf.key, shelf });
      continue;
    }
    if (shelf.isAccordion) {
      rows.push({ type: "accordion", key: shelf.key, shelf });
      continue;
    }
    const pending = !feedStore.isShelfHydrated(shelf.key);
    const items = feedStore.getShelf(shelf.key);
    // Skip truly empty shelves only after hydrate — while pending, show cards.
    if (!pending && items.length === 0) continue;
    rows.push({
      type: shelf.featured ? "featured" : "shelf",
      key: shelf.key,
      shelf,
      items,
      pending,
    });
  }

  const renderChildShelf = useCallback(
    (
      child: {
        key: string;
        label: string;
        color?: string;
      },
      opts?: { lightweight?: boolean },
    ) => {
      const pending = !feedStore.isShelfHydrated(child.key);
      const items = feedStore.getShelf(child.key);
      const isEmpty = !pending && items.length === 0;

      return (
        <View key={child.key} className="mb-2.5">
          <PressableFeedback
            onPress={() => openCategory(child.key)}
            className="mb-1.5 flex-row items-center justify-between px-3 py-0.5"
            animation={{ scale: { value: 0.99 } }}
            accessibilityRole="button"
            accessibilityLabel={`Open ${child.label}`}
          >
            <View className="min-w-0 flex-1 flex-row items-center gap-2">
              {child.color ? (
                <View
                  className="h-2.5 w-2.5 rounded-full border border-border"
                  style={{ backgroundColor: child.color }}
                />
              ) : null}
              <Typography
                type="body"
                weight="bold"
                className="font-bold text-[14px] text-foreground"
              >
                {child.label}
              </Typography>
            </View>
            <StyledIonicons
              name="chevron-forward"
              size={16}
              className="text-muted"
            />
          </PressableFeedback>
          {pending ? (
            <ShelfCardSkeletonRail />
          ) : isEmpty ? (
            <View className="mx-3 flex-row items-center gap-2 rounded-xl bg-surface-secondary px-3 py-2.5">
              <StyledIonicons
                name="search-outline"
                size={14}
                className="text-muted"
              />
              <Typography type="body-sm" className="text-[13px] text-muted">
                No items matched yet
              </Typography>
            </View>
          ) : (
            <ShelfRail
              items={items}
              onPressItem={onPressItem}
              onToggleFavorite={onToggleFavorite}
              lightweight={opts?.lightweight}
            />
          )}
        </View>
      );
    },
    [feedStore, onPressItem, onToggleFavorite, openCategory],
  );

  const renderExpandedGroup = useCallback(
    (shelf: ShelfDef, roundTop: boolean, roundBottom: boolean) => {
      const children = [...groupChildrenFor(shelf.key)].sort((a, b) =>
        a.label.localeCompare(b.label),
      );

      return (
        <StyledAnimatedView
          key={shelf.key}
          layout={AccordionLayoutTransition}
        >
          <Surface
            variant="transparent"
            className={forYouInsetShelfClass(roundTop, roundBottom)}
          >
            <View className="mb-1 px-3 py-0.5">
              <Typography
                type="body"
                weight="bold"
                className="font-bold text-foreground"
              >
                {shelf.label}
              </Typography>
            </View>
            {children.map((child) => renderChildShelf(child))}
          </Surface>
        </StyledAnimatedView>
      );
    },
    [groupChildrenFor, renderChildShelf],
  );

  const renderAccordion = useCallback(
    (shelf: ShelfDef) => {
      const children = [...groupChildrenFor(shelf.key)].sort((a, b) =>
        a.label.localeCompare(b.label),
      );

      return (
        <StyledAnimatedView
          key={shelf.key}
          layout={AccordionLayoutTransition}
        >
          <Surface
            variant="default"
            className="w-full overflow-hidden rounded-none rounded-tl-2xl rounded-bl-2xl px-0 py-2"
          >
            <Accordion
              selectionMode="single"
              hideSeparator
              isCollapsible
              className="bg-transparent"
              value={yourSearchesExpanded ? shelf.key : undefined}
              onValueChange={(next: string | string[] | undefined) => {
                const nextValue = Array.isArray(next) ? next[0] : next;
                feedStore.setYourSearchesExpanded(
                  typeof nextValue === "string" && nextValue === shelf.key,
                );
              }}
              animation={{
                layout: { value: FOR_YOU_ACCORDION_LAYOUT },
              }}
            >
              <Accordion.Item value={shelf.key}>
                {({ isExpanded }) => (
                  <>
                    <Accordion.Trigger className="px-3 py-0.5">
                      <Typography
                        type="body"
                        weight="bold"
                        className="flex-1 font-bold text-foreground"
                      >
                        {shelf.label}
                      </Typography>
                      <Accordion.Indicator />
                    </Accordion.Trigger>

                    {/* Keep preview in layout tree so collapse/expand doesn't jump */}
                    <StyledAnimatedView
                      layout={FOR_YOU_ACCORDION_LAYOUT}
                      className={
                        isExpanded
                          ? "h-0 overflow-hidden opacity-0"
                          : "mt-1 px-3 pb-0.5 opacity-100"
                      }
                    >
                      <Typography
                        type="body-sm"
                        className="text-[13px] text-muted"
                        numberOfLines={1}
                      >
                        {children.map((child) => child.label).join(", ")}
                      </Typography>
                    </StyledAnimatedView>

                    {/* Layout spring owns expand; content fade reads as a late spawn. */}
                    <Accordion.Content className="pt-1" animation={false}>
                      {children.map((child) =>
                        renderChildShelf(child, { lightweight: true }),
                      )}
                    </Accordion.Content>
                  </>
                )}
              </Accordion.Item>
            </Accordion>
          </Surface>
        </StyledAnimatedView>
      );
    },
    [
      feedStore,
      groupChildrenFor,
      renderChildShelf,
      yourSearchesExpanded,
    ],
  );

  const renderRow = useCallback(
    (item: ForYouRow, index: number) => {
      const prevInset = index > 0 && isInsetForYouRow(rows[index - 1]!);
      const nextInset =
        index < rows.length - 1 && isInsetForYouRow(rows[index + 1]!);
      const roundTop = !prevInset;
      const roundBottom = !nextInset;

      if (item.type === "accordion") {
        return renderAccordion(item.shelf);
      }
      if (item.type === "expanded-group") {
        return renderExpandedGroup(item.shelf, roundTop, roundBottom);
      }

      const featured = item.type === "featured";
      const header = (
        <ShelfHeader
          shelf={item.shelf}
          onPress={() => openCategory(item.shelf.key)}
        />
      );
      const rail = item.pending ? (
        <ShelfCardSkeletonRail />
      ) : (
        <ShelfRail
          items={item.items}
          onPressItem={onPressItem}
          onToggleFavorite={onToggleFavorite}
        />
      );

      if (featured) {
        return (
          <StyledAnimatedView
            key={item.key}
            layout={AccordionLayoutTransition}
          >
            <Surface
              variant="transparent"
              className={forYouInsetShelfClass(roundTop, roundBottom)}
            >
              {header}
              {rail}
            </Surface>
          </StyledAnimatedView>
        );
      }

      return (
        <StyledAnimatedView
          key={item.key}
          layout={AccordionLayoutTransition}
        >
          {header}
          {rail}
        </StyledAnimatedView>
      );
    },
    [
      onPressItem,
      onToggleFavorite,
      openCategory,
      renderAccordion,
      renderExpandedGroup,
      rows,
    ],
  );

  return (
    <View className="flex-1">
      {/*
        Accordion layout springs need a Reanimated scroll host — FlashList
        remasures cells after expand, which looks like a delayed spawn.
      */}
      <Animated.ScrollView
        layout={AccordionLayoutTransition}
        className="flex-1"
        contentContainerClassName="pb-[112px] pt-0.5"
        onScroll={handleScroll}
        onScrollEndDrag={handleScrollEnd}
        onMomentumScrollEnd={handleScrollEnd}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator
        indicatorStyle={indicatorStyle}
        persistentScrollbar={Platform.OS === "android"}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void load({ refresh: true });
            }}
            tintColor={accent}
          />
        }
      >
        {showSelectedFiltersBanner ? (
          <SelectedFiltersBanner
            filters={selectedFilters}
            displayPrefs={displayPrefs}
            onPress={() => router.push("/filters")}
          />
        ) : null}
        {rows.map((row, index) => renderRow(row, index))}
      </Animated.ScrollView>
    </View>
  );
});
