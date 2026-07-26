import type { JSX } from "react";
import { Chip } from "heroui-native";

import { getValuationTier, type ValuationTier } from "@/models/feed";

type BadgeScale = "default" | "detail";

const BADGE_SIZE_CLASS: Record<BadgeScale, string> = {
  default:
    "h-5 min-h-5 max-h-5 items-center justify-center rounded-md px-1 py-0",
  detail:
    "h-6 min-h-6 max-h-6 items-center justify-center rounded-md px-1.5 py-0",
};

const BADGE_LABEL_SIZE_CLASS: Record<BadgeScale, string> = {
  default: "text-xs font-extrabold leading-none",
  detail: "text-sm font-extrabold leading-none",
};

/**
 * Deal quality (valuation) only - each tier has its own color.
 * Bad → Fair (amber) → Good (sky / dark blue) → Great (violet).
 * Mid-tone backgrounds; label text uses a soft matching tint (not pure white).
 */
const TIER_BG: Record<ValuationTier, string> = {
  greatDeal: "!bg-violet-600/85",
  goodValue: "!bg-sky-600/85",
  fairPrice: "!bg-amber-500/85",
  overpriced: "!bg-red-600/85",
};

const TIER_TEXT: Record<ValuationTier, string> = {
  greatDeal: "!text-violet-100",
  goodValue: "!text-sky-100",
  fairPrice: "!text-amber-100",
  overpriced: "!text-red-100",
};

const TIER_LABEL: Record<ValuationTier, string> = {
  greatDeal: "Great",
  goodValue: "Good",
  fairPrice: "Fair",
  overpriced: "Bad",
};

interface FeedBadgeProps {
  label: string;
  scale?: BadgeScale;
  /** Background only — sizing/type are shared. */
  chipClass: string;
  /** Label color — defaults to white (status badges on photos). */
  labelClass?: string;
}

/** Shared Chip shell — valuation + status use identical size/type. */
export function FeedBadge({
  label,
  scale = "default",
  chipClass,
  labelClass = "!text-white",
}: FeedBadgeProps): JSX.Element {
  return (
    <Chip
      size="sm"
      variant="primary"
      color="default"
      className={`${BADGE_SIZE_CLASS[scale]} ${chipClass}`}
    >
      <Chip.Label
        className={`${BADGE_LABEL_SIZE_CLASS[scale]} ${labelClass}`}
      >
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
  return (
    <FeedBadge
      label={TIER_LABEL[tier]}
      scale={scale}
      chipClass={TIER_BG[tier]}
      labelClass={TIER_TEXT[tier]}
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
  return <FeedBadge label={label} scale={scale} chipClass="!bg-black/75" />;
}
