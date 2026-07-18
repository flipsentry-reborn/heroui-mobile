import { createContext, useContext, type JSX, type ReactNode } from "react";

import SearchStore from "@/store/searchStore";
import SubscriptionStore from "@/store/subscriptionStore";

export interface RootStore {
  searchStore: SearchStore;
  subscriptionStore: SubscriptionStore;
  resetStores: () => void;
  hydrate: () => Promise<void>;
}

function createStores(): Omit<RootStore, "resetStores" | "hydrate"> {
  const subscriptionStore = new SubscriptionStore();
  const searchStore = new SearchStore();
  searchStore.setSubscriptionStore(subscriptionStore);
  return { searchStore, subscriptionStore };
}

let stores = createStores();

function resetStores(): void {
  stores = createStores();
}

async function hydrate(): Promise<void> {
  await stores.subscriptionStore.load();
  await stores.searchStore.loadSearchGroups();
}

export const store: RootStore = {
  get searchStore() {
    return stores.searchStore;
  },
  get subscriptionStore() {
    return stores.subscriptionStore;
  },
  resetStores,
  hydrate,
};

export const StoreContext = createContext<RootStore>(store);

export function useStore(): RootStore {
  return useContext(StoreContext);
}

interface StoreProviderProps {
  children: ReactNode;
}

export function StoreProvider({ children }: StoreProviderProps): JSX.Element {
  return (
    <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
  );
}
