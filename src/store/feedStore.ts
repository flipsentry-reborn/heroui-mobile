import { makeAutoObservable, observable, runInAction } from "mobx";

import agent from "@/api/agent";
import {
  bucketsForLiveFeed,
  buySignalOf,
  FEED_SHELF_LIMIT,
  insertSortedByBuySignal,
  isBestPicksCandidate,
  mergeCatchUpHead,
  mergeHttpPageWithLiveHead,
  prependId,
} from "@/domain/feed-routing";
import { debugLog } from "@/lib/debug-log";
import type { FeedImageUpdateData, FeedItem } from "@/models/feed";
import type SearchStore from "@/store/searchStore";

const CATCH_UP_LOG = "FeedCatchUp";
const FEED_LIVE_LOG = "FeedLive";
const FEED_OPEN_LOG = "FeedOpen";

/** Collapse reconnect + AppState resume into one catch-up run. */
const CATCH_UP_DEBOUNCE_MS = 600;
/** Bound live queue while feed tabs are still loading. */
const PENDING_FEEDS_MAX = 80;

export type FeedHubStatus = "disconnected" | "connecting" | "connected";

type LoadBucketOpts = {
  query?: string;
  force?: boolean;
  limit?: number;
  soldStatus?: "all" | "sold" | "pending";
  maxDays?: number | null;
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
  dirtyBuckets = new Set<string>();
  loadingBuckets = new Set<string>();
  loadedBuckets = new Set<string>();
  hydratedShelves = new Set<string>();
  hubStatus: FeedHubStatus = "disconnected";
  activeCategory = "for-you";
  lastError: string | null = null;

  private searchStore: SearchStore | null = null;
  private pendingFeeds: FeedItem[] = [];
  private liveHeadIds = new Set<string>();
  private catchUpTimer: ReturnType<typeof setTimeout> | null = null;
  private catchUpInFlight = false;
  private catchUpQueued = false;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  setSearchStore(store: SearchStore): void {
    this.searchStore = store;
  }

  setActiveCategory(key: string): void {
    this.activeCategory = key;
  }

  getList(bucket: string): FeedItem[] {
    const ids = this.lists[bucket] ?? [];
    return ids
      .map((id) => this.items.get(id))
      .filter((item): item is FeedItem => item != null);
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

  isBucketDirty(bucket: string): boolean {
    return this.dirtyBuckets.has(bucket);
  }

  setHubStatus(status: FeedHubStatus): void {
    this.hubStatus = status;
  }

  upsertItem(feed: FeedItem): void {
    const existing = this.items.get(feed.id);
    this.items.set(feed.id, existing ? { ...existing, ...feed } : feed);
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

  private touchSet(
    field:
      | "dirtyBuckets"
      | "loadingBuckets"
      | "loadedBuckets"
      | "hydratedShelves",
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

  private putInBucket(
    bucket: string,
    id: string,
    mode: "prepend" | "sorted-best-picks",
  ): void {
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

    if (this.hydratedShelves.has(bucket) || bucket in this.shelves) {
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
    }
  }

  async loadBucket(bucket: string, opts: LoadBucketOpts = {}): Promise<void> {
    if (bucket === "for-you") return;
    if (this.loadingBuckets.has(bucket) && !opts.force) return;

    const shouldForce =
      opts.force ||
      this.dirtyBuckets.has(bucket) ||
      !this.loadedBuckets.has(bucket);

    if (!shouldForce && this.loadedBuckets.has(bucket) && !opts.query) {
      return;
    }

    this.touchSet("loadingBuckets", (s) => {
      s.add(bucket);
    });
    this.lastError = null;
    try {
      const items = await agent.Feed.list({
        category: bucket,
        groupIds: this.groupIdsFor(bucket),
        query: opts.query,
        limit: opts.limit,
        soldStatus: opts.soldStatus,
        maxDays: opts.maxDays,
      });

      runInAction(() => {
        for (const item of items) {
          this.upsertItem(item);
        }
        const httpIds = items.map((i) => i.id);
        const existing = this.lists[bucket] ?? [];
        const merged =
          opts.query || bucket === "sold"
            ? httpIds
            : mergeHttpPageWithLiveHead(httpIds, existing, (id) =>
                this.liveHeadIds.has(id),
              );
        this.setListIds(bucket, merged);

        if (opts.asShelf || this.hydratedShelves.has(bucket)) {
          this.setShelfIds(bucket, merged.slice(0, opts.limit ?? FEED_SHELF_LIMIT));
          this.touchSet("hydratedShelves", (s) => {
            s.add(bucket);
          });
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
        this.lastError =
          error instanceof Error ? error.message : "Failed to load feed";
      });
    } finally {
      runInAction(() => {
        this.touchSet("loadingBuckets", (s) => {
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
    if (!this.dirtyBuckets.has(bucket) && this.loadedBuckets.has(bucket)) {
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
    const existingBefore = this.lists[bucket] ?? [];
    const startedAt = Date.now();

    debugLog.info(CATCH_UP_LOG, "bucket start", {
      bucket,
      pageSize,
      groupIds,
      existingCount: existingBefore.length,
      shelfHydrated: this.hydratedShelves.has(bucket),
    });

    try {
      const items = await agent.Feed.list({
        category: bucket,
        groupIds,
        pageSize,
        ...(bucket === "sold" ? { maxDays: 1 } : {}),
      });

      runInAction(() => {
        for (const item of items) {
          this.upsertItem(item);
        }
        const httpIds = items.map((i) => i.id);
        const existing = this.lists[bucket] ?? [];
        const merged = mergeCatchUpHead(httpIds, existing);
        const newHeadIds = httpIds.filter((id) => !existing.includes(id));
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

    const tabs = this.searchStore?.feedTabs ?? [];
    const buckets = bucketsForLiveFeed(feed, tabs);

    runInAction(() => {
      this.upsertItem(feed);
      this.liveHeadIds.add(feed.id);

      for (const bucket of buckets) {
        const mode =
          bucket === "best-picks" ? "sorted-best-picks" : "prepend";
        this.putInBucket(bucket, feed.id, mode);
      }

      // Low-confidence Best Picks: dirty so open refreshes server ranking.
      if (!isBestPicksCandidate(feed)) {
        this.touchSet("dirtyBuckets", (s) => {
          s.add("best-picks");
        });
      }
    });

    debugLog.info(FEED_LIVE_LOG, "applyLiveFeed", {
      id: feed.id,
      buckets,
      bucketCount: buckets.length,
      activeCategory: this.activeCategory,
      ms: Date.now() - t0,
      t: Date.now(),
    });
  }

  handleFeedImageUpdate(update: FeedImageUpdateData): void {
    const existing = this.items.get(update.feedId);
    if (!existing) return;
    runInAction(() => {
      this.items.set(update.feedId, {
        ...existing,
        images: update.images,
      });
    });
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
    this.items.clear();
    this.lists = {};
    this.shelves = {};
    this.dirtyBuckets = new Set();
    this.loadingBuckets = new Set();
    this.loadedBuckets = new Set();
    this.hydratedShelves = new Set();
    this.pendingFeeds = [];
    this.liveHeadIds = new Set();
    this.hubStatus = "disconnected";
    this.activeCategory = "for-you";
    this.lastError = null;
  }
}
