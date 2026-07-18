import {
  defaultLocationDraft,
  isLocationSpeedSelected,
  locationsFixture,
  type LocationDraft,
  type LocationPlatform,
  type LocationResult,
} from "@/mocks/data/locations";

let draft: LocationDraft = normalizeDraft(
  structuredClone(defaultLocationDraft),
);

function normalizeDraft(value: LocationDraft): LocationDraft {
  return {
    main: value.main ?? null,
    radiusMiles: value.radiusMiles || defaultLocationDraft.radiusMiles,
    platforms:
      Array.isArray(value.platforms) && value.platforms.length > 0
        ? value.platforms
        : (["facebook"] as LocationPlatform[]),
    otherSpeeds: value.otherSpeeds ?? {},
  };
}

function delay(ms = 120): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function haversineMiles(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadiusMiles = 3958.8;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadiusMiles * Math.asin(Math.sqrt(h));
}

export async function searchLocations(
  query: string,
): Promise<LocationResult[]> {
  await delay();
  const term = query.trim().toLowerCase();
  if (term.length < 2) return [];
  return structuredClone(
    locationsFixture.filter(
      (place) =>
        place.name.toLowerCase().includes(term) ||
        place.displayName.toLowerCase().includes(term) ||
        place.secondaryText.toLowerCase().includes(term),
    ),
  );
}

export async function getNearbyLocations(
  main: LocationResult,
  maxResults = 8,
): Promise<LocationResult[]> {
  await delay(80);
  const ranked = locationsFixture
    .filter((place) => place.id !== main.id)
    .map((place) => ({
      place,
      distance: haversineMiles(main, place),
    }))
    .filter((entry) => entry.distance <= 80)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, maxResults)
    .map((entry) => entry.place);

  return structuredClone(ranked);
}

export function getLocationDraft(): LocationDraft {
  return structuredClone(draft);
}

export function setLocationDraft(next: LocationDraft): LocationDraft {
  draft = normalizeDraft(structuredClone(next));
  return structuredClone(draft);
}

export function formatLocationLabel(draftValue?: LocationDraft | null): string {
  const value = draftValue ?? draft;
  if (value.main == null) return "Set location";
  const selectedLocs = Object.values(value.otherSpeeds).filter(
    isLocationSpeedSelected,
  ).length;
  const platformCount = value.platforms.length;
  const parts = [
    `${value.main.name} (${value.radiusMiles} mi)`,
    platformCount > 0
      ? `${platformCount} platform${platformCount === 1 ? "" : "s"}`
      : null,
    selectedLocs > 0
      ? `${selectedLocs} loc${selectedLocs === 1 ? "" : "s"}`
      : null,
  ].filter(Boolean);
  return parts.join(" · ");
}
