import { createContext, useContext, type JSX, type ReactNode } from "react";

import agent from "@/api/agent";
import CommonStore from "@/store/commonStore";
import FeedStore from "@/store/feedStore";
import SearchStore from "@/store/searchStore";
import SubscriptionStore from "@/store/subscriptionStore";
import UserStore from "@/store/userStore";

export interface RootStore {
  commonStore: CommonStore;
  userStore: UserStore;
  searchStore: SearchStore;
  subscriptionStore: SubscriptionStore;
  feedStore: FeedStore;
  resetStores: () => void;
  hydrate: () => Promise<void>;
}

function wireFeedToSearch(feedStore: FeedStore, searchStore: SearchStore): void {
  feedStore.setSearchStore(searchStore);
  searchStore.setFeedStore(feedStore);
}

function createStores(): Omit<RootStore, "resetStores" | "hydrate"> {
  const commonStore = new CommonStore();
  const userStore = new UserStore(commonStore);
  const subscriptionStore = new SubscriptionStore();
  const searchStore = new SearchStore();
  const feedStore = new FeedStore();
  searchStore.setSubscriptionStore(subscriptionStore);
  wireFeedToSearch(feedStore, searchStore);
  return {
    commonStore,
    userStore,
    searchStore,
    subscriptionStore,
    feedStore,
  };
}

let stores = createStores();

async function startFeedHubConnection(): Promise<void> {
  const { commonStore, feedStore, userStore } = stores;
  if (!userStore.isLoggedIn || !userStore.isPhoneVerified) return;
  if (!commonStore.token) return;

  await agent.FeedHub.start({
    getAccessToken: () => stores.commonStore.token ?? "",
    handlers: {
      onReceiveFeed: (feed) => feedStore.handleReceiveFeed(feed),
      onImageUpdate: (update) => feedStore.handleFeedImageUpdate(update),
      onReconnected: () => feedStore.onHubReconnected(),
      onStatusChange: (status) => feedStore.setHubStatus(status),
    },
  });
}

async function stopFeedHubConnection(): Promise<void> {
  await agent.FeedHub.stop();
  stores.feedStore.setHubStatus("disconnected");
}

function resetStores(): void {
  void stopFeedHubConnection();
  // Keep auth stores so bootstrapped/session flags stay coherent after logout.
  const commonStore = stores.commonStore;
  const userStore = stores.userStore;
  const subscriptionStore = new SubscriptionStore();
  const searchStore = new SearchStore();
  const feedStore = new FeedStore();
  searchStore.setSubscriptionStore(subscriptionStore);
  wireFeedToSearch(feedStore, searchStore);
  stores = {
    commonStore,
    userStore,
    searchStore,
    subscriptionStore,
    feedStore,
  };
}

async function ensureRealtimeSession(): Promise<void> {
  if (!stores.userStore.isLoggedIn || !stores.userStore.isPhoneVerified) return;
  await stores.subscriptionStore.load();
  await stores.searchStore.loadSearchGroups();
  stores.feedStore.flushPendingFeeds();
  await startFeedHubConnection();
}

async function hydrate(): Promise<void> {
  await Promise.all([
    stores.userStore.bootstrap(),
    stores.feedStore.loadLayoutMode(),
  ]);
  await ensureRealtimeSession();
}

stores.userStore.setStoreResetFunction(resetStores);
stores.userStore.setSessionReadyHandler(ensureRealtimeSession);

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
  get feedStore() {
    return stores.feedStore;
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
