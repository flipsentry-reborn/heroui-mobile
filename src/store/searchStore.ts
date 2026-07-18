import { makeAutoObservable, runInAction } from "mobx";

import agent, { type CreateHomeSearchInput } from "@/api/agent";
import { buildHomePlan } from "@/mocks/services/home";
import type { HomePlan, SearchGroup } from "@/mocks/data/home";
import type SubscriptionStore from "@/store/subscriptionStore";

/**
 * Owns search groups list + create/delete/toggle.
 * Slot capacity lives on SubscriptionStore; this store refreshes it after mutations.
 */
export default class SearchStore {
  searchGroups: SearchGroup[] = [];
  loading = false;
  hasLoaded = false;
  submitting = false;
  lastError: string | null = null;

  private subscriptionStore: SubscriptionStore | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  setSubscriptionStore(store: SubscriptionStore): void {
    this.subscriptionStore = store;
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

  async loadSearchGroups(): Promise<void> {
    if (this.loading) return;
    this.loading = true;
    this.lastError = null;
    try {
      const groups = await agent.GroupSearch.list();
      runInAction(() => {
        this.searchGroups = groups;
        this.hasLoaded = true;
      });
      await this.subscriptionStore?.refreshStatus(groups);
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

  async createGroup(input: CreateHomeSearchInput): Promise<SearchGroup | null> {
    if (this.submitting) return null;
    this.submitting = true;
    this.lastError = null;
    try {
      const group = await agent.GroupSearch.create(input);
      runInAction(() => {
        this.searchGroups = [group, ...this.searchGroups];
      });
      await this.subscriptionStore?.refreshStatus(this.searchGroups);
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

  async deleteSearchGroup(id: string): Promise<boolean> {
    const ok = await agent.GroupSearch.delete(id);
    if (!ok) return false;
    runInAction(() => {
      this.searchGroups = this.searchGroups.filter((g) => g.id !== id);
    });
    await this.subscriptionStore?.refreshStatus(this.searchGroups);
    return true;
  }

  async setGroupActive(
    id: string,
    isActive: boolean,
  ): Promise<SearchGroup | null> {
    const updated = await agent.GroupSearch.setActive(id, isActive);
    if (updated == null) return null;
    runInAction(() => {
      this.searchGroups = this.searchGroups.map((g) =>
        g.id === id ? updated : g,
      );
    });
    await this.subscriptionStore?.refreshStatus(this.searchGroups);
    return updated;
  }

  clearError(): void {
    this.lastError = null;
  }

  setError(message: string): void {
    this.lastError = message;
  }
}
