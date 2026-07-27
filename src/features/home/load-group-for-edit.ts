import { intervalSecondsToRunSpeed } from "@/domain/search-rules";
import type { SearchGroup } from "@/mocks/data/home";
import {
  DEFAULT_RADIUS_MILES,
  locationsFixture,
  type LocationDraft,
  type LocationPlatform,
  type LocationResult,
  type LocationRunSpeed,
} from "@/mocks/data/locations";
import type { CarMakesSelection } from "@/features/home/search-bottom-sheet-car-makes-sheet";
import type { IphoneModelSelection } from "@/features/home/search-bottom-sheet-iphone-models-sheet";
import {
  DEFAULT_US_LOCATION_PLATFORMS,
  defaultEnabledPlatforms,
  inferCountryCode,
} from "@/lib/location-platforms";
import { placeRowId } from "@/lib/location-suggest";

function normalizeLocationKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Match fixture places by display/name/city prefix against stored location strings. */
export function findLocationByName(locationName: string): LocationResult | null {
  const key = normalizeLocationKey(locationName);
  if (!key) return null;

  const exact = locationsFixture.find(
    (place) =>
      normalizeLocationKey(place.displayName) === key ||
      normalizeLocationKey(place.name) === key,
  );
  if (exact != null) return structuredClone(exact);

  const city = key.split(",")[0]?.trim() ?? key;
  const byCity = locationsFixture.find(
    (place) =>
      normalizeLocationKey(place.name) === city ||
      normalizeLocationKey(place.displayName).startsWith(`${city},`) ||
      normalizeLocationKey(place.displayName).includes(city),
  );
  if (byCity != null) return structuredClone(byCity);

  return null;
}

type PlaceCoords = {
  latitude?: number;
  longitude?: number;
  country?: string;
  timeZoneId?: string;
  geoNameId?: number;
  placeId?: string;
};

function resolvePlace(
  locationName: string,
  coords?: PlaceCoords,
): LocationResult {
  const latitude = coords?.latitude ?? 0;
  const longitude = coords?.longitude ?? 0;
  const placeId =
    coords?.placeId != null && coords.placeId.length > 0
      ? coords.placeId
      : undefined;
  const geoNameId =
    coords?.geoNameId != null && coords.geoNameId > 0
      ? coords.geoNameId
      : undefined;

  const name = locationName.split(",")[0]?.trim() || locationName || "Location";
  const fromFixture =
    placeId == null && geoNameId == null
      ? findLocationByName(locationName)
      : null;

  const base: LocationResult = {
    id: placeId ?? fromFixture?.placeId ?? fromFixture?.id ?? `legacy-${latitude}-${longitude}`,
    placeId: placeId ?? fromFixture?.placeId,
    name: fromFixture?.name ?? name,
    displayName: locationName || fromFixture?.displayName || name,
    secondaryText: coords?.country ?? fromFixture?.secondaryText ?? "",
    latitude: latitude || fromFixture?.latitude || 0,
    longitude: longitude || fromFixture?.longitude || 0,
    geoNameId: geoNameId ?? fromFixture?.geoNameId,
    countryCode: coords?.country ?? fromFixture?.countryCode,
    timeZoneId: coords?.timeZoneId ?? fromFixture?.timeZoneId,
  };

  return {
    ...base,
    id: placeRowId(base) || base.id,
  };
}

export function buildLocationDraftFromGroup(group: SearchGroup): LocationDraft {
  const centerSetting = group.settings[0];
  const main = resolvePlace(group.locationName, {
    latitude: centerSetting?.latitude,
    longitude: centerSetting?.longitude,
    country: centerSetting?.country,
    timeZoneId: centerSetting?.timeZoneId,
    geoNameId: centerSetting?.geoNameId,
    placeId: centerSetting?.placeId,
  });
  const platforms = [
    ...new Set(group.settings.map((setting) => setting.platform)),
  ] as LocationPlatform[];

  const otherSpeeds: Record<string, LocationRunSpeed> = {};
  const placesById: Record<string, LocationResult> = { [main.id]: main };
  const speedByPlaceId = new Map<string, LocationRunSpeed>();

  for (const setting of group.settings) {
    const place = resolvePlace(setting.locationName, {
      latitude: setting.latitude,
      longitude: setting.longitude,
      country: setting.country,
      timeZoneId: setting.timeZoneId,
      geoNameId: setting.geoNameId,
      placeId: setting.placeId,
    });
    placesById[place.id] = place;
    const speed = intervalSecondsToRunSpeed(setting.runIntervalSeconds);
    if (speed == null) continue;
    if (!speedByPlaceId.has(place.id)) {
      speedByPlaceId.set(place.id, speed);
    }
  }

  for (const [id, speed] of speedByPlaceId) {
    otherSpeeds[id] = speed;
  }

  if (otherSpeeds[main.id] == null) {
    const matchedCenter = group.settings.find((setting) => {
      const place = resolvePlace(setting.locationName, {
        latitude: setting.latitude,
        longitude: setting.longitude,
        geoNameId: setting.geoNameId,
        placeId: setting.placeId,
      });
      return place.id === main.id || setting.locationName === group.locationName;
    });
    if (matchedCenter != null) {
      const speed = intervalSecondsToRunSpeed(matchedCenter.runIntervalSeconds);
      if (speed != null) otherSpeeds[main.id] = speed;
    }
  }

  return {
    main,
    radiusMiles: group.radiusMiles || DEFAULT_RADIUS_MILES,
    platforms:
      platforms.length > 0 ? platforms : [...DEFAULT_US_LOCATION_PLATFORMS],
    otherSpeeds,
    placesById,
  };
}

