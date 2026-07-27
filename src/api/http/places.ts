/**
 * Google Places Autocomplete + Place Details + Time Zone (live only).
 * Matches mobile-app locationStore behavior: types=(regions).
 * Kept in sync with heroui-frontend `src/api/http/places.ts` (same REST paths + mapping).
 */

import { GOOGLE_MAPS_API_KEY } from "@/api/config";
import type { LocationResult } from "@/mocks/data/locations";

interface GooglePlacePrediction {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text?: string;
    secondary_text?: string;
  };
}

interface GoogleAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface AutocompleteResponse {
  status: string;
  predictions?: GooglePlacePrediction[];
  error_message?: string;
}

interface PlaceDetailsResponse {
  status: string;
  result?: {
    geometry?: { location?: { lat: number; lng: number } };
    address_components?: GoogleAddressComponent[];
    formatted_address?: string;
  };
  error_message?: string;
}

interface TimeZoneResponse {
  status: string;
  timeZoneId?: string;
}

/** React Native can call Google Maps HTTP APIs directly (no browser CORS). */
const GOOGLE_MAPS_HTTP_ORIGIN = "https://maps.googleapis.com";

function requireApiKey(): string {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error(
      "Missing EXPO_PUBLIC_GOOGLE_MAPS_API_KEY — required for live location search.",
    );
  }
  return GOOGLE_MAPS_API_KEY;
}

function mapsUrl(pathAndQuery: string): string {
  const path = pathAndQuery.startsWith("/")
    ? pathAndQuery
    : `/${pathAndQuery}`;
  return `${GOOGLE_MAPS_HTTP_ORIGIN}${path}`;
}

function getAddressComponent(
  components: GoogleAddressComponent[],
  type: string,
): GoogleAddressComponent | undefined {
  return components.find((c) => c.types.includes(type));
}

/** Match backend SuggestLocations.FormatLocationName — "City, State, Country" (no zip). */
function formatPlaceDisplayName(
  components: GoogleAddressComponent[],
  fallback: string,
): { name: string; displayName: string } {
  const city =
    getAddressComponent(components, "locality")?.long_name ||
    getAddressComponent(components, "sublocality")?.long_name ||
    getAddressComponent(components, "neighborhood")?.long_name ||
    getAddressComponent(components, "administrative_area_level_2")?.long_name ||
    "";
  const state =
    getAddressComponent(components, "administrative_area_level_1")?.long_name ||
    "";
  const country =
    getAddressComponent(components, "country")?.short_name || "";
  const parts = [city, state, country].filter((part) => part.length > 0);
  const displayName = parts.length > 0 ? parts.join(", ") : fallback;
  return {
    name: city || displayName.split(",")[0]?.trim() || displayName,
    displayName,
  };
}

async function resolveTimeZone(
  latitude: number,
  longitude: number,
  key: string,
): Promise<string> {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const url = mapsUrl(
      `/maps/api/timezone/json?location=${latitude},${longitude}&timestamp=${timestamp}&key=${key}`,
    );
    const response = await fetch(url);
    const data = (await response.json()) as TimeZoneResponse;
    if (data.status === "OK" && data.timeZoneId) {
      return data.timeZoneId;
    }
    return "";
  } catch {
    return "";
  }
}

/** Autocomplete predictions (coords filled after resolvePlace). */
export async function searchPlacePredictions(
  query: string,
): Promise<LocationResult[]> {
  const term = query.trim();
  if (term.length < 2) return [];

  const key = requireApiKey();
  const url = mapsUrl(
    `/maps/api/place/autocomplete/json?input=${encodeURIComponent(
      term,
    )}&types=(regions)&key=${key}`,
  );

  const response = await fetch(url);
  const data = (await response.json()) as AutocompleteResponse;

  if (data.status !== "OK" || !Array.isArray(data.predictions)) {
    if (data.status !== "ZERO_RESULTS") {
      console.warn(
        "[Places] autocomplete status:",
        data.status,
        data.error_message ?? "",
      );
    }
    return [];
  }

  return data.predictions.map((prediction) => {
    const name =
      prediction.structured_formatting?.main_text ||
      prediction.description.split(",")[0]?.trim() ||
      prediction.description;
    return {
      id: prediction.place_id,
      placeId: prediction.place_id,
      name,
      displayName: prediction.description,
      secondaryText:
        prediction.structured_formatting?.secondary_text || "",
      latitude: 0,
      longitude: 0,
    } satisfies LocationResult;
  });
}

/** Resolve place_id → lat/lng/country/timeZone. */
export async function resolvePlaceDetails(
  place: LocationResult,
): Promise<LocationResult> {
  if (place.placeId == null || place.placeId.length === 0) {
    return place;
  }
  if (
    place.latitude !== 0 &&
    place.longitude !== 0 &&
    place.countryCode != null &&
    place.timeZoneId != null
  ) {
    return place;
  }

  const key = requireApiKey();
  const detailsUrl = mapsUrl(
    `/maps/api/place/details/json?place_id=${encodeURIComponent(
      place.placeId,
    )}&fields=geometry,address_components,formatted_address&key=${key}`,
  );

  const detailsResponse = await fetch(detailsUrl);
  const detailsData = (await detailsResponse.json()) as PlaceDetailsResponse;

  if (
    detailsData.status !== "OK" ||
    detailsData.result?.geometry?.location == null
  ) {
    throw new Error(
      `Place details failed: ${detailsData.status}${
        detailsData.error_message ? ` — ${detailsData.error_message}` : ""
      }`,
    );
  }

  const lat = detailsData.result.geometry.location.lat;
  const lng = detailsData.result.geometry.location.lng;
  const components = detailsData.result.address_components ?? [];
  const country = getAddressComponent(components, "country")?.short_name ?? "";
  const timeZoneId = await resolveTimeZone(lat, lng, key);
  const fallback =
    detailsData.result.formatted_address || place.displayName || place.name;
  const labeled = formatPlaceDisplayName(components, fallback);

  return {
    ...place,
    displayName: labeled.displayName,
    name: labeled.name || place.name,
    latitude: lat,
    longitude: lng,
    countryCode: country || place.countryCode,
    timeZoneId: timeZoneId || place.timeZoneId,
    isCenter: true,
  };
}

export const livePlaces = {
  search: searchPlacePredictions,
  resolve: resolvePlaceDetails,
};
