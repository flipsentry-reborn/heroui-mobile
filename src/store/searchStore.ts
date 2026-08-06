import { makeAutoObservable, runInAction } from "mobx";

import agent, {
  type CreateHomeSearchInput,
  type UpdateHomeSearchInput,
} from "@/api/agent";
import {
  buildFeedCategories,
  buildForYouShelves,
  buildYourFilterChildren,
  buildYourSearchChildren,
  type FeedCategoryDef,
} from "@/features/feed/build-feed-categories";
import {
  buildHomePlan,
  buildHomePlanFromStatus,
  isGroupPaused,
  sortSearchGroups,
} from "@/mocks/services/home";
import type { HomePlan, SearchGroup } from "@/mocks/data/home";
import { toUserErrorMessage } from "@/lib/user-error-message";
import type {
  FeedFilterTab,
  FeedTabAvailability,
  FeedUserFilterTab,
} from "@/models/feed";
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
  filterTabs: FeedUserFilterTab[] = [];

  private subscriptionStore: SubscriptionStore | null = null;
  private feedStore: FeedStore | null = null;
  private feedTabAvailabilityInFlight: Promise<void> | null = null;
  private pendingForceFeedTabAvailability = false;

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
    const sub = this.subscriptionStore;
    if (sub?.status != null) {
      return buildHomePlanFromStatus(sub.status);
    }
    const hasAccess = sub?.hasSearchAccess ?? false;
    const tier = hasAccess ? (sub?.currentTier ?? null) : null;
    return buildHomePlan(tier, this.searchGroups, {
      hasActiveTrial: sub?.hasActiveTrial === true && !sub.hasActiveSubscription,
    });
  }

  get canCreateSearch(): boolean {
    return this.subscriptionStore?.canCreate ?? false;
  }

  /** At least one search group with an active platform setting. */
  get hasActiveSearches(): boolean {
    return this.searchGroups.some((group) => !isGroupPaused(group));
  }

  /**
   * Tab-bar danger indicator — loaded and no active searches
   * (empty account, or every group paused).
   */
  get showNoActiveSearchesIndicator(): boolean {
    return this.hasLoaded && !this.hasActiveSearches;
  }

  get feedTabAvailability(): FeedTabAvailability {
    return {
      showFeatured: this.showFeaturedTab,
      showSold: this.showSoldTab,
      tabs: this.feedTabs,
      filterTabs: this.filterTabs,
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

  get yourFilterChildren(): FeedCategoryDef[] {
    return buildYourFilterChildren(this.filterTabs);
  }

  groupIdsForCategory(key: string): string[] | undefined {
    const tab = this.feedTabs.find((entry) => entry.key === key);
    return tab?.groupIds;
  }

  filterIdsForCategory(key: string): string[] | undefined {
    const tab = this.filterTabs.find((entry) => entry.key === key);
    return tab?.filterIds;
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
        this.lastError = toUserErrorMessage(error);
      });
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  async loadFeedTabAvailability(force = false): Promise<void> {
    if (this.feedTabAvailabilityInFlight) {
      if (force) this.pendingForceFeedTabAvailability = true;
      await this.feedTabAvailabilityInFlight;
      if (this.pendingForceFeedTabAvailability) {
        this.pendingForceFeedTabAvailability = false;
        await this.loadFeedTabAvailability(true);
      }
      return;
    }

    if (this.hasLoadedFeedTabAvailability && !force) return;

    const run = this.fetchFeedTabAvailability();
    this.feedTabAvailabilityInFlight = run;
    try {
      await run;
    } finally {
      if (this.feedTabAvailabilityInFlight === run) {
        this.feedTabAvailabilityInFlight = null;
      }
    }

    if (this.pendingForceFeedTabAvailability) {
      this.pendingForceFeedTabAvailability = false;
      await this.loadFeedTabAvailability(true);
    }
  }

  private async fetchFeedTabAvailability(): Promise<void> {
    try {
      runInAction(() => {
        this.loadingFeedTabAvailability = true;
      });
      const availability = await agent.Feed.getTabAvailability();
      runInAction(() => {
        this.showFeaturedTab = availability.showFeatured;
        this.showSoldTab = availability.showSold;
        this.feedTabs = availability.tabs ?? [];
        this.filterTabs = availability.filterTabs ?? [];
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
        this.lastError = toUserErrorMessage(error);
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
      await agent.GroupSearch.update(id, input);
      // Refetch so the store matches server state (e.g. PlaceIds after remap).
      const group = await agent.GroupSearch.get(id);
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
        this.lastError = toUserErrorMessage(error);
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
