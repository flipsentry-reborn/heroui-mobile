import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import type { JSX } from "react";
import { View } from "react-native";
import { Card, PressableFeedback, Typography, useThemeColor } from "heroui-native";

import PlatformIcon from "@/components/icons/PlatformIcon";
import {
  StatusBadge,
  ValuationBadge,
} from "@/features/feed/feed-badge";
import type { DistanceUnit } from "@/mocks/data/settings";
import { getDistanceUnitSync } from "@/mocks/services/settings";
import {
  getOrderedStatusBadges,
  isCarListing,
  type FeedItem as FeedModel,
} from "@/models/feed";

const IMAGE_H_GRID = 168;
const IMAGE_H_RAIL = 128;
const RAIL_WIDTH = 156;
/** Featured shelves (e.g. Top Rated) render ~7% larger. */
const FEATURED_SCALE = 1.07;
const MILES_TO_KM = 1.60934;

interface FeedItemProps {
  feed: FeedModel;
  onPress?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  /** grid = 2-col feed; rail = horizontal For You shelf card */
  layout?: "grid" | "rail";
  /** Slightly larger rail cards for featured shelves. */
  featured?: boolean;
}

function formatPrice(price: number, symbol: string): string {
  const formatted = Math.round(price)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${symbol}${formatted}`;
}

/** Vehicle odometer from stored miles, labeled by user distance preference. */
function formatVehicleMileage(
  miles: number,
  unit: DistanceUnit,
): string {
  const value =
    unit === "km" ? Math.round(miles * MILES_TO_KM) : Math.round(miles);
  const label = unit === "km" ? "km" : "mi";
  return `${value.toLocaleString()} ${label}`;
}

function feedMetaLine(feed: FeedModel, unit: DistanceUnit): string {
  const location = feed.locationText?.trim() || "";
  if (isCarListing(feed)) {
    const miles =
      feed.vehicleSpecifications?.vehicleMileage ?? feed.valuation?.mileage;
    if (miles != null && miles > 0) {
      const mileage = formatVehicleMileage(miles, unit);
      return location ? `${mileage} · ${location}` : mileage;
    }
  }
  return location;
}

export function FeedItem({
  feed,
  onPress,
  onToggleFavorite,
  layout = "grid",
  featured = false,
}: FeedItemProps): JSX.Element {
  const [surfaceSecondary, accentForeground] = useThemeColor([
    "surface-secondary",
    "accent-foreground",
  ]);
  const imageUrl =
    feed.images.imageUrlHostedByUs ||
    feed.images.mainImageUrl.imageUrl ||
    feed.images.marketplaceImages[0]?.imageUrl;
  const statusBadges = getOrderedStatusBadges(feed);
  const meta = feedMetaLine(feed, getDistanceUnitSync());
  const isRail = layout === "rail";
  const scale = isRail && featured ? FEATURED_SCALE : 1;
  const railW = Math.round(RAIL_WIDTH * scale);
  const imageH = isRail
    ? Math.round(IMAGE_H_RAIL * scale)
    : IMAGE_H_GRID;

  return (
    <PressableFeedback
      onPress={() => onPress?.(feed.id)}
      className={isRail ? "mr-2" : "mb-1.5 flex-1 px-0.5"}
      style={isRail ? { width: railW } : undefined}
      animation={{ scale: { value: 0.98 } }}
    >
      <Card
        variant="transparent"
        className={`${isRail ? "" : "flex-1 "}gap-0 overflow-hidden rounded-xl border-0 ${
          featured ? "bg-transparent" : "bg-background"
        } p-0`}
      >
        <View className="relative">
          <Image
            source={{ uri: imageUrl }}
            style={{ width: "100%", height: imageH, backgroundColor: surfaceSecondary }}
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
            <View className="absolute bottom-1.5 left-1.5 right-1.5 flex-row flex-wrap gap-1">
              {feed.valuation?.calculated ? (
                <ValuationBadge buySignal={feed.valuation.buySignal} />
              ) : null}
              {statusBadges.slice(0, 2).map((badge) => (
                <StatusBadge key={badge} label={badge} />
              ))}
            </View>
          )}
        </View>

        {/* Exactly 3 rows: price, title (ellipsis), meta */}
        <Card.Body
          className={`gap-0.5 px-1.5 pb-1.5 pt-1 ${
            featured ? "bg-transparent" : "bg-background"
          }`}
        >
          <View className="flex-row items-baseline gap-1.5">
            <Typography
              type="body-sm"
              weight="semibold"
              className={`${
                featured ? "text-[16px]" : "text-[15px]"
              } leading-5 text-foreground`}
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
            className={`${
              featured ? "text-[15px]" : "text-sm"
            } font-normal leading-5 text-foreground`}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {feed.title}
          </Typography>

          {meta ? (
            <Typography
              type="body-xs"
              className="text-xs text-muted"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {meta}
            </Typography>
          ) : null}
        </Card.Body>
      </Card>
    </PressableFeedback>
  );
}
