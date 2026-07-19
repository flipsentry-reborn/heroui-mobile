import { Image } from "expo-image";
import type { JSX } from "react";
import { View } from "react-native";
import {
  Chip,
  PressableFeedback,
  Separator,
  Surface,
  Typography,
} from "heroui-native";
import { withUniwind } from "uniwind";

import PlatformIcon from "@/components/icons/PlatformIcon";
import { CommunityHunterAvatar } from "@/features/community/community-hunter-avatar";
import {
  formatDaysAgo,
  type CommunityActivityRow as Row,
} from "@/mocks/services/community";

const StyledImage = withUniwind(Image);

function formatPrice(price: number, symbol: string): string {
  const formatted = Math.round(price)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${symbol}${formatted}`;
}

function platformKey(platform: string): string {
  if (platform === "facebookMarketplace") return "facebook";
  return platform;
}

interface CommunityActivityRowProps {
  row: Row;
  onPressListing: (feedItemId: string) => void;
  onPressHunter: (hunterId: string) => void;
}

/**
 * Dense activity card: hunter details on top, listing summary below.
 * Image stays a modest thumb — not a full-bleed empty photo row.
 */
export function CommunityActivityRow({
  row,
  onPressListing,
  onPressHunter,
}: CommunityActivityRowProps): JSX.Element {
  const { hunter, feedItem, event } = row;
  const imageUrl =
    feedItem.images.imageUrlHostedByUs ||
    feedItem.images.mainImageUrl.imageUrl ||
    feedItem.images.marketplaceImages[0]?.imageUrl;

  return (
    <View className="mb-3 px-3">
      <Surface className="overflow-hidden rounded-2xl p-0">
        {/* Hunter */}
        <PressableFeedback
          onPress={() => onPressHunter(hunter.id)}
          className="px-3 py-3"
          animation={{ scale: { value: 0.99 } }}
        >
          <View className="flex-row items-start gap-3">
            <CommunityHunterAvatar hunter={hunter} size="md" />
            <View className="min-w-0 flex-1 gap-1">
              <View className="flex-row items-center gap-2">
                <Typography
                  type="body-sm"
                  weight="semibold"
                  className="min-w-0 flex-1"
                  numberOfLines={1}
                >
                  {hunter.displayName}
                </Typography>
                <Typography type="body-xs" className="text-muted">
                  {formatDaysAgo(event.daysAgo)}
                </Typography>
              </View>
              <Typography type="body-xs" className="text-muted" numberOfLines={1}>
                @{hunter.handle}
                {" · "}
                {hunter.city}
                {" · "}
                {hunter.lastOnlineLabel}
              </Typography>
              <View className="mt-0.5 flex-row flex-wrap gap-1.5">
                <Chip size="sm" variant="soft" color="accent">
                  <Chip.Label className="text-[10px]">
                    {hunter.clicksYesterday} clicks yesterday
                  </Chip.Label>
                </Chip>
                <Chip size="sm" variant="secondary">
                  <Chip.Label className="text-[10px] text-muted">
                    clicked this listing
                  </Chip.Label>
                </Chip>
              </View>
            </View>
          </View>
        </PressableFeedback>

        <Separator className="bg-muted/25" />

        {/* Listing */}
        <PressableFeedback
          onPress={() => onPressListing(feedItem.id)}
          className="px-3 py-3"
          animation={{ scale: { value: 0.99 } }}
        >
          <View className="flex-row gap-3">
            <StyledImage
              source={{ uri: imageUrl }}
              className="h-20 w-20 rounded-xl bg-surface-secondary"
              contentFit="cover"
            />
            <View className="min-w-0 flex-1 justify-center gap-1">
              <Typography type="body-sm" numberOfLines={2}>
                {feedItem.title}
              </Typography>
              <View className="flex-row items-center gap-2">
                <Typography type="body" weight="semibold">
                  {formatPrice(feedItem.price, feedItem.currencySymbol)}
                </Typography>
                <PlatformIcon
                  platform={platformKey(feedItem.platform)}
                  size={14}
                />
              </View>
              <Typography type="body-xs" className="text-muted" numberOfLines={1}>
                {feedItem.locationText}
                {feedItem.distanceMiles != null
                  ? ` · ${feedItem.distanceMiles.toFixed(1)} mi`
                  : ""}
              </Typography>
            </View>
          </View>
        </PressableFeedback>
      </Surface>
    </View>
  );
}
