/**
 * Unified API façade — Mock or Live based on USE_MOCK.
 * Screens/stores call agent only; never branch on mock themselves.
 */

import { USE_MOCK } from "@/api/config";
import {
  applyClientCategoryFilter,
  buildLiveFeedParams,
  buildLiveFeedV1SearchParams,
} from "@/api/feed-query";
import {
  DEFAULT_FEED_DISPLAY_PREFS,
  matchesFeedDisplayPrefs,
} from "@/domain/feed-display-prefs";
import {
  DEFAULT_FEED_HIDE_PREFS,
  matchesFeedHidePrefs,
} from "@/domain/feed-hide-prefs";
import {
  startFeedHub,
  stopFeedHub,
  type FeedHubHandlers,
} from "@/api/signalr/feedHub";
import { liveAccount } from "@/api/http/account";
import {
  liveBlockedSellers,
  liveCarMakes,
  liveIphoneModels,
  liveOnboarding,
  livePlatform,
  liveSamsungModels,
  liveSearch,
} from "@/api/http/catalogs";
import {
  resetHttpClient,
  setAuthToken as setHttpAuthToken,
} from "@/api/http/client";
import { liveFeed } from "@/api/http/feed";
import { liveFilters } from "@/api/http/filters";
import { liveGroupSearch } from "@/api/http/group-search";
import { livePlaces } from "@/api/http/places";
import { liveSubscription } from "@/api/http/subscription";
import {
  createFilter as mockCreateFilter,
  deleteFilter as mockDeleteFilter,
  getFilter as mockGetFilter,
  getFilterTabs as mockGetFilterTabs,
  listFilters as mockListFilters,
  updateFilter as mockUpdateFilter,
} from "@/mocks/services/filters";
import type {
  CreateUserFilterInput,
  UpdateUserFilterInput,
} from "@/models/user-filter";
import type { SearchGroup } from "@/mocks/data/home";
import type { LocationResult } from "@/mocks/data/locations";
import type {
  SubscriptionState,
  SubscriptionTier,
} from "@/mocks/data/subscription";
import * as mockAccount from "@/mocks/services/account";
import {
  blockSeller as mockBlockSeller,
  listBlockedSellers as mockListBlockedSellers,
  unblockSeller as mockUnblockSeller,
} from "@/mocks/services/blocked-sellers";
import {
  listCarMakes as mockListCarMakes,
  listIphoneModelGroups as mockListIphoneModelGroups,
} from "@/mocks/services/catalogs";
import {
  createGroup,
  deleteGroup,
  listGroups,
  toggleGroupActive,
  updateGroup,
  type CreateHomeSearchInput,
  type UpdateHomeSearchInput,
} from "@/mocks/services/home";
import {
  mockMatchPlatforms,
  mockSuggestLocations,
  searchLocations as mockSearchLocations,
} from "@/mocks/services/location";
import type {
  MatchPlatformsInput,
  SuggestLocationsInput,
} from "@/models/search-group";
import {
  getFeedById,
  getFeedPage,
  getLocalComps,
  toggleFavorite,
  type GetFeedParams,
  type GetLocalCompsParams,
} from "@/mocks/services/feed";
import type { PaginatedResult } from "@/models/pagination";
import {
  getSubscription,
  getSubscriptionStatus,
  mockRestorePurchases,
  mockSubscribe,
} from "@/mocks/services/subscription";
import type { FeedItem } from "@/models/feed";
import type { SubscriptionStatus } from "@/models/subscription";
import type {
  PhoneLoginSendCodeRequest,
  PhoneLoginVerifyRequest,
  PhoneVerificationCodeRequest,
  PhoneVerificationRequest,
  User,
  UserLoginFormValues,
  UserNotificationSettings,
  UserPreferences,
  UserRegisterFormValues,
} from "@/models/user";

export function setAuthToken(token: string | null): void {
  setHttpAuthToken(token);
}

export function resetAgent(): void {
  resetHttpClient();
}

