import { observer } from "mobx-react-lite";
import type { JSX } from "react";
import { useMemo } from "react";
import { View } from "react-native";
import { Chip } from "heroui-native";

import { getValuationTier, type ValuationTier } from "@/models/feed";
import type { FeedFilterSummary } from "@/models/user-filter";
import { useStore } from "@/store/store";

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

const FILTER_DOT_SIZE_CLASS: Record<BadgeScale, string> = {
  default: "h-2 w-2",
  detail: "h-2.5 w-2.5",
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

export function ValuationTierBadge({
  tier,
  scale = "default",
}: {
  tier: ValuationTier;
  scale?: BadgeScale;
}): JSX.Element {
  return (
    <FeedBadge
      label={TIER_LABEL[tier]}
      scale={scale}
      chipClass={TIER_BG[tier]}
      labelClass={TIER_TEXT[tier]}
    />
  );
}

export function ValuationBadge({
  buySignal,
  scale = "default",
}: {
  buySignal: number;
  scale?: BadgeScale;
}): JSX.Element {
  return <ValuationTierBadge tier={getValuationTier(buySignal)} scale={scale} />;
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

/** Sold-page profit amount — soft green shell, same size/type as status. */
export function ProfitBadge({
  label,
  scale = "default",
}: {
  label: string;
  scale?: BadgeScale;
}): JSX.Element {
  return (
    <FeedBadge
      label={label}
      scale={scale}
      chipClass="!bg-emerald-600/80"
      labelClass="!text-emerald-100"
    />
  );
}

/** Filter match chip — Negotiable shell + color dots + count label. */
export const FilterMatchBadge = observer(function FilterMatchBadge({
  filters,
  scale = "default",
}: {
  filters: FeedFilterSummary[];
  scale?: BadgeScale;
}): JSX.Element | null {
  const { filterStore } = useStore();

  const visible = useMemo(() => {
    if (!filterStore.hasLoaded) return filters;
    const activeIds = new Set(filterStore.activeFilters.map((f) => f.id));
    return filters.filter((f) => activeIds.has(f.id));
  }, [filterStore.activeFilters, filterStore.hasLoaded, filters]);

  const count = visible.length;
  if (count === 0) return null;

  const ordered = [...visible].sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
  const colors = ordered.slice(0, 3).map((f) => f.color);
  const label =
    count === 1 ? "1 filter match" : `${count} filter matches`;

  return (
    <Chip
      size="sm"
      variant="primary"
      color="default"
      className={`${BADGE_SIZE_CLASS[scale]} gap-1 !bg-black/75`}
    >
      <View className="flex-row items-center gap-0.5">
        {colors.map((color, index) => (
          <View
            key={`${color}-${index}`}
            className={`${FILTER_DOT_SIZE_CLASS[scale]} rounded-full border border-white/80`}
            style={{ backgroundColor: color }}
          />
        ))}
      </View>
      <Chip.Label
        className={`${BADGE_LABEL_SIZE_CLASS[scale]} !text-white`}
      >
        {label}
      </Chip.Label>
    </Chip>
  );
});
