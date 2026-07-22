import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { JSX, ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { View } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
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
import {
  FeedDetailMetaSection,
  formatFoundIn,
} from "@/features/feed/feed-detail-meta";
import { FeedDetailScoreBar } from "@/features/feed/feed-detail-score-bar";
import {
  FeedDetailSimilarNearby,
  useSimilarNearbyFilters,
} from "@/features/feed/feed-detail-similar-nearby";
import { FeedDetailStickyHeader } from "@/features/feed/feed-detail-sticky-header";
import { FeedDetailBasicCalculation } from "@/features/feed/feed-detail-basic-calculation";
import { FeedDetailTrimEstimates } from "@/features/feed/feed-detail-trim-estimates";
import {
  formatSoldPendingTitlePrefix,
  SOLD_STATUS_COLOR,
  SOLD_STATUS_TEXT_CLASS,
} from "@/features/feed/sold-status";
import agent from "@/api/agent";
import { openListing } from "@/lib/marketplace-links";
import {
  getOrderedStatusBadges,
  isCarListing,
  resolveDisplayValuation,
  type FeedItem,
  type FeedPlatform,
} from "@/models/feed";
import { useStore } from "@/store/store";

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
  /** Optional block under the gallery (e.g. Community “Clicked by”). */
  afterGallery?: ReactNode;
}

