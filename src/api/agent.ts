/**
 * Unified API façade — Mock or Live based on USE_MOCK.
 * Screens/stores call agent only; never branch on mock themselves.
 */

import { USE_MOCK } from "@/api/config";
import {
  applyClientCategoryFilter,
  buildLiveFeedParams,
  buildLiveSoldParams,
} from "@/api/feed-query";
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
import { liveFeed, liveSoldListings } from "@/api/http/feed";
import { liveGroupSearch } from "@/api/http/group-search";
import { liveSubscription } from "@/api/http/subscription";
import type { SearchGroup } from "@/mocks/data/home";
import type {
  SubscriptionState,
  SubscriptionTier,
} from "@/mocks/data/subscription";
import * as mockAccount from "@/mocks/services/account";
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
import type { FeedItem, LocalCompItem } from "@/models/feed";
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

function mapLocalCompToFeedItem(comp: LocalCompItem): FeedItem {
  return {
    id: comp.feedId ?? comp.listingId,
    platform: (comp.platform as FeedItem["platform"]) || "facebookMarketplace",
    listingId: comp.listingId,
    creationTime: comp.postedDate ?? new Date().toISOString(),
    appUserId: "",
    title: comp.title,
    description: comp.description ?? "",
    price: comp.price,
    location: {
      latitude: comp.latitude ?? 0,
      longitude: comp.longitude ?? 0,
    },
    locationText: comp.locationText ?? "",
    distanceMiles: comp.distanceMiles,
    images: {
      mainImageUrl: {
        imageUrl: comp.imageUrl ?? "",
        expiresAt: null,
      },
      marketplaceImages: (comp.imageUrls ?? []).map((url) => ({
        imageUrl: url,
        expiresAt: null,
      })),
      imageUrlHostedByUs: comp.imageUrl ?? "",
    },
    searchSettingIds: [],
    keywordTags: { title: [], description: [] },
    createdAt: comp.postedDate ?? new Date().toISOString(),
    seenAt: [],
    isFavorite: false,
    favoritedAt: null,
    isSpamReported: false,
    spamReportedAt: null,
    isDeleted: false,
    deletedAt: null,
    isSniped: false,
    condition: "",
    currency: comp.currency,
    currencySymbol: comp.currencySymbol,
    listingUrl: comp.listingUrl ?? undefined,
    vehicleSpecifications:
      comp.vehicleYear != null
        ? {
            vehicleYear: comp.vehicleYear,
            vehicleMileage: comp.mileageInMiles ?? undefined,
          }
        : undefined,
    compValuation:
      comp.buySignal != null
        ? {
            calculated: true,
            valuationType: "car",
            valuationSource: "comps",
            platform: comp.platform,
            listingId: comp.listingId,
            make: "",
            model: "",
            trim: null,
            year: comp.vehicleYear ?? 0,
            mileage: comp.mileageInMiles ?? 0,
            price: comp.price,
            fairPrice: comp.fairPrice ?? 0,
            profit: 0,
            buySignal: comp.buySignal,
            compCount: 0,
            percentileRank: 0,
            medianCvs: 0,
            targetCvs: 0,
            mileageLow: 0,
            mileageHigh: 0,
            warnings: [],
            calculatedAt: new Date().toISOString(),
          }
        : undefined,
  };
}

const liveFeedApi = {
  list: async (params?: GetFeedParams): Promise<PaginatedResult<FeedItem[]>> => {
    const category = params?.category ?? "all";
    if (category === "sold") {
      const result = await liveSoldListings.list(
        buildLiveSoldParams(params ?? {}),
      );
      return {
        data: result.data ?? [],
        pagination: result.pagination,
      };
    }
    const result = await liveFeed.list(buildLiveFeedParams(params ?? {}));
    const items = applyClientCategoryFilter(
      result.data ?? [],
      category,
      params?.groupIds,
    );
    return {
      data: items,
      pagination: result.pagination,
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
  ): Promise<FeedItem[]> => {
    const comps = await liveFeed.getLocalComps(
      id,
      opts?.sameYear,
      opts?.days,
    );
    return comps.map(mapLocalCompToFeedItem);
  },
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

const SoldListings = {
  list: USE_MOCK
    ? async (params?: GetFeedParams) =>
        getFeedPage({ ...params, category: "sold" })
    : (params?: URLSearchParams) => liveSoldListings.list(params),
};

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
  suggestLocations: async () => ({ locations: [] }),
  matchPlatforms: async () => ({ settings: [] }),
  recentMaps: async () => [],
  get: async (id: string) => {
    const groups = await listGroups();
    const found = groups.find((g) => g.id === id);
    if (!found) throw new Error("Search not found");
    return found;
  },
};

const GroupSearch = USE_MOCK ? mockGroupSearch : liveGroupSearch;

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
      getAvailable: async (_country: string) => [
        "facebook",
        "offerUp",
        "craigslist",
        "kijiji",
      ],
    }
  : livePlatform;

const IphoneModels = USE_MOCK
  ? {
      list: async () => [],
      listGrouped: async () => ({ groups: [] }),
    }
  : liveIphoneModels;

const SamsungModels = USE_MOCK
  ? {
      list: async () => [],
      listGrouped: async () => ({ groups: [] }),
    }
  : liveSamsungModels;

const CarMakes = USE_MOCK
  ? { list: async () => [] }
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
      list: async () => ({
        data: [] as never[],
        pagination: {
          currentPage: 1,
          itemsPerPage: 20,
          totalItems: 0,
          totalPages: 0,
        },
      }),
      block: async () => {
        throw new Error("Blocked sellers require live API");
      },
      unblock: async () => undefined,
    }
  : liveBlockedSellers;

const Onboarding = USE_MOCK
  ? {
      submit: async () => ({ id: "mock-onboarding" }),
    }
  : liveOnboarding;

const agent = {
  Account,
  Feed,
  FeedHub,
  SoldListings,
  GroupSearch,
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
