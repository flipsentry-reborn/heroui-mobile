import type { JSX } from "react";
import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

interface ParticleSeed {
  key: string;
  /** 0-1 from left */
  x: number;
  /** 0-1 from top */
  y: number;
  size: number;
  duration: number;
  delay: number;
  driftX: number;
  driftY: number;
}

/** Sparse particles biased to the top-right (HeroUI pricing glow zone). */
const PARTICLE_SEEDS: readonly ParticleSeed[] = Array.from(
  { length: 18 },
  (_, i) => {
    const t = i / 17;
    const x = 0.48 + Math.abs(Math.sin(i * 2.7)) * 0.48;
    const y = Math.abs(Math.cos(i * 1.9)) * 0.5;
    return {
      key: `p-${i}`,
      x,
      y,
      size: 1.5 + (i % 4) * 0.7,
      duration: 2800 + (i % 5) * 700,
      delay: i * 120,
      driftX: -8 - t * 10,
      driftY: 10 + (i % 3) * 6,
    };
  },
);

function MovingParticle({ seed }: { seed: ParticleSeed }): JSX.Element {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      seed.delay,
      withRepeat(
        withSequence(
          withTiming(1, {
            duration: seed.duration,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(0, {
            duration: seed.duration,
            easing: Easing.inOut(Easing.sin),
          }),
        ),
        -1,
        false,
      ),
    );
  }, [progress, seed.delay, seed.duration]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.15 + progress.value * 0.7,
    transform: [
      { translateX: progress.value * seed.driftX },
      { translateY: progress.value * seed.driftY },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          left: `${seed.x * 100}%`,
          top: `${seed.y * 100}%`,
          width: seed.size,
          height: seed.size,
          borderRadius: seed.size,
          backgroundColor: "white",
        },
        style,
      ]}
    />
  );
}

export function SubscriptionParticleField(): JSX.Element {
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        overflow: "hidden",
      }}
    >
      {PARTICLE_SEEDS.map((seed) => (
        <MovingParticle key={seed.key} seed={seed} />
      ))}
    </View>
  );
}
