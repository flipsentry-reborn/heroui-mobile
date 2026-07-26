import type { CreateHomeSearchInput } from "@/mocks/services/home";
import type { HomePlatform, SearchType } from "@/mocks/data/home";
import type { LocationResult } from "@/mocks/data/locations";
import { DEFAULT_SEARCH_PLATFORMS } from "@/features/home/search-bottom-sheet-platforms-sheet";

export const ONBOARDING_RADIUS_PRESETS = [20, 40, 80] as const;
export const DEFAULT_ONBOARDING_RADIUS = 40;

/** Instant + two 3-min slots for the top nearby cities. */
export const ONBOARDING_SLOT_INTERVALS = [60, 180, 180] as const;
export const ONBOARDING_MAX_LOCATIONS = ONBOARDING_SLOT_INTERVALS.length;

export type OnboardingAssignedLocation = {
  location: LocationResult;
  runIntervalSeconds: number;
  speedLabel: string;
};

export type OnboardingDraft = {
  searchType: SearchType | null;
  location: LocationResult | null;
  /** Car: any-make OR one-or-more specific makes (checkbox multi-select). */
  carMakes: string[];
  carAnyMake: boolean;
  /** iPhone: one-or-more models (checkbox multi-select). */
  iphoneModelIds: string[];
  customQuery: string;
  radiusMiles: number;
  platforms: HomePlatform[];
  /** Top cities inside radius (max 3) with fixed Instant / 3-min / 3-min. */
  assignedLocations: OnboardingAssignedLocation[];
};

export function createEmptyOnboardingDraft(): OnboardingDraft {
  return {
    searchType: null,
    location: null,
    carMakes: [],
    carAnyMake: true,
    iphoneModelIds: [],
    customQuery: "",
    radiusMiles: DEFAULT_ONBOARDING_RADIUS,
    platforms: [...DEFAULT_SEARCH_PLATFORMS],
    assignedLocations: [],
  };
}

export function isCriteriaComplete(draft: OnboardingDraft): boolean {
  if (draft.searchType == null) return false;
  if (draft.searchType === "car") {
    return draft.carAnyMake || draft.carMakes.length > 0;
  }
  if (draft.searchType === "iphone") {
    return draft.iphoneModelIds.length > 0;
  }
  return draft.customQuery.trim().length >= 2;
}

export function intervalSpeedLabel(seconds: number): string {
  if (seconds === 60) return "Instant";
  if (seconds === 180) return "3 min";
  if (seconds === 300) return "5 min";
  if (seconds === 540) return "9 min";
  return `${Math.round(seconds / 60)} min`;
}

function placeKey(loc: LocationResult): string {
  if (loc.placeId) return `p:${loc.placeId}`;
  if (loc.geoNameId != null && loc.geoNameId > 0) return `g:${loc.geoNameId}`;
  return `c:${loc.latitude.toFixed(4)},${loc.longitude.toFixed(4)}`;
}

/**
 * Center first, then nearby by distance — keep only top 3 and assign
 * Instant / 3 min / 3 min so the user still has remaining Hunter slots.
 */
export function assignTopOnboardingLocations(
  center: LocationResult,
  nearby: LocationResult[],
): OnboardingAssignedLocation[] {
  const seen = new Set<string>();
  const ordered: LocationResult[] = [];

  const push = (loc: LocationResult | null | undefined) => {
    if (loc == null) return;
    if (loc.latitude === 0 && loc.longitude === 0) return;
    const key = placeKey(loc);
    if (seen.has(key)) return;
    seen.add(key);
    ordered.push(loc);
  };

  push(center);
  const sortedNearby = [...nearby].sort(
    (a, b) => (a.distanceMiles ?? 0) - (b.distanceMiles ?? 0),
  );
  for (const loc of sortedNearby) push(loc);

  return ordered.slice(0, ONBOARDING_MAX_LOCATIONS).map((location, index) => {
    const runIntervalSeconds = ONBOARDING_SLOT_INTERVALS[index] ?? 180;
    return {
      location,
      runIntervalSeconds,
      speedLabel: intervalSpeedLabel(runIntervalSeconds),
    };
  });
}

function settingFromLocation(
  platform: HomePlatform,
  loc: LocationResult,
  runIntervalSeconds: number,
) {
  const locationName = loc.displayName || loc.name || "Location";
  return {
    platform,
    locationName,
    runIntervalSeconds,
    latitude: loc.latitude,
    longitude: loc.longitude,
    country: loc.countryCode ?? "US",
    timeZoneId: loc.timeZoneId ?? undefined,
    placeId: loc.placeId ?? undefined,
    geoNameId:
      loc.geoNameId != null && loc.geoNameId > 0 ? loc.geoNameId : undefined,
  };
}

export function mapAnswersToCreate(draft: OnboardingDraft): CreateHomeSearchInput {
  if (draft.searchType == null) {
    throw new Error("Pick what you are hunting.");
  }
  if (draft.location == null) {
    throw new Error("Pick a location.");
  }
  if (!isCriteriaComplete(draft)) {
    throw new Error("Complete your search criteria.");
  }
  if (draft.platforms.length === 0) {
    throw new Error("Pick at least one platform.");
  }
  if (draft.assignedLocations.length === 0) {
    throw new Error("No cities found in that radius. Try a larger radius.");
  }

  const main = draft.location;
  const locationName = main.displayName || main.name || "Location";

  // Onboarding burns exactly Instant×1 + 3min×2 on Facebook top cities.
  // Extra platforms can be added later from Home so trial slots stay spare.
  const settings: CreateHomeSearchInput["settings"] = draft.assignedLocations.map(
    (row) =>
      settingFromLocation("facebook", row.location, row.runIntervalSeconds),
  );

  const input: CreateHomeSearchInput = {
    searchType: draft.searchType,
    locationName,
    radiusMiles: draft.radiusMiles,
    latitude: main.latitude,
    longitude: main.longitude,
    country: main.countryCode ?? "US",
    timeZoneId: main.timeZoneId ?? undefined,
    settings,
  };

  if (draft.searchType === "car") {
    input.carQuery = {
      anyMake: draft.carAnyMake,
      vehicleSelection: draft.carAnyMake
        ? []
        : draft.carMakes.map((make) => ({ make })),
    };
  } else if (draft.searchType === "iphone") {
    input.iphoneQuery = draft.iphoneModelIds.map((model) => ({ model }));
  } else {
    input.customLabel = draft.customQuery.trim();
  }

  return input;
}
