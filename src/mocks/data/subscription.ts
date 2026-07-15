export type SubscriptionTier = "starter" | "hunter" | "master";
export type BillingPeriod = "weekly" | "yearly";

export interface PlanCredits {
  instant: number;
  fiveMin: number;
  fifteenMin: number;
}

export interface SubscriptionPlan {
  id: SubscriptionTier;
  displayName: string;
  weeklyPrice: number;
  yearlyPrice: number;
  yearlySavePercent: number;
  maxSearches: number;
  badge?: string;
  features: string[];
  credits: PlanCredits;
  highlight?: boolean;
}

export interface SubscriptionState {
  currentTier: SubscriptionTier | null;
  hasActiveSubscription: boolean;
  hasActiveTrial: boolean;
  plans: SubscriptionPlan[];
}

/** FlipSentry tiers — mock prices / limits for UI only. */
export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: "starter",
    displayName: "Starter",
    weeklyPrice: 4.99,
    yearlyPrice: 149.99,
    yearlySavePercent: 42,
    maxSearches: 3,
    credits: { instant: 0, fiveMin: 1, fifteenMin: 2 },
    features: [
      "3 active searches",
      "15 min deal alerts",
      "Deal valuation scores",
      "Basic feed filters",
    ],
  },
  {
    id: "hunter",
    displayName: "Hunter",
    weeklyPrice: 9.99,
    yearlyPrice: 299.99,
    yearlySavePercent: 42,
    maxSearches: 8,
    badge: "Most popular",
    highlight: true,
    credits: { instant: 3, fiveMin: 3, fifteenMin: 2 },
    features: [
      "8 active searches",
      "Instant + 5 min alerts",
      "Full valuation scores",
      "Spam & dealer filters",
      "Priority support",
    ],
  },
  {
    id: "master",
    displayName: "Master",
    weeklyPrice: 19.99,
    yearlyPrice: 599.99,
    yearlySavePercent: 42,
    maxSearches: 20,
    badge: "Best value",
    credits: { instant: 8, fiveMin: 6, fifteenMin: 6 },
    features: [
      "20 active searches",
      "All alert intervals",
      "Advanced insights",
      "Multi-location coverage",
      "Priority support",
    ],
  },
];

export const initialSubscriptionState: SubscriptionState = {
  currentTier: "hunter",
  hasActiveSubscription: true,
  hasActiveTrial: false,
  plans: subscriptionPlans,
};

export function formatMoney(n: number): string {
  return `$${n.toFixed(2)}`;
}
