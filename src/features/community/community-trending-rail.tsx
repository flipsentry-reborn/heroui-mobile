import { Image } from "expo-image";
import type { JSX } from "react";
import { ScrollView, View } from "react-native";
import { Chip, PressableFeedback, Typography } from "heroui-native";
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

export function CommunityTrendingRail({
  rows,
  onPressListing,
}: CommunityTrendingRailProps): JSX.Element {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="px-3"
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
            className="mr-2 w-[148px]"
            animation={{ scale: { value: 0.97 } }}
          >
            <View className="overflow-hidden rounded-xl bg-surface">
              <View className="relative">
                <StyledImage
                  source={{ uri: imageUrl }}
                  className="h-28 w-full bg-surface-secondary"
                  contentFit="cover"
                />
                <View className="absolute left-1.5 top-1.5">
                  <Chip size="sm" variant="secondary" className="bg-black/55">
                    <Chip.Label className="text-[10px] text-white">
                      {trending.clickCount} clicks
                    </Chip.Label>
                  </Chip>
                </View>
              </View>
              <View className="gap-0.5 px-2 py-1.5">
                <Typography type="body-xs" numberOfLines={2}>
                  {feedItem.title}
                </Typography>
                <Typography type="body-sm" weight="semibold">
                  {formatPrice(feedItem.price, feedItem.currencySymbol)}
                </Typography>
              </View>
            </View>
          </PressableFeedback>
        );
      })}
    </ScrollView>
  );
}
