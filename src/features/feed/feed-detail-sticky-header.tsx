import { Image } from "expo-image";
import type { JSX } from "react";
import { View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { Typography, useThemeColor } from "heroui-native";

import { AiEstimationIcon } from "@/components/icons/ai-estimation-icon";
import { FeedDetailScoreBar } from "@/features/feed/feed-detail-score-bar";
import {
  SOLD_STATUS_COLOR,
  SOLD_STATUS_TEXT_CLASS,
} from "@/features/feed/sold-status";
import { DEFAULT_IMAGE_PLACEHOLDER } from "@/lib/image";

/** Larger now that the sticky back control is gone. */
const THUMB_SIZE = 112;

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
        <Image
          source={imageUrl ? { uri: imageUrl } : null}
          placeholder={DEFAULT_IMAGE_PLACEHOLDER}
          style={{
            width: THUMB_SIZE,
            height: THUMB_SIZE,
            borderRadius: 10,
            backgroundColor: surfaceSecondary,
          }}
          contentFit="cover"
          transition={180}
        />

        <View className="min-w-0 flex-1 justify-center gap-1.5">
          <Typography
            type="body-sm"
            weight="semibold"
            className="text-[15px] leading-5 text-foreground"
            numberOfLines={1}
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
            {title}
          </Typography>

          <View className="flex-row items-center gap-2">
            <Typography
              type="body-sm"
              weight="bold"
              className="text-[18px] font-extrabold leading-6 text-accent"
            >
              {priceLabel}
            </Typography>
            {estPriceLabel ? (
              <View className="min-w-0 flex-1 flex-row items-center gap-1">
                <AiEstimationIcon size={19} />
                <Typography
                  type="body-xs"
                  className="min-w-0 shrink text-[14px] text-muted"
                  numberOfLines={1}
                >
                  Avg. {estPriceLabel}
                </Typography>
              </View>
            ) : (
              <View className="flex-1" />
            )}
          </View>

          {buySignal != null ? (
            <FeedDetailScoreBar buySignal={buySignal} compact />
          ) : null}

          {foundInLabel || locationLabel ? (
            <View className="flex-row items-center gap-2">
              {foundInLabel ? (
                <Typography type="body-xs" className="text-[11px] text-muted">
                  Finding Time {foundInLabel}
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
