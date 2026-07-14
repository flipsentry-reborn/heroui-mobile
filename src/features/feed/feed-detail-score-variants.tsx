import { LinearGradient } from "expo-linear-gradient";
import type { JSX } from "react";
import { StyleSheet, View } from "react-native";
import { Chip, Separator, Surface, Typography } from "heroui-native";
import { ProgressBar, ProgressCircle, TrendChip } from "heroui-native-pro";

import { getValuationTier, type ValuationTier } from "@/models/feed";

const TIER_LABEL: Record<ValuationTier, string> = {
  greatDeal: "Great",
  goodValue: "Good",
  fairPrice: "Fair",
  overpriced: "Pass",
};

const TIER_COLOR: Record<ValuationTier, "success" | "accent" | "warning" | "danger"> = {
  greatDeal: "success",
  goodValue: "accent",
  fairPrice: "warning",
  overpriced: "danger",
};

const TIER_HEX: Record<ValuationTier, string> = {
  greatDeal: "#1DB954",
  goodValue: "#4ade80",
  fairPrice: "#fbbf24",
  overpriced: "#f87171",
};

const EQ_TIERS: ValuationTier[] = ["overpriced", "fairPrice", "goodValue", "greatDeal"];

interface FeedDetailScoreVariantsProps {
  buySignal: number;
  profit?: number;
  currencySymbol?: string;
}

function VariantCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <Surface variant="secondary" className="gap-3 rounded-2xl p-4">
      <Typography type="body-xs" weight="semibold" style={styles.variantTitle}>
        {title}
      </Typography>
      {children}
    </Surface>
  );
}

