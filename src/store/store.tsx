import { createContext, useContext, type JSX, type ReactNode } from "react";

import CommonStore from "@/store/commonStore";
import SearchStore from "@/store/searchStore";
import SubscriptionStore from "@/store/subscriptionStore";
import UserStore from "@/store/userStore";

export interface RootStore {
  commonStore: CommonStore;
  userStore: UserStore;
  searchStore: SearchStore;
  subscriptionStore: SubscriptionStore;
  resetStores: () => void;
  hydrate: () => Promise<void>;
}

function createStores(): Omit<RootStore, "resetStores" | "hydrate"> {
  const commonStore = new CommonStore();
  const userStore = new UserStore(commonStore);
  const subscriptionStore = new SubscriptionStore();
  const searchStore = new SearchStore();
  searchStore.setSubscriptionStore(subscriptionStore);
  return { commonStore, userStore, searchStore, subscriptionStore };
}

let stores = createStores();

function resetStores(): void {
  // Keep auth stores so bootstrapped/session flags stay coherent after logout.
  const commonStore = stores.commonStore;
  const userStore = stores.userStore;
  const subscriptionStore = new SubscriptionStore();
  const searchStore = new SearchStore();
  searchStore.setSubscriptionStore(subscriptionStore);
  stores = { commonStore, userStore, searchStore, subscriptionStore };
}

async function hydrate(): Promise<void> {
  await stores.userStore.bootstrap();
  if (stores.userStore.isLoggedIn && stores.userStore.isPhoneVerified) {
    await stores.subscriptionStore.load();
    await stores.searchStore.loadSearchGroups();
  }
}

stores.userStore.setStoreResetFunction(resetStores);

export const store: RootStore = {
  get commonStore() {
    return stores.commonStore;
  },
  get userStore() {
    return stores.userStore;
  },
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
