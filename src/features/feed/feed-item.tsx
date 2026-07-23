import { Ionicons } from "@expo/vector-icons";
import { useRecyclingState } from "@shopify/flash-list";
import { Image } from "expo-image";
import type { JSX } from "react";
import { memo, useCallback } from "react";
import { View } from "react-native";
import {
  Card,
  PressableFeedback,
  Typography,
  useThemeColor,
} from "heroui-native";

import { AiEstimationIcon } from "@/components/icons/ai-estimation-icon";
import PlatformIcon from "@/components/icons/PlatformIcon";
import {
  StatusBadge,
  ValuationBadge,
} from "@/features/feed/feed-badge";
import { FeedDiagonalShimmer } from "@/features/feed/feed-diagonal-shimmer";
import {
  SOLD_STATUS_COLOR,
  SOLD_STATUS_TEXT_CLASS,
} from "@/features/feed/sold-status";
import { debugLog } from "@/lib/debug-log";
import { formatOdometerCompact } from "@/lib/distance-utils";
import { getDistanceUnitSync } from "@/mocks/services/settings";
import {
  getOrderedStatusBadges,
  resolveDisplayValuation,
  type FeedItem as FeedModel,
} from "@/models/feed";
import { useStore } from "@/store/store";

const FEED_OPEN_LOG = "FeedOpen";

/**
 * Image sizing is layout-split so For You shelves can grow without
 * affecting category / grid feed cards:
 * - grid  → IMAGE_H_GRID (2-col pages, detail similar, etc.)
 * - list  → IMAGE_H_LIST (1-col full-width cards)
 * - rail  → IMAGE_H_RAIL + RAIL_WIDTH (For You horizontal shelves)
 * - featured shelves also multiply rail by FEATURED_SCALE (~7%)
 */
const IMAGE_H_GRID = 168;
const IMAGE_H_LIST = 212;
/** Wider rail cards for For You shelves (not square). */
const IMAGE_H_RAIL = 142;
const RAIL_WIDTH = 200;
/** Featured shelves (e.g. Top Rated) render ~7% larger. */
const FEATURED_SCALE = 1.07;