// ─── Account ───────────────────────────────────────────────────────────────

const mockAccountApi = {
  login: (user: UserLoginFormValues) => mockAccount.login(user),
  register: (user: UserRegisterFormValues) => mockAccount.register(user),
  forgotPassword: (email: string) => mockAccount.forgotPassword(email),
  resetPassword: (email: string, token: string, newPassword: string) =>
    mockAccount.resetPassword(email, token, newPassword),
  current: () => mockAccount.current(),
  deleteAccount: (password: string) => mockAccount.deleteAccount(password),
  startTrial: (deviceId: string) => mockAccount.startTrial(deviceId),
  sendPhoneVerification: (request: PhoneVerificationRequest) =>
    mockAccount.sendPhoneVerification(request),
  verifyPhone: (request: PhoneVerificationCodeRequest) =>
    mockAccount.verifyPhone(request),
  sendPhoneLoginCode: (request: PhoneLoginSendCodeRequest) =>
    mockAccount.sendPhoneLoginCode(request),
  verifyPhoneLogin: (request: PhoneLoginVerifyRequest) =>
    mockAccount.verifyPhoneLogin(request),
  getPreferences: () => mockAccount.getPreferences(),
  updatePreferences: (prefs: UserPreferences) =>
    mockAccount.updatePreferences(prefs),
  getNotificationSettings: () => mockAccount.getNotificationSettings(),
  updateNotificationSettings: (settings: Partial<UserNotificationSettings>) =>
    mockAccount.updateNotificationSettings(settings),
  createMobileWebToken: async () => ({ token: "mock-mobile-web-token" }),
};

const Account = USE_MOCK ? mockAccountApi : liveAccount;

// ─── Feed ──────────────────────────────────────────────────────────────────

const mockFeedApi = {
  list: async (params?: GetFeedParams): Promise<PaginatedResult<FeedItem[]>> =>
    getFeedPage(params ?? {}),
  getTabAvailability: async () => ({
    showFeatured: true,
    showSold: true,
    tabs: [
      { key: "type:car", label: "Cars", groupIds: ["g1", "g3"] },
      { key: "type:iphone", label: "iPhone", groupIds: ["g2"] },
      { key: "custom:couch", label: "Couch", groupIds: ["group-couch"] },
      { key: "custom:xbox", label: "Xbox", groupIds: ["group-xbox"] },
    ],
    filterTabs: await mockGetFilterTabs(),
  }),
  setClicked: async (_id: string) => undefined,
  setViewed: async (_id: string) => undefined,
  toggleFavorite: (id: string) => toggleFavorite(id),
  delete: async (_id: string) => undefined,
  reportSpam: async (_id: string) => undefined,
  getDetails: async (id: string): Promise<FeedItem | null> => getFeedById(id),
  getLocalComps: async (
    id: string,
    opts?: GetLocalCompsParams,
  ): Promise<FeedItem[]> => getLocalComps(id, opts),
};

