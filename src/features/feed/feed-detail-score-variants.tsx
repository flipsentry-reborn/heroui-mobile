import { LinearGradient } from "expo-linear-gradient";
import type { JSX } from "react";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Separator, Surface, Typography } from "heroui-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { getValuationTier, type ValuationTier } from "@/models/feed";

const TIER_LABEL: Record<ValuationTier, string> = {
  greatDeal: "Great",
  goodValue: "Good",
  fairPrice: "Fair",
  overpriced: "Pass",
};

const TIER_HEX: Record<ValuationTier, string> = {
  greatDeal: "#1DB954",
  goodValue: "#4ade80",
  fairPrice: "#f59e0b",
  overpriced: "#ef4444",
};

/**
 * Sharper spectrum: each tier holds longer, short blend at 25 / 50 / 75.
 * locations align with getValuationTier thresholds.
 */
const SPECTRUM = [
  "#ef4444",
  "#ef4444",
  "#f59e0b",
  "#f59e0b",
  "#4ade80",
  "#4ade80",
  "#1DB954",
  "#1DB954",
] as const;
const SPECTRUM_LOCATIONS = [0, 0.2, 0.26, 0.45, 0.51, 0.7, 0.76, 1] as const;

const TIER_DEMOS: { pct: number; tier: ValuationTier }[] = [
  { pct: 14, tier: "overpriced" },
  { pct: 38, tier: "fairPrice" },
  { pct: 63, tier: "goodValue" },
  { pct: 88, tier: "greatDeal" },
];

const TIER_TICKS = [25, 50, 75] as const;

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

/**
 * Ghost track + gradient fill clipped to `pct`.
 * Short blends at tier edges — not fully soft, not hard blocks.
 */
function SmoothScoreBar({
  pct,
  hex,
  height = 9,
  showMarker = true,
  showTicks = false,
}: {
  pct: number;
  hex: string;
  height?: number;
  showMarker?: boolean;
  showTicks?: boolean;
}): JSX.Element {
  const clamped = Math.max(1, Math.min(100, pct));
  const fillGradientWidthPct = (100 / clamped) * 100;

  return (
    <View
      style={[styles.barWrap, { height: showMarker || showTicks ? height + 16 : height }]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped) }}
      accessibilityLabel="Deal score"
    >
      <View style={[styles.barTrack, { height }]}>
        <LinearGradient
          colors={[...SPECTRUM]}
          locations={SPECTRUM_LOCATIONS}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[StyleSheet.absoluteFill, styles.barGhost]}
        />
        <View style={[styles.barFillClip, { width: `${clamped}%` }]}>
          <LinearGradient
            colors={[...SPECTRUM]}
            locations={SPECTRUM_LOCATIONS}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ height: "100%", width: `${fillGradientWidthPct}%` }}
          />
        </View>
      </View>
      {showTicks
        ? TIER_TICKS.map((tick) => (
            <View key={tick} style={[styles.tick, { left: `${tick}%`, height: height + 6 }]} />
          ))
        : null}
      {showMarker ? (
        <View style={[styles.marker, { left: `${clamped}%` }]}>
          <View style={[styles.markerGlow, { backgroundColor: hex }]} />
          <View style={[styles.markerDot, { borderColor: hex }]} />
        </View>
      ) : null}
    </View>
  );
}

/** Soft amber/green tip glow (lighter than full flame). */
function TipGlowBar({ pct, hex }: { pct: number; hex: string }): JSX.Element {
  const pulse = useSharedValue(0);
  const clamped = Math.max(1, Math.min(100, pct));

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [pulse]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.35, 0.95]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.85, 1.25]) }],
  }));

  return (
    <View style={styles.tipGlowWrap}>
      <SmoothScoreBar pct={pct} hex={hex} height={10} showMarker={false} />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.tipGlow,
          { left: `${clamped}%`, backgroundColor: hex, shadowColor: hex },
          glowStyle,
        ]}
      />
    </View>
  );
}

