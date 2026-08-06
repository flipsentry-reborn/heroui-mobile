import { makeAutoObservable, runInAction } from "mobx";

import agent from "@/api/agent";
import {
  areFeedDisplayPrefsEqual,
  countActiveDisplayPrefs,
  DEFAULT_FEED_DISPLAY_PREFS,
  deriveMinBuySignal,
  hasActiveDisplayPrefs,
  normalizeScoreTierCascade,
  prefsFromDealSettings,
  type FeedDisplayPrefs,
} from "@/domain/feed-display-prefs";
import { toUserErrorMessage } from "@/lib/user-error-message";
import type {
  CreateUserFilterInput,
  UpdateUserFilterInput,
  UserFilter,
} from "@/models/user-filter";
import type { UserPreferences } from "@/models/user";
import type FeedStore from "@/store/feedStore";
import type SearchStore from "@/store/searchStore";
import type UserStore from "@/store/userStore";

function applyFilterUpdate(previous: UserFilter, input: UpdateUserFilterInput): UserFilter {
  return {
    ...previous,
    name: input.name ?? previous.name,
    color: input.color ?? previous.color,
    vehicleQuery: input.vehicleQuery !== undefined ? input.vehicleQuery : previous.vehicleQuery,
    customQuery: input.customQuery !== undefined ? input.customQuery : previous.customQuery,
    searchGroupIds:
      input.searchGroupIds !== undefined
        ? input.searchGroupIds
        : previous.searchGroupIds,
    titleIncluders: input.titleIncluders ?? previous.titleIncluders,
    descriptionIncluders: input.descriptionIncluders ?? previous.descriptionIncluders,
    notificationEnabled: input.notificationEnabled ?? previous.notificationEnabled,
    isActive: input.isActive ?? previous.isActive,
    updatedAt: new Date().toISOString(),
  };
}

export default class FilterStore {
  filters: UserFilter[] = [];
  loading = false;
  submitting = false;
  hasLoaded = false;
  lastError: string | null = null;
  /** Deal display prefs — backed by user preferences API (MinBuySignal / MinProfit). */
  displayPrefs: FeedDisplayPrefs = { ...DEFAULT_FEED_DISPLAY_PREFS };
  displayPrefsHydrated = false;
  /** True while Filters route is focused — defers feed wipe until back. */
  filtersScreenOpen = false;
  private searchStore: SearchStore | null = null;
  private feedStore: FeedStore | null = null;
  private userStore: UserStore | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  setSearchStore(store: SearchStore): void {
    this.searchStore = store;
  }

  setFeedStore(store: FeedStore): void {
    this.feedStore = store;
  }

  setUserStore(store: UserStore): void {
    this.userStore = store;
  }

  setFiltersScreenOpen(open: boolean): void {
    this.filtersScreenOpen = open;
  }

  get activeFilters(): UserFilter[] {
    return this.filters.filter((f) => f.isActive);
  }

  get activeFilterIds(): string[] {
    return this.activeFilters.map((f) => f.id);
  }

  /** Min profit / score-tier prefs currently narrowing the feed. */
  get activeDisplayPrefsCount(): number {
    return countActiveDisplayPrefs(this.displayPrefs);
  }

  get hasActiveDisplayPrefs(): boolean {
    return hasActiveDisplayPrefs(this.displayPrefs);
  }

  /** Saved filters + deal-display prefs (header badge). */
  get feedFilterBadgeCount(): number {
    return this.activeFilters.length + this.activeDisplayPrefsCount;
  }

  /** Apply deal prefs from loaded user preferences (or fetch if missing). */
  async loadDisplayPrefs(): Promise<void> {
    try {
      let prefs = this.userStore?.preferences ?? null;
      if (prefs == null) {
        prefs = await agent.Account.getPreferences();
        if (this.userStore != null) {
          runInAction(() => {
            this.userStore!.preferences = prefs;
          });
        }
      }
      this.applyFromUserPreferences(prefs);
    } catch {
      // Keep defaults when prefs are unavailable.
    } finally {
      runInAction(() => {
        this.displayPrefsHydrated = true;
      });
    }
  }

  applyFromUserPreferences(prefs: UserPreferences | null | undefined): void {
    if (prefs == null) return;
    const next = prefsFromDealSettings(prefs.minBuySignal, prefs.minProfit);
    runInAction(() => {
      this.displayPrefs = next;
      this.displayPrefsHydrated = true;
    });
  }