const liveFeedApi = {
  list: async (params?: GetFeedParams): Promise<PaginatedResult<FeedItem[]>> => {
    const category = params?.category ?? "all";
    // Text search stays on V1 until timeline FTS exists.
    const result = (params?.query ?? "").trim()
      ? await liveFeed.listV1(buildLiveFeedV1SearchParams(params ?? {}))
      : await liveFeed.list(buildLiveFeedParams(params ?? {}));
    const prefs = params?.displayPrefs ?? DEFAULT_FEED_DISPLAY_PREFS;
    const hidePrefs = params?.hidePrefs ?? DEFAULT_FEED_HIDE_PREFS;
    const filtered = applyClientCategoryFilter(
      result.data ?? [],
      category,
      params?.groupIds,
    );
    // Hide + deal prefs are enforced on GetAllV2 server-side.
    // Keep client filters only for legacy V1 text-search fallback.
    const isV1Search = !!(params?.query ?? "").trim();
    const afterHide = isV1Search
      ? filtered.filter((item) => matchesFeedHidePrefs(item, hidePrefs))
      : filtered;
    const items =
      isV1Search && category !== "best-picks"
        ? afterHide.filter((item) => matchesFeedDisplayPrefs(item, prefs))
        : afterHide;
    // V1 search has no server cursor — synthesize one so stores stay cursor-only.
    const pagination = result.pagination;
    if (isV1Search && pagination) {
      const current = pagination.currentPage ?? 1;
      const total = pagination.totalPages ?? 1;
      return {
        data: items,
        pagination: {
          ...pagination,
          nextCursor: current < total ? `v1:${current + 1}` : null,
        },
      };
    }
    return {
      data: items,
      pagination,
    };
  },
  getTabAvailability: () => liveFeed.getTabAvailability(),
  setClicked: (id: string) => liveFeed.setClicked(id),
  setViewed: (id: string) => liveFeed.setViewed(id),
  toggleFavorite: async (id: string): Promise<FeedItem | null> => {
    await liveFeed.toggleFavorite(id);
    try {
      return await liveFeed.getDetails(id);
    } catch {
      return null;
    }
  },
  delete: (id: string) => liveFeed.delete(id),
  reportSpam: (id: string) => liveFeed.reportSpam(id),
  getDetails: async (id: string): Promise<FeedItem | null> => {
    try {
      return await liveFeed.getDetails(id);
    } catch {
      return null;
    }
  },
  getLocalComps: async (
    id: string,
    opts?: GetLocalCompsParams,
  ): Promise<FeedItem[]> =>
    liveFeed.getLocalComps(id, opts?.sameYear, opts?.days),
};

const Feed = USE_MOCK ? mockFeedApi : liveFeedApi;

const mockFeedHubApi = {
  start: async (_options: {
    getAccessToken: () => string | Promise<string>;
    handlers: FeedHubHandlers;
  }) => undefined,
  stop: async () => undefined,
};

const liveFeedHubApi = {
  start: startFeedHub,
  stop: stopFeedHub,
};

const FeedHub = USE_MOCK ? mockFeedHubApi : liveFeedHubApi;

// ─── GroupSearch ───────────────────────────────────────────────────────────

const mockGroupSearch = {
  list: (): Promise<SearchGroup[]> => listGroups(),
  create: (input: CreateHomeSearchInput): Promise<SearchGroup> =>
    createGroup(input),
  update: (id: string, input: UpdateHomeSearchInput): Promise<SearchGroup> =>
    updateGroup(id, input),
  delete: (id: string): Promise<boolean> => deleteGroup(id),
  setActive: (id: string, isActive: boolean): Promise<SearchGroup | null> =>
    toggleGroupActive(id, isActive),
  suggestLocations: (params: SuggestLocationsInput) =>
    mockSuggestLocations(params),
  matchPlatforms: (params: MatchPlatformsInput) => mockMatchPlatforms(params),
  recentMaps: async () => [],
  get: async (id: string) => {
    const groups = await listGroups();
    const found = groups.find((g) => g.id === id);
    if (!found) throw new Error("Search not found");
    return found;
  },
};

const GroupSearch = USE_MOCK ? mockGroupSearch : liveGroupSearch;

// ─── Filters ───────────────────────────────────────────────────────────────

const mockFilters = {
  list: () => mockListFilters(),
  get: (id: string) => mockGetFilter(id),
  create: (input: CreateUserFilterInput) => mockCreateFilter(input),
  update: (id: string, input: UpdateUserFilterInput) =>
    mockUpdateFilter(id, input),
  delete: (id: string) => mockDeleteFilter(id),
};

const Filters = USE_MOCK ? mockFilters : liveFilters;

// ─── Subscription ──────────────────────────────────────────────────────────