function FlameParticle({
  delay,
  drift,
  color,
  size,
  duration,
}: {
  delay: number;
  drift: number;
  color: string;
  size: number;
  duration: number;
}): JSX.Element {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration, easing: Easing.out(Easing.cubic) }),
        -1,
        false,
      ),
    );
  }, [delay, duration, t]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0, 0.12, 0.55, 1], [0, 1, 0.55, 0]),
    transform: [
      { translateX: interpolate(t.value, [0, 0.4, 1], [0, drift * 0.4, drift]) },
      { translateY: interpolate(t.value, [0, 1], [4, -38]) },
      { scaleX: interpolate(t.value, [0, 0.3, 1], [0.7, 1.15, 0.35]) },
      { scaleY: interpolate(t.value, [0, 0.25, 1], [0.85, 1.4, 0.4]) },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.flameParticle,
        {
          width: size,
          height: size * 1.55,
          borderRadius: size,
          backgroundColor: color,
          shadowColor: color,
        },
        style,
      ]}
    />
  );
}

/** Crispy flame rising from the fill tip (Great only). */
function FlameScoreBar({ pct, hex }: { pct: number; hex: string }): JSX.Element {
  const flicker = useSharedValue(0);
  const clamped = Math.max(1, Math.min(100, pct));

  useEffect(() => {
    flicker.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 90 }),
        withTiming(0.45, { duration: 70 }),
        withTiming(0.95, { duration: 55 }),
        withTiming(0.25, { duration: 85 }),
        withTiming(0.8, { duration: 60 }),
        withTiming(0.4, { duration: 75 }),
      ),
      -1,
      false,
    );
  }, [flicker]);

  const coreStyle = useAnimatedStyle(() => ({
    opacity: interpolate(flicker.value, [0, 1], [0.55, 1]),
    transform: [
      { scaleX: interpolate(flicker.value, [0, 1], [0.75, 1.2]) },
      { scaleY: interpolate(flicker.value, [0, 1], [0.85, 1.45]) },
    ],
  }));

  const haloStyle = useAnimatedStyle(() => ({
    opacity: interpolate(flicker.value, [0, 1], [0.25, 0.7]),
    transform: [
      { scaleX: interpolate(flicker.value, [0, 1], [1, 1.35]) },
      { scaleY: interpolate(flicker.value, [0, 1], [1, 1.55]) },
    ],
  }));

  return (
    <View style={styles.flameBarWrap}>
      <SmoothScoreBar pct={pct} hex={hex} height={10} showMarker={false} />
      <View pointerEvents="none" style={[styles.flameAnchor, { left: `${clamped}%` }]}>
        <Animated.View style={[styles.flameHalo, haloStyle]} />
        <Animated.View style={[styles.flameCore, coreStyle]} />
        <FlameParticle delay={0} drift={-10} color="#fbbf24" size={7} duration={720} />
        <FlameParticle delay={90} drift={6} color="#f97316" size={9} duration={640} />
        <FlameParticle delay={160} drift={-4} color="#fde68a" size={5} duration={580} />
        <FlameParticle delay={220} drift={12} color="#fb923c" size={6} duration={700} />
        <FlameParticle delay={300} drift={-14} color="#ef4444" size={5} duration={760} />
        <FlameParticle delay={380} drift={3} color="#fef08a" size={4} duration={520} />
        <FlameParticle delay={450} drift={8} color="#f59e0b" size={6} duration={680} />
      </View>
    </View>
  );
}

function BarDemoRow({
  pct,
  tier,
}: {
  pct: number;
  tier: ValuationTier;
}): JSX.Element {
  const hex = TIER_HEX[tier];
  const label = TIER_LABEL[tier];

  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between">
        <Typography type="body-xs" className="text-muted">
          {label}
        </Typography>
        <Typography type="body-sm" weight="semibold" style={{ color: hex }}>
          {pct}
        </Typography>
      </View>
      <SmoothScoreBar pct={pct} hex={hex} />
    </View>
  );
}

const CUT_BANDS: { start: number; end: number; color: string; tier: ValuationTier }[] = [
  { start: 0, end: 25, color: TIER_HEX.overpriced, tier: "overpriced" },
  { start: 25, end: 50, color: TIER_HEX.fairPrice, tier: "fairPrice" },
  { start: 50, end: 75, color: TIER_HEX.goodValue, tier: "goodValue" },
  { start: 75, end: 100, color: TIER_HEX.greatDeal, tier: "greatDeal" },
];

function bandFill(pct: number, start: number, end: number): number {
  if (pct <= start) return 0;
  if (pct >= end) return 1;
  return (pct - start) / (end - start);
}

