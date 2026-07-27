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
  baseOpacity: number;
  peakOpacity: number;
  isAccent: boolean;
  hasHalo: boolean;
}

export type ParticleDensity = "standard" | "rich";

function createParticleSeeds(count: number, density: ParticleDensity): readonly ParticleSeed[] {
  return Array.from({ length: count }, (_, i) => {
    const t = i / Math.max(count - 1, 1);
    const isAmbient = density === "rich" && i >= Math.floor(count * 0.68);
    const x = isAmbient
      ? 0.08 + Math.abs(Math.sin(i * 2.17)) * 0.84
      : 0.38 + Math.abs(Math.sin(i * 2.7)) * 0.58;
    const y = isAmbient
      ? 0.42 + Math.abs(Math.cos(i * 1.43)) * 0.46
      : 0.025 + Math.abs(Math.cos(i * 1.9)) * 0.54;

    return {
      key: `${density}-${i}`,
      x,
      y,
      size: 1.1 + (i % 5) * 0.55,
      duration: 3000 + (i % 6) * 620,
      delay: i * 95,
      driftX: -7 - t * 14,
      driftY: 8 + (i % 4) * 5,
      baseOpacity: 0.1 + (i % 3) * 0.035,
      peakOpacity: 0.48 + (i % 4) * 0.11,
      isAccent: i % 4 === 0,
      hasHalo: density === "rich" && i % 9 === 0,
    };
  });
}

/** Standard is restrained for compact cards; rich fills full pricing cards. */
const STANDARD_PARTICLE_SEEDS = createParticleSeeds(18, "standard");
const RICH_PARTICLE_SEEDS = createParticleSeeds(32, "rich");

function MovingParticle({
  seed,
  accentColor,
}: {
  seed: ParticleSeed;
  accentColor?: string;
}): JSX.Element {
  const progress = useSharedValue(0);
  const color = seed.isAccent && accentColor ? accentColor : "#FFFFFF";

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
          })
        ),
        -1,
        false
      )
    );
  }, [progress, seed.delay, seed.duration]);

  const style = useAnimatedStyle(() => ({
    opacity: seed.baseOpacity + progress.value * (seed.peakOpacity - seed.baseOpacity),
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
          backgroundColor: color,
        },
        style,
      ]}
    >
      {seed.hasHalo ? (
        <View
          className="absolute rounded-full"
          style={{
            left: -seed.size * 1.5,
            top: -seed.size * 1.5,
            width: seed.size * 4,
            height: seed.size * 4,
            backgroundColor: color,
            opacity: 0.16,
          }}
        />
      ) : null}
    </Animated.View>
  );
}

export function SubscriptionParticleField({
  density = "standard",
  accentColor,
}: {
  density?: ParticleDensity;
  accentColor?: string;
}): JSX.Element {
  const seeds = density === "rich" ? RICH_PARTICLE_SEEDS : STANDARD_PARTICLE_SEEDS;

  return (
    <View pointerEvents="none" className="absolute inset-0 overflow-hidden">
      {seeds.map((seed) => (
        <MovingParticle key={seed.key} seed={seed} accentColor={accentColor} />
      ))}
    </View>
  );
}
