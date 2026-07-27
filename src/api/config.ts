import Constants from "expo-constants";

import { debugLog } from "@/lib/debug-log";

type Extra = {
  useMock?: boolean;
  apiUrl?: string;
  googleMapsApiKey?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

/** When true, agent delegates to mocks/services. When false, live REST. */
export const USE_MOCK: boolean = extra.useMock !== false;

/** Backend base URL (no trailing slash). */
export const API_URL: string =
  extra.apiUrl?.replace(/\/$/, "") ?? "http://192.168.0.106:9000";

/**
 * Google Maps / Places key (FlipSentry Mobile Maps).
 * Used for autocomplete, place details, reverse geocode, timezone, map tiles.
 */
export const GOOGLE_MAPS_API_KEY: string =
  extra.googleMapsApiKey ||
  (Constants.expoConfig?.android?.config?.googleMaps as { apiKey?: string } | undefined)
    ?.apiKey ||
  "";

debugLog.info("api/config", "Dual-mode API", {
  USE_MOCK,
  API_URL,
  extraUseMock: extra.useMock,
});
