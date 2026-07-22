/**
 * Live GroupSearch REST — basic radius only (no population / advanced point mode).
 */

import { requests } from "@/api/http/client";
import type {
  HomePlatform,
  SearchGroup as HomeSearchGroup,
  SearchType as HomeSearchType,
} from "@/mocks/data/home";
import type {
  CreateHomeSearchInput,
  UpdateHomeSearchInput,
} from "@/mocks/services/home";
import type { SearchPlatform } from "@/models/create-search-setting";
import type {
  CreateSearchGroup,
  SearchGroup as DomainSearchGroup,
  SearchGroupLocationMode,
  SearchType,
  SuggestLocationsInput,
  SuggestLocationsResult,
  MatchPlatformsInput,
  MatchPlatformsResult,
  UpdateSearchGroup,
} from "@/models/search-group";
import { normalizeSearchType, toBackendSearchType } from "@/models/search-group";

interface ApiSearchSetting {
  id: string;
  platform: string;
  latitude: number;
  longitude: number;
  locationName: string;
  country: string;
  timeZoneId: string;
  radiusMiles: number;
  isActive: boolean;
  runIntervalSeconds: number;
}

interface ApiGroupSearch {
  id: string;
  searchType: string;
  mode?: string | null;
  latitude?: number;
  longitude?: number;
  basicRadiusMiles?: number | null;
  radiusMiles?: number | null;
  locationName: string;
  country: string;
  isActive?: boolean;
  activationStatus?: string | null;
  activationMessage?: string | null;
  coverageArea?: { points: Array<{ lat: number; lng: number }> };
  iphoneQuery?: DomainSearchGroup["iphoneQuery"];
  samsungQuery?: DomainSearchGroup["samsungQuery"];
  carQuery?: DomainSearchGroup["carQuery"];
  customQuery?: DomainSearchGroup["customQuery"];
  containsText?: string[];
  excludeText?: string[];
  titleIncluders?: string[];
  descriptionIncluders?: string[];
  runIntervalSeconds?: number;
  platforms?: string[];
  searchSettings?: ApiSearchSetting[];
  createdAt: string;
  updatedAt: string;
  derivedCenterLat?: number;
  derivedCenterLon?: number;
  derivedRadiusMiles?: number;
}

function mapPlatformToHome(platform: string): HomePlatform {
  const p = platform.toLowerCase();
  if (p === "facebook" || p === "facebookmarketplace") return "facebook";
  if (p === "offerup") return "offerUp";
  if (p === "craigslist") return "craigslist";
  if (p === "kijiji") return "kijiji";
  return "facebook";
}

function mapPlatformToApi(platform: HomePlatform | string): SearchPlatform {
  const p = String(platform).toLowerCase();
  if (p === "offerup") return "offerup";
  if (p === "craigslist") return "craigslist";
  if (p === "kijiji") return "kijiji";
  return "facebook";
}

function toHomeSearchType(searchType: SearchType): HomeSearchType {
  if (searchType === "car" || searchType === "iphone" || searchType === "custom") {
    return searchType;
  }
  return "custom";
}

export function mapApiGroupToHome(group: ApiGroupSearch): HomeSearchGroup {
  const settings = (group.searchSettings ?? []).map((s) => ({
    id: s.id,
    platform: mapPlatformToHome(s.platform),
    locationName: s.locationName,
    isActive: s.isActive,
    runIntervalSeconds: s.runIntervalSeconds,
  }));
  const radius =
    group.basicRadiusMiles ??
    group.derivedRadiusMiles ??
    group.radiusMiles ??
    settings[0]?.runIntervalSeconds ??
    25;
  const searchType = toHomeSearchType(normalizeSearchType(group.searchType));
  const customLabel =
    typeof group.customQuery === "object" && group.customQuery != null
      ? (group.customQuery as { query?: string }).query
      : undefined;

  return {
    id: group.id,
    searchType,
    locationName: group.locationName,
    radiusMiles:
      typeof group.basicRadiusMiles === "number"
        ? group.basicRadiusMiles
        : typeof group.radiusMiles === "number"
          ? group.radiusMiles
          : typeof group.derivedRadiusMiles === "number"
            ? group.derivedRadiusMiles
            : 25,
    carQuery: group.carQuery as HomeSearchGroup["carQuery"],
    customLabel,
    settings,
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
  };
}

