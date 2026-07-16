import { Ionicons } from "@expo/vector-icons";
import type { JSX } from "react";
import { useCallback, useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  View,
} from "react-native";
import {
  PressableFeedback,
  SkeletonGroup,
  Typography,
  useThemeColor,
} from "heroui-native";
import { withUniwind } from "uniwind";

import { FeedItem } from "@/features/feed/feed-item";
import {
  FOR_YOU_SHELVES,
  type FeedCategoryKey,
} from "@/mocks/data/feed";
import { getFeed, toggleFavorite } from "@/mocks/services/feed";
import type { FeedItem as FeedModel } from "@/models/feed";

const StyledIonicons = withUniwind(Ionicons);

const SHELF_LIMIT = 5;

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

export function FeedForYouPage({
  query,
  syncToken,
  onPressItem,
  onOpenCategory,
  onFavoriteChange,
}: FeedForYouPageProps): JSX.Element {
  const accent = useThemeColor("accent");
  const [shelves, setShelves] = useState<ShelfState>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (opts?: { refresh?: boolean }) => {
      if (opts?.refresh) setRefreshing(true);
      else setLoading(true);
      try {
        const entries = await Promise.all(
          FOR_YOU_SHELVES.map(async (shelf) => {
            const items = await getFeed({
              category: shelf.key,
              query,
              limit: SHELF_LIMIT,
            });
            return [shelf.key, items] as const;
          }),
        );
        setShelves(Object.fromEntries(entries));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [query],
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

  if (loading && Object.keys(shelves).length === 0) {
    return (
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-28 pt-2"
        showsVerticalScrollIndicator={false}
      >
        <ShelfSkeleton />
        <ShelfSkeleton />
        <ShelfSkeleton />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="pb-28 pt-2"
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
    >
      {FOR_YOU_SHELVES.map((shelf) => {
        const items = shelves[shelf.key] ?? [];
        if (items.length === 0 && !loading) return null;

        return (
          <View key={shelf.key} className="mb-5">
            <PressableFeedback
              onPress={() => onOpenCategory(shelf.key)}
              className="mb-2 flex-row items-center justify-between px-3 py-1"
              animation={{ scale: { value: 0.99 } }}
              accessibilityRole="button"
              accessibilityLabel={`Open ${shelf.label}`}
            >
              <Typography
                type="body"
                weight="semibold"
                className="text-[17px] text-foreground"
              >
                {shelf.label}
              </Typography>
              <StyledIonicons
                name="chevron-forward"
                size={18}
                className="text-muted"
              />
            </PressableFeedback>

            <ScrollView
              horizontal
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="px-3"
              decelerationRate="fast"
            >
              {items.map((item) => (
                <FeedItem
                  key={item.id}
                  feed={item}
                  layout="rail"
                  onPress={onPressItem}
                  onToggleFavorite={(id) => {
                    void handleToggleFavorite(id);
                  }}
                />
              ))}
            </ScrollView>
          </View>
        );
      })}
    </ScrollView>
  );
}
