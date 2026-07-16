import {
  initialSubscriptionState,
  type SubscriptionState,
  type SubscriptionTier,
} from "@/mocks/data/subscription";
import { setSubscriptionFlags } from "@/mocks/services/settings";

let state: SubscriptionState = structuredClone(initialSubscriptionState);

function delay(ms = 120): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function getSubscription(): Promise<SubscriptionState> {
  await delay();
  return structuredClone(state);
}

export async function mockSubscribe(tier: SubscriptionTier): Promise<SubscriptionState> {
  await delay(400);
  state = {
    ...state,
    currentTier: tier,
    hasActiveSubscription: true,
    hasActiveTrial: false,
  };
  await setSubscriptionFlags({
    hasActiveSubscription: true,
    hasActiveTrial: false,
  });
  return structuredClone(state);
}

export async function mockRestorePurchases(): Promise<SubscriptionState> {
  await delay(350);
  return structuredClone(state);
}
