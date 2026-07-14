import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState, type JSX } from "react";
import { View } from "react-native";
import { Button, SkeletonGroup } from "heroui-native";
import { EmptyState } from "heroui-native-pro";

import { FeedDetail } from "@/features/feed/feed-detail";
import { getFeedById, toggleFavorite } from "@/mocks/services/feed";
import type { FeedItem } from "@/models/feed";

export default function FeedDetailScreen(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<FeedItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setMissing(false);
    void (async () => {
      const data = await getFeedById(String(id ?? ""));
      if (!alive) return;
      setItem(data);
      setMissing(!data);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  const handleFavorite = useCallback(async () => {
    if (!item) return;
    const updated = await toggleFavorite(item.id);
    if (updated) setItem(updated);
  }, [item]);

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
      <View className="flex-1 bg-background items-center justify-center px-6">
        <EmptyState>
          <EmptyState.Header>
            <EmptyState.Title>Listing not found</EmptyState.Title>
            <EmptyState.Description>
              This mock item is missing or the link is invalid.
            </EmptyState.Description>
          </EmptyState.Header>
        </EmptyState>
        <Button variant="secondary" className="mt-4" onPress={() => router.back()}>
          <Button.Label>Back to Feed</Button.Label>
        </Button>
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
}
