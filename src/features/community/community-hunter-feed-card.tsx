import { Image } from "expo-image";
import type { JSX } from "react";
import { View } from "react-native";
import {
  Accordion,
  Button,
  PressableFeedback,
  Typography,
} from "heroui-native";
import { withUniwind } from "uniwind";

import {
  CommunityActiveBadge,
  isHunterOnline,
} from "@/features/community/community-presence-badge";
import {
  formatDaysAgo,
  type CommunityHunterFeed,
} from "@/mocks/services/community";

const StyledImage = withUniwind(Image);

function formatPrice(price: number, symbol: string): string {
  const formatted = Math.round(price)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${symbol}${formatted}`;
}

interface CommunityHunterFeedCardProps {
  feed: CommunityHunterFeed;
  onPressListing: (feedItemId: string) => void;
  onPressHunter: (hunterId: string) => void;
}

/**
 * Spotify track row — square thumb, title / artist meta, expand for stats.
 * No card chrome; sits flush in the list.
 */
export function CommunityHunterFeedCard({
  feed,
  onPressListing,
  onPressHunter,
}: CommunityHunterFeedCardProps): JSX.Element | null {
  const row = feed.clicks[0];
  if (!row) return null;

  const { hunter } = feed;
  const imageUrl =
    row.feedItem.images.imageUrlHostedByUs ||
    row.feedItem.images.mainImageUrl.imageUrl;
  const cityShort = hunter.city.split(",")[0] ?? hunter.city;

  return (
    <Accordion selectionMode="single" variant="default" hideSeparator>
      <Accordion.Item value={`${hunter.id}-details`}>
        <View className="flex-row items-center gap-3 px-4 py-2">
          <PressableFeedback
            onPress={() => onPressListing(row.feedItem.id)}
            animation={{ scale: { value: 0.97 } }}
          >
            <StyledImage
              source={{ uri: imageUrl }}
              className="h-14 w-14 rounded-md bg-surface-secondary"
              contentFit="cover"
            />
          </PressableFeedback>

          <PressableFeedback
            onPress={() => onPressListing(row.feedItem.id)}
            className="min-w-0 flex-1 gap-0.5"
          >
            <Typography type="body-sm" weight="semibold" numberOfLines={1}>
              {row.feedItem.title}
            </Typography>
            <Typography type="body-xs" className="text-muted" numberOfLines={1}>
              {hunter.displayName}
              {" · "}
              {formatPrice(row.feedItem.price, row.feedItem.currencySymbol)}
              {" · "}
              {formatDaysAgo(row.event.daysAgo)}
            </Typography>
            {isHunterOnline(hunter) ? (
              <View className="mt-0.5 self-start">
                <CommunityActiveBadge />
              </View>
            ) : null}
          </PressableFeedback>

          <Accordion.Trigger className="items-center justify-center py-0 pl-1">
            <Accordion.Indicator />
          </Accordion.Trigger>
        </View>

        <Accordion.Content className="px-4 pb-3 pt-0">
          <View className="gap-2 rounded-xl bg-surface-secondary/50 px-3 py-2.5">
            <View className="flex-row gap-2">
              <Kpi label="Clicks" value={String(hunter.clicksYesterday)} />
              {isHunterOnline(hunter) ? (
                <View className="min-w-0 flex-1 items-center gap-0.5 py-1">
                  <CommunityActiveBadge />
                  <Typography type="body-xs" className="text-[10px] text-muted">
                    Last online
                  </Typography>
                </View>
              ) : (
                <Kpi label="Last online" value={hunter.lastOnlineLabel} />
              )}
              <Kpi label="City" value={cityShort} />
            </View>
            <Button
              variant="secondary"
              size="sm"
              className="h-8"
              onPress={() => onPressHunter(hunter.id)}
            >
              See profile
            </Button>
          </View>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion>
  );
}

function Kpi({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <View className="min-w-0 flex-1 items-center gap-0.5 py-1">
      <Typography type="body-sm" weight="semibold" numberOfLines={1}>
        {value}
      </Typography>
      <Typography type="body-xs" className="text-[10px] text-muted">
        {label}
      </Typography>
    </View>
  );
}
