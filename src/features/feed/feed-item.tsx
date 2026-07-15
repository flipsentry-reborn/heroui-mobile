import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import type { JSX } from "react";
import { View } from "react-native";
import { Card, Chip, PressableFeedback, Typography } from "heroui-native";

import PlatformIcon from "@/components/icons/PlatformIcon";
import { GlassSurface } from "@/components/ui/glass-surface";
import { ValuationBadge } from "@/features/feed/valuation-badge";
import {
  getOrderedStatusBadges,
  type FeedItem as FeedModel,
} from "@/models/feed";

/** Feed density: ~20% tighter than original. */
const IMAGE_H = 134;

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
      className="mb-2 flex-1 px-1"
      animation={{ scale: { value: 0.98 } }}
    >
      <Card
        variant="secondary"
        className="flex-1 gap-0 overflow-hidden rounded-xl border border-white/12 bg-[#181818]/85 p-0"
      >
        <View className="relative">
          <Image
            source={{ uri: imageUrl }}
            style={{ width: "100%", height: IMAGE_H, backgroundColor: "#282828" }}
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
                color="#fff"
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

        {/* flex-1: fills leftover height so row bottoms align without empty solid gap */}
        <GlassSurface intensity="feed" bordered={false} className="relative min-h-[72px] flex-1">
          <Card.Body className="flex-1 justify-between gap-0.5 px-2 pb-2 pt-1.5">
            <View className="gap-0.5">
              <View className="flex-row items-baseline gap-1">
                <Typography
                  type="body-sm"
                  weight="bold"
                  className="text-[15px] leading-[18px] text-foreground"
                >
                  {formatPrice(feed.price, feed.currencySymbol)}
                </Typography>
                {feed.valuation?.fairPrice != null ? (
                  <Typography type="body-xs" className="text-[10px] text-muted">
                    Est. {formatPrice(feed.valuation.fairPrice, feed.currencySymbol)}
                  </Typography>
                ) : null}
              </View>

              <Card.Title
                className="min-h-[28px] text-[11px] leading-[14px] text-foreground"
                numberOfLines={2}
              >
                {feed.title}
              </Card.Title>
            </View>

            <View className="mt-0.5 flex-row items-center gap-0.5">
              {distance ? (
                <Typography type="body-xs" className="text-[10px] text-muted">
                  {distance}
                </Typography>
              ) : null}
              {distance ? (
                <Typography type="body-xs" className="text-[10px] text-muted">
                  ·
                </Typography>
              ) : null}
              <Typography
                type="body-xs"
                className="flex-1 text-[10px] text-muted"
                numberOfLines={1}
              >
                {feed.locationText}
              </Typography>
            </View>
          </Card.Body>
        </GlassSurface>
      </Card>
    </PressableFeedback>
  );
}
