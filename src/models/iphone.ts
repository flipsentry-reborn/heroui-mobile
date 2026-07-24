export interface IphoneModel {
  model: string;
  displayName?: string;
  minPrice: number;
  maxPrice: number;
}

export interface LocalizedModelGroup<TModel> {
  key: string;
  label: string;
  models: TModel[];
}

export interface LocalizedModelCatalog<TModel> {
  resolvedCountryCode: string;
  resolvedCountryName: string;
  pricingSource: "country" | "gps" | "fallback";
  currencyCode: string;
  currencySymbol: string;
  groups: LocalizedModelGroup<TModel>[];
}

export type IphoneModelGroup = LocalizedModelGroup<IphoneModel>;
export type IphoneModelCatalog = LocalizedModelCatalog<IphoneModel>;
