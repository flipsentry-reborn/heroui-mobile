import type { JSX } from "react";
import { StyleSheet, View } from "react-native";
import { Typography } from "heroui-native";

interface FeedDetailScoreBarProps {
  buySignal: number;
  iphoneModel?: string;
  storageGb?: number;
  batteryHealth?: number;
  compCount?: number;
  valuationType?: "car" | "iphone";
}

export function FeedDetailScoreBar({
  buySignal,
  iphoneModel,
  storageGb,
  batteryHealth,
  compCount,
  valuationType,
}: FeedDetailScoreBarProps): JSX.Element {
  const pct = Math.max(0, Math.min(100, buySignal));

  return (
    <View className="gap-1.5">
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

      <View style={styles.track}>
        <View style={[styles.seg, { backgroundColor: "#dc2626" }]} />
        <View style={[styles.seg, { backgroundColor: "#d97706" }]} />
        <View style={[styles.seg, { backgroundColor: "#4ade80" }]} />
        <View style={[styles.seg, { backgroundColor: "#047857" }]} />
      </View>
      <View style={styles.arrowRow}>
        <View style={[styles.arrowWrap, { left: `${pct}%` }]}>
          <View style={styles.arrow} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    height: 6,
    borderRadius: 4,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#3f3f46",
  },
  seg: {
    flex: 1,
  },
  arrowRow: {
    height: 10,
    position: "relative",
  },
  arrowWrap: {
    position: "absolute",
    marginLeft: -5,
    top: 0,
    alignItems: "center",
  },
  arrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 7,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#ffffff",
  },
});