/** Country for `GET /api/platform/available` from a prior search group. */
export function countryFromSearchGroup(group: SearchGroup): string {
  return inferCountryCode({
    countryCode: group.settings[0]?.country,
    displayName: group.locationName,
    name: group.locationName,
  });
}

/**
 * New Search prefill: reuse prior group location/radius/speeds.
 * Pass `availablePlatforms` from `agent.Platform.getAvailable(country)` to enable all.
 */
export function buildNewSearchLocationDraft(
  group: SearchGroup,
  availablePlatforms?: LocationPlatform[],
): LocationDraft {
  const draft = buildLocationDraftFromGroup(group);
  if (availablePlatforms == null) return draft;
  return {
    ...draft,
    platforms: defaultEnabledPlatforms(availablePlatforms),
  };
}

export interface EditFormPrefill {
  searchType: SearchGroup["searchType"];
  customQuery: string;
  iphoneSelections: IphoneModelSelection[];
  carMakes: CarMakesSelection;
  minPrice: string;
  maxPrice: string;
  minYear: string;
  maxYear: string;
  minMileage: string;
  maxMileage: string;
  locationDraft: LocationDraft;
  notificationEnabled: boolean;
}

function optionalNumberString(value: number | undefined): string {
  return value != null && Number.isFinite(value) ? String(value) : "";
}

function carMakesFromQuery(
  carQuery: SearchGroup["carQuery"],
): CarMakesSelection {
  if (carQuery == null || carQuery.anyMake) {
    return { anyMake: true, selectedIds: [] };
  }
  const makes = (carQuery.vehicleSelection ?? [])
    .map((item) => item.make?.trim())
    .filter((make): make is string => !!make);
  if (makes.length === 0) {
    return { anyMake: true, selectedIds: [] };
  }
  return { anyMake: false, selectedIds: makes };
}

function iphoneSelectionsFromQuery(
  iphoneQuery: SearchGroup["iphoneQuery"],
): IphoneModelSelection[] {
  if (iphoneQuery == null || iphoneQuery.length === 0) return [];
  return iphoneQuery
    .map((item) => {
      const model = item.model?.trim();
      if (!model) return null;
      return {
        id: model,
        min: optionalNumberString(item.minPrice),
        max: optionalNumberString(item.maxPrice),
      };
    })
    .filter((item): item is IphoneModelSelection => item != null);
}

export function loadGroupForEdit(group: SearchGroup): EditFormPrefill {
  const carQuery = group.carQuery;
  return {
    searchType: group.searchType,
    customQuery: group.searchType === "custom" ? (group.customLabel ?? "") : "",
    iphoneSelections:
      group.searchType === "iphone"
        ? iphoneSelectionsFromQuery(group.iphoneQuery)
        : [],
    carMakes:
      group.searchType === "car"
        ? carMakesFromQuery(carQuery)
        : { anyMake: true, selectedIds: [] },
    minPrice: optionalNumberString(carQuery?.minPrice),
    maxPrice: optionalNumberString(carQuery?.maxPrice),
    minYear: optionalNumberString(carQuery?.minYear),
    maxYear: optionalNumberString(carQuery?.maxYear),
    minMileage: optionalNumberString(carQuery?.minMileage),
    maxMileage: optionalNumberString(carQuery?.maxMileage),
    locationDraft: buildLocationDraftFromGroup(group),
    notificationEnabled: group.notificationEnabled ?? true,
  };
}
