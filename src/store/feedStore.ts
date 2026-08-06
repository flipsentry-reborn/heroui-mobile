import AsyncStorage from "@react-native-async-storage/async-storage";
import { makeAutoObservable, observable, runInAction } from "mobx";

import agent from "@/api/agent";
import {
  bucketsForLiveFeed,
  buySignalOf,
  FEED_SHELF_LIMIT,
  insertSortedByBuySignal,
  isBestPicksCandidate,
  isPriceDropCandidate,
  mergeCatchUpHead,
  mergeHttpPageWithLiveHead,
  prependId,
} from "@/domain/feed-routing";
import {
  DEFAULT_FEED_DISPLAY_PREFS,
  deriveMinProfit,
  effectiveMinBuySignalForQuery,
  matchesFeedDisplayPrefs,
  type FeedDisplayPrefs,
} from "@/domain/feed-display-prefs";
import {
  DEFAULT_FEED_HIDE_PREFS,
  matchesFeedHidePrefs,
  type FeedHidePrefs,
} from "@/domain/feed-hide-prefs";
import {
  DEFAULT_FEED_LAYOUT_MODE,
  FEED_LAYOUT_STORAGE_KEY,
  isFeedLayoutMode,
  type FeedLayoutMode,
} from "@/features/feed/layout-mode";
import {
  DEFAULT_YOUR_SEARCHES_EXPANDED,
  parseYourSearchesExpanded,
  YOUR_SEARCHES_EXPANDED_STORAGE_KEY,
} from "@/features/feed/your-searches-expanded";
import { debugLog } from "@/lib/debug-log";
import { toUserErrorMessage } from "@/lib/user-error-message";
import type { FeedItem, FeedValuationUpdateData } from "@/models/feed";
import type { Pagination } from "@/models/pagination";
import type FilterStore from "@/store/filterStore";
import type SearchStore from "@/store/searchStore";

const CATCH_UP_LOG = "FeedCatchUp";
const FEED_LIVE_LOG = "FeedLive";
const FEED_OPEN_LOG = "FeedOpen";

/** Collapse reconnect + AppState resume into one catch-up run. */
const CATCH_UP_DEBOUNCE_MS = 600;
/** Bound live queue while feed tabs are still loading. */
const PENDING_FEEDS_MAX = 80;
/** Bound pending image/valuation patches that race ahead of ReceiveFeed. */
const PENDING_PATCH_MAX = 80;
/** Default page size for category lists (infinite scroll). Backend max is 50. */
const FEED_PAGE_SIZE = 40;

export type FeedHubStatus = "disconnected" | "connecting" | "connected";

type LoadBucketOpts = {
  query?: string;
  force?: boolean;
  limit?: number;
  pageNumber?: number;
  pageSize?: number;
  soldStatus?: "all" | "sold" | "pending";
  maxDays?: number | null;
  bestPicksSortBy?: "buysignal" | "distance" | "listed";
  bestPicksSortDir?: "asc" | "desc";
  bestPicksMaxHours?: number | null;
  /** When true, also refresh For You shelf slice for this key. */
  asShelf?: boolean;
};

/**
 * Canonical feed registry + per-bucket id lists for HTTP + SignalR.
 */
export default class FeedStore {
  items = observable.map<string, FeedItem>();
  lists: Record<string, string[]> = {};
  shelves: Record<string, string[]> = {};
  /** Per-bucket pagination from last HTTP page (for infinite scroll). */
  paginationByBucket: Record<string, Pagination | null> = {};
  dirtyBuckets = new Set<string>();
  loadingBuckets = new Set<string>();
  loadingMoreBuckets = new Set<string>();
  loadedBuckets = new Set<string>();
  hydratedShelves = new Set<string>();
  /** Category grids currently scrolled — live list prepends are deferred. */
  frozenBuckets = new Set<string>();
  /** Live ids waiting to prepend once the user returns to top. */
  deferredIdsByBucket: Record<string, string[]> = {};
  hubStatus: FeedHubStatus = "disconnected";
  activeCategory = "for-you";
  lastError: string | null = null;
  /** Category feed layout: list (1-col) or grid (2-col). Persisted locally. */
  layoutMode: FeedLayoutMode = DEFAULT_FEED_LAYOUT_MODE;
  layoutModeHydrated = false;
  /** For You → Your Searches accordion open/closed. Persisted locally. */
  yourSearchesExpanded = DEFAULT_YOUR_SEARCHES_EXPANDED;
  /** True while clearing + refetching after a filter / deal-pref change. */
  isApplyingFilters = false;
  /** Set when filters change; consumed on feed focus / in-place apply. */
  pendingFilterApply = false;

  private searchStore: SearchStore | null = null;
  private filterStore: FilterStore | null = null;
  private pendingFeeds: FeedItem[] = [];
  /** Patches that arrived before the feed was in `items` (SignalR race). */
  private pendingValuationUpdates = new Map<
    string,
    FeedValuationUpdateData
  >();
  private liveHeadIds = new Set<string>();
  /** In-flight loadBucket promises so callers can await a join instead of no-op. */
  private bucketLoadPromises = new Map<string, Promise<void>>();
  private catchUpTimer: ReturnType<typeof setTimeout> | null = null;
  private catchUpInFlight = false;
  private catchUpQueued = false;
  private scrollToTopHandler: (() => void) | null = null;
  /** When true, next apply also clears/reloads Best Picks. */
  private pendingIncludeBestPicks = false;
  private filterApplyGeneration = 0;
  private filterApplyInFlight: Promise<void> | null = null;

