import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useState, type JSX } from "react";
import { View } from "react-native";
import { Button, SkeletonGroup } from "heroui-native";
import { EmptyState } from "heroui-native-pro";
import { withUniwind } from "uniwind";

import { FeedDetail } from "@/features/feed/feed-detail";
import agent from "@/api/agent";
import { peekFeedById } from "@/mocks/services/feed";
import type { FeedItem } from "@/models/feed";
import { useStore } from "@/store/store";

const StyledIonicons = withUniwind(Ionicons);

const ListingDetailScreen = observer(function ListingDetailScreen(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { feedStore } = useStore();
  const listingId = String(id ?? "");
  const fromStore = feedStore.items.get(listingId) ?? null;
  // Seed sync so the open transition paints content, not a skeleton flash.
  const [item, setItem] = useState<FeedItem | null>(
    () => fromStore ?? peekFeedById(listingId),
  );
  const [loading, setLoading] = useState(
    () => fromStore == null && peekFeedById(listingId) == null,
  );
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let alive = true;
    const cached = feedStore.items.get(listingId) ?? peekFeedById(listingId);
    if (cached) {
      setItem(cached);
      setMissing(false);
      setLoading(false);
    } else {
      setLoading(true);
      setMissing(false);
    }
    void (async () => {
      const data = await agent.Feed.getDetails(listingId);
      if (!alive) return;
      if (data) feedStore.upsertItem(data);
      setItem(data);
      setMissing(!data);
      setLoading(false);
      void feedStore.markViewed(listingId);
    })();
    return () => {
      alive = false;
    };
  }, [feedStore, listingId]);

  useEffect(() => {
    const latest = feedStore.items.get(listingId);
    if (latest) setItem(latest);
  }, [feedStore.items, listingId]);

  const handleFavorite = useCallback(async () => {
    if (!item) return;
    const updated = await feedStore.toggleFavorite(item.id);
    if (updated) setItem(updated);
  }, [feedStore, item]);

  if (loading) {
    return (
      <View className="flex-1 bg-background px-4 pt-16">
        <SkeletonGroup isLoading className="gap-3">
          <SkeletonGroup.Item className="h-80 w-full rounded-2xl" />
          <SkeletonGroup.Item className="h-8 w-1/3 rounded-md" />
          <SkeletonGroup.Item className="h-6 w-4/5 rounded-md" />
          <SkeletonGroup.Item className="h-24 w-full rounded-xl" />
        </SkeletonGroup>
      </View>
    );
  }

  if (missing || !item) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <EmptyState>
          <EmptyState.Header>
            <EmptyState.Media variant="icon">
              <StyledIonicons
                name="alert-circle-outline"
                size={20}
                className="text-muted"
              />
            </EmptyState.Media>
            <EmptyState.Title>Listing not found</EmptyState.Title>
            <EmptyState.Description>
              This mock item is missing or the link is invalid.
            </EmptyState.Description>
          </EmptyState.Header>
          <EmptyState.Content>
            <Button variant="secondary" onPress={() => router.back()}>
              <Button.Label>Back to Feed</Button.Label>
            </Button>
          </EmptyState.Content>
        </EmptyState>
      </View>
    );
  }

  return (
    <FeedDetail
      item={item}
      onBack={() => router.back()}
      onToggleFavorite={() => {
        void handleFavorite();
      }}
    />
  );
});

export default ListingDetailScreen;
