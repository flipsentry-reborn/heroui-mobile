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
import {
  SOLD_STATUS_COLOR,
  SOLD_STATUS_TEXT_CLASS,
} from "@/features/feed/sold-status";
import { formatOdometerCompact } from "@/lib/distance-utils";
import { getDistanceUnitSync } from "@/mocks/services/settings";
import {
  getOrderedStatusBadges,
  type FeedItem as FeedModel,
} from "@/models/feed";

/**
 * Image sizing is layout-split so For You shelves can grow without
 * affecting category / grid feed cards:
 * - grid  → IMAGE_H_GRID (2-col pages, detail similar, etc.)
 * - rail  → IMAGE_H_RAIL + RAIL_WIDTH (For You horizontal shelves)
 * - featured shelves also multiply rail by FEATURED_SCALE (~7%)
 */
const IMAGE_H_GRID = 168;
/** Wider rail cards for For You shelves (not square). */
const IMAGE_H_RAIL = 142;
const RAIL_WIDTH = 200;
/** Featured shelves (e.g. Top Rated) render ~7% larger. */
const FEATURED_SCALE = 1.07;

interface FeedItemProps {
  feed: FeedModel;
  onPress?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  /** grid = 2-col feed; rail = horizontal For You shelf card */
  layout?: "grid" | "rail";
  /** Slightly larger rail cards for featured shelves. */
  featured?: boolean;
  /** Small label on the image (e.g. Community “2 days ago”). */
  imageCornerLabel?: string;
  imageCornerSide?: "left" | "right";
  /** Hide the favorite star (e.g. Community profile grid). */
  hideFavorite?: boolean;
}

