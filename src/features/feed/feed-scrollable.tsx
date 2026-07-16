import { Ionicons } from "@expo/vector-icons";
import type { JSX } from "react";
import { FlatList, RefreshControl, View } from "react-native";
import { EmptyState } from "heroui-native-pro";
import { SkeletonGroup, useThemeColor } from "heroui-native";

import { FeedItem } from "@/features/feed/feed-item";
import type { FeedItem as FeedModel } from "@/models/feed";

interface FeedScrollableProps {
  items: FeedModel[];
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onPressItem?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  bottomInset?: number;
}

function FeedSkeleton(): JSX.Element {
  return (
    <View className="flex-row flex-wrap px-2 pt-1.5">
      {[0, 1, 2, 3].map((key) => (
        <View key={key} className="w-1/2 px-1 pb-2.5">
          <SkeletonGroup isLoading className="overflow-hidden rounded-xl bg-default">
            <SkeletonGroup.Item className="h-[168px] w-full" />
            <View className="gap-1.5 p-2">
              <SkeletonGroup.Item className="h-3.5 w-1/3 rounded-md" />
              <SkeletonGroup.Item className="h-2.5 w-[90%] rounded-md" />
              <SkeletonGroup.Item className="h-2.5 w-2/3 rounded-md" />
            </View>
          </SkeletonGroup>
        </View>
      ))}
    </View>
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
              <Ionicons name="sparkles-outline" size={22} color={accent} />
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
