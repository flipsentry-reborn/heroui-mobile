import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import type { JSX } from "react";
import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import {
  PressableFeedback,
  SkeletonGroup,
  Switch,
  Typography,
} from "heroui-native";
import { EmptyState, Segment } from "heroui-native-pro";
import { withUniwind } from "uniwind";

import { CommunityHunterAvatar } from "@/features/community/community-hunter-avatar";
import { isHunterOnline } from "@/features/community/community-presence-badge";
import { FeedItem } from "@/features/feed/feed-item";
import type { CommunityHunter } from "@/mocks/data/community";
import {
  formatDaysAgo,
  getHunter,
  getHunterActivity,
  type CommunityActivityRow as ActivityRow,
} from "@/mocks/services/community";

const StyledImage = withUniwind(Image);
const StyledIonicons = withUniwind(Ionicons);

type ActivityLayout = "row" | "grid";

function formatPrice(price: number, symbol: string): string {
  const formatted = Math.round(price)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${symbol}${formatted}`;
}

interface CommunityProfilePageProps {
  hunterId: string;
  /** When true, show privacy toggles (You tab). */
  isSelf?: boolean;
  onPressListing: (feedItemId: string) => void;
  onPressHunter?: (hunterId: string) => void;
}

/** Artist-style profile · Last clicks with row / grid Segment. */
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
  const [layout, setLayout] = useState<ActivityLayout>("row");

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
      <SkeletonGroup isLoading isSkeletonOnly className="px-4 pt-6">
        <SkeletonGroup.Item className="mb-4 h-20 w-20 rounded-full" />
        <SkeletonGroup.Item className="mb-2 h-8 w-48 rounded-md" />
        <SkeletonGroup.Item className="h-4 w-40 rounded-md" />
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
      contentContainerClassName="pb-[110px] pt-2"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="mb-6 gap-3 px-4">
        <CommunityHunterAvatar hunter={hunter} size="lg" />
        <View className="gap-1">
          <Typography type="h2" weight="bold">
            {isSelf ? "Your profile" : hunter.displayName}
          </Typography>
          <Typography type="body-xs" color="muted">
            @{hunter.handle} · {hunter.city}
          </Typography>
          <View className="mt-1 flex-row flex-wrap items-center gap-2">
            {!isHunterOnline(hunter) ? (
              <Typography type="body-xs" className="text-muted">
                Last online · {hunter.lastOnlineLabel}
              </Typography>
            ) : null}
            <Typography type="body-xs" className="text-muted">
              {hunter.clicksYesterday} clicks yesterday
            </Typography>
          </View>
          <Typography type="body-xs" className="text-muted">
            {hunter.huntsFocus}
          </Typography>
        </View>
      </View>

      {isSelf ? (
        <View className="mx-4 mb-8 gap-3 rounded-2xl bg-surface px-4 py-3">
          <Typography type="body-sm" weight="semibold">
            Privacy
          </Typography>
          <View className="flex-row items-center justify-between py-1">
            <View className="mr-3 flex-1">
              <Typography type="body-sm">Show my activity</Typography>
              <Typography type="body-xs" className="text-muted">
                Rivals see your clicks after 24h
              </Typography>
            </View>
            <Switch isSelected={showActivity} onSelectedChange={setShowActivity} />
          </View>
          <View className="flex-row items-center justify-between py-1">
            <View className="mr-3 flex-1">
              <Typography type="body-sm">Appear in Competitors nearby</Typography>
              <Typography type="body-xs" className="text-muted">
                Let rivals near you see that you hunt the same deals
              </Typography>
            </View>
            <Switch isSelected={appearNearby} onSelectedChange={setAppearNearby} />
          </View>
        </View>
      ) : null}

      <View className="mb-3 flex-row items-end justify-between gap-3 px-4">
        <View className="min-w-0 flex-1 gap-0.5">
          <Typography type="h3" weight="bold">
            Last clicks
          </Typography>
          <Typography type="body-xs" color="muted">
            {isSelf
              ? "Your moves · delayed 24h"
              : "Their moves · delayed 24h"}
          </Typography>
        </View>
        {!activityHidden && activity.length > 0 ? (
          <Segment
            value={layout}
            onValueChange={(v) => {
              if (v === "row" || v === "grid") setLayout(v);
            }}
            size="sm"
          >
            <Segment.Group className="rounded-2xl">
              <Segment.Indicator className="rounded-xl" />
              <Segment.Item
                value="row"
                accessibilityLabel="List rows"
                className="rounded-xl"
              >
                <StyledIonicons
                  name="list-outline"
                  size={16}
                  className="text-foreground"
                />
              </Segment.Item>
              <Segment.Item
                value="grid"
                accessibilityLabel="Grid"
                className="rounded-xl"
              >
                <StyledIonicons
                  name="grid-outline"
                  size={16}
                  className="text-foreground"
                />
              </Segment.Item>
            </Segment.Group>
          </Segment>
        ) : null}
      </View>

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
      ) : layout === "grid" ? (
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
      ) : (
        <View>
          {activity.map((row) => {
            const imageUrl =
              row.feedItem.images.imageUrlHostedByUs ||
              row.feedItem.images.mainImageUrl.imageUrl;
            return (
              <PressableFeedback
                key={row.event.id}
                onPress={() => onPressListing(row.feedItem.id)}
                className="flex-row items-center gap-3 px-4 py-2"
                animation={{ scale: { value: 0.98 } }}
              >
                <StyledImage
                  source={{ uri: imageUrl }}
                  className="h-12 w-12 rounded-md bg-surface-secondary"
                  contentFit="cover"
                />
                <View className="min-w-0 flex-1 gap-0.5">
                  <Typography type="body-sm" weight="semibold" numberOfLines={1}>
                    {row.feedItem.title}
                  </Typography>
                  <Typography
                    type="body-xs"
                    className="text-muted"
                    numberOfLines={1}
                  >
                    {formatPrice(
                      row.feedItem.price,
                      row.feedItem.currencySymbol,
                    )}
                    {" · "}
                    {formatDaysAgo(row.event.daysAgo)}
                  </Typography>
                </View>
              </PressableFeedback>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