function defaultCountry(locationName: string): string {
  if (/,?\s*USA?$/i.test(locationName) || /United States/i.test(locationName)) {
    return "US";
  }
  if (/,?\s*Canada$/i.test(locationName)) return "CA";
  return "US";
}

function buildCreatePayload(input: CreateHomeSearchInput): CreateSearchGroup {
  const lat = input.latitude ?? 33.749;
  const lng = input.longitude ?? -84.388;
  const country = input.country ?? defaultCountry(input.locationName);
  const timeZoneId = input.timeZoneId ?? "America/New_York";
  const mode: SearchGroupLocationMode = "basic";

  const settings = input.settings.map((s) => ({
    platform: mapPlatformToApi(s.platform),
    latitude: s.latitude ?? lat,
    longitude: s.longitude ?? lng,
    radiusMiles: input.radiusMiles,
    locationName: s.locationName || input.locationName,
    country: s.country ?? country,
    timeZoneId: s.timeZoneId ?? timeZoneId,
    runIntervalSeconds: s.runIntervalSeconds,
  }));

  const payload: CreateSearchGroup = {
    searchType: toBackendSearchType(input.searchType as SearchType),
    mode,
    latitude: lat,
    longitude: lng,
    basicRadiusMiles: input.radiusMiles,
    radiusMiles: input.radiusMiles,
    locationName: input.locationName,
    country,
    platforms: settings.map((s) => s.platform),
    settings,
    containsText: input.containsText,
    excludeText: input.excludeText,
  };

  if (input.searchType === "car" && input.carQuery) {
    payload.carQuery = input.carQuery;
  }
  if (input.searchType === "custom" && input.customLabel) {
    payload.customQuery = { query: input.customLabel };
  }
  if (input.iphoneQuery) {
    payload.iphoneQuery = input.iphoneQuery;
  }

  return payload;
}

export const liveGroupSearch = {
  suggestLocations: (params: SuggestLocationsInput) =>
    requests.post<SuggestLocationsResult>(
      "/api/group-search/suggest-locations",
      params,
    ),
  matchPlatforms: (params: MatchPlatformsInput) =>
    requests.post<MatchPlatformsResult>(
      "/api/group-search/match-platforms",
      params,
    ),
  recentMaps: () => requests.get<unknown[]>("/api/group-search/recent-maps"),
  list: async (): Promise<HomeSearchGroup[]> => {
    const groups = await requests.get<ApiGroupSearch[]>("/api/group-search");
    return groups.map(mapApiGroupToHome);
  },
  get: async (id: string): Promise<HomeSearchGroup> => {
    const group = await requests.get<ApiGroupSearch>(`/api/group-search/${id}`);
    return mapApiGroupToHome(group);
  },
  create: async (input: CreateHomeSearchInput): Promise<HomeSearchGroup> => {
    const created = await requests.post<ApiGroupSearch>(
      "/api/group-search",
      buildCreatePayload(input),
    );
    return mapApiGroupToHome(created);
  },
  update: async (
    id: string,
    input: UpdateHomeSearchInput,
  ): Promise<HomeSearchGroup> => {
    const body: UpdateSearchGroup = {
      ...buildCreatePayload(input),
    };
    const updated = await requests.put<ApiGroupSearch>(
      `/api/group-search/${id}`,
      body,
    );
    return mapApiGroupToHome(updated);
  },
  setActive: async (
    id: string,
    isActive: boolean,
  ): Promise<HomeSearchGroup | null> => {
    const updated = await requests.put<ApiGroupSearch>(
      `/api/group-search/${id}`,
      { isActive },
    );
    return mapApiGroupToHome(updated);
  },
  delete: async (id: string): Promise<boolean> => {
    await requests.delete<void>(`/api/group-search/${id}`);
    return true;
  },
};