interface FeedItemProps {
  feed: FeedModel;
  onPress?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  /** grid = 2-col feed; list = 1-col same card; rail = For You shelf */
  layout?: "grid" | "list" | "rail";
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

function FeedItemInner({
  feed,
  onPress,
  onToggleFavorite,
  layout = "grid",
  featured = false,
  imageCornerLabel,
  imageCornerSide = "right",
  hideFavorite = false,
}: FeedItemProps): JSX.Element {
  const { feedStore } = useStore();
  const [surfaceSecondary] = useThemeColor(["surface-secondary"]);
  // Reset when the recycled cell binds a different listing (or isNew flips).
  const [showNewShimmer, setShowNewShimmer] = useRecyclingState(
    Boolean(feed.isNew),
    [feed.id, feed.isNew],
  );
  const imageUrl =
    feed.images.marketplaceImages[0]?.imageUrl ||
    feed.images.mainImageUrl.imageUrl ||
    feed.images.imageUrlHostedByUs ||
    undefined;
  const statusBadges = getOrderedStatusBadges(feed);
  const valuation = resolveDisplayValuation(feed);
  const distanceUnit = getDistanceUnitSync();
  const rawMileage = feed.vehicleSpecifications?.vehicleMileage;
  const mileageText =
    rawMileage != null
      ? formatOdometerCompact(rawMileage, distanceUnit)
      : null;
  const primaryLocation = feed.locationText?.split(",")[0]?.trim() || null;
  const isRail = layout === "rail";
  const isList = layout === "list";
  const scale = isRail && featured ? FEATURED_SCALE : 1;
  const railW = Math.round(RAIL_WIDTH * scale);
  const imageH = isRail
    ? Math.round(IMAGE_H_RAIL * scale)
    : isList
      ? IMAGE_H_LIST
      : IMAGE_H_GRID;

  const handleShimmerDone = useCallback(() => {
    setShowNewShimmer(false);
    debugLog.info(FEED_OPEN_LOG, "shimmer done → clearNewFlag", {
      id: feed.id,
      t: Date.now(),
    });
    feedStore.clearNewFlag(feed.id);
  }, [feed.id, feedStore, setShowNewShimmer]);

  const handlePress = useCallback(() => {
    debugLog.info(FEED_OPEN_LOG, "card press", {
      id: feed.id,
      isNew: Boolean(feed.isNew),
      layout,
      t: Date.now(),
    });
    onPress?.(feed.id);
  }, [feed.id, feed.isNew, layout, onPress]);

  const handleToggleFavorite = useCallback(() => {
    onToggleFavorite?.(feed.id);
  }, [feed.id, onToggleFavorite]);

  /** Rail compact; list (1-col) larger; grid mid. */
  const priceClass = isRail
    ? featured
      ? "text-[14px] leading-[18px]"
      : "text-[13px] leading-[18px]"
    : isList
      ? "text-[17px] leading-6"
      : featured
        ? "text-[16px] leading-5"
        : "text-[15px] leading-5";
  const titleClass = isRail
    ? featured
      ? "text-[13px] leading-[17px]"
      : "text-[12px] leading-4"
    : isList
      ? "text-[15px] leading-5"
      : featured
        ? "text-[15px] leading-5"
        : "text-sm leading-5";
  const metaClass = isRail
    ? "text-[11px] leading-[14px]"
    : isList
      ? "text-[13px] leading-4"
      : "text-xs";
  const estClass = isRail
    ? "text-[10px] text-muted"
    : isList
      ? "text-[13px] text-muted"
      : "text-[11px] text-muted";
  const dimClass = "text-muted";
  const platformSize = isRail ? 13 : isList ? 16 : 14;
  const badgeScale = isList ? "detail" : "default";
  const favoriteSize = isList ? 15 : 13;
  const aiIconSize = isRail ? 15 : isList ? 18 : 16;

  return (
    <PressableFeedback
      onPress={handlePress}
      className={
        isRail
          ? "mr-1.5"
          : isList
            ? "mb-2.5 flex-1 px-px"
            : "mb-0.5 flex-1 px-px"
      }
      style={isRail ? { width: railW } : undefined}
      animation={{ scale: { value: 0.98 } }}
    >
      <Card
        variant="transparent"
        className={`${isRail ? "" : "flex-1 "}gap-0 overflow-visible rounded-none border-0 bg-transparent p-0`}
      >
        <View className="relative overflow-hidden rounded-lg">
          <Image
            source={{ uri: imageUrl }}
            style={{
              width: "100%",
              height: imageH,
              backgroundColor: surfaceSecondary,
            }}
            contentFit="cover"
            cachePolicy="memory-disk"
            recyclingKey={`${feed.id}:${imageUrl ?? ""}`}
            transition={180}
          />
          <FeedDiagonalShimmer
            // Remount when the recycled cell binds a new listing so the one-shot
            // animation can start again (internal startedRef would otherwise stick).
            key={feed.id}
            active={showNewShimmer}
            onDone={handleShimmerDone}
          />

          {!hideFavorite ? (
            <PressableFeedback
              accessibilityLabel={feed.isFavorite ? "Unfavorite" : "Favorite"}
              onPress={handleToggleFavorite}
              className={
                feed.isFavorite
                  ? `absolute right-1.5 top-1.5 items-center justify-center rounded-full bg-white/20 ${
                      isList ? "h-8 w-8" : "h-7 w-7"
                    }`
                  : `absolute right-1.5 top-1.5 items-center justify-center rounded-full bg-white/10 ${
                      isList ? "h-8 w-8" : "h-7 w-7"
                    }`
              }
              animation={{ scale: { value: 0.9 } }}
            >
              <Ionicons
                name={feed.isFavorite ? "star" : "star-outline"}
                size={favoriteSize}
                color="rgba(255,255,255,0.95)"
              />
            </PressableFeedback>
          ) : null}

          {(valuation?.calculated || statusBadges.length > 0) && (
            <View
              className={`absolute bottom-[5px] left-[5px] flex-row flex-wrap ${
                isList ? "gap-1" : "gap-[3px]"
              } ${imageCornerLabel ? "right-16" : "right-[5px]"}`}
            >
              {valuation?.calculated ? (
                <ValuationBadge
                  buySignal={valuation.buySignal}
                  scale={badgeScale}
                />
              ) : null}
              {statusBadges.slice(0, 2).map((badge) => (
                <StatusBadge key={badge} label={badge} scale={badgeScale} />
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

        <Card.Body
          className={`bg-transparent px-1.5 pb-1.5 pt-1 ${
            isList ? "gap-1" : "gap-0.5"
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
            {valuation?.fairPrice != null ? (
              <View className="min-w-0 flex-1 flex-row items-center gap-0.5">
                <AiEstimationIcon size={aiIconSize} />
                <Typography
                  type="body-xs"
                  className={`min-w-0 shrink ${estClass}`}
                  numberOfLines={1}
                >
                  Avg. {formatPrice(valuation.fairPrice, feed.currencySymbol)}
                </Typography>
              </View>
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

/** Stable props compare so FlashList parent re-renders skip unchanged cells. */
function feedItemPropsEqual(
  prev: FeedItemProps,
  next: FeedItemProps,
): boolean {
  return (
    prev.feed === next.feed &&
    prev.layout === next.layout &&
    prev.featured === next.featured &&
    prev.hideFavorite === next.hideFavorite &&
    prev.imageCornerLabel === next.imageCornerLabel &&
    prev.imageCornerSide === next.imageCornerSide &&
    prev.onPress === next.onPress &&
    prev.onToggleFavorite === next.onToggleFavorite
  );
}

export const FeedItem = memo(FeedItemInner, feedItemPropsEqual);
