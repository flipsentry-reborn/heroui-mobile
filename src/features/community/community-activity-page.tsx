import type { JSX } from "react";
import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { Button, SkeletonGroup, Typography } from "heroui-native";
import { EmptyState } from "heroui-native-pro";

import { CommunityHunterFeedCard } from "@/features/community/community-hunter-feed-card";
import { CommunityHuntersRail } from "@/features/community/community-hunters-rail";
import { CommunityTrendingRail } from "@/features/community/community-trending-rail";
import type { CommunityHunter } from "@/mocks/data/community";
import {
  getActiveNearbyHunters,
  getCommunityHunterFeeds,
  getCommunityTrending,
  type CommunityHunterFeed,
  type CommunityTrendingRow,
} from "@/mocks/services/community";

interface CommunityActivityPageProps {
  onPressListing: (feedItemId: string) => void;
  onPressHunter: (hunterId: string) => void;
}

export function CommunityActivityPage({
  onPressListing,
  onPressHunter,
}: CommunityActivityPageProps): JSX.Element {
  const router = useRouter();
  const [trending, setTrending] = useState<CommunityTrendingRow[]>([]);
  const [nearby, setNearby] = useState<CommunityHunter[]>([]);
  const [feeds, setFeeds] = useState<CommunityHunterFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [t, n, f] = await Promise.all([
      getCommunityTrending(),
      getActiveNearbyHunters(),
      getCommunityHunterFeeds(),
    ]);
    setTrending(t.slice(0, 5));
    setNearby(n);
    setFeeds(f);
  }, []);

  useEffect(() => {
    let alive = true;
    void (async () => {
      setLoading(true);
      await load();
      if (alive) setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <SkeletonGroup isLoading isSkeletonOnly className="px-3 pt-3">
        <SkeletonGroup.Item className="mb-3 h-5 w-40 rounded-md" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[0, 1, 2].map((k) => (
            <SkeletonGroup.Item
              key={k}
              className="mr-2 h-[160px] w-[140px] rounded-xl"
            />
          ))}
        </ScrollView>
        <SkeletonGroup.Item className="mt-5 h-5 w-36 rounded-md" />
        <SkeletonGroup.Item className="mt-2 h-40 w-full rounded-xl" />
        <SkeletonGroup.Item className="mt-2 h-40 w-full rounded-xl" />
      </SkeletonGroup>
    );
  }

  if (trending.length === 0 && feeds.length === 0) {
    return (
      <EmptyState className="flex-1 justify-center px-6">
        <EmptyState.Header>
          <EmptyState.Title>No activity yet</EmptyState.Title>
          <EmptyState.Description>
            Clicks from other hunters appear here after 24 hours.
          </EmptyState.Description>
        </EmptyState.Header>
      </EmptyState>
    );
  }

  return (
    <ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      contentContainerClassName="pb-[110px] pt-2"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="mb-3 gap-2 px-3">
        <Button
          variant="secondary"
          size="sm"
          onPress={() => router.push("/community/accordion-variants")}
        >
          Compare accordion interiors (10)
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onPress={() => router.push("/community/variants")}
        >
          Compare hunter layouts (39)
        </Button>
      </View>

      {trending.length > 0 ? (
        <View className="mb-5">
          <Typography type="body-sm" className="mb-2 px-3 text-muted">
            Trending yesterday
          </Typography>
          <CommunityTrendingRail
            rows={trending}
            onPressListing={onPressListing}
          />
        </View>
      ) : null}

      <View className="mb-5">
        <Typography type="body-sm" className="mb-2 px-3 text-muted">
          Active nearby
        </Typography>
        <CommunityHuntersRail
          hunters={nearby}
          onPressHunter={onPressHunter}
        />
      </View>

      {feeds.length > 0 ? (
        <View className="mb-2 gap-4 px-3">
          <Typography type="body-sm" className="text-muted">
            Recent by hunter · delayed 24h
          </Typography>
          {feeds.map((feed) => (
            <CommunityHunterFeedCard
              key={feed.hunter.id}
              feed={feed}
              onPressListing={onPressListing}
              onPressHunter={onPressHunter}
            />
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}
