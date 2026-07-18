import type { FlipSentryTier } from "@/models/subscription";
import { TIER_SLOT_TABLES, totalSlotsForTier } from "@/mocks/data/tier-slots";
import { formatIntervalLabel } from "@/domain/search-rules";

export type SubscriptionTier = FlipSentryTier;

export type PlanAccent = "teal" | "purple" | "rose" | "gold";

export type BillingPeriod = "month" | "week";

export interface SubscriptionPlan {
  id: SubscriptionTier;
  displayName: string;
  description: string;
  price: number;
  billingPeriod: BillingPeriod;
  priceNote: string;
  ctaLabel: string;
  badge?: string;
  accent: PlanAccent;
  features: string[];
  renewalTitle: string;
  renewalNote: string;
  featured?: boolean;
}

export interface SubscriptionPersistedState {
  currentTier: SubscriptionTier | null;
  hasActiveSubscription: boolean;
  hasActiveTrial: boolean;
}

export interface SubscriptionState extends SubscriptionPersistedState {
  plans: SubscriptionPlan[];
}

function slotFeatureLines(tier: SubscriptionTier): string[] {
  const slots = TIER_SLOT_TABLES[tier];
  const total = totalSlotsForTier(tier);
  const speedLines = slots.map(
    (s) => `${s.value}× ${formatIntervalLabel(s.interval)} alerts`,
  );
  return [`${total} active search slots`, ...speedLines, "Access to all platforms"];
}

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: "starter",
    displayName: "Starter",
    description: "For casual flippers. Steady 5-min alerts across all platforms.",
    price: 29,
    billingPeriod: "month",
    priceNote: "Billed monthly",
    ctaLabel: "Get Starter",
    accent: "teal",
    features: slotFeatureLines("starter"),
    renewalTitle: "Cancel anytime",
    renewalNote: "Keep your searches until the period ends. No pressure.",
  },
  {
    id: "hunter",
    displayName: "Hunter",
    description: "For growing flippers. Faster 3-min alerts and more slots.",
    price: 49,
    billingPeriod: "month",
    priceNote: "Billed monthly",
    ctaLabel: "Get Hunter",
    badge: "Popular",
    accent: "purple",
    features: slotFeatureLines("hunter"),
    renewalTitle: "Cancel anytime",
    renewalNote: "Keep your searches until the period ends. No pressure.",
  },
  {
    id: "master",
    displayName: "Master",
    description: "For car flippers who need Instant alerts and max coverage.",
    price: 79,
    billingPeriod: "month",
    priceNote: "Billed monthly",
    ctaLabel: "Get Master",
    badge: "Best value",
    accent: "gold",
    featured: true,
    features: slotFeatureLines("master"),
    renewalTitle: "Cancel anytime",
    renewalNote: "Keep your searches until the period ends. No pressure.",
  },
];

/** Default mock: Hunter subscribed so home credits / create rules are demoable. */
export const initialSubscriptionPersisted: SubscriptionPersistedState = {
  currentTier: "hunter",
  hasActiveSubscription: true,
  hasActiveTrial: false,
};

export const initialSubscriptionState: SubscriptionState = {
  ...initialSubscriptionPersisted,
  plans: subscriptionPlans,
};

export function formatMoney(n: number): string {
  return `$${n}`;
}

export function formatPlanPrice(plan: SubscriptionPlan): string {
  const suffix = plan.billingPeriod === "week" ? "/wk" : "/mo";
  return `${formatMoney(plan.price)}${suffix}`;
}
