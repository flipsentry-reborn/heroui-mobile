import { Ionicons } from "@expo/vector-icons";
import {
  FlashList,
  type ListRenderItem,
} from "@shopify/flash-list";
import { useFocusEffect, useRouter } from "expo-router";
import { observer } from "mobx-react-lite";
import type { JSX } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import {
  Accordion,
  PressableFeedback,
  SkeletonGroup,
  Surface,
  Typography,
  useThemeColor,
} from "heroui-native";
import { Badge } from "heroui-native-pro";
import { withUniwind } from "uniwind";

import { FeedCategoryBadge } from "@/features/feed/feed-category-badge";
import {
  FEED_FOR_YOU_DRAW_DISTANCE,
  FEED_RAIL_DRAW_DISTANCE,
  FEED_RAIL_FEATURED_ROW_HEIGHT,
  FEED_RAIL_ROW_HEIGHT,
} from "@/features/feed/feed-flash-list";
import { FeedItem } from "@/features/feed/feed-item";
import { feedCategoryHref } from "@/features/feed/feed-nav";
import type { FeedItem as FeedModel } from "@/models/feed";
import { useStore } from "@/store/store";

const StyledIonicons = withUniwind(Ionicons);

interface FeedForYouPageProps {
  query: string;
  onPressItem?: (id: string) => void;
  onOpenCategory?: (key: string) => void;
}

type ShelfDef = {
  key: string;
  label: string;
  badge?: string;
  isAccordion?: boolean;
  featured?: boolean;
};

type ForYouRow =
  | { type: "accordion"; key: string; shelf: ShelfDef }
  | { type: "featured"; key: string; shelf: ShelfDef; items: FeedModel[] }
  | { type: "shelf"; key: string; shelf: ShelfDef; items: FeedModel[] };

function ShelfSkeleton(): JSX.Element {
  return (
    <SkeletonGroup isLoading className="mb-2.5 gap-1.5">
      <View className="flex-row items-center justify-between px-3 py-0.5">
        <SkeletonGroup.Item className="h-5 w-28 rounded-md" />
        <SkeletonGroup.Item className="h-4 w-4 rounded-md" />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="px-3"
      >
        {[0, 1, 2].map((key) => (
          <View key={key} className="mr-2 w-[156px]">
            <SkeletonGroup.Item className="h-[128px] w-full rounded-lg" />
            <View className="mt-1 gap-0.5 px-0.5">
              <SkeletonGroup.Item className="h-4 w-16 rounded-md" />
              <SkeletonGroup.Item className="h-4 w-full rounded-md" />
            </View>
          </View>
        ))}
      </ScrollView>
    </SkeletonGroup>
  );
}

