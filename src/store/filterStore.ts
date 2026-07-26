import { makeAutoObservable, runInAction } from "mobx";

import agent from "@/api/agent";
import { toUserErrorMessage } from "@/lib/user-error-message";
import type {
  CreateUserFilterInput,
  UpdateUserFilterInput,
  UserFilter,
} from "@/models/user-filter";
import type SearchStore from "@/store/searchStore";

export default class FilterStore {
  filters: UserFilter[] = [];
  loading = false;
  submitting = false;
  hasLoaded = false;
  lastError: string | null = null;
  private searchStore: SearchStore | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  setSearchStore(store: SearchStore): void {
    this.searchStore = store;
  }

  get activeFilters(): UserFilter[] {
    return this.filters.filter((f) => f.isActive);
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

  async updateFilter(
    id: string,
    input: UpdateUserFilterInput,
  ): Promise<UserFilter | null> {
    if (this.submitting) return null;
    this.submitting = true;
    this.lastError = null;
    try {
      const filter = await agent.Filters.update(id, input);
      runInAction(() => {
        this.filters = this.filters.map((f) => (f.id === id ? filter : f));
      });
      await this.searchStore?.loadFeedTabAvailability(true);
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

  async deleteFilter(id: string): Promise<boolean> {
    if (this.submitting) return false;
    this.submitting = true;
    this.lastError = null;
    try {
      await agent.Filters.delete(id);
      runInAction(() => {
        this.filters = this.filters.filter((f) => f.id !== id);
      });
      await this.searchStore?.loadFeedTabAvailability(true);
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
