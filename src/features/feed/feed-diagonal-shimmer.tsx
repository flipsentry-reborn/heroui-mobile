import { LinearGradient } from "expo-linear-gradient";
import type { JSX } from "react";
import { useEffect, useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import Animated, {
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
 */
export function FeedDiagonalShimmer({
  active,
  onDone,
}: FeedDiagonalShimmerProps): JSX.Element | null {
  const progress = useSharedValue(0);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    if (!active || size.w === 0 || size.h === 0) {
      progress.value = 0;
      return;
    }

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
          if (finished && onDone) {
            runOnJS(onDone)();
          }
        },
      ),
    );
  }, [active, onDone, progress, size.h, size.w]);

  const bandStyle = useAnimatedStyle(() => {
    const travel = Math.sqrt(size.w * size.w + size.h * size.h) + size.w * 0.55;
    const t = progress.value * travel - travel * 0.5;
    // Equal X/Y = 45° path (top-left → bottom-right)
    return {
      transform: [
        { translateX: t * 0.7071 },
        { translateY: t * 0.7071 },
        { rotate: "45deg" },
      ],
    };
  });

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width === size.w && height === size.h) return;
    setSize({ w: width, h: height });
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
            width: size.w * 0.45 || "40%",
            height: (size.h || 160) * 2.4,
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
