import { requests } from "@/api/http/client";
import { subscriptionPlans } from "@/mocks/data/subscription";
import type {
  SubscriptionState,
  SubscriptionTier,
} from "@/mocks/data/subscription";
import type { SearchGroup } from "@/mocks/data/home";
import type { SubscriptionStatus } from "@/models/subscription";

/** Backend subscription status (mobile-app shape). */
export interface LiveSubscriptionStatus {
  hasActiveSubscription: boolean;
  tier: SubscriptionTier | "custom" | null;
  productId: string | null;
  store: string | null;
  status: string | null;
  expiresAt: string | null;
  isInGracePeriod: boolean;
  willRenew: boolean;
  isCancelled: boolean;
  isTrialActive: boolean;
  trialTier: SubscriptionTier | "custom" | null;
  trialExpiresAt: string | null;
  totalSlots: number;
  usedSlots: number;
  remainingSlots: number;
  allowedSlotSettings: Array<{ interval: number; value: number }>;
  remainingSlotSettings: Array<{ interval: number; value: number }>;
}

export interface AvailableProduct {
  productId: string;
  tier: SubscriptionTier | "custom";
  name: string;
  displayName: string;
  isDiscounted: boolean;
  isCustomOffer: boolean;
  offerExpiresAt: string | null;
  features: string[];
  trialDays: number | null;
  stripePrice: number | null;
  stripeCurrency: string | null;
  stripePeriod: string | null;
}

export interface AvailableProductsResponse {
  productIds: string[];
  products: AvailableProduct[];
}

function normalizeTier(
  tier: string | null | undefined,
): SubscriptionTier | null {
  if (tier === "starter" || tier === "hunter" || tier === "master") return tier;
  return null;
}

const EMPTY_LIVE_STATUS: LiveSubscriptionStatus = {
  hasActiveSubscription: false,
  tier: null,
  productId: null,
  store: null,
  status: null,
  expiresAt: null,
  isInGracePeriod: false,
  willRenew: false,
  isCancelled: false,
  isTrialActive: false,
  trialTier: null,
  trialExpiresAt: null,
  totalSlots: 0,
  usedSlots: 0,
  remainingSlots: 0,
  allowedSlotSettings: [],
  remainingSlotSettings: [],
};

function coerceLiveStatus(
  live: LiveSubscriptionStatus | null | undefined,
): LiveSubscriptionStatus {
  if (live == null || typeof live !== "object") {
    return EMPTY_LIVE_STATUS;
  }
  return {
    ...EMPTY_LIVE_STATUS,
    ...live,
    allowedSlotSettings: live.allowedSlotSettings ?? [],
    remainingSlotSettings: live.remainingSlotSettings ?? [],
  };
}

export function mapLiveStatusToApp(
  live: LiveSubscriptionStatus | null | undefined,
): SubscriptionStatus {
  const status = coerceLiveStatus(live);
  return {
    hasActiveSubscription: Boolean(status.hasActiveSubscription),
    hasActiveTrial: Boolean(status.isTrialActive),
    tier: normalizeTier(status.tier),
    totalSlots: status.totalSlots ?? 0,
    usedSlots: status.usedSlots ?? 0,
    remainingSlots: status.remainingSlots ?? 0,
    allowedSlotSettings: status.allowedSlotSettings,
    remainingSlotSettings: status.remainingSlotSettings,
  };
}

export function mapLiveStatusToState(
  live: LiveSubscriptionStatus | null | undefined,
): SubscriptionState {
  const status = coerceLiveStatus(live);
  const tier =
    normalizeTier(status.tier) ?? normalizeTier(status.trialTier);
  return {
    currentTier: tier,
    hasActiveSubscription: Boolean(status.hasActiveSubscription),
    hasActiveTrial: Boolean(status.isTrialActive),
    plans: subscriptionPlans,
  };
}

export const liveSubscription = {
  getStatus: () =>
    requests.get<LiveSubscriptionStatus>("/api/subscription/status"),
  sync: () => requests.post<void>("/api/subscription/sync", {}),
  getAvailableProducts: () =>
    requests.get<AvailableProductsResponse>(
      "/api/subscription/available-products",
    ),
  /** Façade compatible with mock Subscription.get */
  get: async (): Promise<SubscriptionState> => {
    const live = await liveSubscription.getStatus().catch(() => null);
    return mapLiveStatusToState(live);
  },
  /** Prefer backend slot math; groups ignored when live. */
  status: async (_groups: SearchGroup[]): Promise<SubscriptionStatus> => {
    const live = await liveSubscription.getStatus().catch(() => null);
    return mapLiveStatusToApp(live);
  },
  /** No Adapty in this build — refresh status only. */
  subscribe: async (_tier: SubscriptionTier): Promise<SubscriptionState> => {
    await liveSubscription.sync().catch(() => undefined);
    return liveSubscription.get();
  },
  restore: async (): Promise<SubscriptionState> => {
    await liveSubscription.sync().catch(() => undefined);
    return liveSubscription.get();
  },
};
