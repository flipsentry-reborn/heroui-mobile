import { makeAutoObservable, runInAction } from "mobx";

import agent from "@/api/agent";
import {
  assignTopOnboardingLocations,
  createEmptyOnboardingDraft,
  isCriteriaComplete,
  mapAnswersToCreate,
  type OnboardingDraft,
} from "@/features/onboarding/map-answers-to-create";
import { getOrCreateDeviceId } from "@/features/onboarding/device-id";
import {
  clearOnboardingStatus,
  needsOnboarding,
  setOnboardingStatus,
} from "@/features/onboarding/onboarding-storage";
import type { HomePlatform } from "@/mocks/data/home";
import type { LocationResult } from "@/mocks/data/locations";
import type { SearchType } from "@/mocks/data/home";
import type SearchStore from "@/store/searchStore";
import type SubscriptionStore from "@/store/subscriptionStore";
import { suggestedLocationToResult } from "@/lib/location-suggest";

export default class OnboardingStore {
  draft: OnboardingDraft = createEmptyOnboardingDraft();
  submitting = false;
  nearbyLoading = false;
  lastError: string | null = null;
  /** Resolved after hydrateGate — null while unknown. */
  shouldShow: boolean | null = null;

  private searchStore: SearchStore | null = null;
  private subscriptionStore: SubscriptionStore | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  setStores(searchStore: SearchStore, subscriptionStore: SubscriptionStore): void {
    this.searchStore = searchStore;
    this.subscriptionStore = subscriptionStore;
  }

  resetDraft(): void {
    this.draft = createEmptyOnboardingDraft();
    this.lastError = null;
    this.submitting = false;
    this.nearbyLoading = false;
  }

  async hydrateGate(): Promise<boolean> {
    const searchStore = this.searchStore;
    if (searchStore == null) {
      runInAction(() => {
        this.shouldShow = false;
      });
      return false;
    }
    if (!searchStore.hasLoaded) {
      await searchStore.loadSearchGroups();
    }
    const show = await needsOnboarding(searchStore.searchGroups.length);
    runInAction(() => {
      this.shouldShow = show;
      if (show) this.resetDraft();
    });
    return show;
  }

  setSearchType(searchType: SearchType): void {
    this.draft.searchType = searchType;
    this.draft.carMakes = [];
    this.draft.carAnyMake = true;
    this.draft.iphoneModelIds = [];
    this.draft.customQuery = "";
  }

  setLocation(location: LocationResult | null): void {
    this.draft.location = location;
    this.draft.assignedLocations = [];
  }

  setCarAnyMake(): void {
    this.draft.carAnyMake = true;
    this.draft.carMakes = [];
  }

  toggleCarMake(make: string): void {
    this.draft.carAnyMake = false;
    if (this.draft.carMakes.includes(make)) {
      this.draft.carMakes = this.draft.carMakes.filter((m) => m !== make);
      if (this.draft.carMakes.length === 0) {
        this.draft.carAnyMake = true;
      }
    } else {
      this.draft.carMakes = [...this.draft.carMakes, make];
    }
  }

  toggleIphoneModelId(modelId: string): void {
    if (this.draft.iphoneModelIds.includes(modelId)) {
      this.draft.iphoneModelIds = this.draft.iphoneModelIds.filter(
        (id) => id !== modelId,
      );
    } else {
      this.draft.iphoneModelIds = [...this.draft.iphoneModelIds, modelId];
    }
  }

  setCustomQuery(query: string): void {
    this.draft.customQuery = query;
  }

  setRadiusMiles(miles: number): void {
    this.draft.radiusMiles = miles;
  }

  setPlatforms(platforms: HomePlatform[]): void {
    const next = platforms.includes("facebook")
      ? platforms
      : (["facebook", ...platforms] as HomePlatform[]);
    this.draft.platforms = next;
  }

  togglePlatform(platform: HomePlatform): void {
    if (platform === "facebook") return;
    const has = this.draft.platforms.includes(platform);
    this.setPlatforms(
      has
        ? this.draft.platforms.filter((p) => p !== platform)
        : [...this.draft.platforms, platform],
    );
  }

  get canContinueWhat(): boolean {
    return this.draft.searchType != null;
  }

  get canContinueWhere(): boolean {
    const loc = this.draft.location;
    return (
      loc != null &&
      loc.latitude !== 0 &&
      loc.longitude !== 0
    );
  }

  get canContinueCoverage(): boolean {
    return (
      this.canContinueWhere &&
      this.draft.platforms.length > 0 &&
      this.draft.assignedLocations.length > 0 &&
      !this.nearbyLoading
    );
  }

