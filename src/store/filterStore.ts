import { makeAutoObservable, runInAction } from "mobx";

import agent from "@/api/agent";
import { toUserErrorMessage } from "@/lib/user-error-message";
import type {
  CreateUserFilterInput,
  UpdateUserFilterInput,
  UserFilter,
} from "@/models/user-filter";
import type FeedStore from "@/store/feedStore";
import type SearchStore from "@/store/searchStore";

function applyFilterUpdate(previous: UserFilter, input: UpdateUserFilterInput): UserFilter {
  return {
    ...previous,
    name: input.name ?? previous.name,
    color: input.color ?? previous.color,
    vehicleQuery: input.vehicleQuery !== undefined ? input.vehicleQuery : previous.vehicleQuery,
    customQuery: input.customQuery !== undefined ? input.customQuery : previous.customQuery,
    titleIncluders: input.titleIncluders ?? previous.titleIncluders,
    descriptionIncluders: input.descriptionIncluders ?? previous.descriptionIncluders,
    notificationEnabled: input.notificationEnabled ?? previous.notificationEnabled,
    isActive: input.isActive ?? previous.isActive,
    isSelected: input.isSelected ?? previous.isSelected,
    updatedAt: new Date().toISOString(),
  };
}

export default class FilterStore {
  filters: UserFilter[] = [];
  loading = false;
  submitting = false;
  hasLoaded = false;
  lastError: string | null = null;
  private searchStore: SearchStore | null = null;
  private feedStore: FeedStore | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  setSearchStore(store: SearchStore): void {
    this.searchStore = store;
  }

  setFeedStore(store: FeedStore): void {
    this.feedStore = store;
  }

  get activeFilters(): UserFilter[] {
    return this.filters.filter((f) => f.isActive);
  }

  get selectedFilters(): UserFilter[] {
    return this.filters.filter((f) => f.isSelected);
  }

  get selectedFilterIds(): string[] {
    return this.selectedFilters.map((f) => f.id);
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
      void this.searchStore?.loadFeedTabAvailability(true);
      if (filter.isSelected) {
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

    const selectionChanged =
      input.isSelected !== undefined && previous.isSelected !== optimistic.isSelected;
    const activeChanged = input.isActive !== undefined && previous.isActive !== optimistic.isActive;
    const criteriaChanged =
      input.vehicleQuery !== undefined ||
      input.customQuery !== undefined ||
      input.titleIncluders !== undefined ||
      input.descriptionIncluders !== undefined;

    if (selectionChanged) {
      this.feedStore?.onSelectedFiltersChanged();
    }
    if (activeChanged || criteriaChanged) {
      void this.searchStore?.loadFeedTabAvailability(true);
    }

    try {
      const filter = await agent.Filters.update(id, input);
      runInAction(() => {
        this.filters = this.filters.map((f) => (f.id === id ? filter : f));
      });
      return filter;
    } catch (error) {
      runInAction(() => {
        this.filters = this.filters.map((f) => (f.id === id ? previous : f));
        this.lastError = toUserErrorMessage(error);
      });
      if (selectionChanged) {
        this.feedStore?.onSelectedFiltersChanged();
      }
      if (activeChanged || criteriaChanged) {
        void this.searchStore?.loadFeedTabAvailability(true);
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
      void this.searchStore?.loadFeedTabAvailability(true);
      if (previous?.isSelected) {
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
