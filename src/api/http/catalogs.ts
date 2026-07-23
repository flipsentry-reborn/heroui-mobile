import { isHTTPError } from "ky";

import { requests } from "@/api/http/client";
import type { PaginatedResult } from "@/models/pagination";
import type { UserActiveSetting } from "@/models/create-search-setting";

export const livePlatform = {
  getAvailable: (country: string) =>
    requests.get<string[]>(`/api/platform/available?country=${country}`),
};

export const liveIphoneModels = {
  list: () => requests.get<unknown[]>("/api/search-setting/iphone-models"),
  listGrouped: (params?: {
    latitude?: number;
    longitude?: number;
    country?: string;
  }) => {
    const query = new URLSearchParams();
    query.append("catalogVersion", "v2");
    if (params?.latitude !== undefined) {
      query.append("latitude", params.latitude.toString());
    }
    if (params?.longitude !== undefined) {
      query.append("longitude", params.longitude.toString());
    }
    if (params?.country) query.append("country", params.country);
    return requests.get<unknown>(
      "/api/search-setting/iphone-model-groups",
      query,
    );
  },
};

export const liveSamsungModels = {
  list: () => requests.get<unknown[]>("/api/search-setting/samsung-models"),
  listGrouped: (params?: {
    latitude?: number;
    longitude?: number;
    country?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.latitude !== undefined) {
      query.append("latitude", params.latitude.toString());
    }
    if (params?.longitude !== undefined) {
      query.append("longitude", params.longitude.toString());
    }
    if (params?.country) query.append("country", params.country);
    return requests.get<unknown>(
      "/api/search-setting/samsung-model-groups",
      query,
    );
  },
};

export const liveCarMakes = {
  list: () => requests.get<unknown[]>("/api/search-setting/car-makes"),
};

export const liveSearch = {
  getUserActiveSetting: async () => {
    try {
      return await requests.get<UserActiveSetting>(
        "/api/search-setting/user-active-subscription-search-setting",
      );
    } catch (error: unknown) {
      if (isHTTPError(error) && error.response.status === 404) {
        return requests.get<UserActiveSetting>(
          "/api/search-setting/user-active-setting",
        );
      }
      throw error;
    }
  },
};

export interface BlockedSeller {
  id: string;
  source: string;
  sellerId: string;
  sellerName: string;
  sellerAvatarUrl: string;
}

export const liveBlockedSellers = {
  list: (params?: URLSearchParams) =>
    requests.get<PaginatedResult<BlockedSeller[]>>(
      "/api/blocked-sellers",
      params,
    ),
  block: (data: {
    source: string;
    sellerId: string;
    sellerName: string;
    sellerAvatarUrl: string;
  }) => requests.post<BlockedSeller>("/api/blocked-sellers", data),
  unblock: (id: string) =>
    requests.delete<void>(`/api/blocked-sellers/${id}`),
};

export const liveOnboarding = {
  submit: (data: {
    deviceId: string;
    category: string | null;
    monthlyVolume: string | null;
    averageMargin: string | null;
    referralSource: string | null;
    triedOtherApps: boolean | null;
  }) => requests.post<{ id: string }>("/api/onboarding", data),
};
