import type { LocationResult } from "@/mocks/data/locations";
import type { LocationRunSpeed } from "@/mocks/data/locations";
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

/** Row id is Google place_id when present. */
export function placeRowId(place: {
  placeId?: string;
  id?: string;
}): string {
  if (place.placeId != null && place.placeId.length > 0) return place.placeId;
  if (place.id != null && place.id.startsWith("place-")) {
    return place.id.slice("place-".length);
  }
  return place.id ?? "";
}

export function suggestedLocationToResult(
  location: SuggestedLocation,
): LocationResult {
  const shortName =
    location.name.split(",")[0]?.trim() || location.name || "Location";
  const placeId =
    location.placeId != null && location.placeId.length > 0
      ? location.placeId
      : undefined;
  return {
    id: placeId ?? `gn-${location.geoNameId}`,
    placeId,
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

/**
 * Enrich center metadata from SuggestLocations original.
 * Keep an existing autocomplete placeId; if missing (legacy edits), fill from
 * reverse-geocode placeId so create→update persists a stable Google id.
 */
export function enrichMainFromOriginal(
  main: LocationResult,
  original: SuggestedLocation | null | undefined,
): LocationResult {
  if (original == null) return main;
  const placeId =
    (main.placeId != null && main.placeId.length > 0
      ? main.placeId
      : undefined) ??
    (original.placeId != null && original.placeId.length > 0
      ? original.placeId
      : undefined);
  return {
    ...main,
    placeId,
    id: placeId ?? main.id,
    geoNameId: original.geoNameId,
    countryCode: original.countryCode || main.countryCode,
    timeZoneId: original.timeZoneId || main.timeZoneId,
    isCenter: true,
  };
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

function samePlace(a: LocationResult, b: LocationResult): boolean {
  const aId = placeRowId(a);
  const bId = placeRowId(b);
  if (aId.length > 0 && aId === bId) return true;
  return haversineMiles(a, b) <= 0.2;
}

/** One row per Google place_id (fallback: coords). Main first. */
export function mergePlacesByPlaceId(
  main: LocationResult | null,
  nearby: LocationResult[],
  saved: LocationResult[],
): LocationResult[] {
  const merged: LocationResult[] = [];
  const upsert = (place: LocationResult) => {
    const id = placeRowId(place) || place.id;
    const normalized: LocationResult = {
      ...place,
      id,
      placeId: place.placeId ?? (id.startsWith("gn-") ? undefined : id),
    };
    const idx = merged.findIndex((item) => samePlace(item, normalized));
    if (idx < 0) {
      merged.push(normalized);
      return;
    }
    // Prefer row that already has placeId + suggest metadata.
    const existing = merged[idx];
    merged[idx] = {
      ...existing,
      ...normalized,
      id: placeRowId(normalized) || placeRowId(existing) || existing.id,
      placeId: normalized.placeId ?? existing.placeId,
      displayName: existing.displayName || normalized.displayName,
      name: existing.name || normalized.name,
    };
  };

  if (main != null) upsert(main);
  for (const place of nearby) upsert(place);
  for (const place of saved) upsert(place);

  if (main == null) return merged;
  const center =
    merged.find((p) => samePlace(p, main)) ?? merged[0];
  if (center == null) return merged;
  return [center, ...merged.filter((p) => p.id !== center.id)];
}

/** Remap speed keys onto placeId row ids after suggest (heals legacy keys). */
export function remapSpeedsByPlaceId(
  speeds: Record<string, LocationRunSpeed>,
  placesById: Record<string, LocationResult>,
  targets: LocationResult[],
): {
  speeds: Record<string, LocationRunSpeed>;
  placesById: Record<string, LocationResult>;
} {
  const nextSpeeds: Record<string, LocationRunSpeed> = {};
  const nextPlaces: Record<string, LocationResult> = {};

  for (const target of targets) {
    const key = placeRowId(target) || target.id;
    nextPlaces[key] = { ...target, id: key, placeId: target.placeId ?? key };
  }

  for (const [oldId, speed] of Object.entries(speeds)) {
    const saved =
      placesById[oldId] ??
      targets.find((t) => t.id === oldId || placeRowId(t) === oldId);
    if (saved == null) continue;

    const match =
      targets.find((t) => samePlace(t, saved)) ??
      targets.find((t) => t.id === oldId);

    if (match != null) {
      const key = placeRowId(match) || match.id;
      if (nextSpeeds[key] == null) nextSpeeds[key] = speed;
      nextPlaces[key] = { ...match, id: key, placeId: match.placeId ?? key };
      continue;
    }

    const key = placeRowId(saved) || saved.id;
    if (nextSpeeds[key] == null) nextSpeeds[key] = speed;
    nextPlaces[key] = { ...saved, id: key };
  }

  return { speeds: nextSpeeds, placesById: nextPlaces };
}

export function mockGeoNameId(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash || 1;
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
    placeId: `mock-center-${input.latitude.toFixed(4)}-${input.longitude.toFixed(4)}`,
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
    placeId: entry.place.placeId ?? `mock-${entry.place.id}`,
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
