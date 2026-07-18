import { intervalSecondsToRunSpeed } from "@/domain/search-rules";
import { MOCK_CAR_MAKES } from "@/mocks/data/car";
import type { SearchGroup } from "@/mocks/data/home";
import { MOCK_IPHONE_SERIES } from "@/mocks/data/iphone";
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

const ALL_IPHONE_MODELS = MOCK_IPHONE_SERIES.flatMap((series) => series.models);

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

function syntheticLocation(locationName: string): LocationResult {
  const name = locationName.split(",")[0]?.trim() || locationName || "Location";
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "location";
  return {
    id: `edit-${slug}`,
    name,
    displayName: locationName || name,
    secondaryText: "",
    latitude: 0,
    longitude: 0,
  };
}

function resolvePlace(locationName: string): LocationResult {
  return findLocationByName(locationName) ?? syntheticLocation(locationName);
}

export function buildLocationDraftFromGroup(group: SearchGroup): LocationDraft {
  const main = resolvePlace(group.locationName);
  const platforms = [
    ...new Set(group.settings.map((setting) => setting.platform)),
  ] as LocationPlatform[];

  const otherSpeeds: Record<string, LocationRunSpeed> = {};
  const speedByPlaceId = new Map<string, LocationRunSpeed>();

  for (const setting of group.settings) {
    const place =
      findLocationByName(setting.locationName) ??
      (normalizeLocationKey(setting.locationName).startsWith(
        normalizeLocationKey(main.name),
      )
        ? main
        : resolvePlace(setting.locationName));
    const speed = intervalSecondsToRunSpeed(setting.runIntervalSeconds);
    if (speed == null) continue;
    // First interval wins per place (fixtures keep one speed per location).
    if (!speedByPlaceId.has(place.id)) {
      speedByPlaceId.set(place.id, speed);
    }
  }

  for (const [id, speed] of speedByPlaceId) {
    otherSpeeds[id] = speed;
  }

  // Ensure center has a speed entry when any setting maps to it.
  if (otherSpeeds[main.id] == null) {
    const centerSetting = group.settings.find((setting) => {
      const place = findLocationByName(setting.locationName);
      return place?.id === main.id || setting.locationName === group.locationName;
    });
    if (centerSetting != null) {
      const speed = intervalSecondsToRunSpeed(centerSetting.runIntervalSeconds);
      if (speed != null) otherSpeeds[main.id] = speed;
    }
  }

  return {
    main,
    radiusMiles: group.radiusMiles || DEFAULT_RADIUS_MILES,
    platforms: platforms.length > 0 ? platforms : ["facebook"],
    otherSpeeds,
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
}

function optionalNumberString(value: number | undefined): string {
  return value != null && Number.isFinite(value) ? String(value) : "";
}

function carMakesFromQuery(makes: string[] | undefined): CarMakesSelection {
  if (makes == null || makes.length === 0) {
    return { anyMake: true, selectedIds: [] };
  }
  const selectedIds = makes
    .map((label) => {
      const key = label.trim().toLowerCase();
      return (
        MOCK_CAR_MAKES.find(
          (make) =>
            make.label.toLowerCase() === key || make.id.toLowerCase() === key,
        )?.id ?? null
      );
    })
    .filter((id): id is string => id != null);
  if (selectedIds.length === 0) {
    return { anyMake: true, selectedIds: [] };
  }
  return { anyMake: false, selectedIds };
}

function iphoneSelectionsFromLabel(customLabel: string | undefined): IphoneModelSelection[] {
  if (customLabel == null || !customLabel.trim()) return [];
  const ids = customLabel
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return ids
    .map((id) => {
      const model = ALL_IPHONE_MODELS.find((item) => item.id === id);
      if (model == null) return null;
      return {
        id: model.id,
        min: String(model.defaultMinPrice),
        max: String(model.defaultMaxPrice),
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
        ? iphoneSelectionsFromLabel(group.customLabel)
        : [],
    carMakes:
      group.searchType === "car"
        ? carMakesFromQuery(carQuery?.makes)
        : { anyMake: true, selectedIds: [] },
    minPrice: optionalNumberString(carQuery?.minPrice),
    maxPrice: optionalNumberString(carQuery?.maxPrice),
    minYear: optionalNumberString(carQuery?.minYear),
    maxYear: optionalNumberString(carQuery?.maxYear),
    minMileage: optionalNumberString(carQuery?.minMileage),
    maxMileage: optionalNumberString(carQuery?.maxMileage),
    locationDraft: buildLocationDraftFromGroup(group),
  };
}
