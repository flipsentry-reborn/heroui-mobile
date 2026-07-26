import { makeAutoObservable, runInAction } from "mobx";

import agent from "@/api/agent";
import {
  buildIntervalOptions,
  canCreateSearch,
  type IntervalOption,
} from "@/domain/search-rules";
import type { SearchGroup } from "@/mocks/data/home";
import type {
  SubscriptionPlan,
  SubscriptionState,
  SubscriptionTier,
} from "@/mocks/data/subscription";
import type { SubscriptionStatus } from "@/models/subscription";

/**
 * Owns subscription tier + slot tables.
 * Slot remaining is recomputed from SearchStore groups (no duplicated slot state).
 */
export default class SubscriptionStore {
  currentTier: SubscriptionTier | null = null;
  hasActiveSubscription = false;
  hasActiveTrial = false;
  plans: SubscriptionPlan[] = [];
  loading = false;
  hasLoaded = false;

  /** Last computed status (from groups). */
  status: SubscriptionStatus | null = null;

  /** In-flight load; excluded from observability. */
  loadPromise: Promise<void> | null = null;

  constructor() {
    makeAutoObservable(
      this,
      { loadPromise: false },
      { autoBind: true },
    );
  }

  get activePlan(): SubscriptionPlan | null {
    if (!this.hasActiveSubscription || this.currentTier == null) return null;
    return this.plans.find((p) => p.id === this.currentTier) ?? null;
  }

  get totalSlots(): number {
    return this.status?.totalSlots ?? 0;
  }

  get usedSlots(): number {
    return this.status?.usedSlots ?? 0;
  }

  get remainingSlots(): number {
    return this.status?.remainingSlots ?? 0;
  }

  get intervalOptions(): IntervalOption[] {
    if (this.status == null) return [];
    return buildIntervalOptions(
      this.status.allowedSlotSettings,
      this.status.remainingSlotSettings,
    );
  }

  get canCreate(): boolean {
    return canCreateSearch(this.remainingSlots);
  }

  applyState(state: SubscriptionState | null | undefined): void {
    if (state == null) {
      this.currentTier = null;
      this.hasActiveSubscription = false;
      this.hasActiveTrial = false;
      this.plans = [];
      this.hasLoaded = true;
      return;
    }
    this.currentTier = state.currentTier ?? null;
    this.hasActiveSubscription = Boolean(state.hasActiveSubscription);
    this.hasActiveTrial = Boolean(state.hasActiveTrial);
    this.plans = state.plans ?? [];
    this.hasLoaded = true;
  }

  async load(): Promise<void> {
    if (this.loadPromise != null) return this.loadPromise;

    this.loading = true;
    this.loadPromise = (async () => {
      try {
        const state = await agent.Subscription.get();
        runInAction(() => {
          this.applyState(state);
        });
      } catch {
        runInAction(() => {
          this.applyState(null);
        });
      } finally {
        runInAction(() => {
          this.loading = false;
          this.loadPromise = null;
        });
      }
    })();

    return this.loadPromise;
  }

  /** Recompute slot remaining from current search groups. */
  async refreshStatus(groups: SearchGroup[]): Promise<void> {
    try {
      const status = await agent.Subscription.status(groups);
      runInAction(() => {
        this.status = status;
      });
    } catch {
      runInAction(() => {
        this.status = {
          hasActiveSubscription: this.hasActiveSubscription,
          hasActiveTrial: this.hasActiveTrial,
          tier: this.currentTier,
          totalSlots: 0,
          usedSlots: 0,
          remainingSlots: 0,
          allowedSlotSettings: [],
          remainingSlotSettings: [],
        };
      });
    }
  }

  async subscribe(tier: SubscriptionTier): Promise<void> {
    const state = await agent.Subscription.subscribe(tier);
    runInAction(() => {
      this.applyState(state);
    });
  }

  async restore(): Promise<void> {
    const state = await agent.Subscription.restore();
    runInAction(() => {
      this.applyState(state);
    });
  }
}