function formatPrice(price: number, symbol: string): string {
  const formatted = Math.round(price)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${symbol}${formatted}`;
}

export function FeedItem({
  feed,
  onPress,
  onToggleFavorite,
  layout = "grid",
  featured = false,
  imageCornerLabel,
  imageCornerSide = "right",
  hideFavorite = false,
}: FeedItemProps): JSX.Element {
  const [surfaceSecondary] = useThemeColor(["surface-secondary"]);
  const imageUrl =
    feed.images.imageUrlHostedByUs ||
    feed.images.mainImageUrl.imageUrl ||
    feed.images.marketplaceImages[0]?.imageUrl;
  const statusBadges = getOrderedStatusBadges(feed);
  const distanceUnit = getDistanceUnitSync();
  const rawMileage = feed.vehicleSpecifications?.vehicleMileage;
  const mileageText =
    rawMileage != null
      ? formatOdometerCompact(rawMileage, distanceUnit)
      : null;
  const primaryLocation = feed.locationText?.split(",")[0]?.trim() || null;
  const isRail = layout === "rail";
  const scale = isRail && featured ? FEATURED_SCALE : 1;
  const railW = Math.round(RAIL_WIDTH * scale);
  const imageH = isRail
    ? Math.round(IMAGE_H_RAIL * scale)
    : IMAGE_H_GRID;

  /** Rail (For You) slightly compact; grid category pages keep fuller type. */
  const priceClass = isRail
    ? featured
      ? "text-[14px] leading-[18px]"
      : "text-[13px] leading-[18px]"
    : featured
      ? "text-[16px] leading-5"
      : "text-[15px] leading-5";
  const titleClass = isRail
    ? featured
      ? "text-[13px] leading-[17px]"
      : "text-[12px] leading-4"
    : featured
      ? "text-[15px] leading-5"
      : "text-sm leading-5";
  const metaClass = isRail ? "text-[11px] leading-[14px]" : "text-xs";
  const estClass = isRail
    ? "text-[10px] text-muted"
    : "text-[11px] text-muted";
  const dimClass = "text-muted";
  const platformSize = isRail ? 13 : 14;

  return (
    <PressableFeedback
      onPress={() => onPress?.(feed.id)}
      className={isRail ? "mr-1.5" : "mb-0.5 flex-1 px-0.5"}
      style={isRail ? { width: railW } : undefined}
      animation={{ scale: { value: 0.98 } }}
    >
      <Card
        variant="transparent"
        className={`${isRail ? "" : "flex-1 "}gap-0 overflow-hidden rounded-lg border-0 ${
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

          {!hideFavorite ? (
            <PressableFeedback
              accessibilityLabel={feed.isFavorite ? "Unfavorite" : "Favorite"}
              onPress={() => onToggleFavorite?.(feed.id)}
              className={
                feed.isFavorite
                  ? "absolute right-1.5 top-1.5 h-7 w-7 items-center justify-center rounded-full bg-white/20"
                  : "absolute right-1.5 top-1.5 h-7 w-7 items-center justify-center rounded-full bg-white/10"
              }
              animation={{ scale: { value: 0.9 } }}
            >
              <Ionicons
                name={feed.isFavorite ? "star" : "star-outline"}
                size={13}
                color="rgba(255,255,255,0.95)"
              />
            </PressableFeedback>
          ) : null}

          {(feed.valuation?.calculated || statusBadges.length > 0) && (
            <View
              className={`absolute bottom-[5px] left-[5px] flex-row flex-wrap gap-[3px] ${
                imageCornerLabel ? "right-16" : "right-[5px]"
              }`}
            >
              {feed.valuation?.calculated ? (
                <ValuationBadge buySignal={feed.valuation.buySignal} />
              ) : null}
              {statusBadges.slice(0, 2).map((badge) => (
                <StatusBadge key={badge} label={badge} />
              ))}
            </View>
          )}

          {imageCornerLabel ? (
            <View
              className={`absolute bottom-[5px] rounded-md bg-black/55 px-1.5 py-0.5 ${
                imageCornerSide === "left" ? "left-[5px]" : "right-[5px]"
              }`}
            >
              <Typography type="body-xs" className="text-[10px] text-white">
                {imageCornerLabel}
              </Typography>
            </View>
          ) : null}
        </View>

        {/* Exactly 3 rows: price, title (ellipsis), meta */}
        <Card.Body
          className={`gap-0.5 px-1.5 pb-1.5 pt-1 ${
            featured ? "bg-transparent" : "bg-background"
          }`}
        >
          <View className="flex-row items-center gap-1">
            <Typography
              type="body-sm"
              weight="bold"
              className={`${priceClass} text-foreground`}
              numberOfLines={1}
            >
              {formatPrice(feed.price, feed.currencySymbol)}
            </Typography>
            {feed.valuation?.fairPrice != null ? (
              <Typography
                type="body-xs"
                className={estClass}
                numberOfLines={1}
              >
                → {formatPrice(feed.valuation.fairPrice, feed.currencySymbol)}
              </Typography>
            ) : null}
          </View>

          <Typography
            type="body-sm"
            className={`${titleClass} font-normal text-foreground`}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {feed.isSold ? (
              <Typography
                type="body-sm"
                weight="semibold"
                className={`${titleClass} ${SOLD_STATUS_TEXT_CLASS}`}
                style={{ color: SOLD_STATUS_COLOR }}
              >
                Sold{" "}
              </Typography>
            ) : feed.isPending ? (
              <Typography
                type="body-sm"
                weight="semibold"
                className={`${titleClass} ${SOLD_STATUS_TEXT_CLASS}`}
                style={{ color: SOLD_STATUS_COLOR }}
              >
                Pending{" "}
              </Typography>
            ) : null}
            {feed.title}
          </Typography>

          <View className="min-w-0 flex-row items-center gap-1">
            {mileageText ? (
              <Typography
                type="body-xs"
                className={`shrink-0 ${dimClass} ${metaClass}`}
                numberOfLines={1}
              >
                {mileageText}
              </Typography>
            ) : null}
            {mileageText && primaryLocation ? (
              <Typography
                type="body-xs"
                className={`${dimClass} ${metaClass}`}
              >
                ·
              </Typography>
            ) : null}
            {primaryLocation ? (
              <Typography
                type="body-xs"
                className={`min-w-0 flex-1 ${dimClass} ${metaClass}`}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {primaryLocation}
              </Typography>
            ) : (
              <View className="min-w-0 flex-1" />
            )}
            <PlatformIcon platform={feed.platform} size={platformSize} />
          </View>
        </Card.Body>
      </Card>
    </PressableFeedback>
  );
}