  constructor() {
    makeAutoObservable<this, "bucketLoadPromises" | "filterReloadTimer">(
      this,
      {
        bucketLoadPromises: false,
        filterReloadTimer: false,
      },
      { autoBind: true },
    );
  }

  setSearchStore(store: SearchStore): void {
    this.searchStore = store;
  }

  setFilterStore(store: FilterStore): void {
    this.filterStore = store;
  }

  setActiveCategory(key: string): void {
    this.activeCategory = key;
  }

  setLayoutMode(mode: FeedLayoutMode): void {
    if (this.layoutMode === mode) return;
    this.layoutMode = mode;
    void AsyncStorage.setItem(FEED_LAYOUT_STORAGE_KEY, mode).catch(() => {
      // best-effort local prefs
    });
  }

  async loadLayoutMode(): Promise<void> {
    try {
      const saved = await AsyncStorage.getItem(FEED_LAYOUT_STORAGE_KEY);
      if (isFeedLayoutMode(saved)) {
        runInAction(() => {
          this.layoutMode = saved;
        });
      }
    } finally {
      runInAction(() => {
        this.layoutModeHydrated = true;
      });
    }
  }

  setYourSearchesExpanded(expanded: boolean): void {
    if (this.yourSearchesExpanded === expanded) return;
    this.yourSearchesExpanded = expanded;
    void AsyncStorage.setItem(
      YOUR_SEARCHES_EXPANDED_STORAGE_KEY,
      expanded ? "true" : "false",
    ).catch(() => {
      // best-effort local prefs
    });
  }

  async loadYourSearchesExpanded(): Promise<void> {
    try {
      const saved = await AsyncStorage.getItem(
        YOUR_SEARCHES_EXPANDED_STORAGE_KEY,
      );
      const parsed = parseYourSearchesExpanded(saved);
      if (parsed != null) {
        runInAction(() => {
          this.yourSearchesExpanded = parsed;
        });
      }
    } catch {
      // keep default
    }
  }

  getList(bucket: string): FeedItem[] {
    const ids = this.lists[bucket] ?? [];
    return ids
      .map((id) => this.items.get(id))
      .filter((item): item is FeedItem => item != null);
  }

  /** Clear a category list so UI can show a loading skeleton (e.g. Sold/Best Picks chips). */
  clearBucketList(bucket: string): void {
    this.setListIds(bucket, []);
    this.setPagination(bucket, null);
    this.touchSet("loadedBuckets", (s) => {
      s.delete(bucket);
    });
  }

  getShelf(key: string): FeedItem[] {
    const ids = this.shelves[key] ?? [];
    return ids
      .map((id) => this.items.get(id))
      .filter((item): item is FeedItem => item != null);
  }

  isBucketLoading(bucket: string): boolean {
    return this.loadingBuckets.has(bucket);
  }

  isBucketLoadingMore(bucket: string): boolean {
    return this.loadingMoreBuckets.has(bucket);
  }

  isBucketDirty(bucket: string): boolean {
    return this.dirtyBuckets.has(bucket);
  }

  hasMore(bucket: string): boolean {
    const pagination = this.paginationByBucket[bucket];
    if (!pagination) return false;
    return pagination.currentPage < pagination.totalPages;
  }

  /** Full-width tab bar strip — deferred live items for the active category. */
  get showNewItemsIndicator(): boolean {
    const key = this.activeCategory;
    if (!key || key === "for-you") return false;
    return (this.deferredIdsByBucket[key]?.length ?? 0) > 0;
  }

  deferredCount(bucket: string): number {
    return this.deferredIdsByBucket[bucket]?.length ?? 0;
  }

  isBucketFrozen(bucket: string): boolean {
    return this.frozenBuckets.has(bucket);
  }

  setBucketFrozen(bucket: string, frozen: boolean): void {
    if (bucket === "for-you") return;
    if (frozen === this.frozenBuckets.has(bucket)) return;
    this.touchSet("frozenBuckets", (s) => {
      if (frozen) s.add(bucket);
      else s.delete(bucket);
    });
  }

  registerScrollToTop(handler: (() => void) | null): void {
    this.scrollToTopHandler = handler;
  }

  /** Re-tap Feed tab / strip — scroll active category to top and reveal deferred. */
  requestScrollToTop(): void {
    this.scrollToTopHandler?.();
  }

  /**
   * Reveal deferred live items into the list and clear the pending indicator.
   * Call when the user returns to the top of a category grid.
   */
  flushDeferredBucket(bucket: string): void {
    if (bucket === "for-you") return;
    const deferred = this.deferredIdsByBucket[bucket] ?? [];
    if (deferred.length > 0) {
      let list = this.lists[bucket] ?? [];
      // Arrival order was push; prepend oldest-first so newest stays on top.
      for (let i = deferred.length - 1; i >= 0; i -= 1) {
        list = prependId(list, deferred[i]!);
      }
      this.setListIds(bucket, list);
      this.deferredIdsByBucket = {
        ...this.deferredIdsByBucket,
        [bucket]: [],
      };
    }
    this.setBucketFrozen(bucket, false);
  }

  clearDeferredBucket(bucket: string): void {
    if (!(bucket in this.deferredIdsByBucket)) return;
    this.deferredIdsByBucket = {
      ...this.deferredIdsByBucket,
      [bucket]: [],
    };
  }

  setHubStatus(status: FeedHubStatus): void {
    this.hubStatus = status;
  }

