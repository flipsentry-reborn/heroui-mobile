import type { ListingValuation, VehicleTrimEstimate } from "@/models/feed";

/** Catalog of common trims by make|model (lowercase). Always 4 rows for UI demos. */
const TRIM_CATALOG: Record<string, string[]> = {
  "honda|civic": ["LX", "EX", "Sport", "Touring"],
  "honda|accord": ["LX", "Sport", "EX-L", "Touring"],
  "toyota|camry": ["LE", "SE", "XSE", "XLE"],
  "ford|f-150": ["XL", "XLT", "Lariat", "Platinum"],
  "subaru|outback": ["Premium", "Limited", "Touring", "Wilderness"],
  "bmw|3 series": ["330i", "330i xDrive", "M340i", "M340i xDrive"],
  "jeep|wrangler": [
    "Sport",
    "Unlimited Sport",
    "Sahara",
    "Rubicon",
  ],
};

const DEFAULT_TRIMS = ["Base", "Sport", "Premium", "Limited"];

/** Relative fair-price multipliers vs the listing’s current-trim fairPrice. */
const PRICE_OFFSETS = [-0.12, 0, 0.08, 0.18] as const;

function catalogKey(make: string, model: string): string {
  return `${make.trim().toLowerCase()}|${model.trim().toLowerCase()}`;
}

function slug(trim: string): string {
  return trim
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Prefer API/mock `valuation.trimEstimates`; otherwise build 4 sibling trims
 * around the listing’s fairPrice for car detail demos.
 */
export function resolveTrimEstimates(
  valuation: ListingValuation,
): VehicleTrimEstimate[] {
  if (valuation.valuationType != null && valuation.valuationType !== "car") {
    return [];
  }
  if (valuation.trimEstimates != null && valuation.trimEstimates.length > 0) {
    return valuation.trimEstimates;
  }

  const key = catalogKey(valuation.make, valuation.model);
  const catalog = [...(TRIM_CATALOG[key] ?? DEFAULT_TRIMS)];
  const currentLabel = valuation.trim?.trim() || catalog[1] || catalog[0];

  // Keep current trim in the list (replace closest slot if needed).
  if (!catalog.some((t) => t.toLowerCase() === currentLabel.toLowerCase())) {
    catalog[1] = currentLabel;
  }

  const currentIndex = catalog.findIndex(
    (t) => t.toLowerCase() === currentLabel.toLowerCase(),
  );
  const base = valuation.fairPrice;

  return catalog.slice(0, 4).map((trim, index) => {
    const isCurrent = index === currentIndex;
    const multiplier = isCurrent ? 1 : 1 + PRICE_OFFSETS[index];
    const fairPrice = isCurrent
      ? base
      : Math.round((base * multiplier) / 50) * 50;

    return {
      id: `${slug(valuation.make)}-${slug(valuation.model)}-${slug(trim)}`,
      trim,
      fairPrice,
      isCurrent,
      note: isCurrent
        ? `This listing · ${valuation.compCount} comps · ${valuation.mileageLow.toLocaleString()}–${valuation.mileageHigh.toLocaleString()} mi`
        : `Est. for ${valuation.year} ${valuation.make} ${valuation.model} ${trim}`,
    };
  });
}
