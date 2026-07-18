import type {
  CarQuery,
  CustomQuery,
  IphoneQuery,
  SamsungQuery,
  SearchPlatform,
} from "./create-search-setting";

export type SearchType = "car" | "iphone" | "samsung" | "custom";

export type BackendSearchType = "Car" | "Iphone" | "Samsung" | "Custom";

export const normalizeSearchType = (searchType?: string | null): SearchType => {
  const normalized = searchType?.trim().toLowerCase();
  switch (normalized) {
    case "car":
      return "car";
    case "iphone":
      return "iphone";
    case "samsung":
      return "samsung";
    case "custom":
    default:
      return "custom";
  }
};

export const toBackendSearchType = (
  searchType: SearchType,
): BackendSearchType => {
  switch (searchType) {
    case "car":
      return "Car";
    case "iphone":
      return "Iphone";
    case "samsung":
      return "Samsung";
    case "custom":
    default:
      return "Custom";
  }
};

export interface CoveragePoint {
  lat: number;
  lng: number;
}

export interface CoverageArea {
  points: CoveragePoint[];
}

export type SearchGroupLocationMode = "basic" | "advanced";

export type SearchGroupActivationStatus =
  | "active"
  | "partial"
  | "paused"
  | "blocked";

export interface SearchGroupSetting {
  id: string;
  platform: SearchPlatform;
  latitude: number;
  longitude: number;
  locationName: string;
  country: string;
  timeZoneId: string;
  radiusMiles: number;
  isActive: boolean;
  runIntervalSeconds: number;
}

/** Full domain group (mobile-app shape). UI may use a thinner home view model. */
export interface SearchGroup {
  id: string;
  searchType: SearchType;
  mode: SearchGroupLocationMode;
  latitude: number;
  longitude: number;
  basicRadiusMiles?: number;
  radiusMiles?: number;
  locationName: string;
  country: string;
  isActive: boolean;
  activationStatus?: SearchGroupActivationStatus;
  activationMessage?: string;
  coverageArea?: CoverageArea;
  iphoneQuery?: IphoneQuery[];
  samsungQuery?: SamsungQuery[];
  carQuery?: CarQuery;
  customQuery?: CustomQuery;
  containsText?: string[];
  excludeText?: string[];
  titleIncluders?: string[];
  descriptionIncluders?: string[];
  runIntervalSeconds: number;
  platforms: SearchPlatform[];
  searchSettings?: SearchGroupSetting[];
  createdAt: string;
  updatedAt: string;
}

export interface GroupSearchSettingInput {
  platform: string;
  latitude: number;
  longitude: number;
  radiusMiles: number;
  locationName: string;
  country: string;
  timeZoneId: string;
  runIntervalSeconds: number;
}

export interface CreateSearchGroup {
  searchType: BackendSearchType | string;
  mode?: SearchGroupLocationMode;
  latitude?: number;
  longitude?: number;
  basicRadiusMiles?: number;
  radiusMiles?: number;
  locationName: string;
  country: string;
  coverageArea?: CoverageArea;
  iphoneQuery?: IphoneQuery[];
  samsungQuery?: SamsungQuery[];
  carQuery?: CarQuery;
  customQuery?: CustomQuery;
  containsText?: string[];
  excludeText?: string[];
  titleIncluders?: string[];
  descriptionIncluders?: string[];
  runIntervalSeconds?: number;
  platforms?: SearchPlatform[];
  settings?: GroupSearchSettingInput[];
}

/** Kept for phase 2 edit flow. */
export interface UpdateSearchGroup {
  mode?: SearchGroupLocationMode;
  latitude?: number;
  longitude?: number;
  basicRadiusMiles?: number;
  radiusMiles?: number;
  locationName?: string;
  country?: string;
  isActive?: boolean;
  coverageArea?: CoverageArea;
  iphoneQuery?: IphoneQuery[];
  samsungQuery?: SamsungQuery[];
  carQuery?: CarQuery;
  customQuery?: CustomQuery;
  containsText?: string[];
  excludeText?: string[];
  titleIncluders?: string[];
  descriptionIncluders?: string[];
  runIntervalSeconds?: number;
  platforms?: SearchPlatform[];
  settings?: GroupSearchSettingInput[];
}

export interface IntervalSetting {
  interval: number;
  value: number;
}
