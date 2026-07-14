import { LinearGradient } from "expo-linear-gradient";
import type { JSX } from "react";
import { StyleSheet, View } from "react-native";
import { Chip, Separator, Surface, Typography } from "heroui-native";
import { NumberValue, ProgressBar, TrendChip } from "heroui-native-pro";
import Svg, { Circle } from "react-native-svg";

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

/** Arc bands match getValuationTier thresholds (0–25 / 25–50 / 50–75 / 75–100). */
const SCORE_SEGMENTS: { start: number; end: number; color: string }[] = [
  { start: 0, end: 25, color: TIER_HEX.overpriced },
  { start: 25, end: 50, color: TIER_HEX.fairPrice },
  { start: 50, end: 75, color: TIER_HEX.goodValue },
  { start: 75, end: 100, color: TIER_HEX.greatDeal },
];

const EQ_TIERS: ValuationTier[] = ["overpriced", "fairPrice", "goodValue", "greatDeal"];

interface FeedDetailScoreVariantsProps {
  buySignal: number;
  profit?: number;
  fairPrice?: number;
  askPrice?: number;
  compCount?: number;
  percentileRank?: number;
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

function ScoreCircle({
  pct,
  hex,
  label,
  size = 96,
}: {
  pct: number;
  color?: "success" | "accent" | "warning" | "danger";
  hex: string;
  label: string;
  size?: number;
}): JSX.Element {
  const strokeWidth = 7;
  const clamped = Math.max(0, Math.min(100, pct));
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <View
      style={{ width: size, height: size }}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped) }}
      accessibilityLabel="Deal score"
    >
      <Svg width={size} height={size}>
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          stroke="#1a1a1a"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {SCORE_SEGMENTS.map((seg) => {
          const filledEnd = Math.min(clamped, seg.end);
          if (filledEnd <= seg.start) return null;
          const length = ((filledEnd - seg.start) / 100) * c;
          const offset = (seg.start / 100) * c;
          return (
            <Circle
              key={seg.start}
              cx={cx}
              cy={cy}
              r={r}
              stroke={seg.color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${length} ${c - length}`}
              strokeDashoffset={-offset}
              rotation={-90}
              origin={`${cx}, ${cy}`}
              strokeLinecap="butt"
            />
          );
        })}
      </Svg>
      <View style={styles.circleLabel} pointerEvents="none">
        <Typography type="h5" weight="bold" className="text-foreground">
          {Math.round(clamped)}
        </Typography>
        <Typography type="body-xs" style={{ color: hex, fontSize: 10 }}>
          {label}
        </Typography>
      </View>
    </View>
  );
}

/** Left circle + right rounded panel. */
function SplitRow({
  left,
  right,
}: {
  left: React.ReactNode;
  right: React.ReactNode;
}): JSX.Element {
  return (
    <View className="flex-row gap-2.5">
      <Surface variant="tertiary" className="items-center justify-center rounded-3xl p-3" style={styles.splitLeft}>
        {left}
      </Surface>
      <Surface variant="tertiary" className="min-w-0 flex-1 justify-center rounded-3xl p-3.5" style={styles.splitRight}>
        {right}
      </Surface>
    </View>
  );
}

/** Temporary A/B section — pick one, then delete this file. */
export function FeedDetailScoreVariants({
  buySignal,
  profit,
  fairPrice,
  askPrice,
  compCount,
  percentileRank,
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
  const profitAbs = profit != null ? Math.abs(Math.round(profit)) : null;
  const profitText =
    profit != null
      ? `${profit >= 0 ? "+" : "-"}${currencySymbol}${profitAbs!.toLocaleString()}`
      : null;
  const deltaPct =
    fairPrice != null && askPrice != null && fairPrice > 0
      ? Math.round(((fairPrice - askPrice) / fairPrice) * 100)
      : null;

  return (
    <View className="gap-3">
      <Separator />
      <Typography type="body-sm" weight="semibold" className="text-foreground">
        Score UI tests (temporary)
      </Typography>
      <Typography type="body-xs" className="text-muted">
        1–5 = older ideas · 6–10 = horizontal 2-panel (circle + right). Pick a #.
      </Typography>

      {/* —— Existing 1–5 —— */}
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

      <VariantCard title="2 · Segmented circle alone">
        <View className="items-center py-1">
          <ScoreCircle pct={pct} hex={hex} label={label} size={112} />
        </View>
      </VariantCard>

      <VariantCard title="3 · Tier chip only">
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
          ) : null}
        </View>
      </VariantCard>

      <VariantCard title="4 · EQ bars">
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
      </VariantCard>

      <VariantCard title="5 · Gradient + glow marker">
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
      </VariantCard>

      {/* —— New horizontal 2-panel variants —— */}
      <Typography type="body-sm" weight="semibold" className="mt-2 text-foreground">
        Horizontal 2-panel
      </Typography>

      <VariantCard title="6 · Circle + Profit (recommended)">
        <SplitRow
          left={<ScoreCircle pct={pct} color={color} hex={hex} label={label} />}
          right={
            <View className="gap-1">
              <Typography type="body-xs" className="text-muted">
                Est. profit
              </Typography>
              {profit != null ? (
                <NumberValue
                  value={profit}
                  signDisplay="always"
                  maximumFractionDigits={0}
                >
                  <NumberValue.Prefix className="text-xl font-bold" style={{ color: hex }}>
                    {currencySymbol}
                  </NumberValue.Prefix>
                  <NumberValue.Value className="text-xl font-bold" style={{ color: hex }} />
                </NumberValue>
              ) : (
                <Typography type="h5" weight="bold" className="text-foreground">
                  —
                </Typography>
              )}
              <Typography type="body-xs" className="text-muted">
                vs fair price
              </Typography>
            </View>
          }
        />
      </VariantCard>

      <VariantCard title="7 · Circle + Fair price">
        <SplitRow
          left={<ScoreCircle pct={pct} color={color} hex={hex} label={label} />}
          right={
            <View className="gap-1.5">
              <Typography type="body-xs" className="text-muted">
                Fair market
              </Typography>
              {fairPrice != null ? (
                <NumberValue
                  value={fairPrice}
                  maximumFractionDigits={0}
                >
                  <NumberValue.Prefix className="text-lg font-bold text-foreground">
                    {currencySymbol}
                  </NumberValue.Prefix>
                  <NumberValue.Value className="text-lg font-bold text-foreground" />
                </NumberValue>
              ) : null}
              {askPrice != null ? (
                <Typography type="body-xs" className="text-muted">
                  Ask {currencySymbol}
                  {Math.round(askPrice).toLocaleString()}
                  {deltaPct != null ? ` · ${deltaPct > 0 ? "−" : "+"}${Math.abs(deltaPct)}%` : ""}
                </Typography>
              ) : null}
              <Chip size="sm" variant="soft" color={color} className="self-start">
                <Chip.Label>{label}</Chip.Label>
              </Chip>
            </View>
          }
        />
      </VariantCard>

      <VariantCard title="8 · Circle + mini ProgressBar">
        <SplitRow
          left={<ScoreCircle pct={pct} color={color} hex={hex} label={label} />}
          right={
            <View className="gap-2">
              <View className="flex-row items-center justify-between">
                <Typography type="body-xs" className="text-muted">
                  Deal strength
                </Typography>
                <Typography type="body-sm" weight="semibold" style={{ color: hex }}>
                  {label}
                </Typography>
              </View>
              <ProgressBar value={pct} color={color} size="sm" accessibilityLabel="Deal strength">
                <ProgressBar.Track>
                  <ProgressBar.Fill />
                </ProgressBar.Track>
              </ProgressBar>
              {profitText ? (
                <TrendChip trend={trend} variant="soft" size="sm">
                  <TrendChip.Indicator />
                  <TrendChip.Value>{profitText}</TrendChip.Value>
                  <TrendChip.Suffix>edge</TrendChip.Suffix>
                </TrendChip>
              ) : null}
            </View>
          }
        />
      </VariantCard>

      <VariantCard title="9 · Circle + comps / percentile">
        <SplitRow
          left={<ScoreCircle pct={pct} color={color} hex={hex} label={label} />}
          right={
            <View className="gap-2.5">
              <View>
                <Typography type="body-xs" className="text-muted">
                  Comparables
                </Typography>
                <Typography type="h5" weight="bold" className="text-foreground">
                  {compCount ?? "—"}
                  <Typography type="body-sm" className="text-muted">
                    {" "}
                    comps
                  </Typography>
                </Typography>
              </View>
              <Separator />
              <View>
                <Typography type="body-xs" className="text-muted">
                  Market rank
                </Typography>
                <Typography type="body-sm" weight="semibold" className="text-foreground">
                  {percentileRank != null ? `Top ${percentileRank}%` : "—"}
                </Typography>
              </View>
            </View>
          }
        />
      </VariantCard>

      <VariantCard title="10 · Circle + stacked chips">
        <SplitRow
          left={<ScoreCircle pct={pct} color={color} hex={hex} label={label} />}
          right={
            <View className="gap-2">
              <Chip size="sm" variant="soft" color={color} className="self-start">
                <Chip.Label>{label} deal</Chip.Label>
              </Chip>
              {profitText ? (
                <TrendChip trend={trend} variant="soft" size="sm">
                  <TrendChip.Indicator />
                  <TrendChip.Value>{profitText}</TrendChip.Value>
                  <TrendChip.Suffix>vs fair</TrendChip.Suffix>
                </TrendChip>
              ) : null}
              {compCount != null ? (
                <Chip size="sm" variant="soft" color="default" className="self-start">
                  <Chip.Label>{compCount} comps</Chip.Label>
                </Chip>
              ) : null}
              {fairPrice != null ? (
                <Typography type="body-xs" className="text-muted">
                  Fair {currencySymbol}
                  {Math.round(fairPrice).toLocaleString()}
                </Typography>
              ) : null}
            </View>
          }
        />
      </VariantCard>
    </View>
  );
}

const styles = StyleSheet.create({
  variantTitle: {
    color: "#1DB954",
    letterSpacing: 0.2,
  },
  circleLabel: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  splitLeft: {
    width: 118,
    minHeight: 118,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  splitRight: {
    backgroundColor: "rgba(255,255,255,0.04)",
    minHeight: 118,
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
