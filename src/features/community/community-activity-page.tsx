import type { JSX } from "react";
import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { LinkButton, SkeletonGroup } from "heroui-native";
import { EmptyState } from "heroui-native-pro";

import { CommunityActiveNearbySection } from "@/features/community/community-active-nearby-section";
import { CommunityHunterFeedDepthList } from "@/features/community/community-hunter-feed-card";
import { CommunitySectionHeader } from "@/features/community/community-section-header";
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
      <SkeletonGroup isLoading isSkeletonOnly className="px-4 pt-3">
        <SkeletonGroup.Item className="mb-3 h-7 w-48 rounded-md" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[0, 1, 2].map((k) => (
            <SkeletonGroup.Item
              key={k}
              className="mr-4 h-[148px] w-[148px] rounded-md"
            />
          ))}
        </ScrollView>
        <SkeletonGroup.Item className="mt-8 h-7 w-40 rounded-md" />
        <View className="mt-3 flex-row gap-5">
          {[0, 1, 2].map((k) => (
            <SkeletonGroup.Item key={k} className="h-16 w-16 rounded-full" />
          ))}
        </View>
        <SkeletonGroup.Item className="mt-8 h-7 w-44 rounded-md" />
        <SkeletonGroup.Item className="mt-3 h-14 w-full rounded-md" />
        <SkeletonGroup.Item className="mt-2 h-14 w-full rounded-md" />
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
      contentContainerClassName="pb-[110px] pt-1"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {trending.length > 0 ? (
        <View className="mb-8">
          <CommunitySectionHeader title="Trending yesterday" />
          <CommunityTrendingRail
            rows={trending}
            onPressListing={onPressListing}
          />
        </View>
      ) : null}

      <View className="mb-8">
        <CommunityActiveNearbySection
          hunters={nearby}
          onPressHunter={onPressHunter}
        />
      </View>

      {feeds.length > 0 ? (
        <View className="mb-6">
          <CommunitySectionHeader
            title="Recently clicked"
            subtitle="Delayed 24h · expand a row for hunter stats"
          />
          <CommunityHunterFeedDepthList
            feeds={feeds}
            onPressListing={onPressListing}
            onPressHunter={onPressHunter}
          />
        </View>
      ) : null}

      <View className="flex-row flex-wrap items-center gap-x-4 gap-y-1 px-4 pt-2">
        <LinkButton
          size="sm"
          onPress={() => router.push("/community/accordion-variants")}
        >
          Accordion layouts
        </LinkButton>
        <LinkButton
          size="sm"
          onPress={() => router.push("/community/variants")}
        >
          Card layouts
        </LinkButton>
        <LinkButton
          size="sm"
          onPress={() => router.push("/community/nearby-bg-variants")}
        >
          Nearby bg variants
        </LinkButton>
      </View>
    </ScrollView>
  );
}
