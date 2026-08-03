import type { JSX } from "react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { Typography, useThemeColor } from "heroui-native";

import {
  clampMinProfit,
  MIN_PROFIT_MAX,
  MIN_PROFIT_MIN,
  MIN_PROFIT_STEP,
} from "@/domain/feed-display-prefs";

const THUMB_SIZE = 22;
const HIT_SLOP = 20;

function formatAmount(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}

export function formatMinProfitLabel(value: number): string {
  if (value <= 0) return "Any";
  return `${formatAmount(value)}+`;
}

interface MinProfitSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

/**
 * Gesture + Reanimated slider — thumb/fill move on the UI thread so the
 * HeroUI controlled Slider lag (step=1 over a wide range in a sheet) is gone.
 */
export function MinProfitSlider({
  value,
  onChange,
  min = MIN_PROFIT_MIN,
  max = MIN_PROFIT_MAX,
  step = MIN_PROFIT_STEP,
}: MinProfitSliderProps): JSX.Element {
  const [accent, border, mutedTrack] = useThemeColor([
    "accent",
    "border",
    "default",
  ]);

  const trackWidth = useSharedValue(0);
  const progress = useSharedValue(0);
  const lastEmitted = useSharedValue(Number.NaN);
  const minSV = useSharedValue(min);
  const maxSV = useSharedValue(max);
  const stepSV = useSharedValue(step);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    minSV.value = min;
    maxSV.value = max;
    stepSV.value = step;
  }, [max, maxSV, min, minSV, step, stepSV]);

  useEffect(() => {
    const bounded = Math.min(max, Math.max(min, clampMinProfit(value)));
    const range = Math.max(1, max - min);
    progress.value = (bounded - min) / range;
    lastEmitted.value = bounded;
  }, [lastEmitted, max, min, progress, value]);

  const emit = useCallback((next: number) => {
    onChangeRef.current(next);
  }, []);

  const gesture = useMemo(() => {
    return Gesture.Pan()
      .activeOffsetX([-2, 2])
      .failOffsetY([-16, 16])
      .hitSlop(HIT_SLOP)
      .onBegin((e) => {
        const width = trackWidth.value;
        if (width <= 0) return;
        const p = Math.min(1, Math.max(0, e.x / width));
        progress.value = p;
        const range = Math.max(1, maxSV.value - minSV.value);
        const raw = minSV.value + p * range;
        const stepped = Math.round(raw / stepSV.value) * stepSV.value;
        const bounded = Math.min(
          maxSV.value,
          Math.max(minSV.value, stepped),
        );
        if (bounded === lastEmitted.value) return;
        lastEmitted.value = bounded;
        runOnJS(emit)(bounded);
      })
      .onUpdate((e) => {
        const width = trackWidth.value;
        if (width <= 0) return;
        const p = Math.min(1, Math.max(0, e.x / width));
        progress.value = p;
        const range = Math.max(1, maxSV.value - minSV.value);
        const raw = minSV.value + p * range;
        const stepped = Math.round(raw / stepSV.value) * stepSV.value;
        const bounded = Math.min(
          maxSV.value,
          Math.max(minSV.value, stepped),
        );
        if (bounded === lastEmitted.value) return;
        lastEmitted.value = bounded;
        runOnJS(emit)(bounded);
      });
  }, [emit, lastEmitted, maxSV, minSV, progress, stepSV, trackWidth]);

  const fillStyle = useAnimatedStyle(() => ({
    width: Math.max(0, progress.value * trackWidth.value),
  }));

  const thumbStyle = useAnimatedStyle(() => {
    const width = trackWidth.value;
    const maxX = Math.max(0, width - THUMB_SIZE);
    const x = Math.min(maxX, Math.max(0, progress.value * width - THUMB_SIZE / 2));
    return {
      transform: [{ translateX: x }],
    };
  });

  return (
    <View className="gap-2">
      <GestureDetector gesture={gesture}>
        <View
          className="justify-center py-3"
          onLayout={(e) => {
            trackWidth.value = e.nativeEvent.layout.width;
          }}
          accessibilityRole="adjustable"
          accessibilityLabel="Minimum profit"
          accessibilityValue={{
            min,
            max,
            now: value,
            text: formatMinProfitLabel(value),
          }}
        >
          <View
            className="h-1.5 w-full overflow-hidden rounded-full"
            style={{ backgroundColor: mutedTrack || "#e5e5e5" }}
          >
            <Animated.View
              className="h-full rounded-full"
              style={[{ backgroundColor: accent || "#000" }, fillStyle]}
            />
          </View>
          <Animated.View
            className="absolute top-1/2 rounded-full border-2"
            style={[
              {
                width: THUMB_SIZE,
                height: THUMB_SIZE,
                marginTop: -THUMB_SIZE / 2,
                backgroundColor: accent || "#000",
                borderColor: border || "#fff",
              },
              thumbStyle,
            ]}
          />
        </View>
      </GestureDetector>
      <View className="flex-row justify-between">
        <Typography type="body-xs" className="text-muted">
          {formatAmount(min)}
        </Typography>
        <Typography type="body-xs" className="text-muted">
          {formatAmount(max)}
        </Typography>
      </View>
    </View>
  );
}
