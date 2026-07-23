import { useId, useState, type JSX } from "react";
import { Dimensions, View, type LayoutChangeEvent } from "react-native";
import Svg, { ClipPath, Defs, G, Polygon, Rect } from "react-native-svg";
import { Typography, useThemeColor } from "heroui-native";

import { getValuationTier, type ValuationTier } from "@/models/feed";

const TIER_ORDER: ValuationTier[] = ["overpriced", "fairPrice", "goodValue", "greatDeal"];

/** Matches the tier-cut rotate angle. */
const CUT_DEG = 18;

/** Tailwind lime-700 — Good tier (no theme token). */
const GOOD_VALUE_FILL = "#4d7c0f";

/** Detail page horizontal padding estimate so fill paints before onLayout. */
const ESTIMATED_BAR_WIDTH = Math.max(200, Dimensions.get("window").width - 32);

const TIER_LABEL: Record<ValuationTier, string> = {
  greatDeal: "Great",
  goodValue: "Good",
  fairPrice: "Fair",
  overpriced: "Bad",
};

const TIER_TRACK_CLASS: Record<ValuationTier, string> = {
  greatDeal: "bg-success",
  goodValue: "bg-lime-700",
  fairPrice: "bg-warning",
  overpriced: "bg-danger",
};

interface FeedDetailScoreBarProps {
  buySignal: number;
  iphoneModel?: string;
  storageGb?: number;
  batteryHealth?: number;
  compCount?: number;
  valuationType?: "car" | "iphone" | "samsung";
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
  const barH = compact ? "h-2" : "h-2.5";
  const barHeightPx = compact ? 8 : 10;
  const cutH = compact ? "h-3.5 -top-0.5" : "h-5 -top-1";
  const cutBg = compact ? "bg-surface-secondary" : "bg-background";
  const clipId = `score-fill-${useId().replace(/:/g, "")}`;

  const [success, warning, danger] = useThemeColor(["success", "warning", "danger"]);
  // Fallbacks so fill never waits on theme token resolution.
  const tierFill: Record<ValuationTier, string> = {
    greatDeal: success || "#22c55e",
    goodValue: GOOD_VALUE_FILL,
    fairPrice: warning || "#eab308",
    overpriced: danger || "#ef4444",
  };

  // Seed size so the filled score is visible on first paint (not after layout).
  const [size, setSize] = useState({
    width: ESTIMATED_BAR_WIDTH,
    height: barHeightPx,
  });
  const onBarLayout = (event: LayoutChangeEvent): void => {
    const { width, height } = event.nativeEvent.layout;
    setSize((prev) =>
      prev.width === width && prev.height === height ? prev : { width, height },
    );
  };

  const fillW = (pct / 100) * size.width;
  /** Half-projection of an 18° cut across bar height — centers the tip on `pct`. */
  const diag = (size.height / 2) * Math.tan((CUT_DEG * Math.PI) / 180);
  // RN +svg is clockwise → vertical cut leans `/` (top-right → bottom-left).
  const tipTop = pct >= 100 ? size.width : Math.min(size.width, fillW + diag);
  const tipBottom = pct >= 100 ? size.width : Math.max(0, fillW - diag);
  /** Darker band width along the tip so the finish reads clearly. */
  const tipBand = compact ? 3.5 : 5;

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
        className={`relative w-full overflow-hidden rounded-sm ${barH}`}
        onLayout={onBarLayout}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}
        accessibilityLabel={`Deal score: ${TIER_LABEL[tier]}`}
      >
        {/* Muted track */}
        <View className="absolute inset-0 flex-row">
          {TIER_ORDER.map((itemTier) => (
            <View key={itemTier} className="relative flex-1 overflow-hidden">
              <View
                className={`absolute inset-0 ${TIER_TRACK_CLASS[itemTier]}`}
                style={{ opacity: 0.12 }}
              />
            </View>
          ))}
        </View>

        {/* Solid fill clipped to a diagonal tip — paints immediately via seeded size */}
        {pct > 0 ? (
          <Svg
            width={size.width}
            height={size.height}
            className="absolute inset-0"
            pointerEvents="none"
          >
            <Defs>
              <ClipPath id={clipId}>
                <Polygon
                  points={`0,0 ${tipTop},0 ${tipBottom},${size.height} 0,${size.height}`}
                />
              </ClipPath>
            </Defs>
            <G clipPath={`url(#${clipId})`}>
              {TIER_ORDER.map((itemTier, index) => (
                <Rect
                  key={itemTier}
                  x={(index / TIER_ORDER.length) * size.width}
                  y={0}
                  width={size.width / TIER_ORDER.length}
                  height={size.height}
                  fill={tierFill[itemTier]}
                />
              ))}
              {/* Thick darker tip — makes the diagonal finish obvious */}
              {pct < 100 ? (
                <Polygon
                  points={[
                    `${Math.max(0, tipTop - tipBand)},0`,
                    `${tipTop},0`,
                    `${tipBottom},${size.height}`,
                    `${Math.max(0, tipBottom - tipBand)},${size.height}`,
                  ].join(" ")}
                  fill="rgba(255,255,255,0.55)"
                />
              ) : null}
            </G>
          </Svg>
        ) : null}

        {[25, 50, 75].map((position) => (
          <View
            key={position}
            className={`absolute w-1 ${cutBg} ${cutH}`}
            style={{
              left: `${position}%`,
              transform: [{ translateX: -2 }, { rotate: `${CUT_DEG}deg` }],
            }}
          />
        ))}
      </View>
    </View>
  );
}
