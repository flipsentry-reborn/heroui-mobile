export type SubscriptionTier = "web" | "mobile" | "custom" | "super";

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
 /** Featured plan uses solid white CTA (HeroUI Super Heroes). */
 featured?: boolean;
}

export interface SubscriptionState {
 currentTier: SubscriptionTier | null;
 hasActiveSubscription: boolean;
 hasActiveTrial: boolean;
 plans: SubscriptionPlan[];
}

/**
 * Placeholder plans - HeroUI Pro-inspired copy.
 * Swap `displayName`, `features`, prices, and accents for FlipSentry later.
 * See `SUBSCRIPTION.md`.
 */
export const subscriptionPlans: SubscriptionPlan[] = [
 {
 id: "web",
 displayName: "Web Heroes",
 description: "Get access to React library components and features",
 price: 199,
 billingPeriod: "month",
 priceNote: "Per seat",
 ctaLabel: "Get Web Heroes",
 accent: "teal",
 features: [
 "Pro React components",
 "Premium templates",
 "Pro AI (Skills and MCPs)",
 "500 AI credits per seat included",
 "Premium design systems",
 "Pro theme builder",
 "Private Discord channel",
 "Prioritized issues",
 "Priority support",
 "Shared themes and rules",
 "Usage analytics and reports",
 "Centralized team billing",
 ],
 renewalTitle: "Optional updates renewal at $69/yr/seat",
 renewalNote:
 "Get another year of updates, or keep using your current version. No pressure.",
 },
 {
 id: "mobile",
 displayName: "Mobile Heroes",
 description: "Get access to React Native library components and features",
 price: 199,
 billingPeriod: "month",
 priceNote: "Per seat",
 ctaLabel: "Get Mobile Heroes",
 accent: "purple",
 features: [
 "Pro React Native components",
 "Premium templates",
 "Pro AI (Skills and MCPs)",
 "500 AI credits per seat included",
 "Premium design systems",
 "Pro theme builder",
 "Private Discord channel",
 "Prioritized issues",
 "Priority support",
 "Shared themes and rules",
 "Usage analytics and reports",
 "Centralized team billing",
 ],
 renewalTitle: "Optional updates renewal at $69/yr/seat",
 renewalNote:
 "Get another year of updates, or keep using your current version. No pressure.",
 },
 {
 id: "custom",
 displayName: "Custom Heroes",
 description:
 "Tailored access for teams that need more than a single stack - without going all-in on Super",
 price: 249,
 billingPeriod: "month",
 priceNote: "Per seat",
 ctaLabel: "Get Custom Heroes",
 badge: "Flexible",
 accent: "rose",
 features: [
 "Choose React or React Native Pro components",
 "Premium templates",
 "Pro AI (Skills and MCPs)",
 "750 AI credits per seat included",
 "Premium design systems",
 "Pro theme builder",
 "Private Discord channel",
 "Prioritized issues",
 "Priority support",
 "Shared themes and rules",
 "Usage analytics and reports",
 "Centralized team billing",
 ],
 renewalTitle: "Optional updates renewal at $79/yr/seat",
 renewalNote:
 "Get another year of updates, or keep using your current version. No pressure.",
 },
 {
 id: "super",
 displayName: "Super Heroes",
 description: "The full system. React and React Native, together",
 price: 299,
 billingPeriod: "week",
 priceNote: "Per seat",
 ctaLabel: "Get Super Heroes",
 badge: "Best value",
 accent: "gold",
 featured: true,
 features: [
 "All Pro components (React + React Native)",
 "Premium templates",
 "Pro AI (Skills and MCPs)",
 "1000 AI credits per seat included",
 "Premium design systems",
 "Pro theme builder",
 "Private Discord channels",
 "Prioritized issues",
 "Priority support",
 "Shared themes and rules",
 "Usage analytics and reports",
 "Centralized team billing",
 ],
 renewalTitle: "Optional updates renewal at $99/yr/seat",
 renewalNote:
 "Get another year of updates, or keep using your current version. No pressure.",
 },
];

export const initialSubscriptionState: SubscriptionState = {
 currentTier: null,
 hasActiveSubscription: false,
 hasActiveTrial: false,
 plans: subscriptionPlans,
};

export function formatMoney(n: number): string {
 return `$${n}`;
}

export function formatPlanPrice(plan: SubscriptionPlan): string {
 const suffix = plan.billingPeriod === "week" ? "/wk" : "/mo";
 return `${formatMoney(plan.price)}${suffix}`;
}
