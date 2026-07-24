import type { LocationResult } from "@/mocks/data/locations";
import type {
  SuggestedLocation,
  SuggestLocationsInput,
  SuggestLocationsResult,
} from "@/models/search-group";

/** Mirrors backend SuggestLocations.CalculateAdditionalLocationCount. */
export function calculateAdditionalLocationCount(radiusMiles: number): number {
  const minSeparationMiles = 10;
  if (radiusMiles <= minSeparationMiles) return 0;
  return Math.min(
    Math.floor((radiusMiles - minSeparationMiles) / minSeparationMiles),
    10,
  );
}

export function suggestedLocationToResult(
  location: SuggestedLocation,
): LocationResult {
  const shortName =
    location.name.split(",")[0]?.trim() || location.name || "Location";
  return {
    id: `gn-${location.geoNameId}`,
    name: shortName,
    displayName: location.name,
    secondaryText: location.countryCode
      ? `${Math.round(location.distanceMiles)} mi · ${location.countryCode}`
      : `${Math.round(location.distanceMiles)} mi`,
    latitude: location.latitude,
    longitude: location.longitude,
    geoNameId: location.geoNameId,
    countryCode: location.countryCode,
    timeZoneId: location.timeZoneId,
    distanceMiles: location.distanceMiles,
    isCenter: location.isCenter,
    selected: location.selected,
  };
}

/** Merge GeoNames metadata onto the user's selected center without changing its UI id. */
export function enrichMainFromOriginal(
  main: LocationResult,
  original: SuggestedLocation | null | undefined,
): LocationResult {
  if (original == null) return main;
  if (
    main.geoNameId === original.geoNameId &&
    main.countryCode === original.countryCode &&
    main.timeZoneId === original.timeZoneId &&
    main.isCenter === true
  ) {
    return main;
  }
  return {
    ...main,
    geoNameId: original.geoNameId,
    countryCode: original.countryCode || main.countryCode,
    timeZoneId: original.timeZoneId || main.timeZoneId,
    isCenter: true,
  };
}

export function mockGeoNameId(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash || 1;
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

function countryFromName(name: string): string {
  if (/,?\s*Canada$/i.test(name) || /,\s*CA$/i.test(name)) return "CA";
  return "US";
}

/** Fixture-backed SuggestLocations for mock agent. */
export function buildMockSuggestLocationsResult(
  input: SuggestLocationsInput,
  places: LocationResult[],
): SuggestLocationsResult {
  const centerName =
    input.centerLocationName?.trim() ||
    places.find(
      (p) =>
        Math.abs(p.latitude - input.latitude) < 0.01 &&
        Math.abs(p.longitude - input.longitude) < 0.01,
    )?.displayName ||
    "Center";
  const countryCode = countryFromName(centerName);
  const additionalCount = calculateAdditionalLocationCount(input.radiusMiles);

  const original: SuggestedLocation = {
    geoNameId: mockGeoNameId(
      `center:${input.latitude.toFixed(4)},${input.longitude.toFixed(4)}`,
    ),
    name: centerName,
    countryCode,
    latitude: input.latitude,
    longitude: input.longitude,
    timeZoneId: "America/New_York",
    distanceMiles: 0,
    isCenter: true,
    selected: true,
  };

  const ranked = places
    .map((place) => ({
      place,
      distance: haversineMiles(
        { latitude: input.latitude, longitude: input.longitude },
        place,
      ),
    }))
    .filter(
      (entry) =>
        entry.distance > 0.5 &&
        entry.distance <= Math.max(input.radiusMiles, 10),
    )
    .sort((a, b) => a.distance - b.distance)
    .slice(0, additionalCount);

  const suggestedLocations: SuggestedLocation[] = ranked.map((entry, index) => ({
    geoNameId: mockGeoNameId(entry.place.id),
    name: entry.place.displayName || entry.place.name,
    countryCode: countryFromName(entry.place.displayName || entry.place.name),
    latitude: entry.place.latitude,
    longitude: entry.place.longitude,
    timeZoneId: "America/New_York",
    distanceMiles: Math.round(entry.distance * 10) / 10,
    isCenter: false,
    selected: index < additionalCount,
  }));

  return {
    centerLatitude: input.latitude,
    centerLongitude: input.longitude,
    searchRadiusMiles: input.radiusMiles,
    countryCode,
    additionalLocationCount: additionalCount,
    originalLocation: original,
    suggestedLocations,
  };
}
