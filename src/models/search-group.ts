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

/** Radius-only group (matches backend SearchGroupDto). */
export interface SearchGroup {
  id: string;
  searchType: SearchType;
  latitude: number;
  longitude: number;
  radiusMiles: number;
  locationName: string;
  country: string;
  isActive: boolean;
  activationStatus?: SearchGroupActivationStatus;
  activationMessage?: string;
  totalSettingsCount?: number;
  activeSettingsCount?: number;
  inactiveSettingsCount?: number;
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
  latitude: number;
  longitude: number;
  radiusMiles: number;
  locationName: string;
  country: string;
  iphoneQuery?: IphoneQuery[];
  samsungQuery?: SamsungQuery[];
  carQuery?: CarQuery;
  customQuery?: CustomQuery;
  containsText?: string[];
  excludeText?: string[];
  titleIncluders?: string[];
  descriptionIncluders?: string[];
  settings: GroupSearchSettingInput[];
}

export interface UpdateSearchGroup {
  latitude?: number;
  longitude?: number;
  radiusMiles?: number;
  locationName?: string;
  country?: string;
  isActive?: boolean;
  iphoneQuery?: IphoneQuery[];
  samsungQuery?: SamsungQuery[];
  carQuery?: CarQuery;
  customQuery?: CustomQuery;
  containsText?: string[];
  excludeText?: string[];
  titleIncluders?: string[];
  descriptionIncluders?: string[];
  settings?: GroupSearchSettingInput[];
}

export interface IntervalSetting {
  interval: number;
  value: number;
}

/** Matches backend SuggestedLocationDto (Google SuggestLocations). */
export interface SuggestedLocation {
  geoNameId: number;
  name: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  timeZoneId: string;
  distanceMiles: number;
  isCenter: boolean;
  selected: boolean;
}

export interface SuggestLocationsResult {
  centerLatitude: number;
  centerLongitude: number;
  searchRadiusMiles: number;
  countryCode: string;
  additionalLocationCount: number;
  originalLocation: SuggestedLocation;
  suggestedLocations: SuggestedLocation[];
}

export interface SuggestLocationsInput {
  latitude: number;
  longitude: number;
  radiusMiles: number;
  centerLocationName?: string;
}

export interface RecentMap {
  id: string;
  latitude: number;
  longitude: number;
  basicRadiusMiles: number;
  locationName: string;
  country: string;
  createdAt: string;
  updatedAt: string;
}

export interface MatchPlatformsInput {
  isEditing?: boolean;
  originalLocation: {
    geoNameId: number;
    name: string;
    countryCode?: string;
    latitude: number;
    longitude: number;
  };
  selectedLocations: Array<{
    geoNameId: number;
    name: string;
    countryCode?: string;
    latitude: number;
    longitude: number;
  }>;
  candidateLocations?: Array<{
    geoNameId: number;
    name: string;
    countryCode?: string;
    latitude: number;
    longitude: number;
  }>;
  platforms: string[];
  settings: IntervalSetting[];
}

export interface LocationWithInterval {
  geoNameId: number;
  name: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  distanceMiles: number;
  isCenter: boolean;
  intervalSeconds: number;
}

export interface PlatformPlan {
  platform: string;
  locations: LocationWithInterval[];
}

export interface MatchPlatformsResult {
  totalSlotsUsed: number;
  totalSlotsAvailable: number;
  remainingSlots: number;
  platforms: Record<string, PlatformPlan>;
}
