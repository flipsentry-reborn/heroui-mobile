import { makeAutoObservable, runInAction } from "mobx";

import agent from "@/api/agent";
import {
  assignTopOnboardingLocations,
  createEmptyOnboardingDraft,
  defaultOnboardingIphoneQuery,
  DEFAULT_ONBOARDING_RADIUS,
  isReadyToCreate,
  mapAnswersToCreate,
  ONBOARDING_SLOT_INTERVALS,
  pickOnboardingIntervals,
  type OnboardingDraft,
} from "@/features/onboarding/map-answers-to-create";
import { getOrCreateDeviceId } from "@/features/onboarding/device-id";
import {
  persistOnboardingCenter,
  resolveDeviceLocation,
} from "@/features/onboarding/resolve-device-location";
import {
  clearOnboardingStatus,
  needsOnboarding,
  setOnboardingStatus,
} from "@/features/onboarding/onboarding-storage";
import type { SearchType } from "@/mocks/data/home";
import type SearchStore from "@/store/searchStore";
import type SubscriptionStore from "@/store/subscriptionStore";
import { suggestedLocationToResult } from "@/lib/location-suggest";
import { toUserErrorMessage } from "@/lib/user-error-message";

export default class OnboardingStore {
  draft: OnboardingDraft = createEmptyOnboardingDraft();
  submitting = false;
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
    if (searchType !== "custom") {
      this.draft.customQuery = "";
    }
  }

  setCustomQuery(query: string): void {
    this.draft.customQuery = query;
  }

  get canContinueWhat(): boolean {
    return isReadyToCreate(this.draft);
  }

  async skip(): Promise<void> {
    await setOnboardingStatus("skipped");
    runInAction(() => {
      this.shouldShow = false;
    });
  }

  /** Dev helper: delete all search groups, clear onboarding flag, open wizard. */
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

  /** Broad iPhone hunt — all catalog models (no picker). */
  private async prepareIphoneQuery(): Promise<void> {
    try {
      const catalog = await agent.IphoneModels.listGrouped({
        latitude: this.draft.location?.latitude,
        longitude: this.draft.location?.longitude,
        country: this.draft.location?.countryCode,
      });
      const models = (catalog.groups ?? []).flatMap((group) =>
        (group.models ?? []).map((model) => ({
          model: model.model,
          minPrice: model.minPrice,
          maxPrice: model.maxPrice,
        })),
      );
      runInAction(() => {
        this.draft.iphoneQuery =
          models.length > 0 ? models : defaultOnboardingIphoneQuery();
      });
    } catch {
      runInAction(() => {
        this.draft.iphoneQuery = defaultOnboardingIphoneQuery();
      });
    }
  }

  /** NYC (persisted) → suggest 100mi cities → best available intervals. */
  private async prepareAssignedFromDevice(
    intervals: readonly number[],
  ): Promise<void> {
    const center = await resolveDeviceLocation();
    runInAction(() => {
      this.draft.location = center;
      this.draft.radiusMiles = DEFAULT_ONBOARDING_RADIUS;
    });

    try {
      const result = await agent.GroupSearch.suggestLocations({
        latitude: center.latitude,
        longitude: center.longitude,
        radiusMiles: DEFAULT_ONBOARDING_RADIUS,
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
      const assigned = assignTopOnboardingLocations(
        nextCenter,
        nearby,
        intervals,
      );
      await persistOnboardingCenter(nextCenter);
      runInAction(() => {
        this.draft.location = nextCenter;
        this.draft.assignedLocations = assigned;
      });
    } catch (error) {
      console.warn("[Onboarding] suggestLocations failed", error);
      const assigned = assignTopOnboardingLocations(center, [], intervals);
      runInAction(() => {
        this.draft.assignedLocations = assigned;
      });
    }
  }

  async finish(): Promise<boolean> {
    const searchStore = this.searchStore;
    const subscriptionStore = this.subscriptionStore;
    if (searchStore == null || subscriptionStore == null) {
      this.lastError = "App stores not ready.";
      return false;
    }
    if (!isReadyToCreate(this.draft)) {
      this.lastError = "Pick what you want alerts for.";
      return false;
    }

    this.submitting = true;
    this.lastError = null;
    try {
      if (!subscriptionStore.hasLoaded) {
        await subscriptionStore.load();
      }
      await subscriptionStore.refreshStatus(searchStore.searchGroups);

      // Only start a trial when there is truly no access yet.
      // Never re-hit start-trial when trial is already active/used
      // (that returns 400 "Trial already used").
      const needsTrial =
        !subscriptionStore.canCreate && !subscriptionStore.hasActiveTrial;
      if (needsTrial) {
        try {
          const deviceId = await getOrCreateDeviceId();
          await agent.Account.startTrial(deviceId);
          await subscriptionStore.load();
          await subscriptionStore.refreshStatus(searchStore.searchGroups);
        } catch (error) {
          console.warn("[Onboarding] startTrial failed", error);
          runInAction(() => {
            this.lastError = toUserErrorMessage(error);
          });
          return false;
        }
      }

      if (!subscriptionStore.canCreate) {
        runInAction(() => {
          this.lastError =
            "No search slots available. Start a trial or subscribe.";
        });
        return false;
      }

      const remaining =
        subscriptionStore.status?.remainingSlotSettings ?? [];
      const intervals = pickOnboardingIntervals(remaining);
      console.log("[Onboarding] finish", {
        type: this.draft.searchType,
        remainingSlots: subscriptionStore.remainingSlots,
        hasActiveTrial: subscriptionStore.hasActiveTrial,
        intervals,
        remaining,
      });
      if (intervals.length === 0) {
        runInAction(() => {
          this.lastError =
            "No free search slots left. Free a search or upgrade.";
        });
        return false;
      }

      await this.prepareAssignedFromDevice(
        intervals.length > 0 ? intervals : ONBOARDING_SLOT_INTERVALS,
      );

      if (this.draft.searchType === "iphone") {
        await this.prepareIphoneQuery();
      }

      const input = mapAnswersToCreate(this.draft);
      console.log("[Onboarding] create payload", {
        searchType: input.searchType,
        locationName: input.locationName,
        settings: input.settings.map((s) => ({
          locationName: s.locationName,
          runIntervalSeconds: s.runIntervalSeconds,
          geoNameId: s.geoNameId,
        })),
        iphoneModels: input.iphoneQuery?.length ?? 0,
      });

      const group = await searchStore.createGroup(input);
      if (group == null) {
        console.warn("[Onboarding] createGroup failed", searchStore.lastError);
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
      }).catch((error) => {
        console.warn("[Onboarding] analytics submit failed", error);
      });

      runInAction(() => {
        this.shouldShow = false;
      });
      return true;
    } catch (error) {
      console.warn("[Onboarding] finish error", error);
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
