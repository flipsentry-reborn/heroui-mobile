import type { JSX } from "react";
import { View } from "react-native";
import { Typography } from "heroui-native";

import { getValuationTier, type ValuationTier } from "@/models/feed";

const TIER_ORDER: ValuationTier[] = ["overpriced", "fairPrice", "goodValue", "greatDeal"];

const TIER_STYLE: Record<ValuationTier, { label: string; fillClass: string; textClass: string }> = {
  greatDeal: {
    label: "Great",
    fillClass: "bg-success",
    textClass: "text-success",
  },
  goodValue: {
    label: "Good",
    fillClass: "bg-lime-700",
    textClass: "text-lime-700",
  },
  fairPrice: {
    label: "OK",
    fillClass: "bg-warning",
    textClass: "text-warning",
  },
  overpriced: {
    label: "Skip",
    fillClass: "bg-danger",
    textClass: "text-danger",
  },
};

interface FeedDetailScoreBarProps {
  buySignal: number;
  iphoneModel?: string;
  storageGb?: number;
  batteryHealth?: number;
  compCount?: number;
  valuationType?: "car" | "iphone";
}

/** Four-threshold horizontal score with parallel diagonal cuts. */
export function FeedDetailScoreBar({
  buySignal,
  iphoneModel,
  storageGb,
  batteryHealth,
  compCount,
  valuationType,
}: FeedDetailScoreBarProps): JSX.Element {
  const pct = Math.max(0, Math.min(100, buySignal));
  const tier = getValuationTier(buySignal);
  const tierStyle = TIER_STYLE[tier];

  return (
    <View className="gap-2">
      {valuationType === "iphone" && iphoneModel ? (
        <View className="flex-row flex-wrap items-center gap-1.5">
          <Typography type="body-xs" weight="semibold" className="text-foreground">
            {iphoneModel}
          </Typography>
          {storageGb != null ? (
            <Typography type="body-xs" className="text-muted">
              · {storageGb}GB
            </Typography>
          ) : null}
          {batteryHealth != null ? (
            <Typography type="body-xs" className="text-muted">
              · {batteryHealth}% battery
            </Typography>
          ) : null}
          {compCount != null ? (
            <Typography type="body-xs" className="text-muted">
              · {compCount} comps
            </Typography>
          ) : null}
        </View>
      ) : null}

      <View className="flex-row items-baseline justify-end">
        <Typography
          type="body-sm"
          weight="semibold"
          className={`text-[15px] ${tierStyle.textClass}`}
        >
          {tierStyle.label}
        </Typography>
      </View>

      <View
        className="relative h-3 w-full flex-row overflow-hidden rounded-sm"
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}
        accessibilityLabel={`Deal score: ${tierStyle.label}`}
      >
        {TIER_ORDER.map((itemTier, index) => {
          const start = index * 25;
          const localProgress = Math.max(0, Math.min(100, ((pct - start) / 25) * 100));
          return (
            <View key={itemTier} className="relative flex-1 overflow-hidden">
              <View
                className={`absolute inset-0 ${TIER_STYLE[itemTier].fillClass}`}
                style={{ opacity: 0.22 }}
              />
              <View
                className={`h-full ${TIER_STYLE[itemTier].fillClass}`}
                style={{ width: `${localProgress}%` }}
              />
            </View>
          );
        })}
        {[25, 50, 75].map((position) => (
          <View
            key={position}
            className="absolute -top-1.5 h-6 w-1 bg-background"
            style={{
              left: `${position}%`,
              transform: [{ translateX: -2 }, { rotate: "18deg" }],
            }}
          />
        ))}
        {pct > 0 && pct < 100 ? (
          <View
            className="absolute -top-1.5 h-6 w-1 bg-background"
            style={{
              left: `${pct}%`,
              transform: [{ translateX: -2 }, { rotate: "18deg" }],
            }}
          />
        ) : null}
      </View>
    </View>
  );
}