export function FeedDetail({
  item,
  onBack,
  onToggleFavorite,
  afterGallery,
}: FeedDetailProps): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { toast } = useToast();
  const { feedStore } = useStore();
  const [descExpanded, setDescExpanded] = useState(false);
  const [localComps, setLocalComps] = useState<FeedItem[]>([]);
  const [localCompsLoading, setLocalCompsLoading] = useState(false);
  const [hasShownLocalComps, setHasShownLocalComps] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);
  const stickyVisibleRef = useRef(false);
  const stickyAnchorRef = useRef<View>(null);
  const { sameYear, days, toggleSameYear, setDays } = useSimilarNearbyFilters();
  const scrollY = useSharedValue(0);
  const statusBadges = getOrderedStatusBadges(item);
  const valuation = resolveDisplayValuation(item);
  const images = galleryUrls(item);
  const description = item.description || "No description provided.";
  const longDesc = description.length > 160;
  const showSimilarNearby = isCarListing(item) && !item.isSold && !item.isPending;
  const soldPendingPrefix = formatSoldPendingTitlePrefix(item);

  const syncStickyVisibility = useCallback(() => {
    stickyAnchorRef.current?.measureInWindow((_x, y) => {
      const next = y <= insets.top + 4;
      if (next === stickyVisibleRef.current) return;
      stickyVisibleRef.current = next;
      setStickyVisible(next);
    });
  }, [insets.top]);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
      runOnJS(syncStickyVisibility)();
    },
  });

  useEffect(() => {
    stickyVisibleRef.current = false;
    setStickyVisible(false);
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
      const comps = await agent.Feed.getLocalComps(item.id, { sameYear, days });
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
      description: "Action queued",
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
    router.push({ pathname: "/listing/[id]", params: { id } });
  };

  const openMarketplaceListing = useCallback(() => {
    void feedStore.markViewed(item.id);
    openListing(item.platform, item.listingId, item.listingUrl);
  }, [feedStore, item.id, item.listingId, item.listingUrl, item.platform]);

  const thumbUrl = images[0];

  return (
    <View className="flex-1 bg-background" style={{ paddingBottom: insets.bottom }}>
      {stickyVisible ? (
        <FeedDetailStickyHeader
          title={item.title}
          soldPendingPrefix={soldPendingPrefix ?? undefined}
          imageUrl={thumbUrl}
          priceLabel={formatPrice(item.price, item.currencySymbol)}
          estPriceLabel={
            valuation?.fairPrice != null
              ? formatPrice(valuation.fairPrice, item.currencySymbol)
              : undefined
          }
          buySignal={valuation?.calculated ? valuation.buySignal : undefined}
          foundInLabel={
            item.creationTime && item.createdAt
              ? formatFoundIn(item.creationTime, item.createdAt)
              : undefined
          }
          locationLabel={item.locationText || undefined}
          topInset={insets.top}
        />
      ) : null}

      <Animated.ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        <View className="relative">
          <FeedDetailGallery images={images} scrollY={scrollY} />

          {!stickyVisible ? (
            <PressableFeedback
              onPress={onBack}
              accessibilityLabel="Go back"
              className="absolute left-4 z-10 h-10 w-10 items-center justify-center rounded-full bg-black/55"
              style={{ top: insets.top + 8 }}
              animation={{ scale: { value: 0.92 } }}
            >
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </PressableFeedback>
          ) : null}

          {statusBadges.length > 0 ? (
            <View
              className="absolute left-[5px] right-[5px] flex-row flex-wrap gap-[3px]"
              style={{ bottom: images.length > 1 ? 70 : 5 }}
            >
              {statusBadges.slice(0, 2).map((label) => (
                <StatusBadge key={label} label={label} scale="detail" />
              ))}
            </View>
          ) : null}
        </View>

        {afterGallery}

        <View className="gap-6 px-4 pt-4">
          <View className="gap-2">
            <Typography
              type="body-sm"
              weight="semibold"
              className="text-[15px] leading-5 text-foreground"
              numberOfLines={2}
            >
              {soldPendingPrefix ? (
                <Typography
                  type="body-sm"
                  weight="semibold"
                  className={`text-[15px] leading-5 ${SOLD_STATUS_TEXT_CLASS}`}
                  style={{ color: SOLD_STATUS_COLOR }}
                >
                  {soldPendingPrefix}{" "}
                </Typography>
              ) : null}
              {item.title}
            </Typography>

            <View className="flex-row items-center gap-2">
              <Typography
                type="body-sm"
                weight="semibold"
                className="text-[22px] leading-7 text-foreground"
              >
                {formatPrice(item.price, item.currencySymbol)}
              </Typography>
              {valuation?.fairPrice != null ? (
                <Typography type="body-xs" className="min-w-0 flex-1 text-[11px] text-muted">
                  → {formatPrice(valuation.fairPrice, item.currencySymbol)}
                </Typography>
              ) : (
                <View className="flex-1" />
              )}
              {valuation?.calculated ? (
                <ValuationBadge buySignal={valuation.buySignal} scale="detail" />
              ) : null}
            </View>

            {valuation?.calculated ? (
              <FeedDetailScoreBar
                buySignal={valuation.buySignal}
                valuationType={valuation.valuationType}
                iphoneModel={valuation.iphoneModel}
                storageGb={valuation.storageGb}
                batteryHealth={valuation.batteryHealth}
                compCount={valuation.compCount}
              />
            ) : null}
          </View>

          {item.externalValuation?.calculated ||
          item.compValuation?.calculated ? (
            <View className="gap-2">
              {item.externalValuation?.calculated ? (
                <FeedDetailTrimEstimates
                  valuation={item.externalValuation}
                  currencySymbol={item.currencySymbol}
                />
              ) : null}
              {item.compValuation?.calculated ? (
                <FeedDetailBasicCalculation
                  valuation={item.compValuation}
                  currencySymbol={item.currencySymbol}
                />
              ) : null}
            </View>
          ) : null}

          <View>
            <FeedDetailMetaSection item={item} />
            <View
              ref={stickyAnchorRef}
              onLayout={syncStickyVisibility}
              collapsable={false}
              className="h-0"
            />
          </View>

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

          <View>
            <Separator className="opacity-50" />
            <FeedDetailActions
              isFavorite={item.isFavorite}
              onSave={handleFavorite}
              onDelete={() => mockAction("Delete")}
              onShare={() => mockAction("Share")}
            />
            <Separator className="opacity-50" />
            <View className="gap-1.5 pt-3">
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
        style={{ paddingBottom: Math.max(insets.bottom, 10) + 6 }}
      >
        <Button
          variant="primary"
          className="min-h-11 w-full rounded-full"
          style={{ backgroundColor: PLATFORM_CTA[item.platform] }}
          onPress={openMarketplaceListing}
        >
          <Ionicons name="open-outline" size={16} color="#FFFFFF" />
          <Button.Label className="text-sm tracking-wide text-white">
            View on Marketplace
          </Button.Label>
        </Button>
      </View>
    </View>
  );
}
