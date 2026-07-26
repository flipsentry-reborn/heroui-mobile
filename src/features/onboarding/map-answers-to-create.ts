import type { CreateHomeSearchInput } from "@/mocks/services/home";
import type { HomePlatform, SearchType } from "@/mocks/data/home";
import type { LocationResult } from "@/mocks/data/locations";
import type { IphoneQuery } from "@/models/create-search-setting";
import { MOCK_IPHONE_SERIES } from "@/mocks/data/iphone";

/** Fixed radius — no location / miles UI. */
export const DEFAULT_ONBOARDING_RADIUS = 100;

/**
 * Hunter trial: 1 Instant + 4 × 3-min Facebook cities (5 settings).
 * Leaves one 3-min slot spare on Hunter.
 */
export const ONBOARDING_SLOT_INTERVALS = [60, 180, 180, 180, 180] as const;
export const ONBOARDING_MAX_LOCATIONS = ONBOARDING_SLOT_INTERVALS.length;

export type OnboardingAssignedLocation = {
  location: LocationResult;
  runIntervalSeconds: number;
  speedLabel: string;
};

export type OnboardingDraft = {
  searchType: SearchType | null;
  location: LocationResult | null;
  customQuery: string;
  radiusMiles: number;
  assignedLocations: OnboardingAssignedLocation[];
  /** Populated at finish for broad iPhone hunt (all catalog models). */
  iphoneQuery: IphoneQuery[];
  /** Dummy quiz answers — UI only, never persisted. */
  volumeId: string | null;
  marginId: string | null;
  triedOtherApps: boolean | null;
};

export function createEmptyOnboardingDraft(): OnboardingDraft {
  return {
    searchType: null,
    location: null,
    customQuery: "",
    radiusMiles: DEFAULT_ONBOARDING_RADIUS,
    assignedLocations: [],
    iphoneQuery: [],
    volumeId: null,
    marginId: null,
    triedOtherApps: null,
  };
}

/** Car / iPhone: type alone is enough. Custom needs a short keyword. */
export function isReadyToCreate(draft: OnboardingDraft): boolean {
  if (draft.searchType == null) return false;
  if (draft.searchType === "custom") {
    return draft.customQuery.trim().length >= 2;
  }
  return true;
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
 * Prefer Instant×1 + 3min×4; if Instant is spent, fall back to slower slots
 * from remaining capacities (180 → 300 → 540).
 */
export function pickOnboardingIntervals(
  remainingSlotSettings: Array<{ interval: number; value: number }>,
): number[] {
  const left = new Map<number, number>();
  for (const row of remainingSlotSettings) {
    if (row.interval > 0 && row.value > 0) {
      left.set(row.interval, (left.get(row.interval) ?? 0) + row.value);
    }
  }

  const preferred = [...ONBOARDING_SLOT_INTERVALS];
  const fallbacks = [180, 300, 540, 60] as const;
  const picked: number[] = [];

  for (const want of preferred) {
    const candidates = [want, ...fallbacks.filter((f) => f !== want)];
    let chosen: number | null = null;
    for (const interval of candidates) {
      if ((left.get(interval) ?? 0) > 0) {
        chosen = interval;
        break;
      }
    }
    if (chosen == null) break;
    left.set(chosen, (left.get(chosen) ?? 0) - 1);
    picked.push(chosen);
  }

  return picked;
}

/** Center first, then nearby by distance — N rows from intervals (pad with center). */
export function assignTopOnboardingLocations(
  center: LocationResult,
  nearby: LocationResult[],
  intervals: readonly number[] = ONBOARDING_SLOT_INTERVALS,
): OnboardingAssignedLocation[] {
  const max = Math.max(1, intervals.length);
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

  while (ordered.length < max) {
    ordered.push(center);
  }

  return ordered.slice(0, max).map((location, index) => {
    const runIntervalSeconds = intervals[index] ?? 180;
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
    throw new Error("Pick what you want alerts for.");
  }
  if (!isReadyToCreate(draft)) {
    throw new Error("Enter a keyword for your custom search.");
  }
  if (draft.assignedLocations.length === 0) {
    throw new Error("Could not resolve your area. Try again.");
  }

  const main = draft.assignedLocations[0]!.location;
  const locationName = main.displayName || main.name || "Near you";

  const settings: CreateHomeSearchInput["settings"] =
    draft.assignedLocations.map((row) =>
      settingFromLocation("facebook", row.location, row.runIntervalSeconds),
    );

  const input: CreateHomeSearchInput = {
    searchType: draft.searchType,
    locationName,
    radiusMiles: DEFAULT_ONBOARDING_RADIUS,
    latitude: main.latitude,
    longitude: main.longitude,
    country: main.countryCode ?? "US",
    timeZoneId: main.timeZoneId ?? undefined,
    settings,
  };

  if (draft.searchType === "car") {
    input.carQuery = { anyMake: true, vehicleSelection: [] };
  } else if (draft.searchType === "iphone") {
    input.iphoneQuery =
      draft.iphoneQuery.length > 0
        ? draft.iphoneQuery
        : defaultOnboardingIphoneQuery();
  } else {
    input.customLabel = draft.customQuery.trim();
  }

  return input;
}

/** Fallback catalog when API models are unavailable. */
export function defaultOnboardingIphoneQuery(): IphoneQuery[] {
  return MOCK_IPHONE_SERIES.flatMap((series) =>
    series.models.map((model) => ({
      model: model.id,
      minPrice: model.defaultMinPrice,
      maxPrice: model.defaultMaxPrice,
    })),
  );
}