  upsertItem(feed: FeedItem): void {
    const pendingValuation = this.pendingValuationUpdates.get(feed.id);
    if (pendingValuation) this.pendingValuationUpdates.delete(feed.id);

    const merged: FeedItem = {
      ...feed,
      ...(pendingValuation
        ? {
            compValuation:
              pendingValuation.compValuation !== undefined
                ? pendingValuation.compValuation
                : (feed.compValuation ?? null),
            externalValuation:
              pendingValuation.externalValuation !== undefined
                ? pendingValuation.externalValuation
                : (feed.externalValuation ?? null),
          }
        : null),
    };

    const existing = this.items.get(merged.id);
    this.items.set(merged.id, existing ? { ...existing, ...merged } : merged);
  }

  /** Clear live "just arrived" highlight after the UI shimmer finishes. */
  clearNewFlag(id: string): void {
    const existing = this.items.get(id);
    if (!existing?.isNew) return;
    debugLog.info(FEED_LIVE_LOG, "clearNewFlag", { id, t: Date.now() });
    this.items.set(id, { ...existing, isNew: false });
  }

  private groupIdsFor(bucket: string): string[] | undefined {
    return this.searchStore?.groupIdsForCategory(bucket);
  }

  private filterIdsFor(bucket: string): string[] | undefined {
    // Saved / All / typed tabs are never narrowed by isActive filters.
    // Only dedicated filter:{id} tabs (via tab availability) pass filterIds.
    if (bucket === "saved") return undefined;

    const tabIds = this.searchStore?.filterIdsForCategory(bucket);
    if (tabIds != null && tabIds.length > 0) {
      return tabIds;
    }

    // Explicit filter tab fallback when tabs aren't hydrated yet.
    if (bucket.startsWith("filter:")) {
      const id = bucket.slice("filter:".length).trim();
      return id ? [id] : undefined;
    }

    return undefined;
  }

  private displayPrefs(): FeedDisplayPrefs {
    return this.filterStore?.displayPrefs ?? DEFAULT_FEED_DISPLAY_PREFS;
  }

  private hidePrefs(): FeedHidePrefs {
    return this.filterStore?.hidePrefs ?? DEFAULT_FEED_HIDE_PREFS;
  }

  private listQueryExtras(bucket?: string): {
    minBuySignal?: number;
    minProfit?: number;
    displayPrefs: FeedDisplayPrefs;
    hidePrefs: FeedHidePrefs;
  } {
    const prefs = this.displayPrefs();
    const hidePrefs = this.hidePrefs();
    // Best Picks uses its own score floor — not Great / min-profit prefs.
    if (bucket === "best-picks") {
      return { displayPrefs: prefs, hidePrefs };
    }
    return {
      minBuySignal: effectiveMinBuySignalForQuery(prefs),
      minProfit: deriveMinProfit(prefs),
      displayPrefs: prefs,
      hidePrefs,
    };
  }

  /**
   * Selected filters changed — persist already done by FilterStore.
   * Defer wipe/reload until feed focus (or apply immediately if not on Filters).
   */
  onSelectedFiltersChanged(): void {
    this.markFilterApplyPending({ includeBestPicks: true });
    if (!this.filterStore?.filtersScreenOpen) {
      void this.beginFilterApplyIfNeeded();
    }
  }

  /**
   * Deal display prefs changed. Best Picks is unaffected.
   * Defer wipe/reload until feed focus (or apply immediately if not on Filters).
   */
  onDisplayPrefsChanged(): void {
    this.markFilterApplyPending({ includeBestPicks: false });
    if (!this.filterStore?.filtersScreenOpen) {
      void this.beginFilterApplyIfNeeded();
    }
  }

  markFilterApplyPending(opts?: { includeBestPicks?: boolean }): void {
    this.pendingFilterApply = true;
    if (opts?.includeBestPicks) {
      this.pendingIncludeBestPicks = true;
    }
  }

  /**
   * Clear non-saved feed state and refetch For You shelves + active category.
   * Shows `isApplyingFilters` for the FilterApplyingDialog host.
   */
  async beginFilterApplyIfNeeded(): Promise<void> {
    if (!this.pendingFilterApply) return;
    if (this.filterApplyInFlight) {
      await this.filterApplyInFlight;
      if (this.pendingFilterApply) {
        await this.beginFilterApplyIfNeeded();
      }
      return;
    }

    const run = this.runFilterApply();
    this.filterApplyInFlight = run;
    try {
      await run;
    } finally {
      if (this.filterApplyInFlight === run) {
        this.filterApplyInFlight = null;
      }
    }
  }

  /**
   * Soft-refresh a single filter shelf/list after criteria edits.
   * Does not trigger the global Applying dialog / wipe.
   */
  async refreshFilterBucket(filterId: string): Promise<void> {
    const id = filterId.trim();
    if (!id) return;
    const key = `filter:${id}`;
    this.touchSet("dirtyBuckets", (s) => {
      s.add(key);
    });

    const tasks: Promise<void>[] = [];
    if (this.hydratedShelves.has(key) || key in this.shelves) {
      tasks.push(this.loadBucket(key, { force: true, asShelf: true }));
    }
    if (
      this.loadedBuckets.has(key) ||
      this.activeCategory === key ||
      key in this.lists
    ) {
      tasks.push(this.loadBucket(key, { force: true }));
    }
    if (tasks.length === 0) return;
    await Promise.all(tasks);
  }

