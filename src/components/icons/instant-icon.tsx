import { Ionicons } from "@expo/vector-icons";
import type { JSX } from "react";
import { withUniwind } from "uniwind";

/** Matches location sheet Instant speed affordance. */
export const INSTANT_YELLOW = "#eab308";

const StyledIonicons = withUniwind(Ionicons);

type InstantIconProps = {
  size?: number;
  className?: string;
  color?: string;
};

/** Shared Instant (60s) affordance — rocket, not flash/bolt. */
export function InstantIcon({
  size = 14,
  className,
  color = INSTANT_YELLOW,
}: InstantIconProps): JSX.Element {
  if (className != null) {
    return (
      <StyledIonicons name="rocket" size={size} className={className} />
    );
  }
  return <Ionicons name="rocket" size={size} color={color} />;
}

export function isInstantInterval(seconds: number): boolean {
  return seconds === 60;
}

export function featureMentionsInstant(feature: string): boolean {
  return /\binstant\b/i.test(feature);
}
