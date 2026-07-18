import {
  computeRemainingSlotSettings,
  countUsedSlotsByInterval,
  sumSlotValues,
} from "@/domain/search-rules";
import {
  initialSubscriptionPersisted,
  subscriptionPlans,
  type SubscriptionPersistedState,
  type SubscriptionState,
  type SubscriptionTier,
} from "@/mocks/data/subscription";
import {
  getAllowedSlotSettings,
  totalSlotsForTier,
} from "@/mocks/data/tier-slots";
import { readJson, writeJson } from "@/lib/storage";
import type { SubscriptionStatus } from "@/models/subscription";
import { setSubscriptionFlags } from "@/mocks/services/settings";
import type { SearchGroup } from "@/mocks/data/home";

const SUB_KEY = "@flipsentry/subscription";

let persisted: SubscriptionPersistedState = structuredClone(
  initialSubscriptionPersisted,
);
let hydrated = false;

function delay(ms = 120): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function normalizeTier(tier: unknown): SubscriptionTier | null {
  if (tier === "starter" || tier === "hunter" || tier === "master") {
    return tier;
  }
  return null;
}

async function ensureHydrated(): Promise<void> {
  if (hydrated) return;
  const stored = await readJson<SubscriptionPersistedState>(SUB_KEY);
  if (stored != null && typeof stored === "object") {
    const tier = normalizeTier(stored.currentTier);
    persisted = {
      currentTier: tier,
      hasActiveSubscription:
        Boolean(stored.hasActiveSubscription) && tier != null,
      hasActiveTrial: Boolean(stored.hasActiveTrial) && tier != null,
    };
    // Migrate away from legacy HeroUI placeholder tier ids.
    if (stored.currentTier !== tier) {
      await writeJson(SUB_KEY, persisted);
    }
  } else {
    persisted = structuredClone(initialSubscriptionPersisted);
    await writeJson(SUB_KEY, persisted);
  }
  hydrated = true;
}

async function persist(): Promise<void> {
  await writeJson(SUB_KEY, persisted);
}

/** Sync read after hydrate — used by home service for plan building. */
export async function getPersistedSubscription(): Promise<SubscriptionPersistedState> {
  await ensureHydrated();
  return structuredClone(persisted);
}

export async function getSubscription(): Promise<SubscriptionState> {
  await ensureHydrated();
  await delay();
  return {
    ...structuredClone(persisted),
    plans: subscriptionPlans,
  };
}

export function buildSubscriptionStatus(
  state: SubscriptionPersistedState,
  groups: SearchGroup[],
): SubscriptionStatus {
  const tier = state.hasActiveSubscription ? state.currentTier : null;
  const allowed = getAllowedSlotSettings(tier);
  const usedByInterval = countUsedSlotsByInterval(
    groups.flatMap((g) => g.settings),
  );
  const remainingSlotSettings = computeRemainingSlotSettings(
    allowed,
    usedByInterval,
  );
  const totalSlots = totalSlotsForTier(tier);
  const remainingSlots = sumSlotValues(remainingSlotSettings);
  const usedSlots = Math.max(0, totalSlots - remainingSlots);

  return {
    hasActiveSubscription: state.hasActiveSubscription,
    hasActiveTrial: state.hasActiveTrial,
    tier,
    totalSlots,
    usedSlots,
    remainingSlots,
    allowedSlotSettings: allowed,
    remainingSlotSettings,
  };
}

export async function getSubscriptionStatus(
  groups: SearchGroup[],
): Promise<SubscriptionStatus> {
  await ensureHydrated();
  await delay();
  return buildSubscriptionStatus(persisted, groups);
}

export async function mockSubscribe(
  tier: SubscriptionTier,
): Promise<SubscriptionState> {
  await ensureHydrated();
  await delay(400);
  persisted = {
    currentTier: tier,
    hasActiveSubscription: true,
    hasActiveTrial: false,
  };
  await persist();
  await setSubscriptionFlags({
    hasActiveSubscription: true,
    hasActiveTrial: false,
  });
  return {
    ...structuredClone(persisted),
    plans: subscriptionPlans,
  };
}

export async function mockRestorePurchases(): Promise<SubscriptionState> {
  await ensureHydrated();
  await delay(350);
  return {
    ...structuredClone(persisted),
    plans: subscriptionPlans,
  };
}

export async function resetSubscriptionMocks(): Promise<void> {
  persisted = structuredClone(initialSubscriptionPersisted);
  hydrated = true;
  await persist();
}
