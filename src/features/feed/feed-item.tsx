import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import type { JSX } from "react";
import { View } from "react-native";
import { Card, Chip, PressableFeedback, Typography, useThemeColor } from "heroui-native";

import PlatformIcon from "@/components/icons/PlatformIcon";
import { ValuationBadge } from "@/features/feed/valuation-badge";
import {
  getOrderedStatusBadges,
  type FeedItem as FeedModel,
} from "@/models/feed";

const IMAGE_H = 168;

interface FeedItemProps {
  feed: FeedModel;
  onPress?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
}

function formatPrice(price: number, symbol: string): string {
  const formatted = Math.round(price)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${symbol}${formatted}`;
}

export function FeedItem({ feed, onPress, onToggleFavorite }: FeedItemProps): JSX.Element {
  const [surfaceSecondary, accentForeground] = useThemeColor([
    "surface-secondary",
    "accent-foreground",
  ]);
  const imageUrl =
    feed.images.imageUrlHostedByUs ||
    feed.images.mainImageUrl.imageUrl ||
    feed.images.marketplaceImages[0]?.imageUrl;
  const statusBadges = getOrderedStatusBadges(feed);
  const distance =
    feed.distanceMiles != null ? `${feed.distanceMiles.toFixed(1)} mi` : null;

  return (
    <PressableFeedback
      onPress={() => onPress?.(feed.id)}
      className="mb-1.5 flex-1 px-0.5"
      animation={{ scale: { value: 0.98 } }}
    >
      <Card
        variant="transparent"
        className="flex-1 gap-0 overflow-hidden rounded-xl border-0 bg-background p-0"
      >
        <View className="relative">
          <Image
            source={{ uri: imageUrl }}
            style={{ width: "100%", height: IMAGE_H, backgroundColor: surfaceSecondary }}
            contentFit="cover"
            transition={180}
          />

          <View className="absolute left-1.5 top-1.5 flex-row items-center gap-1">
            <PressableFeedback
              accessibilityLabel={feed.isFavorite ? "Unfavorite" : "Favorite"}
              onPress={() => onToggleFavorite?.(feed.id)}
              className={
                feed.isFavorite
                  ? "h-7 w-7 items-center justify-center rounded-full border border-accent bg-accent"
                  : "h-7 w-7 items-center justify-center rounded-full border border-white/25 bg-black/55"
              }
              animation={{ scale: { value: 0.9 } }}
            >
              <Ionicons
                name={feed.isFavorite ? "star" : "star-outline"}
                size={12}
                color={feed.isFavorite ? accentForeground : "#fff"}
              />
            </PressableFeedback>
            <PlatformIcon platform={feed.platform} size={18} />
          </View>

          {(feed.valuation?.calculated || statusBadges.length > 0) && (
            <View className="absolute bottom-1.5 left-1.5 right-1.5 flex-row flex-wrap gap-0.5">
              {feed.valuation?.calculated ? (
                <ValuationBadge buySignal={feed.valuation.buySignal} />
              ) : null}
              {statusBadges.slice(0, 2).map((badge) => (
                <Chip
                  key={badge}
                  size="sm"
                  variant="soft"
                  color={badge === "Dealer" || badge === "Spam" ? "danger" : "warning"}
                  className="bg-black/60"
                >
                  <Chip.Label className="text-[9px] text-white">{badge}</Chip.Label>
                </Chip>
              ))}
            </View>
          )}
        </View>

        {/* Exactly 3 rows: price, title (ellipsis), meta */}
        <Card.Body className="gap-0.5 bg-background px-1.5 pb-1.5 pt-1">
          <View className="flex-row items-baseline gap-1.5">
            <Typography
              type="body-sm"
              weight="semibold"
              className="text-[15px] leading-5 text-foreground"
              numberOfLines={1}
            >
              {formatPrice(feed.price, feed.currencySymbol)}
            </Typography>
            {feed.valuation?.fairPrice != null ? (
              <Typography
                type="body-xs"
                className="text-xs text-muted"
                numberOfLines={1}
              >
                Est. {formatPrice(feed.valuation.fairPrice, feed.currencySymbol)}
              </Typography>
            ) : null}
          </View>

          <Typography
            type="body-sm"
            className="text-sm font-normal leading-5 text-foreground"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {feed.title}
          </Typography>

          <View className="flex-row items-center gap-1">
            {distance ? (
              <Typography type="body-xs" className="text-xs text-muted" numberOfLines={1}>
                {distance}
              </Typography>
            ) : null}
            {distance ? (
              <Typography type="body-xs" className="text-xs text-muted">
                ·
              </Typography>
            ) : null}
            <Typography
              type="body-xs"
              className="flex-1 text-xs text-muted"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {feed.locationText}
            </Typography>
          </View>
        </Card.Body>
      </Card>
    </PressableFeedback>
  );
}
