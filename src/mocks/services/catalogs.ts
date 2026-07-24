import { MOCK_CAR_MAKES } from "@/mocks/data/car";
import { MOCK_IPHONE_SERIES } from "@/mocks/data/iphone";
import type { CarMake } from "@/models/car-make";
import type { IphoneModelCatalog } from "@/models/iphone";

export async function listCarMakes(): Promise<CarMake[]> {
  return MOCK_CAR_MAKES.map((make) => ({ make: make.label }));
}

export async function listIphoneModelGroups(_params?: {
  latitude?: number;
  longitude?: number;
  country?: string;
}): Promise<IphoneModelCatalog> {
  return {
    resolvedCountryCode: "US",
    resolvedCountryName: "United States",
    pricingSource: "fallback",
    currencyCode: "USD",
    currencySymbol: "$",
    groups: MOCK_IPHONE_SERIES.map((series) => ({
      key: series.id,
      label: series.title,
      models: series.models.map((model) => ({
        model: model.id,
        displayName: model.label.startsWith("iPhone")
          ? model.label
          : `iPhone ${model.label}`,
        minPrice: model.defaultMinPrice,
        maxPrice: model.defaultMaxPrice,
      })),
    })),
  };
}