  private async runFilterApply(): Promise<void> {
    const generation = ++this.filterApplyGeneration;
    const includeBestPicks = this.pendingIncludeBestPicks;
    runInAction(() => {
      this.pendingFilterApply = false;
      this.pendingIncludeBestPicks = false;
      this.isApplyingFilters = true;
    });

    try {
      // Tabs must be fresh before shelf keys are chosen (new/enabled filters).
      await this.searchStore?.loadFeedTabAvailability(true);

      runInAction(() => {
        this.clearNonSavedFeedState(includeBestPicks);
      });

      const shelfKeys = this.forYouShelfKeysForApply(includeBestPicks);
      const active = this.activeCategory;
      const tasks: Promise<void>[] = [
        this.loadForYouShelves(shelfKeys, { force: true }),
      ];
      if (active !== "for-you" && active !== "saved") {
        if (includeBestPicks || active !== "best-picks") {
          tasks.push(this.loadBucket(active, { force: true }));
        }
      }
      await Promise.all(tasks);
    } finally {
      if (generation === this.filterApplyGeneration) {
        runInAction(() => {
          this.isApplyingFilters = false;
        });
        this.flushPendingFeeds();
      }
    }
  }

  /** Wipe lists/shelves/pagination for buckets affected by the filter change. */
  private clearNonSavedFeedState(includeBestPicks: boolean): void {
    const keep = (bucket: string) =>
      bucket === "saved" ||
      bucket === "for-you" ||
      (!includeBestPicks && bucket === "best-picks");

    const nextLists: Record<string, string[]> = {};
    for (const [key, ids] of Object.entries(this.lists)) {
      if (keep(key)) nextLists[key] = ids;
    }
    this.lists = nextLists;

    const nextShelves: Record<string, string[]> = {};
    for (const [key, ids] of Object.entries(this.shelves)) {
      if (keep(key)) nextShelves[key] = ids;
    }
    this.shelves = nextShelves;

    const nextPagination: Record<string, Pagination | null> = {};
    for (const [key, page] of Object.entries(this.paginationByBucket)) {
      if (keep(key)) nextPagination[key] = page;
    }
    this.paginationByBucket = nextPagination;

    const nextDeferred: Record<string, string[]> = {};
    for (const [key, ids] of Object.entries(this.deferredIdsByBucket)) {
      if (keep(key)) nextDeferred[key] = ids;
    }
    this.deferredIdsByBucket = nextDeferred;

    this.dirtyBuckets = new Set(
      [...this.dirtyBuckets].filter((bucket) => keep(bucket)),
    );
    this.loadedBuckets = new Set(
      [...this.loadedBuckets].filter((bucket) => keep(bucket)),
    );
    this.hydratedShelves = new Set(
      [...this.hydratedShelves].filter((bucket) => keep(bucket)),
    );
    this.frozenBuckets = new Set(
      [...this.frozenBuckets].filter((bucket) => keep(bucket)),
    );
    this.liveHeadIds = new Set();
    this.pendingFeeds = [];
  }

  private forYouShelfKeysForApply(includeBestPicks: boolean): string[] {
    const shelves = this.searchStore?.forYouShelves ?? [];
    const searchChildren = this.searchStore?.yourSearchChildren ?? [];
    const filterChildren = this.searchStore?.yourFilterChildren ?? [];
    const keys: string[] = [];

    for (const shelf of shelves) {
      if (shelf.isAccordion) {
        for (const child of searchChildren) keys.push(child.key);
        continue;
      }
      if (shelf.isExpandedGroup) {
        for (const child of filterChildren) keys.push(child.key);
        continue;
      }
      if (shelf.key === "your-searches" || shelf.key === "your-filters") {
        continue;
      }
      if (shelf.key === "saved") continue;
      if (shelf.key === "best-picks" && !includeBestPicks) continue;
      keys.push(shelf.key);
    }
    return keys;
  }

  private touchSet(
    field:
      | "dirtyBuckets"
      | "loadingBuckets"
      | "loadingMoreBuckets"
      | "loadedBuckets"
      | "hydratedShelves"
      | "frozenBuckets",
    mutate: (set: Set<string>) => void,
  ): void {
    const next = new Set(this[field]);
    mutate(next);
    this[field] = next;
  }

  private setListIds(bucket: string, ids: string[]): void {
    this.lists = { ...this.lists, [bucket]: ids };
  }

  private setShelfIds(key: string, ids: string[]): void {
    this.shelves = { ...this.shelves, [key]: ids };
  }

  private setPagination(bucket: string, pagination: Pagination | null): void {
    this.paginationByBucket = {
      ...this.paginationByBucket,
      [bucket]: pagination,
    };
  }

  private appendUniqueIds(existing: string[], incoming: string[]): string[] {
    if (incoming.length === 0) return existing;
    const seen = new Set(existing);
    const next = [...existing];
    for (const id of incoming) {
      if (seen.has(id)) continue;
      seen.add(id);
      next.push(id);
    }
    return next;
  }

  private queueDeferred(bucket: string, id: string): void {
    const current = this.deferredIdsByBucket[bucket] ?? [];
    if (current.includes(id)) return;
    if ((this.lists[bucket] ?? []).includes(id)) return;
    this.deferredIdsByBucket = {
      ...this.deferredIdsByBucket,
      [bucket]: [...current, id],
    };
  }

