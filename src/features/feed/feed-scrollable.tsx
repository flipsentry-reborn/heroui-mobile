import { Ionicons } from "@expo/vector-icons";
import { FlashList, type ListRenderItem } from "@shopify/flash-list";
import type { JSX } from "react";
import { useCallback } from "react";
import { RefreshControl, View } from "react-native";
import { EmptyState } from "heroui-native-pro";
import { SkeletonGroup, useThemeColor } from "heroui-native";
import { withUniwind } from "uniwind";

import { FEED_GRID_DRAW_DISTANCE } from "@/features/feed/feed-flash-list";
import { FeedItem } from "@/features/feed/feed-item";
import type { FeedItem as FeedModel } from "@/models/feed";

const StyledIonicons = withUniwind(Ionicons);

interface FeedScrollableProps {
  items: FeedModel[];
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onPressItem?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  /** Extra space above the first row so cards aren’t flush under the header. */
  topInset?: number;
  bottomInset?: number;
}

/** Matches FeedItem: 2-col card, 168px image, 3 text rows. */
function FeedSkeleton(): JSX.Element {
  return (
    <SkeletonGroup
      isLoading
      isSkeletonOnly
      className="flex-row flex-wrap pt-1"
    >
      {[0, 1, 2, 3, 4, 5].map((key) => (
        <View key={key} className="mb-0.5 w-1/2 px-px">
          <View className="overflow-hidden rounded-lg">
            <SkeletonGroup.Item className="h-[168px] w-full rounded-lg" />
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

export function FeedScrollable({
  items,
  loading,
  refreshing,
  onRefresh,
  onPressItem,
  onToggleFavorite,
  topInset = 4,
  bottomInset = 96,
}: FeedScrollableProps): JSX.Element {
  const accent = useThemeColor("accent");

  const renderItem = useCallback<ListRenderItem<FeedModel>>(
    ({ item }) => (
      <FeedItem
        feed={item}
        onPress={onPressItem}
        onToggleFavorite={onToggleFavorite}
      />
    ),
    [onPressItem, onToggleFavorite],
  );

  const keyExtractor = useCallback((item: FeedModel) => item.id, []);

  if (loading && items.length === 0) {
    return (
      <View className="flex-1" style={{ paddingTop: topInset }}>
        <FeedSkeleton />
      </View>
    );
  }

  return (
    <View className="flex-1">
      <FlashList
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={2}
        drawDistance={FEED_GRID_DRAW_DISTANCE}
        contentContainerStyle={{
          paddingTop: topInset,
          paddingBottom: bottomInset,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={accent}
          />
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
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
