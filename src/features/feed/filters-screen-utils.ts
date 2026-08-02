import {
  applyScoreTierSelection,
  clampMinProfit,
  MIN_PROFIT_MAX,
  MIN_PROFIT_MIN,
  MIN_PROFIT_STEP,
  type FeedDisplayPrefs,
  type ScoreTierKey,
} from "@/domain/feed-display-prefs";
import { formatOpenRangeLabel } from "@/features/home/search-bottom-sheet-price-sheet";
import { formatPriceShort } from "@/mocks/services/home";
import type { UserFilter } from "@/models/user-filter";

export const SCORE_TIER_OPTIONS: {
  key: ScoreTierKey;
  label: string;
  swatchClassName: string;
}[] = [
  { key: "showGreat", label: "Great", swatchClassName: "bg-violet-600" },
  { key: "showGood", label: "Good", swatchClassName: "bg-sky-600" },
  { key: "showFair", label: "Fair", swatchClassName: "bg-amber-500" },
  { key: "showBad", label: "Bad", swatchClassName: "bg-red-600" },
];

export {
  applyScoreTierSelection,
  clampMinProfit,
  MIN_PROFIT_MAX,
  MIN_PROFIT_MIN,
  MIN_PROFIT_STEP,
};

export function toSliderValue(next: number | number[]): number | null {
  const value = Array.isArray(next) ? next[0] : next;
  return typeof value === "number" ? value : null;
}

export function formatMinProfitLabel(value: number): string {
  if (value <= 0) return "Any";
  return `$${formatPriceShort(value)}+`;
}

export function displayPrefsSummary(prefs: FeedDisplayPrefs): string {
  const tiers = SCORE_TIER_OPTIONS.filter((option) => prefs[option.key]).map(
    (option) => option.label,
  );
  const scorePart =
    tiers.length === SCORE_TIER_OPTIONS.length
      ? "All scores"
      : tiers.length === 0
        ? "No valuation only"
        : tiers.join(", ");
  return `${formatMinProfitLabel(prefs.minProfit)} · ${scorePart}`;
}

export function filterTypeLabel(filter: UserFilter): string {
  return filter.filterType === "Vehicle" ? "Vehicle" : "Custom";
}

export function keywordCount(filter: UserFilter): number {
  return (filter.titleIncluders?.length ?? 0) + (filter.descriptionIncluders?.length ?? 0);
}

export function priceLabel(filter: UserFilter): string | null {
  const query = filter.filterType === "Vehicle" ? filter.vehicleQuery : filter.customQuery;
  if (query == null || (query.minPrice == null && query.maxPrice == null)) {
    return null;
  }
  return formatOpenRangeLabel(
    query.minPrice != null ? formatPriceShort(query.minPrice) : "",
    query.maxPrice != null ? formatPriceShort(query.maxPrice) : "",
  );
}

export function criteriaLabels(filter: UserFilter): string[] {
  const labels: string[] = [];
  const price = priceLabel(filter);
  if (price != null) labels.push(`Price ${price}`);

  if (filter.filterType === "Vehicle" && filter.vehicleQuery != null) {
    const query = filter.vehicleQuery;
    if (query.minYear != null || query.maxYear != null) {
      labels.push(
        `Year ${formatOpenRangeLabel(
          query.minYear != null ? String(query.minYear) : "",
          query.maxYear != null ? String(query.maxYear) : "",
        )}`,
      );
    }
    if (query.minMileage != null || query.maxMileage != null) {
      labels.push(
        `Mileage ${formatOpenRangeLabel(
          query.minMileage != null ? formatPriceShort(query.minMileage) : "",
          query.maxMileage != null ? formatPriceShort(query.maxMileage) : "",
          { unit: " mi" },
        )}`,
      );
    }
  }

  const keywords = keywordCount(filter);
  if (keywords > 0) {
    labels.push(keywords === 1 ? "1 keyword" : `${keywords} keywords`);
  }
  return labels;
}

export function collapsedSummary(filter: UserFilter): string {
  const labels = criteriaLabels(filter);
  return [filterTypeLabel(filter), ...labels.slice(0, 2)].join(" · ");
}