const mockSubscription = {
  get: (): Promise<SubscriptionState> => getSubscription(),
  status: (groups: SearchGroup[]): Promise<SubscriptionStatus> =>
    getSubscriptionStatus(groups),
  subscribe: (tier: SubscriptionTier): Promise<SubscriptionState> =>
    mockSubscribe(tier),
  restore: (): Promise<SubscriptionState> => mockRestorePurchases(),
  getStatus: async (): Promise<SubscriptionStatus> =>
    getSubscriptionStatus([]),
  sync: async () => undefined,
  getAvailableProducts: async () => ({ productIds: [], products: [] }),
};

const Subscription = USE_MOCK
  ? mockSubscription
  : {
      get: liveSubscription.get,
      status: liveSubscription.status,
      subscribe: liveSubscription.subscribe,
      restore: liveSubscription.restore,
      getStatus: async () => {
        const live = await liveSubscription.getStatus();
        const { mapLiveStatusToApp } = await import(
          "@/api/http/subscription"
        );
        return mapLiveStatusToApp(live);
      },
      sync: liveSubscription.sync,
      getAvailableProducts: liveSubscription.getAvailableProducts,
    };

// ─── Other namespaces ──────────────────────────────────────────────────────

const Platform = USE_MOCK
  ? {
      getAvailable: async (country: string) => {
        const code = country.trim().toUpperCase();
        if (code === "CA") return ["facebook", "kijiji"];
        return ["facebook", "offerup", "craigslist"];
      },
    }
  : livePlatform;

const IphoneModels = USE_MOCK
  ? {
      list: async () => [],
      listGrouped: mockListIphoneModelGroups,
    }
  : liveIphoneModels;

const SamsungModels = USE_MOCK
  ? {
      list: async () => [],
      listGrouped: async () => ({
        resolvedCountryCode: "US",
        resolvedCountryName: "United States",
        pricingSource: "fallback",
        currencyCode: "USD",
        currencySymbol: "$",
        groups: [
          {
            key: "galaxy-s",
            label: "Galaxy S",
            models: [
              {
                model: "galaxy-s24",
                displayName: "Galaxy S24",
                minPrice: 400,
                maxPrice: 900,
              },
              {
                model: "galaxy-s23",
                displayName: "Galaxy S23",
                minPrice: 300,
                maxPrice: 700,
              },
            ],
          },
        ],
      }),
    }
  : liveSamsungModels;

const CarMakes = USE_MOCK
  ? { list: mockListCarMakes }
  : liveCarMakes;

const Search = USE_MOCK
  ? {
      getUserActiveSetting: async () => ({
        maxSearchSettings: 15,
        maxActiveSearchSettings: 15,
        allowedSlotSettings: [],
        remainingSlotSettings: [],
      }),
    }
  : liveSearch;

const BlockedSellers = USE_MOCK
  ? {
      list: async () => {
        const data = await mockListBlockedSellers();
        return {
          data,
          pagination: {
            currentPage: 1,
            itemsPerPage: 20,
            totalItems: data.length,
            totalPages: 1,
          },
        };
      },
      block: mockBlockSeller,
      unblock: async (id: string) => {
        await mockUnblockSeller(id);
      },
    }
  : liveBlockedSellers;

const Onboarding = USE_MOCK
  ? {
      submit: async () => ({ id: "mock-onboarding" }),
    }
  : liveOnboarding;

// ─── Locations (autocomplete) ──────────────────────────────────────────────

const mockLocations = {
  search: (query: string): Promise<LocationResult[]> =>
    mockSearchLocations(query),
  resolve: async (place: LocationResult): Promise<LocationResult> => place,
};

const Locations = USE_MOCK ? mockLocations : livePlaces;

const agent = {
  Account,
  Feed,
  FeedHub,
  GroupSearch,
  Filters,
  Locations,
  Platform,
  IphoneModels,
  SamsungModels,
  CarMakes,
  Search,
  Subscription,
  BlockedSellers,
  Onboarding,
  reset: resetAgent,
};

export default agent;
export type { CreateHomeSearchInput, UpdateHomeSearchInput, User };
export { USE_MOCK };
