export type FlipSentryTier = "starter" | "hunter" | "master";

export interface SubscriptionSlotSetting {
  interval: number;
  value: number;
}

export interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  hasActiveTrial: boolean;
  tier: FlipSentryTier | null;
  totalSlots: number;
  usedSlots: number;
  remainingSlots: number;
  allowedSlotSettings: SubscriptionSlotSetting[];
  remainingSlotSettings: SubscriptionSlotSetting[];
}
