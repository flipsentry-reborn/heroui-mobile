import type { JSX } from "react";
import { StyleSheet, Text, View } from "react-native";
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
        style={styles.slotRow}
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
              style={[
                styles.slot,
                {
                  backgroundColor: color,
                  opacity: active ? 1 : partial ? 0.55 : MUTED_OPACITY,
                },
              ]}
            />
          );
        })}
      </View>

      {/* Past = struck · current = strong · ahead = muted */}
      <View style={styles.tierRow}>
        {TIER_ORDER.map((t, i) => {
          const past = i < currentIdx;
          const current = i === currentIdx;
          const color = current ? TIER_HEX[t] : past ? "#6B6B6B" : "#8A8A8A";

          return (
            <View key={t} style={styles.tierCell}>
              <Text
                style={[
                  styles.tierLabel,
                  {
                    color,
                    fontWeight: current ? "700" : "500",
                    textDecorationLine: past ? "line-through" : "none",
                    opacity: current ? 1 : past ? 0.55 : 0.4,
                  },
                ]}
              >
                {TIER_LABEL[t]}
              </Text>
              {current ? (
                <Text style={[styles.scoreBeside, { color: hex }]}>
                  {Math.round(pct)}
                </Text>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slotRow: {
    flexDirection: "row",
    gap: 3,
    width: "100%",
    height: 16,
    alignItems: "stretch",
  },
  slot: {
    flex: 1,
    borderRadius: 2,
  },
  tierRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  tierCell: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  tierLabel: {
    fontSize: 11,
    letterSpacing: 0.15,
  },
  scoreBeside: {
    fontSize: 11,
    fontWeight: "700",
  },
});
