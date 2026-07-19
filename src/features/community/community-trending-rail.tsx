import { Image } from "expo-image";
import type { JSX } from "react";
import { ScrollView, View } from "react-native";
import { PressableFeedback, Typography } from "heroui-native";
import { withUniwind } from "uniwind";

import type { CommunityTrendingRow } from "@/mocks/services/community";

const StyledImage = withUniwind(Image);

function formatPrice(price: number, symbol: string): string {
  const formatted = Math.round(price)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${symbol}${formatted}`;
}

interface CommunityTrendingRailProps {
  rows: CommunityTrendingRow[];
  onPressListing: (feedItemId: string) => void;
}

/** Spotify “album shelf” — large square covers, title under art. */
export function CommunityTrendingRail({
  rows,
  onPressListing,
}: CommunityTrendingRailProps): JSX.Element {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-4 px-4"
    >
      {rows.map((row) => {
        const { feedItem, trending } = row;
        const imageUrl =
          feedItem.images.imageUrlHostedByUs ||
          feedItem.images.mainImageUrl.imageUrl;
        return (
          <PressableFeedback
            key={feedItem.id}
            onPress={() => onPressListing(feedItem.id)}
            className="w-[148px]"
            animation={{ scale: { value: 0.97 } }}
          >
            <StyledImage
              source={{ uri: imageUrl }}
              className="mb-2 h-[148px] w-[148px] rounded-md bg-surface-secondary"
              contentFit="cover"
            />
            <Typography type="body-sm" weight="semibold" numberOfLines={2}>
              {feedItem.title}
            </Typography>
            <Typography type="body-xs" className="mt-0.5 text-muted" numberOfLines={1}>
              {formatPrice(feedItem.price, feedItem.currencySymbol)}
              {" · "}
              {trending.clickCount} clicks
            </Typography>
          </PressableFeedback>
        );
      })}
    </ScrollView>
  );
}
