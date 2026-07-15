import { BlurView } from "expo-blur";
import type { JSX, ReactNode } from "react";
import { Platform, StyleSheet, View, type ViewProps } from "react-native";

export type GlassIntensity = "feed" | "sheet" | "settings";

const BLUR: Record<GlassIntensity, { ios: number; android: number }> = {
  feed: { ios: 9, android: 6 },
  sheet: { ios: 14, android: 10 },
  settings: { ios: 18, android: 12 },
};

const WASH: Record<GlassIntensity, string> = {
  feed: "rgba(255,255,255,0.02)",
  sheet: "rgba(255,255,255,0.04)",
  settings: "rgba(255,255,255,0.04)",
};

interface GlassSurfaceProps {
  children: ReactNode;
  intensity?: GlassIntensity;
  className?: string;
  style?: ViewProps["style"];
  /** Extra wash over blur (e.g. CTA bar dark scrim). */
  washColor?: string;
  /** When false, no rounded border chrome — parent controls shape. */
  bordered?: boolean;
}

/**
 * Shared soft glass: BlurView + light wash.
 * StyleSheet.absoluteFill kept only here for native BlurView fill.
 */
export function GlassSurface({
  children,
  intensity = "feed",
  className,
  style,
  washColor,
  bordered = true,
}: GlassSurfaceProps): JSX.Element {
  const blur = BLUR[intensity];
  const wash = washColor ?? WASH[intensity];

  return (
    <View
      style={style}
      className={
        bordered
          ? `overflow-hidden rounded-2xl border border-white/12 ${className ?? ""}`
          : `overflow-hidden ${className ?? ""}`
      }
    >
      <BlurView
        intensity={Platform.OS === "ios" ? blur.ios : blur.android}
        tint="dark"
        style={StyleSheet.absoluteFill}
      />
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: wash }]}
      />
      {children}
    </View>
  );
}
