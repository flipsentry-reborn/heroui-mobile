import { Ionicons } from "@expo/vector-icons";
import type { JSX } from "react";
import { useState } from "react";
import { View } from "react-native";
import Animated, { useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Avatar,
  Button,
  PressableFeedback,
  Typography,
  useThemeColor,
  useToast,
} from "heroui-native";

import PlatformIcon from "@/components/icons/PlatformIcon";
import { FeedDetailActions } from "@/features/feed/feed-detail-actions";
import { FeedDetailGallery } from "@/features/feed/feed-detail-gallery";
import { StatusBadge, ValuationBadge } from "@/features/feed/feed-badge";
import { FeedDetailScoreBar } from "@/features/feed/feed-detail-score-bar";
import { getOrderedStatusBadges, type FeedItem } from "@/models/feed";

function formatPrice(price: number, symbol: string): string {
  const formatted = Math.round(price)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${symbol}${formatted}`;
}

function formatTimeAgo(dateString: string): string {
  const diffMs = Math.max(0, Date.now() - new Date(dateString).getTime());
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function galleryUrls(item: FeedItem): string[] {
  const fromMarket = item.images.marketplaceImages.map((img) => img.imageUrl).filter(Boolean);
  if (fromMarket.length > 0) return fromMarket;
  const main = item.images.imageUrlHostedByUs || item.images.mainImageUrl.imageUrl;
  return main ? [main] : [];
}

interface FeedDetailProps {
  item: FeedItem;
  onBack: () => void;
  onToggleFavorite: () => void;
}

export function FeedDetail({ item, onBack, onToggleFavorite }: FeedDetailProps): JSX.Element {
  const insets = useSafeAreaInsets();
  const { toast } = useToast();
  const accentForeground = useThemeColor("accent-foreground");
  const [descExpanded, setDescExpanded] = useState(false);
  const scrollY = useSharedValue(0);
  const statusBadges = getOrderedStatusBadges(item);
  const images = galleryUrls(item);
  const description = item.description || "No description provided.";
  const longDesc = description.length > 160;

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
  });

  const mockAction = (label: string) => {
    toast.show({
      variant: "accent",
      label,
      description: "Mock only - no API in this build.",
      duration: 2800,
    });
  };

  const handleFavorite = () => {
    onToggleFavorite();
    toast.show({
      variant: "accent",
      label: item.isFavorite ? "Removed from saved" : "Saved",
      duration: 2200,
    });
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingBottom: insets.bottom }}>
      <Animated.ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 96 }}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        <View className="relative">
          <FeedDetailGallery images={images} scrollY={scrollY} />

          <PressableFeedback
            onPress={onBack}
            accessibilityLabel="Go back"
            className="absolute left-4 z-10 h-10 w-10 items-center justify-center rounded-full bg-black/55"
            style={{ top: insets.top + 8 }}
            animation={{ scale: { value: 0.92 } }}
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </PressableFeedback>

          {item.valuation?.calculated || statusBadges.length > 0 ? (
            <View
              className="absolute left-1.5 right-1.5 flex-row flex-wrap gap-1"
              style={{ bottom: images.length > 1 ? 70 : 6 }}
            >
              {item.valuation?.calculated ? (
                <ValuationBadge buySignal={item.valuation.buySignal} scale="detail" />
              ) : null}
              {statusBadges.slice(0, 2).map((label) => (
                <StatusBadge key={label} label={label} scale="detail" />
              ))}
            </View>
          ) : null}
        </View>

        <View className="px-4 pt-4">
          <View className="gap-2">
            <View className="flex-row flex-wrap items-center gap-2">
              <Typography
                type="body-sm"
                weight="semibold"
                className="text-[22px] leading-7 text-foreground"
              >
                {formatPrice(item.price, item.currencySymbol)}
              </Typography>
              {item.valuation?.fairPrice != null ? (
                <Typography type="body-xs" className="text-xs text-muted">
                  Est. {formatPrice(item.valuation.fairPrice, item.currencySymbol)}
                </Typography>
              ) : null}
            </View>

            <Typography
              type="body-sm"
              className="text-[15px] font-normal leading-5 text-foreground"
            >
              {item.title}
            </Typography>

            {item.valuation?.calculated ? (
              <FeedDetailScoreBar
                buySignal={item.valuation.buySignal}
                valuationType={item.valuation.valuationType}
                iphoneModel={item.valuation.iphoneModel}
                storageGb={item.valuation.storageGb}
                batteryHealth={item.valuation.batteryHealth}
                compCount={item.valuation.compCount}
              />
            ) : null}

            {(item.vehicleSpecifications?.vehicleMileage ||
              item.vehicleSpecifications?.vehicleTransmission) && (
              <Typography type="body-sm" className="text-[13px] leading-5 text-foreground">
                {item.vehicleSpecifications.vehicleMileage != null
                  ? `Mileage: ${item.vehicleSpecifications.vehicleMileage.toLocaleString()} mi`
                  : null}
                {item.vehicleSpecifications.vehicleMileage != null &&
                item.vehicleSpecifications.vehicleTransmission
                  ? " · "
                  : null}
                {item.vehicleSpecifications.vehicleTransmission
                  ? `Transmission: ${item.vehicleSpecifications.vehicleTransmission}`
                  : null}
              </Typography>
            )}

            {item.creationTime ? (
              <Typography type="body-xs" className="text-xs text-muted">
                Posted {formatTimeAgo(item.creationTime)} ago ·{" "}
                {new Date(item.creationTime).toLocaleString(undefined, {
                  day: "numeric",
                  month: "short",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </Typography>
            ) : null}

            <View className="flex-row items-center gap-2">
              <PlatformIcon platform={item.platform} size={18} />
              <Typography type="body-sm" className="flex-1 text-[13px] text-muted">
                {item.locationText}
                {item.distanceMiles != null ? ` · ${item.distanceMiles.toFixed(1)} mi` : ""}
              </Typography>
            </View>
          </View>

          {item.seller ? (
            <View className="mt-6 flex-row items-center gap-3">
              <Avatar size="md" alt={item.seller.name}>
                {item.seller.avatarUrl ? (
                  <Avatar.Image source={{ uri: item.seller.avatarUrl }} />
                ) : null}
                <Avatar.Fallback />
              </Avatar>
              <View className="min-w-0 flex-1 gap-0.5">
                <Typography
                  type="body-sm"
                  weight="semibold"
                  className="text-[15px] text-foreground"
                  numberOfLines={1}
                >
                  {item.seller.name}
                </Typography>
                <View className="flex-row flex-wrap items-center gap-1">
                  {item.seller.ratingAverage != null ? (
                    <Typography type="body-xs" className="text-xs text-muted">
                      ★ {item.seller.ratingAverage.toFixed(1)}
                      {item.seller.ratingCount != null ? ` (${item.seller.ratingCount})` : ""}
                    </Typography>
                  ) : null}
                  {item.seller.isAutosDealer ? (
                    <Typography type="body-xs" className="text-xs text-muted">
                      · Dealer
                    </Typography>
                  ) : null}
                </View>
              </View>
              <Button size="sm" variant="secondary" onPress={() => mockAction("Block seller")}>
                <Button.Label className="text-xs">Block</Button.Label>
              </Button>
            </View>
          ) : null}

          <View className="mt-4">
            <FeedDetailActions
              isFavorite={item.isFavorite}
              onSave={handleFavorite}
              onDelete={() => mockAction("Delete")}
              onShare={() => mockAction("Share")}
            />
          </View>

          <View className="mt-6 gap-2">
            <Typography type="body-sm" weight="semibold" className="text-[15px] text-foreground">
              Description
            </Typography>
            <Typography
              type="body-sm"
              className="text-sm font-normal leading-5 text-muted"
              numberOfLines={descExpanded || !longDesc ? undefined : 5}
            >
              {description}
            </Typography>
            {longDesc ? (
              <PressableFeedback
                onPress={() => setDescExpanded((v) => !v)}
                className="self-start py-1"
                animation={{ scale: { value: 0.98 } }}
              >
                <Typography
                  type="body-sm"
                  weight="semibold"
                  className="text-[13px] text-foreground"
                >
                  {descExpanded ? "Show less" : "Show more"}
                </Typography>
              </PressableFeedback>
            ) : null}
          </View>
        </View>
      </Animated.ScrollView>

      <View
        className="absolute inset-x-0 bottom-0 bg-background px-4 pt-2.5"
        style={{ paddingBottom: Math.max(insets.bottom, 10) }}
      >
        <Button
          variant="primary"
          className="min-h-11 w-full bg-accent"
          onPress={() => mockAction("View on Marketplace")}
        >
          <Ionicons name="open-outline" size={16} color={accentForeground} />
          <Button.Label className="text-sm text-accent-foreground">
            View on Marketplace
          </Button.Label>
        </Button>
      </View>
    </View>
  );
}
