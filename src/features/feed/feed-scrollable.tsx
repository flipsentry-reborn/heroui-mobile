import { Ionicons } from "@expo/vector-icons";
import type { JSX } from "react";
import { FlatList, RefreshControl, View } from "react-native";
import { EmptyState } from "heroui-native-pro";
import { SkeletonGroup, useThemeColor } from "heroui-native";
import { withUniwind } from "uniwind";

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
  bottomInset?: number;
}

/** Matches FeedItem: 2-col card, 168px image, 3 text rows. */
function FeedSkeleton(): JSX.Element {
  return (
    <SkeletonGroup
      isLoading
      isSkeletonOnly
      className="flex-row flex-wrap px-0.5 pt-1"
    >
      {[0, 1, 2, 3, 4, 5].map((key) => (
        <View key={key} className="mb-1.5 w-1/2 px-0.5">
          <View className="overflow-hidden rounded-xl">
            <SkeletonGroup.Item className="h-[168px] w-full rounded-xl" />
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
  bottomInset = 96,
}: FeedScrollableProps): JSX.Element {
  const accent = useThemeColor("accent");

  if (loading && items.length === 0) {
    return <FeedSkeleton />;
  }

  return (
    <FlatList
      key="feed-grid-2"
      data={items}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={{ paddingHorizontal: 2 }}
      contentContainerStyle={{ paddingTop: 4, paddingBottom: bottomInset, flexGrow: 1 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent} />
      }
      renderItem={({ item }) => (
        <FeedItem
          feed={item}
          onPress={onPressItem}
          onToggleFavorite={onToggleFavorite}
        />
      )}
      ListEmptyComponent={
        <EmptyState className="px-6 py-12">
          <EmptyState.Header>
            <EmptyState.Media variant="icon">
              <StyledIonicons name="grid-outline" size={20} className="text-muted" />
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
  );
}