/** Temporary A/B section — pick one, then delete this file. */
export function FeedDetailScoreVariants({
  buySignal,
  profit,
  currencySymbol = "$",
}: FeedDetailScoreVariantsProps): JSX.Element {
  const pct = Math.max(0, Math.min(100, buySignal));
  const tier = getValuationTier(buySignal);
  const color = TIER_COLOR[tier];
  const hex = TIER_HEX[tier];
  const label = TIER_LABEL[tier];
  const activeEq = EQ_TIERS.indexOf(tier);
  const trend =
    tier === "greatDeal" || tier === "goodValue"
      ? "up"
      : tier === "fairPrice"
        ? "neutral"
        : "down";
  const profitText =
    profit != null
      ? `${profit >= 0 ? "+" : "-"}${currencySymbol}${Math.abs(Math.round(profit)).toLocaleString()}`
      : null;

  return (
    <View className="gap-3">
      <Separator />
      <Typography type="body-sm" weight="semibold" className="text-foreground">
        Score UI tests (temporary)
      </Typography>
      <Typography type="body-xs" className="text-muted">
        Scroll & compare — tell me which # you want, then we remove the rest.
      </Typography>

      {/* 1 — Spotify ProgressBar */}
      <VariantCard title="1 · ProgressBar + big score">
        <View className="flex-row items-end justify-between">
          <Typography type="h3" weight="bold" style={{ color: hex }}>
            {Math.round(pct)}
          </Typography>
          <Chip size="sm" variant="soft" color={color}>
            <Chip.Label>{label}</Chip.Label>
          </Chip>
        </View>
        <ProgressBar
          value={pct}
          color={color}
          size="md"
          formatOptions={{ style: "decimal", maximumFractionDigits: 0 }}
          accessibilityLabel="Deal score"
        >
          <ProgressBar.Track>
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>
      </VariantCard>

      {/* 2 — ProgressCircle */}
      <VariantCard title="2 · ProgressCircle ring">
        <View className="items-center gap-2 py-1">
          <ProgressCircle
            value={pct}
            color={color}
            size={112}
            formatOptions={{ style: "decimal", maximumFractionDigits: 0 }}
            accessibilityLabel="Deal score"
          >
            <ProgressCircle.Indicator strokeWidth={8} trackColor="#282828" fillColor={hex} />
            <ProgressCircle.ValueLabel>
              <View className="items-center">
                <Typography type="h4" weight="bold" className="text-foreground">
                  {Math.round(pct)}
                </Typography>
                <Typography type="body-xs" style={{ color: hex }}>
                  {label}
                </Typography>
              </View>
            </ProgressCircle.ValueLabel>
          </ProgressCircle>
        </View>
      </VariantCard>

      {/* 3 — Chip only */}
      <VariantCard title="3 · Tier chip only (no bar)">
        <View className="flex-row flex-wrap items-center gap-2">
          <Chip size="md" variant="primary" color={color}>
            <Chip.Label>{label} deal</Chip.Label>
          </Chip>
          {profitText ? (
            <TrendChip trend={trend} variant="soft" size="md">
              <TrendChip.Indicator />
              <TrendChip.Value>{profitText}</TrendChip.Value>
              <TrendChip.Suffix>vs fair</TrendChip.Suffix>
            </TrendChip>
          ) : (
            <Typography type="body-sm" className="text-muted">
              Score {Math.round(pct)}/100
            </Typography>
          )}
        </View>
      </VariantCard>

      {/* 4 — EQ bars */}
      <VariantCard title="4 · EQ bars (Spotify vibe)">
        <View className="flex-row items-end justify-between gap-2 px-2 pt-1">
          {EQ_TIERS.map((t, i) => {
            const active = i === activeEq;
            const heights = [28, 40, 52, 64];
            return (
              <View key={t} className="flex-1 items-center gap-1.5">
                <View
                  style={[
                    styles.eqBar,
                    {
                      height: heights[i],
                      backgroundColor: active ? TIER_HEX[t] : "rgba(255,255,255,0.12)",
                      opacity: active ? 1 : 0.45,
                    },
                  ]}
                />
                <Typography
                  type="body-xs"
                  weight={active ? "semibold" : undefined}
                  style={{ color: active ? TIER_HEX[t] : "#8A8A8A", fontSize: 10 }}
                >
                  {TIER_LABEL[t]}
                </Typography>
              </View>
            );
          })}
        </View>
        <Typography type="body-xs" className="text-center text-muted">
          Active: {label} · {Math.round(pct)}
        </Typography>
      </VariantCard>

      {/* 5 — Gradient + glow marker */}
      <VariantCard title="5 · Gradient strip + glow marker">
        <View style={styles.gradientWrap}>
          <LinearGradient
            colors={["#f87171", "#fbbf24", "#4ade80", "#1DB954"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.gradientTrack}
          />
          <View style={[styles.marker, { left: `${pct}%` }]}>
            <View style={[styles.markerGlow, { backgroundColor: hex }]} />
            <View style={[styles.markerDot, { borderColor: hex }]} />
          </View>
        </View>
        <View className="flex-row items-center justify-between">
          <Typography type="body-xs" className="text-muted">
            Pass
          </Typography>
          <Typography type="body-sm" weight="semibold" style={{ color: hex }}>
            {label} · {Math.round(pct)}
          </Typography>
          <Typography type="body-xs" className="text-muted">
            Great
          </Typography>
        </View>
      </VariantCard>
    </View>
  );
}

const styles = StyleSheet.create({
  variantTitle: {
    color: "#1DB954",
    letterSpacing: 0.2,
  },
  eqBar: {
    width: "100%",
    maxWidth: 36,
    borderRadius: 8,
  },
  gradientWrap: {
    height: 18,
    justifyContent: "center",
    marginBottom: 4,
  },
  gradientTrack: {
    height: 8,
    borderRadius: 999,
  },
  marker: {
    position: "absolute",
    marginLeft: -10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  markerGlow: {
    position: "absolute",
    width: 18,
    height: 18,
    borderRadius: 9,
    opacity: 0.35,
  },
  markerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#121212",
    borderWidth: 2.5,
  },
});
