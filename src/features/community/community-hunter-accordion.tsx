import { Image } from "expo-image";
import type { JSX } from "react";
import { View } from "react-native";
import {
  Accordion,
  Chip,
  PressableFeedback,
  Typography,
} from "heroui-native";
import { withUniwind } from "uniwind";

import { CommunityHunterAvatar } from "@/features/community/community-hunter-avatar";
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

interface CommunityHunterAccordionProps {
  feeds: CommunityHunterFeed[];
  onPressListing: (feedItemId: string) => void;
  onPressHunter: (hunterId: string) => void;
}

const PREVIEW_COUNT = 3;

export function CommunityHunterAccordion({
  feeds,
  onPressListing,
  onPressHunter,
}: CommunityHunterAccordionProps): JSX.Element {
  return (
    <Accordion
      selectionMode="single"
      variant="surface"
      className="gap-2 px-3"
    >
      {feeds.map((feed) => {
        const { hunter, clicks } = feed;
        const preview = clicks.slice(0, PREVIEW_COUNT);
        const hasMore = clicks.length > PREVIEW_COUNT;

        return (
          <Accordion.Item key={hunter.id} value={hunter.id}>
            <Accordion.Trigger className="gap-2 px-3 py-2.5">
              <View className="min-w-0 flex-1 flex-row items-center gap-2.5">
                <CommunityHunterAvatar hunter={hunter} size="md" />
                <View className="min-w-0 flex-1">
                  <Typography type="body-sm" weight="semibold" numberOfLines={1}>
                    {hunter.displayName}
                  </Typography>
                  <Typography type="body-xs" className="text-muted" numberOfLines={1}>
                    {clicks.length} click{clicks.length === 1 ? "" : "s"}
                    {preview[0]
                      ? ` · ${formatDaysAgo(preview[0].event.daysAgo)}`
                      : ""}
                  </Typography>
                </View>
                {preview[0] ? (
                  <StyledImage
                    source={{
                      uri:
                        preview[0].feedItem.images.imageUrlHostedByUs ||
                        preview[0].feedItem.images.mainImageUrl.imageUrl,
                    }}
                    className="h-12 w-12 rounded-lg bg-surface-secondary"
                    contentFit="cover"
                  />
                ) : (
                  <Chip size="sm" variant="secondary">
                    <Chip.Label className="text-[10px] text-muted">
                      {clicks.length}
                    </Chip.Label>
                  </Chip>
                )}
              </View>
              <Accordion.Indicator />
            </Accordion.Trigger>

            <Accordion.Content className="gap-2 px-3 pb-3 pt-0">
              {preview.map((row) => {
                const imageUrl =
                  row.feedItem.images.imageUrlHostedByUs ||
                  row.feedItem.images.mainImageUrl.imageUrl;
                return (
                  <PressableFeedback
                    key={row.event.id}
                    onPress={() => onPressListing(row.feedItem.id)}
                    animation={{ scale: { value: 0.98 } }}
                  >
                    <View className="flex-row items-center gap-2.5 rounded-xl bg-surface-secondary/80 px-2 py-2">
                      <StyledImage
                        source={{ uri: imageUrl }}
                        className="h-14 w-14 rounded-lg bg-surface"
                        contentFit="cover"
                      />
                      <View className="min-w-0 flex-1 gap-0.5">
                        <Typography type="body-sm" numberOfLines={1}>
                          {row.feedItem.title}
                        </Typography>
                        <Typography type="body-xs" className="text-muted" numberOfLines={1}>
                          {formatPrice(
                            row.feedItem.price,
                            row.feedItem.currencySymbol,
                          )}
                          {"  ·  "}
                          {formatDaysAgo(row.event.daysAgo)}
                        </Typography>
                      </View>
                    </View>
                  </PressableFeedback>
                );
              })}

              <PressableFeedback
                onPress={() => onPressHunter(hunter.id)}
                className="items-center py-2"
              >
                <Typography type="body-sm" className="text-accent">
                  {hasMore
                    ? `See all (${clicks.length})`
                    : "See profile"}
                </Typography>
              </PressableFeedback>
            </Accordion.Content>
          </Accordion.Item>
        );
      })}
    </Accordion>
  );
}
