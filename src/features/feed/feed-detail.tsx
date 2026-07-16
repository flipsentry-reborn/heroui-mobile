import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { JSX } from "react";
import { useEffect, useState } from "react";
import { View } from "react-native";
import Animated, { useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Avatar,
  Button,
  PressableFeedback,
  Separator,
  Typography,
  useToast,
} from "heroui-native";

import { FeedDetailActions } from "@/features/feed/feed-detail-actions";
import { FeedDetailGallery } from "@/features/feed/feed-detail-gallery";
import { StatusBadge, ValuationBadge } from "@/features/feed/feed-badge";
import { FeedDetailMetaSection } from "@/features/feed/feed-detail-meta";
import { FeedDetailScoreBar } from "@/features/feed/feed-detail-score-bar";
import {
  FeedDetailSimilarNearby,
  useSimilarNearbyFilters,
} from "@/features/feed/feed-detail-similar-nearby";
import { getLocalComps } from "@/mocks/services/feed";
import {
  getOrderedStatusBadges,
  isCarListing,
  type FeedItem,
  type FeedPlatform,
} from "@/models/feed";

const PLATFORM_CTA: Record<FeedPlatform, string> = {
  facebookMarketplace: "#1877F2",
  offerUp: "#00AB80",
  craigslist: "#5A00B5",
  kijiji: "#373373",
};

function formatPrice(price: number, symbol: string): string {
  const formatted = Math.round(price)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${symbol}${formatted}`;
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
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { toast } = useToast();
  const [descExpanded, setDescExpanded] = useState(false);
  const [localComps, setLocalComps] = useState<FeedItem[]>([]);
  const [localCompsLoading, setLocalCompsLoading] = useState(false);
  const [hasShownLocalComps, setHasShownLocalComps] = useState(false);
  const { sameYear, days, toggleSameYear, setDays } = useSimilarNearbyFilters();
  const scrollY = useSharedValue(0);
  const statusBadges = getOrderedStatusBadges(item);
  const images = galleryUrls(item);
  const description = item.description || "No description provided.";
  const longDesc = description.length > 160;
  const showSimilarNearby = isCarListing(item) && !item.isSold && !item.isPending;

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
  });

  useEffect(() => {
    setHasShownLocalComps(false);
  }, [item.id]);

  useEffect(() => {
    if (localComps.length > 0) setHasShownLocalComps(true);
  }, [localComps.length]);

  useEffect(() => {
    if (!showSimilarNearby) {
      setLocalComps([]);
      setLocalCompsLoading(false);
      return;
    }

    let alive = true;
    setLocalCompsLoading(true);
    void (async () => {
      const comps = await getLocalComps(item.id, { sameYear, days });
      if (!alive) return;
      setLocalComps(comps);
      setLocalCompsLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [item.id, showSimilarNearby, sameYear, days]);

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

  const handleCompPress = (id: string) => {
    router.push(`/feed/${id}`);
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingBottom: insets.bottom }}>
      <Animated.ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
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

        <View className="gap-6 px-4 pt-4">
          <View className="gap-2">
            <Typography
              type="body-sm"
              weight="semibold"
              className="text-[15px] leading-5 text-foreground"
              numberOfLines={2}
            >
              {item.title}
            </Typography>

            <View className="flex-row flex-wrap items-baseline gap-2">
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
          </View>

          <FeedDetailMetaSection item={item} />

          {item.seller ? (
            <View className="flex-row items-center gap-3 rounded-sm bg-surface-secondary px-3 py-2.5">
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
                  {item.seller.isBusinessAccount ? (
                    <Typography type="body-xs" className="text-xs text-muted">
                      · Business
                    </Typography>
                  ) : null}
                </View>
              </View>
              <Button size="sm" variant="secondary" onPress={() => mockAction("Block seller")}>
                <Button.Label className="text-xs">Block</Button.Label>
              </Button>
            </View>
          ) : null}

          <View className="gap-4">
            <Separator className="opacity-50" />
            <FeedDetailActions
              isFavorite={item.isFavorite}
              onSave={handleFavorite}
              onDelete={() => mockAction("Delete")}
              onShare={() => mockAction("Share")}
            />
          </View>

          <View className="gap-1.5">
            <Typography
              type="body"
              weight="semibold"
              className="text-[15px] tracking-tight text-foreground"
            >
              Description
            </Typography>
            <Typography
              type="body-xs"
              className="text-xs font-normal leading-4 text-muted"
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

          {showSimilarNearby &&
          (localCompsLoading || localComps.length > 0 || hasShownLocalComps) ? (
            <View className="gap-4">
              <Separator className="opacity-50" />
              <FeedDetailSimilarNearby
                items={localComps}
                loading={localCompsLoading}
                sameYear={sameYear}
                days={days}
                onSameYearToggle={toggleSameYear}
                onDaysChange={setDays}
                onPressItem={handleCompPress}
              />
            </View>
          ) : null}
        </View>
      </Animated.ScrollView>

      <View
        className="absolute inset-x-0 bottom-0 border-t border-border bg-background px-4 pt-2.5"
        style={{ paddingBottom: Math.max(insets.bottom, 10) }}
      >
        <Button
          variant="primary"
          className="min-h-11 w-full"
          style={{ backgroundColor: PLATFORM_CTA[item.platform] }}
          onPress={() => mockAction("View on Marketplace")}
        >
          <Ionicons name="open-outline" size={16} color="#FFFFFF" />
          <Button.Label className="text-sm text-white">
            View on Marketplace
          </Button.Label>
        </Button>
      </View>
    </View>
  );
}
