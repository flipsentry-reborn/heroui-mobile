import { readJson, writeJson } from "@/lib/storage";
import type { LocationResult } from "@/mocks/data/locations";

/** Survives onboarding reset / replay — only the wizard flag is cleared. */
export const ONBOARDING_CENTER_STORAGE_KEY = "@flipsentry/onboarding-center-v1";

/** Fixed NYC center for hunting (no GPS — works while abroad). */
export const DEFAULT_ONBOARDING_CENTER: LocationResult = {
  id: "new-york-ny",
  name: "New York",
  displayName: "New York, NY, USA",
  secondaryText: "New York, USA",
  latitude: 40.7128,
  longitude: -74.006,
  countryCode: "US",
  timeZoneId: "America/New_York",
  distanceMiles: 0,
  isCenter: true,
};

function isValidCenter(value: unknown): value is LocationResult {
  if (value == null || typeof value !== "object") return false;
  const loc = value as LocationResult;
  return (
    typeof loc.latitude === "number" &&
    Number.isFinite(loc.latitude) &&
    typeof loc.longitude === "number" &&
    Number.isFinite(loc.longitude) &&
    !(loc.latitude === 0 && loc.longitude === 0)
  );
}

export async function getPersistedOnboardingCenter(): Promise<LocationResult | null> {
  const stored = await readJson<LocationResult>(ONBOARDING_CENTER_STORAGE_KEY);
  if (!isValidCenter(stored)) return null;
  return {
    ...DEFAULT_ONBOARDING_CENTER,
    ...stored,
    isCenter: true,
    distanceMiles: 0,
  };
}

export async function persistOnboardingCenter(
  center: LocationResult,
): Promise<void> {
  await writeJson(ONBOARDING_CENTER_STORAGE_KEY, {
    id: center.id,
    name: center.name,
    displayName: center.displayName,
    secondaryText: center.secondaryText,
    latitude: center.latitude,
    longitude: center.longitude,
    countryCode: center.countryCode,
    timeZoneId: center.timeZoneId,
    placeId: center.placeId,
    geoNameId: center.geoNameId,
  });
}

/**
 * Resolve onboarding center: persisted location first, else New York.
 * Never cleared by Replay onboarding — only search groups + wizard flag reset.
 */
export async function resolveDeviceLocation(): Promise<LocationResult> {
  const persisted = await getPersistedOnboardingCenter();
  const center = persisted ?? { ...DEFAULT_ONBOARDING_CENTER };
  if (persisted == null) {
    await persistOnboardingCenter(center);
  }
  return center;
}