function ShelfRail({
  items,
  onPressItem,
  onToggleFavorite,
  featured = false,
  contentPadding = 12,
}: {
  items: FeedModel[];
  onPressItem?: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  featured?: boolean;
  contentPadding?: number;
}): JSX.Element {
  const renderItem = useCallback<ListRenderItem<FeedModel>>(
    ({ item }) => (
      <FeedItem
        feed={item}
        layout="rail"
        featured={featured}
        onPress={onPressItem}
        onToggleFavorite={onToggleFavorite}
      />
    ),
    [featured, onPressItem, onToggleFavorite],
  );

  const keyExtractor = useCallback((item: FeedModel) => item.id, []);

  return (
    <FlashList
      data={items}
      horizontal
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      drawDistance={FEED_RAIL_DRAW_DISTANCE}
      showsHorizontalScrollIndicator={false}
      // Fixed height so nested horizontal lists don't collapse before measure.
      style={{
        height: featured ? FEED_RAIL_FEATURED_ROW_HEIGHT : FEED_RAIL_ROW_HEIGHT,
      }}
      contentContainerStyle={{
        paddingHorizontal: contentPadding,
      }}
      // Nested inside vertical FlashList / accordion — lock axis.
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
            weight="semibold"
            className="text-[16px] text-foreground"
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
  onPressItem,
  onOpenCategory,
}: FeedForYouPageProps): JSX.Element {
  const router = useRouter();
  const { searchStore, feedStore } = useStore();
  const forYouShelves = searchStore.forYouShelves;
  const yourSearchChildren = searchStore.yourSearchChildren;
  const feedCategoryKeys = useMemo(
    () => new Set(searchStore.feedCategories.map((c) => c.key)),
    [searchStore.feedCategories],
  );
  const accent = useThemeColor("accent");
  const [refreshing, setRefreshing] = useState(false);
  const hasLoaded = useRef(false);
  const skipQueryEffect = useRef(true);

  const openCategory = useCallback(
    (key: string) => {
      if (key === "for-you" || key === "your-searches") return;
      if (onOpenCategory && feedCategoryKeys.has(key)) {
        onOpenCategory(key);
        return;
      }
      router.push(feedCategoryHref(key));
    },
    [feedCategoryKeys, onOpenCategory, router],
  );

  const shelfKeys = useMemo(() => {
    const keys: string[] = [];
    for (const shelf of forYouShelves) {
      if (shelf.isAccordion) {
        for (const child of yourSearchChildren) keys.push(child.key);
      } else if (shelf.key !== "your-searches") {
        keys.push(shelf.key);
      }
    }
    return keys;
  }, [forYouShelves, yourSearchChildren]);

  const allChildrenAlphabetical = useMemo(
    () =>
      [...yourSearchChildren].sort((a, b) => a.label.localeCompare(b.label)),
    [yourSearchChildren],
  );

  const loading =
    shelfKeys.some((key) => feedStore.isBucketLoading(key)) && !hasLoaded.current;

  const load = useCallback(
    async (opts?: { refresh?: boolean }) => {
      if (opts?.refresh) setRefreshing(true);
      try {
        if (opts?.refresh || feedStore.isBucketDirty("best-picks")) {
          await feedStore.refreshIfDirty("best-picks", {
            force: true,
            limit: 6,
            asShelf: true,
            query,
          });
        }
        await feedStore.loadForYouShelves(shelfKeys, {
          query,
          force: opts?.refresh,
        });
        hasLoaded.current = true;
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

  // Build during render (not useMemo) so MobX observer tracks getShelf / items.
  const rows: ForYouRow[] = [];
  for (const shelf of forYouShelves) {
    if (shelf.isAccordion) {
      rows.push({ type: "accordion", key: shelf.key, shelf });
      continue;
    }
    const items = feedStore.getShelf(shelf.key);
    if (items.length === 0 && !loading) continue;
    rows.push({
      type: shelf.featured ? "featured" : "shelf",
      key: shelf.key,
      shelf,
      items,
    });
  }

  const getItemType = useCallback((item: ForYouRow) => item.type, []);

  const keyExtractor = useCallback((item: ForYouRow) => item.key, []);

  const renderAccordion = useCallback(
    (shelf: ShelfDef) => (
      <View className="mb-2.5">
        <Surface
          variant="default"
          className="w-full overflow-hidden rounded-none rounded-tl-2xl rounded-bl-2xl px-0 py-2"
        >
          <Accordion
            selectionMode="single"
            hideSeparator
            isCollapsible
            className="bg-transparent"
          >
            <Accordion.Item value={shelf.key}>
              {({ isExpanded }) => (
                <>
                  <Accordion.Trigger className="px-3 py-0.5">
                    <Typography
                      type="body"
                      weight="semibold"
                      className="flex-1 text-[16px] text-foreground"
                    >
                      {shelf.label}
                    </Typography>
                    <Accordion.Indicator />
                  </Accordion.Trigger>

                  {!isExpanded ? (
                    <Typography
                      type="body-sm"
                      className="mt-1 px-3 pb-0.5 text-[13px] text-muted"
                      numberOfLines={1}
                    >
                      {allChildrenAlphabetical
                        .map((child) => child.label)
                        .join(", ")}
                    </Typography>
                  ) : null}

                  <Accordion.Content className="pt-1">
                    {allChildrenAlphabetical.map((child) => {
                      const items = feedStore.getShelf(child.key);
                      if (items.length === 0 && !loading) return null;

                      return (
                        <View key={child.key} className="mb-2.5">
                          <PressableFeedback
                            onPress={() => openCategory(child.key)}
                            className="mb-1.5 flex-row items-center justify-between px-3 py-0.5"
                            animation={{ scale: { value: 0.99 } }}
                            accessibilityRole="button"
                            accessibilityLabel={`Open ${child.label}`}
                          >
                            <Typography
                              type="body"
                              weight="semibold"
                              className="text-[14px] text-foreground"
                            >
                              {child.label}
                            </Typography>
                            <StyledIonicons
                              name="chevron-forward"
                              size={16}
                              className="text-muted"
                            />
                          </PressableFeedback>
                          <ShelfRail
                            items={items}
                            onPressItem={onPressItem}
                            onToggleFavorite={onToggleFavorite}
                          />
                        </View>
                      );
                    })}
                  </Accordion.Content>
                </>
              )}
            </Accordion.Item>
          </Accordion>
        </Surface>
      </View>
    ),
    [
      allChildrenAlphabetical,
      feedStore,
      loading,
      onPressItem,
      onToggleFavorite,
      openCategory,
    ],
  );

  const renderItem = useCallback<ListRenderItem<ForYouRow>>(
    ({ item }) => {
      if (item.type === "accordion") {
        return renderAccordion(item.shelf);
      }

      const header = (
        <ShelfHeader
          shelf={item.shelf}
          onPress={() => openCategory(item.shelf.key)}
        />
      );
      const rail = (
        <ShelfRail
          items={item.items}
          onPressItem={onPressItem}
          onToggleFavorite={onToggleFavorite}
          featured={item.type === "featured"}
        />
      );

      if (item.type === "featured") {
        return (
          <View className="mb-2.5">
            <Surface
              variant="default"
              className="w-full overflow-hidden rounded-none rounded-tl-2xl rounded-bl-2xl px-0 py-2"
            >
              {header}
              {rail}
            </Surface>
          </View>
        );
      }

      return (
        <View className="mb-2.5">
          {header}
          {rail}
        </View>
      );
    },
    [onPressItem, onToggleFavorite, openCategory, renderAccordion],
  );

  if (loading) {
    return (
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-28 pt-0.5"
        showsVerticalScrollIndicator={false}
      >
        <ShelfSkeleton />
        <ShelfSkeleton />
        <ShelfSkeleton />
      </ScrollView>
    );
  }

  return (
    <View className="flex-1">
      <FlashList
        data={rows}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemType={getItemType}
        drawDistance={FEED_FOR_YOU_DRAW_DISTANCE}
        contentContainerStyle={{
          paddingTop: 2,
          paddingBottom: 112,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void load({ refresh: true });
            }}
            tintColor={accent}
          />
        }
      />
    </View>
  );
});
