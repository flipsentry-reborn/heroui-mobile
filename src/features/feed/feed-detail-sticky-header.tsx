import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import type { JSX } from "react";
import { View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { PressableFeedback, Typography, useThemeColor } from "heroui-native";

import { AiEstimationIcon } from "@/components/icons/ai-estimation-icon";
import { ValuationBadge } from "@/features/feed/feed-badge";
import { FeedDetailScoreBar } from "@/features/feed/feed-detail-score-bar";
import {
  SOLD_STATUS_COLOR,
  SOLD_STATUS_TEXT_CLASS,
} from "@/features/feed/sold-status";

const THUMB_SIZE = 88;

interface FeedDetailStickyHeaderProps {
  title: string;
  /** e.g. "Sold in 7h 0m" — coral prefix before the listing title. */
  soldPendingPrefix?: string;
  imageUrl?: string;
  priceLabel: string;
  estPriceLabel?: string;
  buySignal?: number;
  foundInLabel?: string;
  locationLabel?: string;
  topInset: number;
  onBack: () => void;
}

export function FeedDetailStickyHeader({
  title,
  soldPendingPrefix,
  imageUrl,
  priceLabel,
  estPriceLabel,
  buySignal,
  foundInLabel,
  locationLabel,
  topInset,
  onBack,
}: FeedDetailStickyHeaderProps): JSX.Element {
  const [surfaceSecondary, foreground] = useThemeColor([
    "surface-secondary",
    "foreground",
  ]);

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
      <View className="flex-row items-stretch gap-2 px-2 pb-3 pt-1.5">
        <PressableFeedback
          onPress={onBack}
          accessibilityLabel="Go back"
          className="mt-1 h-10 w-10 shrink-0 items-center justify-center rounded-full"
          animation={{ scale: { value: 0.92 } }}
        >
          <Ionicons name="chevron-back" size={22} color={foreground} />
        </PressableFeedback>

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
            {soldPendingPrefix ? (
              <Typography
                type="body-sm"
                weight="semibold"
                className={`text-[14px] leading-5 ${SOLD_STATUS_TEXT_CLASS}`}
                style={{ color: SOLD_STATUS_COLOR }}
              >
                {soldPendingPrefix}{" "}
              </Typography>
            ) : null}
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
              <View className="min-w-0 flex-1 flex-row items-center gap-1">
                <AiEstimationIcon size={18} />
                <Typography
                  type="body-xs"
                  className="min-w-0 shrink text-[11px] text-muted"
                  numberOfLines={1}
                >
                  Avg. {estPriceLabel}
                </Typography>
              </View>
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
