import {
  defaultLocationDraft,
  isLocationSpeedSelected,
  locationsFixture,
  type LocationDraft,
  type LocationPlatform,
  type LocationResult,
} from "@/mocks/data/locations";
import { buildMockSuggestLocationsResult } from "@/lib/location-suggest";
import type {
  MatchPlatformsInput,
  MatchPlatformsResult,
  SuggestLocationsInput,
  SuggestLocationsResult,
} from "@/models/search-group";

export { defaultLocationDraft };

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
    placesById: value.placesById ?? {},
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

/** Fixture fallback — prefer agent.GroupSearch.suggestLocations. */
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

export async function mockSuggestLocations(
  params: SuggestLocationsInput,
): Promise<SuggestLocationsResult> {
  await delay(80);
  return buildMockSuggestLocationsResult(params, locationsFixture);
}

export async function mockMatchPlatforms(
  params: MatchPlatformsInput,
): Promise<MatchPlatformsResult> {
  await delay(80);

  const enabledPlatforms = [
    ...new Set(
      params.platforms
        .map((platform) => platform.trim().toLowerCase())
        .filter((platform) => platform.length > 0),
    ),
  ];
  const facebookSelected = enabledPlatforms.includes("facebook");
  const intervalPool = [...params.settings]
    .sort((left, right) => left.interval - right.interval)
    .flatMap((setting) =>
      Array.from({ length: Math.max(0, setting.value) }, () => setting.interval),
    );

  const original = params.originalLocation;
  let selectedAdditional = (params.selectedLocations ?? []).filter(
    (location) =>
      location.geoNameId !== original.geoNameId &&
      !(
        Math.abs(location.latitude - original.latitude) < 0.002 &&
        Math.abs(location.longitude - original.longitude) < 0.002
      ),
  );

  const slotsForOriginal = params.isEditing ? 0 : enabledPlatforms.length;
  if (facebookSelected && selectedAdditional.length === 0) {
    const candidates = (params.candidateLocations ?? []).filter(
      (location) =>
        location.geoNameId !== original.geoNameId &&
        !(
          Math.abs(location.latitude - original.latitude) < 0.002 &&
          Math.abs(location.longitude - original.longitude) < 0.002
        ),
    );
    const maxAdditional =
      intervalPool.length > 0
        ? Math.max(0, intervalPool.length - slotsForOriginal)
        : candidates.length;
    selectedAdditional = candidates.slice(0, maxAdditional);
  }

  if (facebookSelected && intervalPool.length > 0) {
    const remainingCapacity = Math.max(0, intervalPool.length - slotsForOriginal);
    selectedAdditional = selectedAdditional.slice(0, remainingCapacity);
  }

  let poolIdx = 0;
  const originalIntervals = new Map<string, number>();
  for (const platform of enabledPlatforms) {
    originalIntervals.set(
      platform,
      poolIdx < intervalPool.length ? intervalPool[poolIdx++]! : 0,
    );
  }

  const additionalIntervals = selectedAdditional.map(() =>
    poolIdx < intervalPool.length
      ? intervalPool[poolIdx++]!
      : intervalPool.length > 0
        ? intervalPool[intervalPool.length - 1]!
        : 0,
  );

  const totalSlotsNeeded =
    slotsForOriginal + (facebookSelected ? selectedAdditional.length : 0);
  const platforms: MatchPlatformsResult["platforms"] = {};

  for (const platform of enabledPlatforms) {
    const locations = [];
    if (!params.isEditing) {
      locations.push({
        geoNameId: original.geoNameId,
        name: original.name,
        countryCode: original.countryCode ?? "",
        latitude: original.latitude,
        longitude: original.longitude,
        distanceMiles: 0,
        isCenter: true,
        intervalSeconds: originalIntervals.get(platform) ?? 0,
      });
    }
    if (platform === "facebook") {
      selectedAdditional.forEach((location, index) => {
        locations.push({
          geoNameId: location.geoNameId,
          name: location.name,
          countryCode: location.countryCode ?? "",
          latitude: location.latitude,
          longitude: location.longitude,
          distanceMiles: 0,
          isCenter: false,
          intervalSeconds: additionalIntervals[index] ?? 0,
        });
      });
    }
    platforms[platform] = { platform, locations };
  }

  return {
    totalSlotsUsed: totalSlotsNeeded,
    totalSlotsAvailable: intervalPool.length,
    remainingSlots: Math.max(0, intervalPool.length - totalSlotsNeeded),
    platforms,
  };
}

export function getLocationDraft(): LocationDraft {
  return structuredClone(draft);
}

export function setLocationDraft(next: LocationDraft): LocationDraft {
  draft = normalizeDraft(structuredClone(next));
  return structuredClone(draft);
}

export function resetLocationDraft(): LocationDraft {
  return setLocationDraft(defaultLocationDraft);
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