  private putInBucket(
    bucket: string,
    id: string,
    mode: "prepend" | "sorted-best-picks",
  ): void {
    const updateShelf = (): void => {
      if (!(this.hydratedShelves.has(bucket) || bucket in this.shelves)) {
        return;
      }
      const shelfCurrent = this.shelves[bucket] ?? [];
      const shelfNext =
        mode === "sorted-best-picks"
          ? insertSortedByBuySignal(
              shelfCurrent,
              id,
              (itemId) => {
                const item = this.items.get(itemId);
                return item ? buySignalOf(item) : 0;
              },
              FEED_SHELF_LIMIT,
            )
          : prependId(shelfCurrent, id, FEED_SHELF_LIMIT);
      this.setShelfIds(bucket, shelfNext);
      this.touchSet("hydratedShelves", (s) => {
        s.add(bucket);
      });
    };

    // Scrolled category grid: keep shelves live, defer list prepend so cells don't jump.
    if (this.frozenBuckets.has(bucket)) {
      this.queueDeferred(bucket, id);
      updateShelf();
      return;
    }

    const current = this.lists[bucket] ?? [];
    const next =
      mode === "sorted-best-picks"
        ? insertSortedByBuySignal(
            current,
            id,
            (itemId) => {
              const item = this.items.get(itemId);
              return item ? buySignalOf(item) : 0;
            },
          )
        : prependId(current, id);
    this.setListIds(bucket, next);
    updateShelf();
  }

  isShelfHydrated(bucket: string): boolean {
    return this.hydratedShelves.has(bucket);
  }

  async loadBucket(bucket: string, opts: LoadBucketOpts = {}): Promise<void> {
    if (bucket === "for-you") return;

    const inFlight = this.bucketLoadPromises.get(bucket);
    if (inFlight) {
      if (!opts.force) {
        // Join the in-flight request — a bare return made For You think shelves
        // were ready while the first load was still outstanding (blank flash).
        await inFlight;
        return;
      }
      // Force reload: wait so a stale response cannot overwrite newer prefs.
      try {
        await inFlight;
      } catch {
        // ignore prior failure; we still force-reload below
      }
    }

    const isShelf = !!opts.asShelf;
    const existingPagination = this.paginationByBucket[bucket];
    const poisonedShelfPage =
      !isShelf &&
      existingPagination != null &&
      existingPagination.itemsPerPage < FEED_PAGE_SIZE;
    // Shelf preview (For You) must not mark the category list as fully loaded,
    // or category tabs reuse pageSize=6 forever.
    const shouldForce =
      opts.force ||
      poisonedShelfPage ||
      this.dirtyBuckets.has(bucket) ||
      (!isShelf && !this.loadedBuckets.has(bucket));

    if (
      !shouldForce &&
      !isShelf &&
      this.loadedBuckets.has(bucket) &&
      !opts.query
    ) {
      return;
    }
    if (
      !shouldForce &&
      isShelf &&
      this.hydratedShelves.has(bucket) &&
      !opts.query &&
      !opts.force
    ) {
      return;
    }

    const run = this.runLoadBucket(bucket, opts, isShelf);
    this.bucketLoadPromises.set(bucket, run);
    try {
      await run;
    } finally {
      if (this.bucketLoadPromises.get(bucket) === run) {
        this.bucketLoadPromises.delete(bucket);
      }
    }
  }

  private async runLoadBucket(
    bucket: string,
    opts: LoadBucketOpts,
    isShelf: boolean,
  ): Promise<void> {
    this.touchSet("loadingBuckets", (s) => {
      s.add(bucket);
    });
    this.lastError = null;
    try {
      // Full category lists always use FEED_PAGE_SIZE. Never inherit shelf limit (6).
      const pageSize = isShelf
        ? (opts.limit ?? FEED_SHELF_LIMIT)
        : (opts.pageSize ?? FEED_PAGE_SIZE);
      const result = await agent.Feed.list({
        category: bucket,
        groupIds: this.groupIdsFor(bucket),
        filterIds: this.filterIdsFor(bucket),
        query: opts.query,
        pageNumber: opts.pageNumber ?? 1,
        pageSize,
        soldStatus: opts.soldStatus,
        maxDays: opts.maxDays,
        bestPicksSortBy: opts.bestPicksSortBy,
        bestPicksSortDir: opts.bestPicksSortDir,
        bestPicksMaxHours: opts.bestPicksMaxHours,
        ...this.listQueryExtras(bucket),
      });
      const items = result.data ?? [];

      runInAction(() => {
        for (const item of items) {
          this.upsertItem(item);
        }
        const httpIds = items.map((i) => i.id);

        if (isShelf) {
          this.setShelfIds(
            bucket,
            httpIds.slice(0, opts.limit ?? FEED_SHELF_LIMIT),
          );
          this.touchSet("hydratedShelves", (s) => {
            s.add(bucket);
          });
          this.touchSet("dirtyBuckets", (s) => {
            s.delete(bucket);
          });
          return;
        }

        const existing = this.lists[bucket] ?? [];
        const merged =
          opts.query || bucket === "sold" || bucket === "best-picks"
            ? httpIds
            : mergeHttpPageWithLiveHead(httpIds, existing, (id) =>
                this.liveHeadIds.has(id),
              );
        this.setListIds(bucket, merged);
        this.setPagination(bucket, result.pagination ?? null);
        this.clearDeferredBucket(bucket);

        if (this.hydratedShelves.has(bucket)) {
          this.setShelfIds(bucket, merged.slice(0, FEED_SHELF_LIMIT));
        }

        this.touchSet("loadedBuckets", (s) => {
          s.add(bucket);
        });
        this.touchSet("dirtyBuckets", (s) => {
          s.delete(bucket);
        });
      });
    } catch (error) {
      runInAction(() => {
        this.lastError = toUserErrorMessage(error);
      });
    } finally {
      runInAction(() => {
        this.touchSet("loadingBuckets", (s) => {
          s.delete(bucket);
        });
      });
    }
  }

