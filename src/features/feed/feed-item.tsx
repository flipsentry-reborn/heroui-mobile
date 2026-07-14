import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import type { JSX } from "react";
import { StyleSheet, View } from "react-native";
import { Card, Chip, PressableFeedback, Typography } from "heroui-native";

import PlatformIcon from "@/components/icons/PlatformIcon";
import { ValuationBadge } from "@/features/feed/valuation-badge";
import {
  getOrderedStatusBadges,
  type FeedItem as FeedModel,
} from "@/models/feed";

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
      className="flex-1"
      style={styles.cell}
      animation={{ scale: { value: 0.98 } }}
    >
      <Card
        variant="secondary"
        className="flex-1 gap-0 overflow-hidden rounded-2xl border-0 p-0"
        style={styles.card}
      >
        <View className="relative">
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            contentFit="cover"
            transition={180}
          />

          <View className="absolute left-2 top-2 flex-row items-center gap-1.5">
            <PressableFeedback
              accessibilityLabel={feed.isFavorite ? "Unfavorite" : "Favorite"}
              onPress={() => onToggleFavorite?.(feed.id)}
              className="h-8 w-8 items-center justify-center rounded-full"
              style={feed.isFavorite ? styles.favOn : styles.favOff}
              animation={{ scale: { value: 0.9 } }}
            >
              <Ionicons
                name={feed.isFavorite ? "star" : "star-outline"}
                size={15}
                color="#fff"
              />
            </PressableFeedback>
            <PlatformIcon platform={feed.platform} size={22} />
          </View>

          {(feed.valuation?.calculated || statusBadges.length > 0) && (
            <View className="absolute bottom-2 left-2 right-2 flex-row flex-wrap gap-1">
              {feed.valuation?.calculated ? (
                <ValuationBadge buySignal={feed.valuation.buySignal} />
              ) : null}
              {statusBadges.slice(0, 2).map((badge) => (
                <Chip
                  key={badge}
                  size="sm"
                  variant="soft"
                  color={badge === "Dealer" || badge === "Spam" ? "danger" : "warning"}
                  style={styles.statusChip}
                >
                  <Chip.Label className="text-[10px]" style={styles.chipLabel}>
                    {badge}
                  </Chip.Label>
                </Chip>
              ))}
            </View>
          )}
        </View>

        <Card.Body className="gap-1 px-2.5 pb-3 pt-2">
          <View className="flex-row items-baseline gap-1.5">
            <Typography type="h6" weight="bold" className="text-foreground">
              {formatPrice(feed.price, feed.currencySymbol)}
            </Typography>
            {feed.valuation?.fairPrice != null ? (
              <Typography type="body-xs" className="text-muted">
                Est. {formatPrice(feed.valuation.fairPrice, feed.currencySymbol)}
              </Typography>
            ) : null}
          </View>

          <Card.Title className="text-[13px] leading-4 text-foreground" numberOfLines={2}>
            {feed.title}
          </Card.Title>

          <View className="mt-0.5 flex-row items-center gap-1">
            {distance ? (
              <Typography type="body-xs" className="text-muted">
                {distance}
              </Typography>
            ) : null}
            {distance ? (
              <Typography type="body-xs" className="text-muted">
                ·
              </Typography>
            ) : null}
            <Typography type="body-xs" className="flex-1 text-muted" numberOfLines={1}>
              {feed.locationText}
            </Typography>
          </View>
        </Card.Body>
      </Card>
    </PressableFeedback>
  );
}

const styles = StyleSheet.create({
  cell: {
    flex: 1,
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  card: {
    backgroundColor: "#181818",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.1)",
  },
  image: {
    width: "100%",
    height: 168,
    backgroundColor: "#282828",
  },
  favOn: {
    borderWidth: 1,
    borderColor: "#1DB954",
    backgroundColor: "#1DB954",
  },
  favOff: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  statusChip: {
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  chipLabel: {
    color: "#FFFFFF",
  },
});
