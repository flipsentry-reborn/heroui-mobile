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

export function mapLiveStatusToApp(
  live: LiveSubscriptionStatus,
): SubscriptionStatus {
  return {
    hasActiveSubscription: live.hasActiveSubscription,
    hasActiveTrial: live.isTrialActive,
    tier: normalizeTier(live.tier),
    totalSlots: live.totalSlots,
    usedSlots: live.usedSlots,
    remainingSlots: live.remainingSlots,
    allowedSlotSettings: live.allowedSlotSettings,
    remainingSlotSettings: live.remainingSlotSettings,
  };
}

export function mapLiveStatusToState(
  live: LiveSubscriptionStatus,
): SubscriptionState {
  const tier = normalizeTier(live.tier) ?? normalizeTier(live.trialTier);
  return {
    currentTier: tier,
    hasActiveSubscription: live.hasActiveSubscription,
    hasActiveTrial: live.isTrialActive,
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
    const live = await liveSubscription.getStatus();
    return mapLiveStatusToState(live);
  },
  /** Prefer backend slot math; groups ignored when live. */
  status: async (_groups: SearchGroup[]): Promise<SubscriptionStatus> => {
    const live = await liveSubscription.getStatus();
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