  async setDisplayPrefs(
    patch: Partial<Omit<FeedDisplayPrefs, "showNoValuation">>,
  ): Promise<void> {
    const next = normalizeScoreTierCascade({
      ...this.displayPrefs,
      ...patch,
      showNoValuation: true,
    });
    if (areFeedDisplayPrefsEqual(this.displayPrefs, next)) return;

    const previous = this.displayPrefs;
    runInAction(() => {
      this.displayPrefs = next;
    });
    // Mark feed for wipe/refetch (applies on back from Filters, or immediately on feed).
    this.feedStore?.onDisplayPrefsChanged();

    const minBuySignal = deriveMinBuySignal(next);
    const minProfit = next.minProfit;

    try {
      const base =
        this.userStore?.preferences ?? (await agent.Account.getPreferences());
      const updated = await agent.Account.updatePreferences({
        ...base,
        minBuySignal,
        minProfit,
      });
      const confirmed = prefsFromDealSettings(
        updated.minBuySignal,
        updated.minProfit,
      );
      runInAction(() => {
        if (this.userStore != null) {
          this.userStore.preferences = updated;
        }
        this.displayPrefs = confirmed;
      });
      // Only re-trigger apply if server confirmed a different floor than optimistic.
      if (!areFeedDisplayPrefsEqual(next, confirmed)) {
        this.feedStore?.onDisplayPrefsChanged();
      }
    } catch (error) {
      runInAction(() => {
        this.displayPrefs = previous;
        this.lastError = toUserErrorMessage(error);
      });
      this.feedStore?.onDisplayPrefsChanged();
    }
  }

  async loadFilters(force = false): Promise<void> {
    if (this.loading) return;
    if (this.hasLoaded && !force) return;
    this.loading = true;
    this.lastError = null;
    try {
      const filters = await agent.Filters.list();
      runInAction(() => {
        this.filters = filters;
        this.hasLoaded = true;
      });
    } catch (error) {
      runInAction(() => {
        this.lastError = toUserErrorMessage(error);
        this.hasLoaded = true;
      });
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  async createFilter(input: CreateUserFilterInput): Promise<UserFilter | null> {
    if (this.submitting) return null;
    this.submitting = true;
    this.lastError = null;
    try {
      const filter = await agent.Filters.create(input);
      runInAction(() => {
        this.filters = [filter, ...this.filters];
      });
      await this.searchStore?.loadFeedTabAvailability(true);
      if (filter.isActive) {
        this.feedStore?.onSelectedFiltersChanged();
      }
      return filter;
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

  async updateFilter(id: string, input: UpdateUserFilterInput): Promise<UserFilter | null> {
    const previous = this.filters.find((f) => f.id === id);
    if (previous == null) {
      this.lastError = "Filter not found";
      return null;
    }

    this.lastError = null;
    const optimistic = applyFilterUpdate(previous, input);
    runInAction(() => {
      this.filters = this.filters.map((f) => (f.id === id ? optimistic : f));
    });

    const activeChanged =
      input.isActive !== undefined && previous.isActive !== optimistic.isActive;
    const criteriaChanged =
      input.vehicleQuery !== undefined ||
      input.customQuery !== undefined ||
      input.searchGroupIds !== undefined ||
      input.titleIncluders !== undefined ||
      input.descriptionIncluders !== undefined;

    try {
      const filter = await agent.Filters.update(id, input);
      runInAction(() => {
        this.filters = this.filters.map((f) => (f.id === id ? filter : f));
      });
      if (activeChanged) {
        await this.searchStore?.loadFeedTabAvailability(true);
        this.feedStore?.onSelectedFiltersChanged();
      } else if (criteriaChanged && filter.isActive) {
        void this.feedStore?.refreshFilterBucket(filter.id);
      }
      return filter;
    } catch (error) {
      runInAction(() => {
        this.filters = this.filters.map((f) => (f.id === id ? previous : f));
        this.lastError = toUserErrorMessage(error);
      });
      if (activeChanged) {
        await this.searchStore?.loadFeedTabAvailability(true);
        this.feedStore?.onSelectedFiltersChanged();
      }
      return null;
    }
  }

  async deleteFilter(id: string): Promise<boolean> {
    if (this.submitting) return false;
    this.submitting = true;
    this.lastError = null;
    const previous = this.filters.find((f) => f.id === id);
    try {
      await agent.Filters.delete(id);
      runInAction(() => {
        this.filters = this.filters.filter((f) => f.id !== id);
      });
      await this.searchStore?.loadFeedTabAvailability(true);
      if (previous?.isActive) {
        this.feedStore?.onSelectedFiltersChanged();
      }
      return true;
    } catch (error) {
      runInAction(() => {
        this.lastError = toUserErrorMessage(error);
      });
      return false;
    } finally {
      runInAction(() => {
        this.submitting = false;
      });
    }
  }
}
