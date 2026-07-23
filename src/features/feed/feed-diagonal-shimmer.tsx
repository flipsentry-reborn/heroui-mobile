import { LinearGradient } from "expo-linear-gradient";
import type { JSX } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

/** Delay before the diagonal sweep starts (lets the card land first). */
const SHIMMER_DELAY_MS = 300;
/** One top-left → bottom-right pass. */
const SHIMMER_DURATION_MS = 700;

type FeedDiagonalShimmerProps = {
  active: boolean;
  onDone?: () => void;
};

/**
 * Skeleton-style highlight, but diagonal (HeroUI Skeleton is horizontal-only).
 * Sweeps top-left → bottom-right over the feed image.
 * One-shot per activation: parent re-renders / layout noise cannot restart it.
 */
export function FeedDiagonalShimmer({
  active,
  onDone,
}: FeedDiagonalShimmerProps): JSX.Element | null {
  const progress = useSharedValue(0);
  const widthSV = useSharedValue(0);
  const heightSV = useSharedValue(0);
  const [hasSize, setHasSize] = useState(false);
  const startedRef = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const notifyDone = useCallback(() => {
    onDoneRef.current?.();
  }, []);

  useEffect(() => {
    if (!active) {
      cancelAnimation(progress);
      progress.value = 0;
      startedRef.current = false;
      return;
    }

    if (!hasSize || startedRef.current) return;

    startedRef.current = true;
    progress.value = 0;
    progress.value = withDelay(
      SHIMMER_DELAY_MS,
      withTiming(
        1,
        {
          duration: SHIMMER_DURATION_MS,
          easing: Easing.inOut(Easing.quad),
        },
        (finished) => {
          if (finished) {
            runOnJS(notifyDone)();
          }
        },
      ),
    );
  }, [active, hasSize, notifyDone, progress]);

  const bandStyle = useAnimatedStyle(() => {
    const w = widthSV.value;
    const h = heightSV.value;
    const travel = Math.sqrt(w * w + h * h) + w * 0.55;
    const t = progress.value * travel - travel * 0.5;
    // Equal X/Y = 45° path (top-left → bottom-right)
    return {
      width: w * 0.45 || 1,
      height: (h || 160) * 2.4,
      transform: [
        { translateX: t * 0.7071 },
        { translateY: t * 0.7071 },
        { rotate: "45deg" },
      ],
    };
  });

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width <= 0 || height <= 0) return;
    if (widthSV.value === width && heightSV.value === height) return;
    widthSV.value = width;
    heightSV.value = height;
    if (!hasSize) setHasSize(true);
  };

  if (!active) return null;

  return (
    <View
      pointerEvents="none"
      onLayout={onLayout}
      className="absolute inset-0 overflow-hidden rounded-lg"
    >
      <Animated.View
        className="absolute"
        style={[
          {
            top: "-70%",
            left: "-10%",
          },
          bandStyle,
        ]}
      >
        <LinearGradient
          colors={[
            "transparent",
            "rgba(255,255,255,0.55)",
            "transparent",
          ]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
}
