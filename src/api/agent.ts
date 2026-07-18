/**
 * Mock API façade mirroring mobile-app `agent` namespaces.
 * No Axios — delegates to `mocks/services/*` only.
 */

import type { SearchGroup } from "@/mocks/data/home";
import type { SubscriptionState, SubscriptionTier } from "@/mocks/data/subscription";
import type { SubscriptionStatus } from "@/models/subscription";
import {
  createGroup,
  deleteGroup,
  listGroups,
  toggleGroupActive,
  type CreateHomeSearchInput,
} from "@/mocks/services/home";
import {
  getSubscription,
  getSubscriptionStatus,
  mockRestorePurchases,
  mockSubscribe,
} from "@/mocks/services/subscription";

const GroupSearch = {
  list: (): Promise<SearchGroup[]> => listGroups(),
  create: (input: CreateHomeSearchInput): Promise<SearchGroup> =>
    createGroup(input),
  delete: (id: string): Promise<boolean> => deleteGroup(id),
  setActive: (id: string, isActive: boolean): Promise<SearchGroup | null> =>
    toggleGroupActive(id, isActive),
};

const Subscription = {
  get: (): Promise<SubscriptionState> => getSubscription(),
  status: (groups: SearchGroup[]): Promise<SubscriptionStatus> =>
    getSubscriptionStatus(groups),
  subscribe: (tier: SubscriptionTier): Promise<SubscriptionState> =>
    mockSubscribe(tier),
  restore: (): Promise<SubscriptionState> => mockRestorePurchases(),
};

const agent = {
  GroupSearch,
  Subscription,
};

export default agent;
export type { CreateHomeSearchInput };
