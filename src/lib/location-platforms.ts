import type { LocationPlatform } from "@/mocks/data/locations";

const PLATFORM_ORDER: LocationPlatform[] = [
  "facebook",
  "offerUp",
  "craigslist",
  "kijiji",
];

/** US create-flow seed when country/availability is unknown. */
export const DEFAULT_US_LOCATION_PLATFORMS: LocationPlatform[] = [
  "facebook",
  "offerUp",
  "craigslist",
];

/** Map API / backend platform ids onto LocationPlatform. */
export function toLocationPlatform(
  value: string,
): LocationPlatform | null {
  const normalized = value.trim().toLowerCase();
  if (normalized === "facebook" || normalized === "facebookmarketplace") {
    return "facebook";
  }
  if (normalized === "offerup") return "offerUp";
  if (normalized === "craigslist") return "craigslist";
  if (normalized === "kijiji") return "kijiji";
  return null;
}

export function normalizeAvailablePlatforms(
  values: Iterable<string>,
): LocationPlatform[] {
  const available = new Set<LocationPlatform>();
  for (const value of values) {
    const platform = toLocationPlatform(value);
    if (platform != null) available.add(platform);
  }
  return PLATFORM_ORDER.filter((id) => available.has(id));
}

export function inferCountryCode(input: {
  countryCode?: string | null;
  displayName?: string | null;
  name?: string | null;
}): string {
  const explicit = input.countryCode?.trim().toUpperCase();
  if (explicit != null && explicit.length > 0) return explicit;

  const label = `${input.displayName ?? ""} ${input.name ?? ""}`;
  if (/,?\s*Canada$/i.test(label) || /,\s*CA$/i.test(label)) return "CA";
  return "US";
}

/** Create flow: enable every available platform (Facebook first via SEARCH_PLATFORMS). */
export function defaultEnabledPlatforms(
  available: LocationPlatform[],
): LocationPlatform[] {
  if (available.length === 0) return [...DEFAULT_US_LOCATION_PLATFORMS];
  return available;
}

/** Edit / preserve: keep prior selection that is still available. */
export function syncEnabledWithAvailable(
  previous: LocationPlatform[],
  available: LocationPlatform[],
): LocationPlatform[] {
  if (available.length === 0) {
    return previous.length > 0 ? previous : [...DEFAULT_US_LOCATION_PLATFORMS];
  }
  const kept = previous.filter((platform) => available.includes(platform));
  return kept.length > 0 ? kept : available;
}
