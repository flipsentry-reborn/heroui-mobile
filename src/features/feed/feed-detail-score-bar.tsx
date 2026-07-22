import type { JSX } from "react";
import { View } from "react-native";
import { Typography } from "heroui-native";

import { getValuationTier, type ValuationTier } from "@/models/feed";

const TIER_ORDER: ValuationTier[] = ["overpriced", "fairPrice", "goodValue", "greatDeal"];

const TIER_STYLE: Record<ValuationTier, { label: string; fillClass: string }> = {
  greatDeal: {
    label: "Great",
    fillClass: "bg-success",
  },
  goodValue: {
    label: "Good",
    fillClass: "bg-lime-700",
  },
  fairPrice: {
    label: "Fair",
    fillClass: "bg-warning",
  },
  overpriced: {
    label: "Skip",
    fillClass: "bg-danger",
  },
};

interface FeedDetailScoreBarProps {
  buySignal: number;
  iphoneModel?: string;
  storageGb?: number;
  batteryHealth?: number;
  compCount?: number;
  valuationType?: "car" | "iphone";
  /** Compact bar only — no meta row / tier label (sticky header). */
  compact?: boolean;
}

/** Four-threshold horizontal score with parallel diagonal cuts. */
export function FeedDetailScoreBar({
  buySignal,
  iphoneModel,
  storageGb,
  batteryHealth,
  compCount,
  valuationType,
  compact = false,
}: FeedDetailScoreBarProps): JSX.Element {
  const pct = Math.max(0, Math.min(100, buySignal));
  const tier = getValuationTier(buySignal);
  const tierStyle = TIER_STYLE[tier];
  const barH = compact ? "h-2" : "h-2.5";
  const cutH = compact ? "h-3.5 -top-0.5" : "h-5 -top-1";
  const cutBg = compact ? "bg-surface-secondary" : "bg-background";

  return (
    <View className={compact ? "gap-0" : "gap-2"}>
      {!compact && valuationType === "iphone" && iphoneModel ? (
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

      <View
        className={`relative w-full flex-row overflow-hidden rounded-sm ${barH}`}
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
            className={`absolute w-1 ${cutBg} ${cutH}`}
            style={{
              left: `${position}%`,
              transform: [{ translateX: -2 }, { rotate: "18deg" }],
            }}
          />
        ))}
        {pct > 0 && pct < 100 ? (
          <View
            className={`absolute w-1 ${cutBg} ${cutH}`}
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
