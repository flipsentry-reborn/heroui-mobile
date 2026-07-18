import { Image } from "expo-image";
import type { JSX } from "react";
import { View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { Typography, useThemeColor } from "heroui-native";

import { ValuationBadge } from "@/features/feed/feed-badge";
import { FeedDetailScoreBar } from "@/features/feed/feed-detail-score-bar";

const THUMB_SIZE = 88;

interface FeedDetailStickyHeaderProps {
  title: string;
  imageUrl?: string;
  priceLabel: string;
  estPriceLabel?: string;
  buySignal?: number;
  foundInLabel?: string;
  locationLabel?: string;
  topInset: number;
}

export function FeedDetailStickyHeader({
  title,
  imageUrl,
  priceLabel,
  estPriceLabel,
  buySignal,
  foundInLabel,
  locationLabel,
  topInset,
}: FeedDetailStickyHeaderProps): JSX.Element {
  const [surfaceSecondary] = useThemeColor(["surface-secondary"]);

  return (
    <Animated.View
      entering={FadeIn.duration(180)}
      exiting={FadeOut.duration(120)}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        paddingTop: topInset,
      }}
      className="border-b border-border bg-surface-secondary"
    >
      <View className="flex-row items-stretch gap-3 px-3 pb-3 pt-1.5">
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={{
              width: THUMB_SIZE,
              height: THUMB_SIZE,
              borderRadius: 10,
              backgroundColor: surfaceSecondary,
            }}
            contentFit="cover"
          />
        ) : (
          <View
            className="rounded-[10px] bg-surface-tertiary"
            style={{ width: THUMB_SIZE, height: THUMB_SIZE }}
          />
        )}

        <View className="min-w-0 flex-1 justify-center gap-1.5">
          <Typography
            type="body-sm"
            weight="semibold"
            className="text-[14px] leading-5 text-foreground"
            numberOfLines={1}
          >
            {title}
          </Typography>

          <View className="flex-row items-center gap-2">
            <Typography
              type="body-sm"
              weight="semibold"
              className="text-[16px] leading-5 text-foreground"
            >
              {priceLabel}
            </Typography>
            {estPriceLabel ? (
              <Typography type="body-xs" className="min-w-0 flex-1 text-[11px] text-muted">
                → {estPriceLabel}
              </Typography>
            ) : (
              <View className="flex-1" />
            )}
            {buySignal != null ? (
              <ValuationBadge buySignal={buySignal} scale="default" />
            ) : null}
          </View>

          {buySignal != null ? (
            <FeedDetailScoreBar buySignal={buySignal} compact />
          ) : null}

          {foundInLabel || locationLabel ? (
            <View className="flex-row items-center gap-2">
              {foundInLabel ? (
                <Typography type="body-xs" className="text-[11px] text-muted">
                  Found in {foundInLabel}
                </Typography>
              ) : null}
              {locationLabel ? (
                <Typography
                  type="body-xs"
                  className="min-w-0 flex-1 text-right text-[11px] text-muted"
                  numberOfLines={1}
                >
                  {locationLabel}
                </Typography>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
    </Animated.View>
  );
}
