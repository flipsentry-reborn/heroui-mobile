import { Image } from "expo-image";
import type { JSX } from "react";
import { View } from "react-native";
import {
  Accordion,
  Button,
  PressableFeedback,
  Surface,
  Typography,
} from "heroui-native";
import { withUniwind } from "uniwind";

import { CommunityHunterAvatar } from "@/features/community/community-hunter-avatar";
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

/** Product-first card; simple accordion: Clicks / Last online / City. */
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
    <Surface className="overflow-hidden rounded-2xl p-0">
      <Accordion selectionMode="single" variant="default" hideSeparator>
        <Accordion.Item value={`${hunter.id}-details`}>
          <View className="flex-row">
            <PressableFeedback
              onPress={() => onPressListing(row.feedItem.id)}
              className="w-[38%]"
            >
              <StyledImage
                source={{ uri: imageUrl }}
                className="h-[108px] w-full bg-surface-secondary"
                contentFit="cover"
              />
            </PressableFeedback>

            <View className="w-[62%] justify-between gap-1 px-2.5 py-2">
              <PressableFeedback onPress={() => onPressHunter(hunter.id)}>
                <View className="flex-row items-center gap-1.5">
                  <CommunityHunterAvatar hunter={hunter} size="sm" />
                  <View className="min-w-0 flex-1">
                    <Typography
                      type="body-xs"
                      weight="semibold"
                      numberOfLines={1}
                    >
                      {hunter.displayName}
                    </Typography>
                    <Typography
                      type="body-xs"
                      className="text-[11px] text-muted"
                      numberOfLines={1}
                    >
                      @{hunter.handle}
                    </Typography>
                  </View>
                </View>
              </PressableFeedback>

              <PressableFeedback onPress={() => onPressListing(row.feedItem.id)}>
                <Typography type="body-xs" numberOfLines={1}>
                  {row.feedItem.title}
                </Typography>
                <Typography type="body-xs" className="text-[11px] text-muted">
                  {formatPrice(row.feedItem.price, row.feedItem.currencySymbol)}
                  {" · "}
                  {formatDaysAgo(row.event.daysAgo)}
                </Typography>
                {isHunterOnline(hunter) ? (
                  <View className="mt-1 self-start">
                    <CommunityActiveBadge />
                  </View>
                ) : null}
              </PressableFeedback>

              <Accordion.Trigger className="items-center justify-end gap-1 py-0">
                <Accordion.Indicator />
              </Accordion.Trigger>
            </View>
          </View>

          <Accordion.Content className="px-3 pb-2 pt-0.5">
            <View className="gap-1.5 rounded-xl bg-surface-secondary/60 px-2 py-2">
              <View className="flex-row gap-1">
                <Kpi
                  label="Clicks"
                  value={String(hunter.clicksYesterday)}
                />
                <Kpi label="Last online" value={hunter.lastOnlineLabel} />
                <Kpi label="City" value={cityShort} />
              </View>

              <Button
                variant="primary"
                size="sm"
                className="h-7"
                onPress={() => onPressHunter(hunter.id)}
              >
                See profile
              </Button>
            </View>
          </Accordion.Content>
        </Accordion.Item>
      </Accordion>
    </Surface>
  );
}

function Kpi({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <View className="min-w-0 flex-1 items-center rounded-md bg-surface px-1 py-1.5">
      <Typography type="body-xs" weight="semibold" numberOfLines={1}>
        {value}
      </Typography>
      <Typography type="body-xs" className="text-[10px] text-muted">
        {label}
      </Typography>
    </View>
  );
}
