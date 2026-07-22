import Constants from "expo-constants";

type Extra = {
  useMock?: boolean;
  apiUrl?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

/** When true, agent delegates to mocks/services. When false, live REST. */
export const USE_MOCK: boolean = extra.useMock !== false;

/** Backend base URL (no trailing slash). */
export const API_URL: string =
  extra.apiUrl?.replace(/\/$/, "") ?? "http://192.168.0.106:9000";
