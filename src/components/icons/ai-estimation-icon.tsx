import { Image, type ImageRef } from "expo-image";
import { memo, type JSX } from "react";
import type { ImageStyle } from "react-native";

/**
 * Bundled AI sparkle used on feed cards + detail. Kept as one require so Metro
 * shares a single module across screens.
 */
export const AI_ESTIMATION_ASSET =
  require("../../../assets/images/ai-estimation-2.png") as number;

/** Max on-screen size is 20pt; decode at 3x so we never keep a larger bitmap. */
const DECODE_MAX_PX = 60;

const SIZE_STYLE: Record<15 | 16 | 18 | 20, ImageStyle> = {
  15: { width: 15, height: 15 },
  16: { width: 16, height: 16 },
  18: { width: 18, height: 18 },
  20: { width: 20, height: 20 },
};

/** Native decoded ref after {@link prefetchAiEstimationIcon}; null until boot. */
let decodedRef: ImageRef | null = null;
let loadPromise: Promise<ImageRef | null> | null = null;

/**
 * Decode once into memory before the first feed paint (call from root boot).
 * Subsequent renders reuse the same ImageRef — no per-row decode.
 */
export function prefetchAiEstimationIcon(): Promise<ImageRef | null> {
  if (decodedRef) return Promise.resolve(decodedRef);
  if (!loadPromise) {
    loadPromise = Image.loadAsync(AI_ESTIMATION_ASSET, {
      maxWidth: DECODE_MAX_PX,
      maxHeight: DECODE_MAX_PX,
    })
      .then((ref) => {
        decodedRef = ref;
        return ref;
      })
      .catch(() => {
        loadPromise = null;
        return null;
      });
  }
  return loadPromise;
}

export type AiEstimationIconSize = keyof typeof SIZE_STYLE;

interface AiEstimationIconProps {
  /** Display size in points. Prefer the known sizes so style objects stay stable. */
  size?: AiEstimationIconSize;
}

/**
 * Hot-path decorative icon for AI fair-price labels.
 * Uses a pre-decoded ImageRef when available, memory cache, and no transition
 * so recycled FlashList cells do not flash or re-decode.
 */
export const AiEstimationIcon = memo(function AiEstimationIcon({
  size = 16,
}: AiEstimationIconProps): JSX.Element {
  return (
    <Image
      source={decodedRef ?? AI_ESTIMATION_ASSET}
      style={SIZE_STYLE[size]}
      contentFit="contain"
      cachePolicy="memory"
      recyclingKey="ai-estimation"
      transition={0}
      priority="low"
      pointerEvents="none"
      accessible={false}
      importantForAccessibility="no"
    />
  );
});