  get canContinueCriteria(): boolean {
    return isCriteriaComplete(this.draft);
  }

  async refreshAssignedLocations(): Promise<void> {
    const center = this.draft.location;
    if (center == null || (center.latitude === 0 && center.longitude === 0)) {
      runInAction(() => {
        this.draft.assignedLocations = [];
      });
      return;
    }

    this.nearbyLoading = true;
    this.lastError = null;
    try {
      const result = await agent.GroupSearch.suggestLocations({
        latitude: center.latitude,
        longitude: center.longitude,
        radiusMiles: this.draft.radiusMiles,
        centerLocationName: center.displayName || center.name,
      });
      const nearby = (result.suggestedLocations ?? []).map(
        suggestedLocationToResult,
      );
      let nextCenter = center;
      if (result.originalLocation != null) {
        const fromOriginal = suggestedLocationToResult(result.originalLocation);
        nextCenter = {
          ...center,
          ...fromOriginal,
          id: center.id || fromOriginal.id,
          displayName:
            fromOriginal.displayName ||
            center.displayName ||
            fromOriginal.name,
        };
      }
      const assigned = assignTopOnboardingLocations(nextCenter, nearby);
      runInAction(() => {
        this.draft.location = nextCenter;
        this.draft.assignedLocations = assigned;
      });
    } catch (error) {
      const fallback = assignTopOnboardingLocations(center, []);
      runInAction(() => {
        this.draft.assignedLocations = fallback;
        this.lastError =
          error instanceof Error
            ? error.message
            : "Could not load nearby cities.";
      });
    } finally {
      runInAction(() => {
        this.nearbyLoading = false;
      });
    }
  }

  async skip(): Promise<void> {
    await setOnboardingStatus("skipped");
    runInAction(() => {
      this.shouldShow = false;
    });
  }

  /**
   * Dev helper: delete all search groups, clear onboarding flag, open wizard.
   */
  async resetAndStartWizard(): Promise<void> {
    const searchStore = this.searchStore;
    if (searchStore == null) {
      throw new Error("Search store not ready.");
    }
    if (!searchStore.hasLoaded) {
      await searchStore.loadSearchGroups();
    }
    const ids = searchStore.searchGroups.map((g) => g.id);
    for (const id of ids) {
      const ok = await searchStore.deleteSearchGroup(id);
      if (!ok) {
        throw new Error("Could not delete a search. Try again.");
      }
    }
    await clearOnboardingStatus();
    this.resetDraft();
    runInAction(() => {
      this.shouldShow = true;
    });
  }

  async finish(): Promise<boolean> {
    const searchStore = this.searchStore;
    const subscriptionStore = this.subscriptionStore;
    if (searchStore == null || subscriptionStore == null) {
      this.lastError = "App stores not ready.";
      return false;
    }

    this.submitting = true;
    this.lastError = null;
    try {
      if (!subscriptionStore.hasLoaded) {
        await subscriptionStore.load();
      }
      await subscriptionStore.refreshStatus(searchStore.searchGroups);

      if (!subscriptionStore.canCreate) {
        const deviceId = await getOrCreateDeviceId();
        await agent.Account.startTrial(deviceId);
        await subscriptionStore.load();
        await subscriptionStore.refreshStatus(searchStore.searchGroups);
      }

      if (!subscriptionStore.canCreate) {
        runInAction(() => {
          this.lastError =
            "No search slots available. Start a trial or subscribe.";
        });
        return false;
      }

      if (this.draft.assignedLocations.length === 0) {
        await this.refreshAssignedLocations();
      }

      const input = mapAnswersToCreate(this.draft);
      const group = await searchStore.createGroup(input);
      if (group == null) {
        runInAction(() => {
          this.lastError = searchStore.lastError ?? "Could not create search.";
        });
        return false;
      }

      await setOnboardingStatus("done");
      void agent.Onboarding.submit({
        deviceId: await getOrCreateDeviceId(),
        category: this.draft.searchType ?? "car",
        monthlyVolume: "unknown",
        averageMargin: "unknown",
        referralSource: "onboarding_wizard",
        triedOtherApps: false,
      }).catch(() => undefined);

      runInAction(() => {
        this.shouldShow = false;
      });
      return true;
    } catch (error) {
      runInAction(() => {
        this.lastError =
          error instanceof Error ? error.message : "Could not create search.";
      });
      return false;
    } finally {
      runInAction(() => {
        this.submitting = false;
      });
    }
  }
}
