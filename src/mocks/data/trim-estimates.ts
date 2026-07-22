import type { ListingValuation, VehicleTrimEstimate } from "@/models/feed";

/**
 * Real 2019 Honda Civic vehicleOptions from vehicle estimation API
 * (analysis.vehicleOptions). Selected = EX Sedan 4D.
 */
export const CIVIC_2019_VEHICLE_OPTIONS: VehicleTrimEstimate[] = [
  {
    make: "Honda",
    model: "Civic",
    trim: "EX Sedan 4D",
    modelId: "123",
    vehicleId: "438961",
    matchScore: 0.4833,
    isSelected: true,
    hasPricing: true,
    marketplace: { min: 18040, median: 19140, max: 20240 },
  },
  {
    make: "Honda",
    model: "Civic",
    trim: "EX-L Sedan 4D",
    modelId: "123",
    vehicleId: "438995",
    matchScore: 0.4,
    isSelected: false,
    hasPricing: true,
    marketplace: { min: 17640, median: 18590, max: 19590 },
  },
  {
    make: "Honda",
    model: "Civic",
    trim: "Sport Touring Hatchback 4D",
    modelId: "123",
    vehicleId: "439525",
    matchScore: null,
    isSelected: false,
    hasPricing: true,
    marketplace: { min: 20140, median: 21240, max: 22390 },
  },
  {
    make: "Honda",
    model: "Civic",
    trim: "Si Coupe 2D",
    modelId: "123",
    vehicleId: "439620",
    matchScore: null,
    isSelected: false,
    hasPricing: true,
    marketplace: { min: 19830, median: 21180, max: 22480 },
  },
  {
    make: "Honda",
    model: "Civic",
    trim: "Si Sedan 4D",
    modelId: "123",
    vehicleId: "439544",
    matchScore: null,
    isSelected: false,
    hasPricing: true,
    marketplace: { min: 19560, median: 21060, max: 22510 },
  },
  {
    make: "Honda",
    model: "Civic",
    trim: "Touring Sedan 4D",
    modelId: "123",
    vehicleId: "438996",
    matchScore: null,
    isSelected: false,
    hasPricing: true,
    marketplace: { min: 17550, median: 18450, max: 19350 },
  },
  {
    make: "Honda",
    model: "Civic",
    trim: "Touring Coupe 2D",
    modelId: "123",
    vehicleId: "438994",
    matchScore: null,
    isSelected: false,
    hasPricing: true,
    marketplace: { min: 17090, median: 18190, max: 19290 },
  },
  {
    make: "Honda",
    model: "Civic",
    trim: "EX Hatchback 4D",
    modelId: "123",
    vehicleId: "439617",
    matchScore: null,
    isSelected: false,
    hasPricing: true,
    marketplace: { min: 17020, median: 18020, max: 19020 },
  },
  {
    make: "Honda",
    model: "Civic",
    trim: "EX Coupe 2D",
    modelId: "123",
    vehicleId: "438974",
    matchScore: null,
    isSelected: false,
    hasPricing: true,
    marketplace: { min: 17000, median: 17900, max: 18800 },
  },
  {
    make: "Honda",
    model: "Civic",
    trim: "Sport Sedan 4D",
    modelId: "123",
    vehicleId: "438985",
    matchScore: null,
    isSelected: false,
    hasPricing: true,
    marketplace: { min: 16720, median: 17770, max: 18820 },
  },
  {
    make: "Honda",
    model: "Civic",
    trim: "Sport Hatchback 4D",
    modelId: "123",
    vehicleId: "439591",
    matchScore: null,
    isSelected: false,
    hasPricing: true,
    marketplace: { min: 16860, median: 17760, max: 18710 },
  },
  {
    make: "Honda",
    model: "Civic",
    trim: "EX-L w/Navigation Hatchback 4D",
    modelId: "123",
    vehicleId: "439616",
    matchScore: null,
    isSelected: false,
    hasPricing: true,
    marketplace: { min: 16600, median: 17700, max: 18750 },
  },
  {
    make: "Honda",
    model: "Civic",
    trim: "Sport Coupe 2D",
    modelId: "123",
    vehicleId: "438998",
    matchScore: null,
    isSelected: false,
    hasPricing: true,
    marketplace: { min: 16280, median: 17280, max: 18230 },
  },
  {
    make: "Honda",
    model: "Civic",
    trim: "LX Hatchback 4D",
    modelId: "123",
    vehicleId: "439608",
    matchScore: null,
    isSelected: false,
    hasPricing: true,
    marketplace: { min: 16030, median: 16930, max: 17830 },
  },
  {
    make: "Honda",
    model: "Civic",
    trim: "LX Sedan 4D",
    modelId: "123",
    vehicleId: "438958",
    matchScore: null,
    isSelected: false,
    hasPricing: true,
    marketplace: { min: 15430, median: 16280, max: 17130 },
  },
  {
    make: "Honda",
    model: "Civic",
    trim: "LX Coupe 2D",
    modelId: "123",
    vehicleId: "438981",
    matchScore: null,
    isSelected: false,
    hasPricing: true,
    marketplace: { min: 15230, median: 16130, max: 17080 },
  },
];

