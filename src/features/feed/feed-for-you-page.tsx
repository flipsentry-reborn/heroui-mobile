import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { JSX } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
import {
  Accordion,
  AccordionLayoutTransition,
  PressableFeedback,
  ScrollShadow,
  SkeletonGroup,
  Surface,
  Typography,
  useThemeColor,
} from "heroui-native";
import { Badge } from "heroui-native-pro";
import { withUniwind } from "uniwind";

import { FeedCategoryBadge } from "@/features/feed/feed-category-badge";
import { FeedItem } from "@/features/feed/feed-item";
import {
  FOR_YOU_ALL_CHILDREN,
  FOR_YOU_SHELVES,
  type FeedCategoryKey,
} from "@/mocks/data/feed";
import { getFeed, toggleFavorite } from "@/mocks/services/feed";
import type { FeedItem as FeedModel } from "@/models/feed";

const StyledIonicons = withUniwind(Ionicons);

const SHELF_LIMIT = 6;

type ShelfState = Record<string, FeedModel[]>;

interface FeedForYouPageProps {
  query: string;
  syncToken: number;
  onPressItem?: (id: string) => void;
  onOpenCategory: (key: FeedCategoryKey) => void;
  onFavoriteChange?: () => void;
}

function ShelfSkeleton(): JSX.Element {
  return (
    <SkeletonGroup isLoading isSkeletonOnly className="mb-5">
      <View className="mb-2 flex-row items-center justify-between px-3">
        <SkeletonGroup.Item className="h-5 w-28 rounded-md" />
        <SkeletonGroup.Item className="h-4 w-4 rounded-md" />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="px-3">
        {[0, 1, 2].map((key) => (
          <View key={key} className="mr-2 w-[156px]">
            <SkeletonGroup.Item className="h-[128px] w-full rounded-xl" />
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
  contentClassName = "px-3",
}: {
  items: FeedModel[];
  onPressItem?: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  featured?: boolean;
  contentClassName?: string;
}): JSX.Element {
  return (
    <ScrollView
      horizontal
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      contentContainerClassName={contentClassName}
      decelerationRate="fast"
    >
      {items.map((item) => (
        <FeedItem
          key={item.id}
          feed={item}
          layout="rail"
          featured={featured}
          onPress={onPressItem}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </ScrollView>
  );
}

export function FeedForYouPage({
  query,
  syncToken,
  onPressItem,
  onOpenCategory,
  onFavoriteChange,
}: FeedForYouPageProps): JSX.Element {
  const [accent, background] = useThemeColor(["accent", "background"]);
  const [shelves, setShelves] = useState<ShelfState>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const shelfKeys = useMemo(() => {
    const keys: Exclude<FeedCategoryKey, "for-you">[] = [];
    for (const shelf of FOR_YOU_SHELVES) {
      if (shelf.isAccordion) {
        for (const child of FOR_YOU_ALL_CHILDREN) keys.push(child.key);
      } else if (shelf.key !== "your-searches") {
        keys.push(shelf.key);
      }
    }
    return keys;
  }, []);

  const allChildrenAlphabetical = useMemo(
    () =>
      [...FOR_YOU_ALL_CHILDREN].sort((a, b) =>
        a.label.localeCompare(b.label),
      ),
    [],
  );

  const load = useCallback(
    async (opts?: { refresh?: boolean }) => {
      if (opts?.refresh) setRefreshing(true);
      else setLoading(true);
      try {
        const entries = await Promise.all(
          shelfKeys.map(async (key) => {
            const items = await getFeed({
              category: key,
              query,
              limit: SHELF_LIMIT,
            });
            return [key, items] as const;
          }),
        );
        setShelves(Object.fromEntries(entries));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [query, shelfKeys],
  );

  useEffect(() => {
    void load();
  }, [load, syncToken]);

  const handleToggleFavorite = useCallback(
    async (id: string) => {
      const updated = await toggleFavorite(id);
      if (!updated) return;
      setShelves((prev) => {
        const next: ShelfState = {};
        for (const [key, items] of Object.entries(prev)) {
          next[key] = items.map((item) => (item.id === id ? updated : item));
        }
        return next;
      });
      onFavoriteChange?.();
    },
    [onFavoriteChange],
  );

  const onToggleFavorite = useCallback(
    (id: string) => {
      void handleToggleFavorite(id);
    },
    [handleToggleFavorite],
  );

  if (loading && Object.keys(shelves).length === 0) {
    return (
      <ScrollShadow
        className="flex-1"
        LinearGradientComponent={LinearGradient}
        color={background}
        size={12}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="pb-28 pt-2"
          showsVerticalScrollIndicator={false}
        >
          <ShelfSkeleton />
          <ShelfSkeleton />
          <ShelfSkeleton />
        </ScrollView>
      </ScrollShadow>
    );
  }

  return (
    <ScrollShadow
      className="flex-1"
      LinearGradientComponent={LinearGradient}
      color={background}
      size={12}
    >
      <Animated.ScrollView
        className="flex-1"
        contentContainerClassName="pb-28 pt-2"
        showsVerticalScrollIndicator={false}
        layout={AccordionLayoutTransition}
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
        {FOR_YOU_SHELVES.map((shelf) => {
          if (shelf.isAccordion) {
            return (
              <Animated.View
                key={shelf.key}
                className="mb-2.5"
                layout={AccordionLayoutTransition}
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
                            className="flex-1 text-[17px] text-foreground"
                          >
                            {shelf.label}
                          </Typography>
                          <Accordion.Indicator />
                        </Accordion.Trigger>

                        {!isExpanded ? (
                          <Typography
                            type="body-sm"
                            className="mt-1 px-3 pb-0.5 text-[14px] text-muted"
                            numberOfLines={1}
                          >
                            {allChildrenAlphabetical
                              .map((child) => child.label)
                              .join(", ")}
                          </Typography>
                        ) : null}

                        <Accordion.Content className="pt-1">
                          {allChildrenAlphabetical.map((child) => {
                            const items = shelves[child.key] ?? [];
                            if (items.length === 0 && !loading) return null;

                            return (
                              <View key={child.key} className="mb-2.5">
                                <PressableFeedback
                                  onPress={() => onOpenCategory(child.key)}
                                  className="mb-1.5 flex-row items-center justify-between px-3 py-0.5"
                                  animation={{ scale: { value: 0.99 } }}
                                  accessibilityRole="button"
                                  accessibilityLabel={`Open ${child.label}`}
                                >
                                  <Typography
                                    type="body"
                                    weight="semibold"
                                    className="text-[15px] text-foreground"
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
              </Animated.View>
            );
          }

          const items = shelves[shelf.key] ?? [];
          if (items.length === 0 && !loading) return null;

          const header = (
            <PressableFeedback
              onPress={() => {
                if (shelf.key === "your-searches") return;
                onOpenCategory(shelf.key);
              }}
              className="mb-1.5 flex-row items-center justify-between px-3 py-0.5"
              animation={{ scale: { value: 0.99 } }}
              accessibilityRole="button"
              accessibilityLabel={`Open ${shelf.label}`}
            >
              <Badge.Anchor className={shelf.badge ? "pr-7" : undefined}>
                <Typography
                  type="body"
                  weight="semibold"
                  className="text-[17px] text-foreground"
                >
                  {shelf.label}
                </Typography>
                {shelf.badge ? (
                  <FeedCategoryBadge label={shelf.badge} />
                ) : null}
              </Badge.Anchor>
              <StyledIonicons
                name="chevron-forward"
                size={18}
                className="text-muted"
              />
            </PressableFeedback>
          );

          const rail = (
            <ShelfRail
              items={items}
              onPressItem={onPressItem}
              onToggleFavorite={onToggleFavorite}
              featured={shelf.featured}
            />
          );

          if (shelf.featured) {
            return (
              <Animated.View
                key={shelf.key}
                className="mb-2.5"
                layout={AccordionLayoutTransition}
              >
                <Surface
                  variant="default"
                  className="w-full overflow-hidden rounded-none rounded-tl-2xl rounded-bl-2xl px-0 py-2"
                >
                  {header}
                  {rail}
                </Surface>
              </Animated.View>
            );
          }

          return (
            <Animated.View
              key={shelf.key}
              className="mb-2.5"
              layout={AccordionLayoutTransition}
            >
              {header}
              {rail}
            </Animated.View>
          );
        })}
      </Animated.ScrollView>
    </ScrollShadow>
  );
}