  /**
   * Append the next page for a category list (infinite scroll).
   * No-op when already loading, no more pages, or For You.
   */
  async loadMore(bucket: string, opts: LoadBucketOpts = {}): Promise<void> {
    if (bucket === "for-you") return;
    if (this.loadingBuckets.has(bucket) || this.loadingMoreBuckets.has(bucket)) {
      return;
    }
    if (!this.hasMore(bucket)) return;

    const pagination = this.paginationByBucket[bucket];
    const nextPage = (pagination?.currentPage ?? 1) + 1;
    // Always use full list page size — never shelf size leftover in pagination.
    const pageSize = opts.pageSize ?? FEED_PAGE_SIZE;

    this.touchSet("loadingMoreBuckets", (s) => {
      s.add(bucket);
    });
    this.lastError = null;

    try {
      const result = await agent.Feed.list({
        category: bucket,
        groupIds: this.groupIdsFor(bucket),
        filterIds: this.filterIdsFor(bucket),
        query: opts.query,
        pageNumber: nextPage,
        pageSize,
        soldStatus: opts.soldStatus,
        maxDays: opts.maxDays,
        bestPicksSortBy: opts.bestPicksSortBy,
        bestPicksSortDir: opts.bestPicksSortDir,
        bestPicksMaxHours: opts.bestPicksMaxHours,
        ...this.listQueryExtras(bucket),
      });
      const items = result.data ?? [];

      runInAction(() => {
        for (const item of items) {
          this.upsertItem(item);
        }
        const httpIds = items.map((i) => i.id);
        const existing = this.lists[bucket] ?? [];
        this.setListIds(bucket, this.appendUniqueIds(existing, httpIds));
        this.setPagination(bucket, result.pagination ?? null);
      });
    } catch (error) {
      runInAction(() => {
        this.lastError = toUserErrorMessage(error);
      });
    } finally {
      runInAction(() => {
        this.touchSet("loadingMoreBuckets", (s) => {
          s.delete(bucket);
        });
      });
    }
  }

  async loadForYouShelves(
    shelfKeys: string[],
    opts?: { query?: string; force?: boolean },
  ): Promise<void> {
    await Promise.all(
      shelfKeys.map((key) =>
        this.loadBucket(key, {
          query: opts?.query,
          force: opts?.force,
          limit: FEED_SHELF_LIMIT,
          asShelf: true,
          ...(key === "sold" ? { maxDays: 1 } : {}),
        }),
      ),
    );
  }

  async refreshIfDirty(bucket: string, opts?: LoadBucketOpts): Promise<void> {
    // Shelf-only hydrate must not block a full category open.
    if (
      !opts?.asShelf &&
      !this.dirtyBuckets.has(bucket) &&
      this.loadedBuckets.has(bucket)
    ) {
      const pagination = this.paginationByBucket[bucket];
      if (!pagination || pagination.itemsPerPage >= FEED_PAGE_SIZE) {
        return;
      }
    }
    if (
      opts?.asShelf &&
      !this.dirtyBuckets.has(bucket) &&
      this.hydratedShelves.has(bucket) &&
      !opts.force
    ) {
      return;
    }
    await this.loadBucket(bucket, { ...opts, force: true });
  }