/** Fallback catalogs for non-Civic car demos (short trim labels). */
const TRIM_CATALOG: Record<string, string[]> = {
  "honda|accord": ["LX", "Sport", "EX-L", "Touring"],
  "toyota|camry": ["LE", "SE", "XSE", "XLE"],
  "ford|f-150": ["XL", "XLT", "Lariat", "Platinum"],
  "subaru|outback": ["Premium", "Limited", "Touring", "Wilderness"],
  "bmw|3 series": ["330i", "330i xDrive", "M340i", "M340i xDrive"],
  "jeep|wrangler": ["Sport", "Unlimited Sport", "Sahara", "Rubicon"],
};

const DEFAULT_TRIMS = ["Base", "Sport", "Premium", "Limited"];
const PRICE_OFFSETS = [-0.12, 0, 0.08, 0.18] as const;

function catalogKey(make: string, model: string): string {
  return `${make.trim().toLowerCase()}|${model.trim().toLowerCase()}`;
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function withPricingOnly(options: VehicleTrimEstimate[]): VehicleTrimEstimate[] {
  return options.filter((o) => o.hasPricing && o.marketplace.median > 0);
}

function synthesizeOptions(valuation: ListingValuation): VehicleTrimEstimate[] {
  const key = catalogKey(valuation.make, valuation.model);
  const catalog = [...(TRIM_CATALOG[key] ?? DEFAULT_TRIMS)];
  const currentLabel = valuation.trim?.trim() || catalog[1] || catalog[0];

  if (!catalog.some((t) => t.toLowerCase() === currentLabel.toLowerCase())) {
    catalog[1] = currentLabel;
  }

  const currentIndex = catalog.findIndex(
    (t) => t.toLowerCase() === currentLabel.toLowerCase(),
  );
  const base = valuation.fairPrice;

  return catalog.slice(0, 4).map((trim, index) => {
    const isSelected = index === currentIndex;
    const multiplier = isSelected ? 1 : 1 + PRICE_OFFSETS[index];
    const median = isSelected
      ? base
      : Math.round((base * multiplier) / 50) * 50;
    const spread = Math.round(median * 0.05);

    return {
      make: valuation.make,
      model: valuation.model,
      trim,
      vehicleId: `${slug(valuation.make)}-${slug(valuation.model)}-${slug(trim)}`,
      matchScore: isSelected ? 0.85 : null,
      isSelected,
      hasPricing: true,
      marketplace: {
        min: median - spread,
        median,
        max: median + spread,
      },
    };
  });
}

/**
 * Prefer API/mock `valuation.vehicleOptions`; Honda Civic uses the real
 * estimation fixture; other cars get a short synthesized sibling list.
 */
export function resolveTrimEstimates(
  valuation: ListingValuation,
): VehicleTrimEstimate[] {
  if (valuation.valuationType != null && valuation.valuationType !== "car") {
    return [];
  }

  if (valuation.vehicleOptions != null && valuation.vehicleOptions.length > 0) {
    return withPricingOnly(valuation.vehicleOptions);
  }

  if (
    catalogKey(valuation.make, valuation.model) === "honda|civic"
  ) {
    return withPricingOnly(CIVIC_2019_VEHICLE_OPTIONS);
  }

  return withPricingOnly(synthesizeOptions(valuation));
}
