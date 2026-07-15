import type { JSX } from "react";
import { View } from "react-native";
import { Typography } from "heroui-native";

import { getValuationTier, type ValuationTier } from "@/models/feed";

const TIER_HEX: Record<ValuationTier, string> = {
  greatDeal: "#1DB954",
  goodValue: "#4ade80",
  fairPrice: "#f59e0b",
  overpriced: "#ef4444",
};

const TIER_ORDER: ValuationTier[] = [
  "overpriced",
  "fairPrice",
  "goodValue",
  "greatDeal",
];

const TIER_LABEL: Record<ValuationTier, string> = {
  greatDeal: "Great",
  goodValue: "Good",
  fairPrice: "Fair",
  overpriced: "Pass",
};

const SLOT_COUNT = 20;
const MUTED_OPACITY = 0.22;

function slotColor(slotMid: number): string {
  if (slotMid < 25) return TIER_HEX.overpriced;
  if (slotMid < 50) return TIER_HEX.fairPrice;
  if (slotMid < 75) return TIER_HEX.goodValue;
  return TIER_HEX.greatDeal;
}

interface FeedDetailScoreBarProps {
  buySignal: number;
  iphoneModel?: string;
  storageGb?: number;
  batteryHealth?: number;
  compCount?: number;
  valuationType?: "car" | "iphone";
}

/** Dense slot bar: bright up to score, muted spectrum for the rest. */
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
  const currentIdx = TIER_ORDER.indexOf(tier);
  const hex = TIER_HEX[tier];

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

      <View
        className="h-4 w-full flex-row items-stretch gap-[3px]"
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}
        accessibilityLabel="Deal score"
      >
        {Array.from({ length: SLOT_COUNT }, (_, i) => {
          const slotStart = (i / SLOT_COUNT) * 100;
          const slotMid = ((i + 0.5) / SLOT_COUNT) * 100;
          const active = pct >= slotMid;
          const partial = !active && pct > slotStart;
          const color = slotColor(slotMid);
          return (
            <View
              key={i}
              className="min-w-0 flex-1 rounded-sm"
              style={{
                backgroundColor: color,
                opacity: active ? 1 : partial ? 0.55 : MUTED_OPACITY,
              }}
            />
          );
        })}
      </View>

      <View className="flex-row items-center">
        {TIER_ORDER.map((t, i) => {
          const past = i < currentIdx;
          const current = i === currentIdx;
          const color = current ? TIER_HEX[t] : past ? "#6B6B6B" : "#8A8A8A";

          return (
            <View key={t} className="flex-1 flex-row items-center justify-center gap-1">
              <Typography
                type="body-xs"
                weight={current ? "bold" : "medium"}
                className="text-[11px] tracking-wide"
                style={{
                  color,
                  textDecorationLine: past ? "line-through" : "none",
                  opacity: current ? 1 : past ? 0.55 : 0.4,
                }}
              >
                {TIER_LABEL[t]}
              </Typography>
              {current ? (
                <Typography
                  type="body-xs"
                  weight="bold"
                  className="text-[11px]"
                  style={{ color: hex }}
                >
                  {Math.round(pct)}
                </Typography>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}