  /**
   * Reconnect catch-up: fetch a small page-1 head and merge in front of
   * already-loaded rows (does not wipe the rest of the list).
   */
  async catchUpBucket(bucket: string, pageSize = 10): Promise<void> {
    if (bucket === "for-you") return;

    const groupIds = this.groupIdsFor(bucket);
    const filterIds = this.filterIdsFor(bucket);
    const existingBefore = this.lists[bucket] ?? [];
    const startedAt = Date.now();

    debugLog.info(CATCH_UP_LOG, "bucket start", {
      bucket,
      pageSize,
      groupIds,
      filterIds,
      existingCount: existingBefore.length,
      shelfHydrated: this.hydratedShelves.has(bucket),
    });

    try {
      const result = await agent.Feed.list({
        category: bucket,
        groupIds,
        filterIds,
        pageSize,
        ...(bucket === "sold" ? { maxDays: 1 } : {}),
        ...this.listQueryExtras(bucket),
      });
      const items = result.data ?? [];

      runInAction(() => {
        for (const item of items) {
          this.upsertItem(item);
        }
        const httpIds = items.map((i) => i.id);
        const existing = this.lists[bucket] ?? [];
        const newHeadIds = httpIds.filter((id) => !existing.includes(id));

        // Don't reflow a scrolled grid — queue new head ids for the tab strip.
        if (this.frozenBuckets.has(bucket)) {
          for (const id of newHeadIds) {
            this.queueDeferred(bucket, id);
          }
          if (this.hydratedShelves.has(bucket)) {
            const shelfMerged = mergeCatchUpHead(
              httpIds,
              this.shelves[bucket] ?? [],
            );
            this.setShelfIds(bucket, shelfMerged.slice(0, FEED_SHELF_LIMIT));
          }
          this.touchSet("dirtyBuckets", (s) => {
            s.delete(bucket);
          });
          debugLog.info(CATCH_UP_LOG, "bucket deferred (frozen)", {
            bucket,
            pageSize,
            ms: Date.now() - startedAt,
            fetched: httpIds.length,
            deferredNew: newHeadIds.length,
          });
          return;
        }

        const merged = mergeCatchUpHead(httpIds, existing);
        this.setListIds(bucket, merged);

        if (this.hydratedShelves.has(bucket)) {
          this.setShelfIds(bucket, merged.slice(0, FEED_SHELF_LIMIT));
        }

        this.touchSet("dirtyBuckets", (s) => {
          s.delete(bucket);
        });

        debugLog.info(CATCH_UP_LOG, "bucket done", {
          bucket,
          pageSize,
          ms: Date.now() - startedAt,
          fetched: httpIds.length,
          headIds: httpIds.slice(0, 5),
          newAtHead: newHeadIds.length,
          newHeadIds: newHeadIds.slice(0, 5),
          existingBefore: existing.length,
          mergedCount: merged.length,
          preservedTail: merged.length - httpIds.length,
        });
      });
    } catch (error) {
      // Soft-fail: keep existing list; next open/dirty refresh can recover.
      debugLog.error(CATCH_UP_LOG, "bucket failed", {
        bucket,
        pageSize,
        ms: Date.now() - startedAt,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  handleReceiveFeed(feed: FeedItem): void {
    if (!this.searchStore?.hasLoadedFeedTabAvailability) {
      this.pendingFeeds.push(feed);
      if (this.pendingFeeds.length > PENDING_FEEDS_MAX) {
        this.pendingFeeds = this.pendingFeeds.slice(-PENDING_FEEDS_MAX);
      }
      debugLog.info(FEED_LIVE_LOG, "receive queued (tabs not ready)", {
        id: feed.id,
        pending: this.pendingFeeds.length,
        t: Date.now(),
      });
      return;
    }
    this.applyLiveFeed(feed);
  }

  flushPendingFeeds(): void {
    if (!this.pendingFeeds.length) return;
    const queued = this.pendingFeeds;
    this.pendingFeeds = [];
    debugLog.info(FEED_LIVE_LOG, "flushPendingFeeds", {
      count: queued.length,
      t: Date.now(),
    });
    for (const feed of queued) {
      this.applyLiveFeed(feed);
    }
  }

  private applyLiveFeed(raw: FeedItem): void {
    const t0 = Date.now();
    const feed: FeedItem = {
      ...raw,
      isNew: true,
      receivedAt: t0,
      searchGroupIds: raw.searchGroupIds ?? [],
    };

    // During filter apply, queue until lists are rebuilt from HTTP.
    if (this.isApplyingFilters || this.pendingFilterApply) {
      runInAction(() => {
        this.pendingFeeds.push(feed);
        if (this.pendingFeeds.length > PENDING_FEEDS_MAX) {
          this.pendingFeeds = this.pendingFeeds.slice(-PENDING_FEEDS_MAX);
        }
      });
      return;
    }

    // upsertItem also merges any pending image/valuation patches that raced ahead.
    const tabs = this.searchStore?.feedTabs ?? [];
    // Resolve buckets after upsert so pending valuation is visible on the item.
    runInAction(() => {
      this.upsertItem(feed);
      const resolved = this.items.get(feed.id) ?? feed;
      const filterTabs = this.searchStore?.filterTabs ?? [];
      const activeFilterIds = this.filterStore?.activeFilterIds ?? [];
      const allBuckets = bucketsForLiveFeed(
        resolved,
        tabs,
        filterTabs,
        activeFilterIds,
      );
      // Hide-listings gates apply to every bucket (including Best Picks).
      if (!matchesFeedHidePrefs(resolved, this.hidePrefs())) {
        debugLog.info(FEED_LIVE_LOG, "applyLiveFeed skipped (hide prefs)", {
          id: resolved.id,
          t: Date.now(),
        });
        return;
      }
      // Best Picks ignores Great / min-profit prefs; other buckets still honor them.
      const passesDisplayPrefs = matchesFeedDisplayPrefs(
        resolved,
        this.displayPrefs(),
      );
      const buckets = passesDisplayPrefs
        ? allBuckets
        : allBuckets.filter((bucket) => bucket === "best-picks");
      if (buckets.length === 0) {
        debugLog.info(FEED_LIVE_LOG, "applyLiveFeed skipped (display prefs)", {
          id: resolved.id,
          t: Date.now(),
        });
        return;
      }
      this.liveHeadIds.add(resolved.id);

      for (const bucket of buckets) {
        const mode =
          bucket === "best-picks" ? "sorted-best-picks" : "prepend";
        this.putInBucket(bucket, resolved.id, mode);
      }

      // Low-confidence Best Picks: dirty so open refreshes server ranking.
      if (!isBestPicksCandidate(resolved)) {
        this.touchSet("dirtyBuckets", (s) => {
          s.add("best-picks");
        });
      }

      debugLog.info(FEED_LIVE_LOG, "applyLiveFeed", {
        id: resolved.id,
        buckets,
        bucketCount: buckets.length,
        activeCategory: this.activeCategory,
        ms: Date.now() - t0,
        t: Date.now(),
      });
    });
  }

  handleFeedValuationUpdate(update: FeedValuationUpdateData): void {
    const existing = this.items.get(update.feedId);
    if (!existing) {
      this.queuePendingPatch(
        this.pendingValuationUpdates,
        update.feedId,
        update,
      );
      return;
    }

    const updated: FeedItem = {
      ...existing,
      compValuation:
        update.compValuation !== undefined
          ? update.compValuation
          : (existing.compValuation ?? null),
      externalValuation:
        update.externalValuation !== undefined
          ? update.externalValuation
          : (existing.externalValuation ?? null),
    };

    runInAction(() => {
      this.items.set(update.feedId, updated);

      // Late valuation may newly qualify for Best Picks / price-drop.
      if (isBestPicksCandidate(updated)) {
        this.putInBucket("best-picks", update.feedId, "sorted-best-picks");
      } else {
        this.touchSet("dirtyBuckets", (s) => {
          s.add("best-picks");
        });
      }
      if (isPriceDropCandidate(updated)) {
        this.putInBucket("price-drop", update.feedId, "prepend");
      }
    });

    debugLog.info(FEED_LIVE_LOG, "handleFeedValuationUpdate", {
      id: update.feedId,
      bestPicks: isBestPicksCandidate(updated),
      priceDrop: isPriceDropCandidate(updated),
      t: Date.now(),
    });
  }

  private queuePendingPatch<T>(
    map: Map<string, T>,
    feedId: string,
    value: T,
  ): void {
    map.set(feedId, value);
    if (map.size <= PENDING_PATCH_MAX) return;
    const oldest = map.keys().next().value;
    if (oldest != null) map.delete(oldest);
  }

  /**
   * Debounced + single-flight catch-up after hub reconnect or app resume.
   * Rapid reconnect/resume events collapse into one HTTP burst.
   */
  onHubReconnected(): void {
    if (this.catchUpTimer) {
      clearTimeout(this.catchUpTimer);
    }
    this.catchUpTimer = setTimeout(() => {
      this.catchUpTimer = null;
      void this.runCatchUpSingleFlight();
    }, CATCH_UP_DEBOUNCE_MS);
  }

  private async runCatchUpSingleFlight(): Promise<void> {
    if (this.catchUpInFlight) {
      this.catchUpQueued = true;
      debugLog.info(CATCH_UP_LOG, "catch-up coalesced (in flight)");
      return;
    }

    this.catchUpInFlight = true;
    try {
      do {
        this.catchUpQueued = false;
        await this.executeCatchUp();
      } while (this.catchUpQueued);
    } finally {
      this.catchUpInFlight = false;
    }
  }

  private async executeCatchUp(): Promise<void> {
    const targets = new Set<string>(["best-picks"]);
    if (this.activeCategory === "for-you") {
      for (const key of this.hydratedShelves) {
        targets.add(key);
      }
    } else if (this.activeCategory) {
      targets.add(this.activeCategory);
    }

    const targetList = [...targets];
    debugLog.info(CATCH_UP_LOG, "reconnect catch-up", {
      activeCategory: this.activeCategory,
      targets: targetList,
      hydratedShelves: [...this.hydratedShelves],
      pageSize: 10,
    });

    await Promise.all(targetList.map((b) => this.catchUpBucket(b, 10)));
    debugLog.info(CATCH_UP_LOG, "reconnect catch-up finished", {
      targets: targetList,
    });
  }

  async toggleFavorite(id: string): Promise<FeedItem | null> {
    const updated = await agent.Feed.toggleFavorite(id);
    if (!updated) return null;

    runInAction(() => {
      this.upsertItem(updated);
      const saved = this.lists.saved ?? [];
      if (updated.isFavorite) {
        this.setListIds("saved", prependId(saved, id));
        if (this.hydratedShelves.has("saved")) {
          this.setShelfIds(
            "saved",
            prependId(this.shelves.saved ?? [], id, FEED_SHELF_LIMIT),
          );
        }
      } else {
        this.setListIds(
          "saved",
          saved.filter((x) => x !== id),
        );
        if (this.shelves.saved) {
          this.setShelfIds(
            "saved",
            (this.shelves.saved ?? []).filter((x) => x !== id),
          );
        }
      }
    });
    return updated;
  }

  async markViewed(id: string): Promise<void> {
    const item = this.items.get(id);
    if (item) {
      runInAction(() => {
        this.items.set(id, {
          ...item,
          viewedAt: [...(item.viewedAt ?? []), new Date().toISOString()],
          isNew: false,
        });
      });
    }
    try {
      await agent.Feed.setViewed(id);
    } catch {
      // best-effort
    }
  }

  async markClicked(id: string): Promise<void> {
    const item = this.items.get(id);
    if (item && (!item.seenAt || item.seenAt.length === 0)) {
      debugLog.info(FEED_OPEN_LOG, "markClicked mutate", {
        id,
        wasNew: Boolean(item.isNew),
        t: Date.now(),
      });
      runInAction(() => {
        this.items.set(id, {
          ...item,
          seenAt: [new Date().toISOString()],
          isNew: false,
        });
      });
    }
    try {
      await agent.Feed.setClicked(id);
    } catch {
      // best-effort
    }
  }

  reset(): void {
    if (this.catchUpTimer) {
      clearTimeout(this.catchUpTimer);
      this.catchUpTimer = null;
    }
    this.catchUpInFlight = false;
    this.catchUpQueued = false;
    this.scrollToTopHandler = null;
    this.filterApplyInFlight = null;
    this.filterApplyGeneration += 1;
    this.items.clear();
    this.lists = {};
    this.shelves = {};
    this.paginationByBucket = {};
    this.deferredIdsByBucket = {};
    this.dirtyBuckets = new Set();
    this.loadingBuckets = new Set();
    this.loadingMoreBuckets = new Set();
    this.loadedBuckets = new Set();
    this.hydratedShelves = new Set();
    this.frozenBuckets = new Set();
    this.pendingFeeds = [];
    this.pendingValuationUpdates.clear();
    this.liveHeadIds = new Set();
    this.hubStatus = "disconnected";
    this.activeCategory = "for-you";
    this.lastError = null;
    this.isApplyingFilters = false;
    this.pendingFilterApply = false;
    this.pendingIncludeBestPicks = false;
  }
}
