import { useRouter } from "expo-router";
import type { JSX } from "react";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SkeletonGroup, Typography } from "heroui-native";
import { EmptyState } from "heroui-native-pro";
import { withUniwind } from "uniwind";

import { CommunityClickersStack } from "@/features/community/community-clickers-stack";
import { communityHunterHref } from "@/features/community/community-nav";
import { FeedDetail } from "@/features/feed/feed-detail";
import {
  getItemClickers,
  type CommunityClicker,
} from "@/mocks/services/community";
import { getFeedById, toggleFavorite } from "@/mocks/services/feed";
import type { FeedItem } from "@/models/feed";

const StyledSafeAreaView = withUniwind(SafeAreaView);

interface CommunityItemDetailScreenProps {
  feedItemId: string;
}

function ClickedBySection({
  total,
  clickers,
  onPressHunter,
}: {
  total: number;
  clickers: CommunityClicker[];
  onPressHunter: (id: string) => void;
}): JSX.Element {
  return (
    <View className="flex-row items-center gap-3 px-4 pt-4">
      <Typography type="body-xs" className="text-muted">
        Clicked by
      </Typography>
      <CommunityClickersStack
        total={total}
        clickers={clickers}
        onPressHunter={onPressHunter}
      />
    </View>
  );
}

export function CommunityItemDetailScreen({
  feedItemId,
}: CommunityItemDetailScreenProps): JSX.Element {
  const router = useRouter();
  const [item, setItem] = useState<FeedItem | null>(null);
  const [clickers, setClickers] = useState<CommunityClicker[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    void (async () => {
      setLoading(true);
      const [feed, clicks] = await Promise.all([
        getFeedById(feedItemId),
        getItemClickers(feedItemId),
      ]);
      if (!alive) return;
      setItem(feed);
      setClickers(clicks.clickers);
      setTotal(clicks.total);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [feedItemId]);

  const handleFavorite = useCallback(async () => {
    if (!item) return;
    const updated = await toggleFavorite(item.id);
    if (updated) setItem(updated);
  }, [item]);

  if (loading) {
    return (
      <StyledSafeAreaView edges={["top"]} className="flex-1 bg-background">
        <SkeletonGroup isLoading isSkeletonOnly className="px-3 pt-3">
          <SkeletonGroup.Item className="mb-3 h-56 w-full rounded-xl" />
          <SkeletonGroup.Item className="mb-2 h-16 w-full rounded-xl" />
          <SkeletonGroup.Item className="h-24 w-full rounded-xl" />
        </SkeletonGroup>
      </StyledSafeAreaView>
    );
  }

  if (!item) {
    return (
      <View className="flex-1 justify-center bg-background px-6">
        <EmptyState>
          <EmptyState.Header>
            <EmptyState.Title>Listing not found</EmptyState.Title>
          </EmptyState.Header>
        </EmptyState>
      </View>
    );
  }

  return (
    <FeedDetail
      item={item}
      onBack={() => router.back()}
      onToggleFavorite={handleFavorite}
      afterGallery={
        <ClickedBySection
          total={total}
          clickers={clickers}
          onPressHunter={(id) => router.push(communityHunterHref(id))}
        />
      }
    />
  );
}
