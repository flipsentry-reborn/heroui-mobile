import type { JSX } from "react";
import { Chip } from "heroui-native";

import { getValuationTier, type ValuationTier } from "@/models/feed";

type BadgeScale = "default" | "detail";

const BADGE_SIZE_CLASS: Record<BadgeScale, string> = {
  default:
    "h-[21px] min-h-[21px] max-h-[21px] items-center justify-center rounded-md px-1 py-0",
  detail:
    "h-6 min-h-6 max-h-6 items-center justify-center rounded-md px-1.5 py-0",
};

const BADGE_LABEL_CLASS: Record<BadgeScale, string> = {
  default: "text-[11px] font-medium leading-none !text-white",
  detail: "text-[13px] font-medium leading-none !text-white",
};

/**
 * Deal quality (valuation) only - each tier has its own color.
 * Good uses olive-lime for a natural Fair → Good → Great progression.
 * Backgrounds are translucent so they sit softer on listing photos.
 * Label text is always white.
 */
const TIER_BG: Record<ValuationTier, string> = {
  greatDeal: "!bg-green-600/75",
  goodValue: "!bg-lime-700/75",
  fairPrice: "!bg-amber-500/75",
  overpriced: "!bg-red-600/75",
};

const TIER_LABEL: Record<ValuationTier, string> = {
  greatDeal: "Great",
  goodValue: "Good",
  fairPrice: "Fair",
  overpriced: "Skip",
};

interface FeedBadgeProps {
  label: string;
  scale?: BadgeScale;
  /** Background only — sizing/type are shared. */
  chipClass: string;
}

/** Shared Chip shell — valuation + status use identical size/type. */
export function FeedBadge({
  label,
  scale = "default",
  chipClass,
}: FeedBadgeProps): JSX.Element {
  return (
    <Chip
      size="sm"
      variant="primary"
      color="default"
      className={`${BADGE_SIZE_CLASS[scale]} ${chipClass}`}
    >
      <Chip.Label className={BADGE_LABEL_CLASS[scale]}>{label}</Chip.Label>
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
  return (
    <FeedBadge
      label={TIER_LABEL[tier]}
      scale={scale}
      chipClass={TIER_BG[tier]}
    />
  );
}

/** Negotiable, ASAP, Damaged, Dealer, etc. — same shell, different bg. */
export function StatusBadge({
  label,
  scale = "default",
}: {
  label: string;
  scale?: BadgeScale;
}): JSX.Element {
  return <FeedBadge label={label} scale={scale} chipClass="!bg-black/60" />;
}
