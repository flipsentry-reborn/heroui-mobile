import type { JSX } from "react";
import { Chip } from "heroui-native";

import { getValuationTier, type ValuationTier } from "@/models/feed";

type ChipColor = "accent" | "default" | "success" | "warning" | "danger";
type BadgeScale = "default" | "detail";

const BADGE_SIZE_CLASS: Record<BadgeScale, string> = {
  default: "h-5 min-h-5 px-1.5 py-0",
  detail: "h-6 min-h-6 px-2 py-0",
};

const BADGE_LABEL_CLASS: Record<BadgeScale, string> = {
  default: "text-[10px] font-normal leading-none",
  detail: "text-xs font-medium leading-[14px]",
};

/**
 * Deal quality (valuation) only - each tier has its own color.
 * Good uses olive-lime for a natural Fair → Good → Great progression.
 */
const TIER_STYLE: Record<
  ValuationTier,
  { label: string; color: ChipColor; chipClass?: string; labelClass?: string }
> = {
  greatDeal: { label: "Great", color: "success" },
  goodValue: {
    label: "Good",
    color: "accent",
    chipClass: "bg-lime-700",
    labelClass: "text-white",
  },
  fairPrice: { label: "Fair", color: "warning" },
  overpriced: { label: "Skip", color: "danger" },
};

interface FeedBadgeProps {
  label: string;
  color: ChipColor;
  scale?: BadgeScale;
  chipClass?: string;
  labelClass?: string;
}

/** Solid Chip badge - same height/type for valuation + status. */
export function FeedBadge({
  label,
  color,
  scale = "default",
  chipClass,
  labelClass,
}: FeedBadgeProps): JSX.Element {
  return (
    <Chip
      size="sm"
      variant="primary"
      color={color}
      className={`${BADGE_SIZE_CLASS[scale]}${chipClass ? ` ${chipClass}` : ""}`}
    >
      <Chip.Label className={`${BADGE_LABEL_CLASS[scale]}${labelClass ? ` ${labelClass}` : ""}`}>
        {label}
      </Chip.Label>
    </Chip>
  );
}

export function ValuationBadge({
  buySignal,
  scale = "default",
}: {
  buySignal: number;
  scale?: BadgeScale;
}): JSX.Element {
  const tier = getValuationTier(buySignal);
  const style = TIER_STYLE[tier];
  return (
    <FeedBadge
      label={style.label}
      color={style.color}
      scale={scale}
      chipClass={style.chipClass}
      labelClass={style.labelClass}
    />
  );
}

/** Negotiable, ASAP, Damaged, Dealer, etc. - shared text-only style. */
export function StatusBadge({
  label,
  scale = "default",
}: {
  label: string;
  scale?: BadgeScale;
}): JSX.Element {
  return (
    <Chip
      size="sm"
      variant="primary"
      color="default"
      className={`${BADGE_SIZE_CLASS[scale]} bg-black/70`}
    >
      <Chip.Label className={`${BADGE_LABEL_CLASS[scale]} text-white`}>{label}</Chip.Label>
    </Chip>
  );
}