/** 4 separate cells with visible gaps (cut between tiers). */
function CutGappedBar({ pct }: { pct: number }): JSX.Element {
  const clamped = Math.max(0, Math.min(100, pct));

  return (
    <View style={styles.cutRow}>
      {CUT_BANDS.map((band) => {
        const fill = bandFill(clamped, band.start, band.end);
        return (
          <View key={band.tier} style={styles.cutCell}>
            <View style={styles.cutCellTrack}>
              <View
                style={[
                  styles.cutCellFill,
                  {
                    width: `${fill * 100}%`,
                    backgroundColor: band.color,
                    opacity: fill > 0 ? 1 : 0.2,
                  },
                ]}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** Continuous bar with deep dark groove cuts at 25 / 50 / 75. */
function CutGrooveBar({ pct }: { pct: number }): JSX.Element {
  const clamped = Math.max(1, Math.min(100, pct));
  const fillGradientWidthPct = (100 / clamped) * 100;

  return (
    <View style={styles.grooveWrap}>
      <View style={styles.grooveTrack}>
        <View style={[styles.barFillClip, { width: `${clamped}%` }]}>
          <LinearGradient
            colors={[...SPECTRUM]}
            locations={SPECTRUM_LOCATIONS}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ height: "100%", width: `${fillGradientWidthPct}%` }}
          />
        </View>
        {TIER_TICKS.map((tick) => (
          <View key={tick} style={[styles.grooveCut, { left: `${tick}%` }]} />
        ))}
      </View>
    </View>
  );
}

/** Dense vertical slots — full color up to pct, muted spectrum after. */
function CutSlotBar({ pct }: { pct: number }): JSX.Element {
  const clamped = Math.max(0, Math.min(100, pct));
  const slotCount = 20;

  return (
    <View style={styles.slotRow}>
      {Array.from({ length: slotCount }, (_, i) => {
        const slotStart = (i / slotCount) * 100;
        const slotMid = ((i + 0.5) / slotCount) * 100;
        const active = clamped >= slotMid;
        const partial = !active && clamped > slotStart;
        const color =
          slotMid < 25
            ? TIER_HEX.overpriced
            : slotMid < 50
              ? TIER_HEX.fairPrice
              : slotMid < 75
                ? TIER_HEX.goodValue
                : TIER_HEX.greatDeal;
        return (
          <View
            key={i}
            style={[
              styles.slot,
              {
                backgroundColor: color,
                // Filled = strong; remaining = same hue, washed out (never empty grey)
                opacity: active ? 1 : partial ? 0.55 : 0.22,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

/** Ruler: cut notches on top edge + fill underneath. */
function CutRulerBar({ pct }: { pct: number }): JSX.Element {
  const clamped = Math.max(1, Math.min(100, pct));
  const fillGradientWidthPct = (100 / clamped) * 100;
  const notches = [0, 10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 100];

  return (
    <View style={styles.rulerWrap}>
      <View style={styles.rulerNotchRow}>
        {notches.map((n) => {
          const major = n === 25 || n === 50 || n === 75 || n === 0 || n === 100;
          return (
            <View
              key={n}
              style={[
                styles.rulerNotch,
                {
                  left: `${n}%`,
                  height: major ? 10 : 5,
                  backgroundColor: major ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.2)",
                },
              ]}
            />
          );
        })}
      </View>
      <View style={styles.rulerTrack}>
        <View style={[styles.barFillClip, { width: `${clamped}%` }]}>
          <LinearGradient
            colors={[...SPECTRUM]}
            locations={SPECTRUM_LOCATIONS}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ height: "100%", width: `${fillGradientWidthPct}%` }}
          />
        </View>
        {TIER_TICKS.map((tick) => (
          <View key={tick} style={[styles.rulerCut, { left: `${tick}%` }]} />
        ))}
      </View>
    </View>
  );
}

function CutDemoBlock({
  title,
  children,
}: {
  title: string;
  children: (pct: number) => React.ReactNode;
}): JSX.Element {
  return (
    <View className="gap-3">
      <Typography type="body-xs" className="text-muted">
        {title}
      </Typography>
      {TIER_DEMOS.map((d) => (
        <View key={d.tier} className="gap-1.5">
          <View className="flex-row items-center justify-between">
            <Typography type="body-xs" style={{ color: TIER_HEX[d.tier] }}>
              {TIER_LABEL[d.tier]}
            </Typography>
            <Typography type="body-xs" weight="semibold" style={{ color: TIER_HEX[d.tier] }}>
              {d.pct}
            </Typography>
          </View>
          {children(d.pct)}
        </View>
      ))}
    </View>
  );
}

/** Temporary A/B — horizontal bars only. Pick a look, then delete this file. */
export function FeedDetailScoreVariants({
  buySignal,
}: FeedDetailScoreVariantsProps): JSX.Element {
  const pct = Math.max(0, Math.min(100, buySignal));
  const tier = getValuationTier(buySignal);
  const hex = TIER_HEX[tier];
  const label = TIER_LABEL[tier];

  return (
    <View className="gap-3">
      <Separator />
      <Typography type="body-sm" weight="semibold" className="text-foreground">
        Horizontal score bars (temporary)
      </Typography>
      <Typography type="body-xs" className="text-muted">
        Sharper tier colors · 4 demos + flame + 4 extra layouts. Listing: {Math.round(pct)}{" "}
        {label}.
      </Typography>

      <VariantCard title="This listing">
        <BarDemoRow pct={Math.round(pct)} tier={tier} />
      </VariantCard>

      <Typography type="body-sm" weight="semibold" className="mt-1 text-foreground">
        Tier demos
      </Typography>

      <VariantCard title="1 · Pass — red (~14)">
        <BarDemoRow pct={TIER_DEMOS[0].pct} tier={TIER_DEMOS[0].tier} />
      </VariantCard>

      <VariantCard title="2 · Fair — orange (~38)">
        <BarDemoRow pct={TIER_DEMOS[1].pct} tier={TIER_DEMOS[1].tier} />
      </VariantCard>

      <VariantCard title="3 · Good — green (~63)">
        <BarDemoRow pct={TIER_DEMOS[2].pct} tier={TIER_DEMOS[2].tier} />
      </VariantCard>

      <VariantCard title="4 · Great — dark green (~88)">
        <BarDemoRow pct={TIER_DEMOS[3].pct} tier={TIER_DEMOS[3].tier} />
      </VariantCard>

      <VariantCard title="5 · Great + crispy flame">
        <View className="gap-2">
          <View className="flex-row items-center justify-between">
            <Typography type="body-xs" className="text-muted">
              Flame at fill tip
            </Typography>
            <Typography type="body-sm" weight="semibold" style={{ color: TIER_HEX.greatDeal }}>
              88 · Great
            </Typography>
          </View>
          <FlameScoreBar pct={88} hex={TIER_HEX.greatDeal} />
        </View>
      </VariantCard>

      <Typography type="body-sm" weight="semibold" className="mt-1 text-foreground">
        Extra layouts
      </Typography>

      <VariantCard title="6 · All 4 tiers stacked">
        <View className="gap-3">
          {TIER_DEMOS.map((d) => (
            <BarDemoRow key={d.tier} pct={d.pct} tier={d.tier} />
          ))}
        </View>
      </VariantCard>

      <VariantCard title="7 · Thick bar + tier ticks">
        <View className="gap-2">
          <View className="flex-row items-center justify-between">
            <Typography type="body-xs" className="text-muted">
              Marks at 25 / 50 / 75
            </Typography>
            <Typography type="body-sm" weight="semibold" style={{ color: TIER_HEX.greatDeal }}>
              88 · Great
            </Typography>
          </View>
          <SmoothScoreBar pct={88} hex={TIER_HEX.greatDeal} height={14} showTicks />
          <View className="flex-row justify-between px-0.5">
            <Typography type="body-xs" style={styles.tickLabel}>
              Pass
            </Typography>
            <Typography type="body-xs" style={styles.tickLabel}>
              Fair
            </Typography>
            <Typography type="body-xs" style={styles.tickLabel}>
              Good
            </Typography>
            <Typography type="body-xs" style={styles.tickLabel}>
              Great
            </Typography>
          </View>
        </View>
      </VariantCard>

      <VariantCard title="8 · Inline score + bar">
        <View className="flex-row items-center gap-3">
          <Typography type="h4" weight="bold" style={{ color: TIER_HEX.fairPrice, minWidth: 36 }}>
            38
          </Typography>
          <View className="min-w-0 flex-1">
            <SmoothScoreBar pct={38} hex={TIER_HEX.fairPrice} height={8} showMarker={false} />
          </View>
          <Typography type="body-sm" weight="semibold" style={{ color: TIER_HEX.fairPrice }}>
            Fair
          </Typography>
        </View>
      </VariantCard>

      <VariantCard title="9 · Soft tip glow (no flame)">
        <View className="gap-2">
          <View className="flex-row items-center justify-between">
            <Typography type="body-xs" className="text-muted">
              Breathing tip glow
            </Typography>
            <Typography type="body-sm" weight="semibold" style={{ color: TIER_HEX.greatDeal }}>
              88 · Great
            </Typography>
          </View>
          <TipGlowBar pct={88} hex={TIER_HEX.greatDeal} />
        </View>
      </VariantCard>

      <Typography type="body-sm" weight="semibold" className="mt-1 text-foreground">
        Cut / segmented (yatay kesikler)
      </Typography>
      <Typography type="body-xs" className="text-muted">
        10–13: gaps, grooves, slots, ruler — each shows all 4 tiers.
      </Typography>

      <VariantCard title="10 · Gapped cells (4 blocks)">
        <CutDemoBlock title="Boşluklu 4 hücre">
          {(p) => <CutGappedBar pct={p} />}
        </CutDemoBlock>
      </VariantCard>

      <VariantCard title="11 · Deep groove cuts">
        <CutDemoBlock title="25 / 50 / 75 derin kesik">
          {(p) => <CutGrooveBar pct={p} />}
        </CutDemoBlock>
      </VariantCard>

      <VariantCard title="12 · Dense slots (muted remainder)">
        <CutDemoBlock title="Dolu = canlı · kalan = aynı renk soluk">
          {(p) => <CutSlotBar pct={p} />}
        </CutDemoBlock>
      </VariantCard>

      <VariantCard title="13 · Ruler notches">
        <CutDemoBlock title="Üst çentikler + bar kesikleri">
          {(p) => <CutRulerBar pct={p} />}
        </CutDemoBlock>
      </VariantCard>
    </View>
  );
}

const styles = StyleSheet.create({
  variantTitle: {
    color: "#1DB954",
    letterSpacing: 0.2,
  },
  barWrap: {
    width: "100%",
    justifyContent: "center",
  },
  barTrack: {
    width: "100%",
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  barGhost: {
    opacity: 0.12,
  },
  barFillClip: {
    height: "100%",
    overflow: "hidden",
    borderRadius: 999,
  },
  tick: {
    position: "absolute",
    top: "50%",
    marginTop: -10,
    marginLeft: -0.5,
    width: 1,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  tickLabel: {
    color: "#8A8A8A",
    fontSize: 10,
  },
  tipGlowWrap: {
    width: "100%",
    minHeight: 28,
    justifyContent: "center",
  },
  tipGlow: {
    position: "absolute",
    top: "50%",
    marginTop: -9,
    marginLeft: -9,
    width: 18,
    height: 18,
    borderRadius: 9,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  marker: {
    position: "absolute",
    top: "50%",
    marginTop: -10,
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
  flameBarWrap: {
    width: "100%",
    minHeight: 52,
    justifyContent: "center",
    paddingTop: 8,
  },
  flameAnchor: {
    position: "absolute",
    top: 0,
    marginLeft: -10,
    width: 20,
    height: 52,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 18,
  },
  flameHalo: {
    position: "absolute",
    bottom: 14,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#f97316",
    shadowColor: "#f97316",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 14,
  },
  flameCore: {
    position: "absolute",
    bottom: 16,
    width: 10,
    height: 14,
    borderRadius: 6,
    backgroundColor: "#fde68a",
    shadowColor: "#fbbf24",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  flameParticle: {
    position: "absolute",
    bottom: 18,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 6,
  },
  cutRow: {
    flexDirection: "row",
    gap: 5,
    width: "100%",
    height: 12,
  },
  cutCell: {
    flex: 1,
    height: "100%",
  },
  cutCellTrack: {
    flex: 1,
    height: "100%",
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  cutCellFill: {
    height: "100%",
    borderRadius: 4,
  },
  grooveWrap: {
    width: "100%",
    height: 14,
    justifyContent: "center",
  },
  grooveTrack: {
    height: 12,
    width: "100%",
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  grooveCut: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 3,
    marginLeft: -1.5,
    backgroundColor: "#121212",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
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
  rulerWrap: {
    width: "100%",
    gap: 2,
  },
  rulerNotchRow: {
    height: 10,
    width: "100%",
    position: "relative",
  },
  rulerNotch: {
    position: "absolute",
    bottom: 0,
    width: 1.5,
    marginLeft: -0.75,
  },
  rulerTrack: {
    height: 10,
    width: "100%",
    borderRadius: 3,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  rulerCut: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 2,
    marginLeft: -1,
    backgroundColor: "#0a0a0a",
  },
});
