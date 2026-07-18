import type { FlipSentryTier, SubscriptionSlotSetting } from "@/models/subscription";

/**
 * Hardcoded mock capacities per FlipSentry tier.
 * Marketing: Starter 7 / 5-min, Hunter 15 / 3-min, Master 22 / Instant.
 */
export const TIER_SLOT_TABLES: Record<FlipSentryTier, SubscriptionSlotSetting[]> =
  {
    starter: [{ interval: 300, value: 7 }],
    hunter: [
      { interval: 180, value: 10 },
      { interval: 300, value: 5 },
    ],
    master: [
      { interval: 60, value: 12 },
      { interval: 180, value: 6 },
      { interval: 300, value: 4 },
    ],
  };

export const TIER_DISPLAY_NAMES: Record<FlipSentryTier, string> = {
  starter: "Starter",
  hunter: "Hunter",
  master: "Master",
};

export function getAllowedSlotSettings(
  tier: FlipSentryTier | null,
): SubscriptionSlotSetting[] {
  if (tier == null) return [];
  return TIER_SLOT_TABLES[tier].map((s) => ({ ...s }));
}

export function totalSlotsForTier(tier: FlipSentryTier | null): number {
  return getAllowedSlotSettings(tier).reduce((sum, s) => sum + s.value, 0);
}
