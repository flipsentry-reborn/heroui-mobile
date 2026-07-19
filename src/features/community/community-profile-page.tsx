import type { JSX } from "react";
import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { SkeletonGroup, Switch, Typography } from "heroui-native";
import { EmptyState } from "heroui-native-pro";

import { CommunityHunterAvatar } from "@/features/community/community-hunter-avatar";
import { FeedItem } from "@/features/feed/feed-item";
import type { CommunityHunter } from "@/mocks/data/community";
import {
  formatDaysAgo,
  getHunter,
  getHunterActivity,
  type CommunityActivityRow as ActivityRow,
} from "@/mocks/services/community";

interface CommunityProfilePageProps {
  hunterId: string;
  /** When true, show privacy toggles (You tab). */
  isSelf?: boolean;
  onPressListing: (feedItemId: string) => void;
  onPressHunter?: (hunterId: string) => void;
}

export function CommunityProfilePage({
  hunterId,
  isSelf = false,
  onPressListing,
}: CommunityProfilePageProps): JSX.Element {
  const [hunter, setHunter] = useState<CommunityHunter | null>(null);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showActivity, setShowActivity] = useState(true);
  const [appearNearby, setAppearNearby] = useState(true);

  const load = useCallback(async () => {
    const [h, a] = await Promise.all([
      getHunter(hunterId),
      getHunterActivity(hunterId),
    ]);
    setHunter(h);
    setActivity(a);
    if (h) setShowActivity(h.showActivity);
  }, [hunterId]);

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
      <SkeletonGroup isLoading isSkeletonOnly className="items-center px-3 pt-6">
        <SkeletonGroup.Item className="mb-3 h-16 w-16 rounded-full" />
        <SkeletonGroup.Item className="mb-2 h-5 w-36 rounded-md" />
        <SkeletonGroup.Item className="h-4 w-48 rounded-md" />
      </SkeletonGroup>
    );
  }

  if (!hunter) {
    return (
      <EmptyState className="flex-1 justify-center px-6">
        <EmptyState.Header>
          <EmptyState.Title>Hunter not found</EmptyState.Title>
        </EmptyState.Header>
      </EmptyState>
    );
  }

  const activityHidden = !hunter.showActivity && !isSelf;

  return (
    <ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      contentContainerClassName="pb-[110px] pt-4"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="mb-5 items-center gap-2 px-3">
        <CommunityHunterAvatar hunter={hunter} size="lg" />
        <Typography type="body" weight="semibold">
          {isSelf ? "Your profile" : hunter.displayName}
        </Typography>
        <Typography type="body-xs" className="text-muted">
          @{hunter.handle} · {hunter.city}
        </Typography>
        <Typography type="body-xs" className="text-muted">
          {hunter.clicksYesterday} clicks yesterday
        </Typography>
      </View>

      {isSelf ? (
        <View className="mx-3 mb-5 gap-3 rounded-2xl bg-surface px-4 py-3">
          <Typography type="body-xs" className="text-muted">
            Privacy
          </Typography>
          <View className="flex-row items-center justify-between py-1">
            <View className="mr-3 flex-1">
              <Typography type="body-sm">Show my activity</Typography>
              <Typography type="body-xs" className="text-muted">
                Others see your clicks after 24h
              </Typography>
            </View>
            <Switch isSelected={showActivity} onSelectedChange={setShowActivity} />
          </View>
          <View className="flex-row items-center justify-between py-1">
            <View className="mr-3 flex-1">
              <Typography type="body-sm">Appear in Nearby</Typography>
              <Typography type="body-xs" className="text-muted">
                Show up for hunters in your radius
              </Typography>
            </View>
            <Switch isSelected={appearNearby} onSelectedChange={setAppearNearby} />
          </View>
        </View>
      ) : null}

      <Typography type="body-sm" className="mb-2 px-3 text-muted">
        {isSelf ? "Your activity · delayed 24h" : "Activity · delayed 24h"}
      </Typography>

      {activityHidden ? (
        <EmptyState className="px-6 py-8">
          <EmptyState.Header>
            <EmptyState.Title>Activity hidden</EmptyState.Title>
            <EmptyState.Description>
              This hunter keeps their clicks private.
            </EmptyState.Description>
          </EmptyState.Header>
        </EmptyState>
      ) : activity.length === 0 ? (
        <EmptyState className="px-6 py-8">
          <EmptyState.Header>
            <EmptyState.Title>No activity yet</EmptyState.Title>
            <EmptyState.Description>
              Clicks appear here after 24 hours.
            </EmptyState.Description>
          </EmptyState.Header>
        </EmptyState>
      ) : (
        <View className="flex-row flex-wrap px-0.5 pt-1">
          {activity.map((row) => (
            <View key={row.event.id} className="mb-1.5 w-1/2 px-0.5">
              <FeedItem
                feed={row.feedItem}
                layout="grid"
                hideFavorite
                imageCornerLabel={formatDaysAgo(row.event.daysAgo)}
                imageCornerSide="right"
                onPress={onPressListing}
              />
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
