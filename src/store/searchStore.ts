import { makeAutoObservable, runInAction } from "mobx";

import agent, {
  type CreateHomeSearchInput,
  type UpdateHomeSearchInput,
} from "@/api/agent";
import {
  buildFeedCategories,
  buildForYouShelves,
  buildYourSearchChildren,
  type FeedCategoryDef,
} from "@/features/feed/build-feed-categories";
import { buildHomePlan, sortSearchGroups } from "@/mocks/services/home";
import type { HomePlan, SearchGroup } from "@/mocks/data/home";
import type { FeedFilterTab, FeedTabAvailability } from "@/models/feed";
import type FeedStore from "@/store/feedStore";
import type SubscriptionStore from "@/store/subscriptionStore";

/**
 * Owns search groups list + create/update/delete/toggle.
 * Slot capacity lives on SubscriptionStore; this store refreshes it after mutations.
 */
export default class SearchStore {
  searchGroups: SearchGroup[] = [];
  loading = false;
  hasLoaded = false;
  submitting = false;
  lastError: string | null = null;

  loadingFeedTabAvailability = false;
  hasLoadedFeedTabAvailability = false;
  showFeaturedTab = false;
  showSoldTab = false;
  feedTabs: FeedFilterTab[] = [];

  private subscriptionStore: SubscriptionStore | null = null;
  private feedStore: FeedStore | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  setSubscriptionStore(store: SubscriptionStore): void {
    this.subscriptionStore = store;
  }

  setFeedStore(store: FeedStore): void {
    this.feedStore = store;
  }

  get loadingInitial(): boolean {
    return this.loading && !this.hasLoaded;
  }

  get homePlan(): HomePlan {
    const tier = this.subscriptionStore?.hasActiveSubscription
      ? this.subscriptionStore.currentTier
      : null;
    return buildHomePlan(tier, this.searchGroups);
  }

  get canCreateSearch(): boolean {
    return this.subscriptionStore?.canCreate ?? false;
  }

  get feedTabAvailability(): FeedTabAvailability {
    return {
      showFeatured: this.showFeaturedTab,
      showSold: this.showSoldTab,
      tabs: this.feedTabs,
    };
  }

  get feedCategories(): FeedCategoryDef[] {
    return buildFeedCategories(
      this.hasLoadedFeedTabAvailability ? this.feedTabAvailability : null,
    );
  }

  get forYouShelves() {
    return buildForYouShelves(
      this.hasLoadedFeedTabAvailability ? this.feedTabAvailability : null,
    );
  }

  get yourSearchChildren(): FeedCategoryDef[] {
    return buildYourSearchChildren(this.feedTabs);
  }

  groupIdsForCategory(key: string): string[] | undefined {
    const tab = this.feedTabs.find((entry) => entry.key === key);
    return tab?.groupIds;
  }

  async loadSearchGroups(): Promise<void> {
    if (this.loading) return;
    this.loading = true;
    this.lastError = null;
    const hadLoaded = this.hasLoaded;
    try {
      const groups = await agent.GroupSearch.list();
      runInAction(() => {
        this.searchGroups = sortSearchGroups(groups);
        this.hasLoaded = true;
      });
      await this.subscriptionStore?.refreshStatus(groups);
      await this.loadFeedTabAvailability(hadLoaded);
    } catch (error) {
      runInAction(() => {
        this.lastError =
          error instanceof Error ? error.message : "Failed to load searches";
      });
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  async loadFeedTabAvailability(force = false): Promise<void> {
    if (this.loadingFeedTabAvailability) return;
    if (this.hasLoadedFeedTabAvailability && !force) return;

    try {
      runInAction(() => {
        this.loadingFeedTabAvailability = true;
      });
      const availability = await agent.Feed.getTabAvailability();
      runInAction(() => {
        this.showFeaturedTab = availability.showFeatured;
        this.showSoldTab = availability.showSold;
        this.feedTabs = availability.tabs ?? [];
        this.hasLoadedFeedTabAvailability = true;
      });
      this.feedStore?.flushPendingFeeds();
    } catch {
      runInAction(() => {
        this.hasLoadedFeedTabAvailability = true;
      });
      this.feedStore?.flushPendingFeeds();
    } finally {
      runInAction(() => {
        this.loadingFeedTabAvailability = false;
      });
    }
  }

  async createGroup(input: CreateHomeSearchInput): Promise<SearchGroup | null> {
    if (this.submitting) return null;
    this.submitting = true;
    this.lastError = null;
    try {
      const group = await agent.GroupSearch.create(input);
      runInAction(() => {
        this.searchGroups = sortSearchGroups([group, ...this.searchGroups]);
      });
      await this.subscriptionStore?.refreshStatus(this.searchGroups);
      await this.loadFeedTabAvailability(true);
      return group;
    } catch (error) {
      runInAction(() => {
        this.lastError =
          error instanceof Error ? error.message : "Failed to create search";
      });
      return null;
    } finally {
      runInAction(() => {
        this.submitting = false;
      });
    }
  }

  async updateGroup(
    id: string,
    input: UpdateHomeSearchInput,
  ): Promise<SearchGroup | null> {
    if (this.submitting) return null;
    this.submitting = true;
    this.lastError = null;
    try {
      const group = await agent.GroupSearch.update(id, input);
      runInAction(() => {
        this.searchGroups = sortSearchGroups(
          this.searchGroups.map((item) => (item.id === id ? group : item)),
        );
      });
      await this.subscriptionStore?.refreshStatus(this.searchGroups);
      await this.loadFeedTabAvailability(true);
      return group;
    } catch (error) {
      runInAction(() => {
        this.lastError =
          error instanceof Error ? error.message : "Failed to update search";
      });
      return null;
    } finally {
      runInAction(() => {
        this.submitting = false;
      });
    }
  }

  async deleteSearchGroup(id: string): Promise<boolean> {
    const ok = await agent.GroupSearch.delete(id);
    if (!ok) return false;
    runInAction(() => {
      this.searchGroups = this.searchGroups.filter((g) => g.id !== id);
    });
    await this.subscriptionStore?.refreshStatus(this.searchGroups);
    await this.loadFeedTabAvailability(true);
    return true;
  }

  async setGroupActive(
    id: string,
    isActive: boolean,
  ): Promise<SearchGroup | null> {
    const updated = await agent.GroupSearch.setActive(id, isActive);
    if (updated == null) return null;
    runInAction(() => {
      this.searchGroups = sortSearchGroups(
        this.searchGroups.map((g) => (g.id === id ? updated : g)),
      );
    });
    await this.subscriptionStore?.refreshStatus(this.searchGroups);
    await this.loadFeedTabAvailability(true);
    return updated;
  }

  clearError(): void {
    this.lastError = null;
  }

  setError(message: string): void {
    this.lastError = message;
  }
}
