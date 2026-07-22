import { makeAutoObservable, observable, runInAction } from "mobx";

import agent from "@/api/agent";
import {
  bucketsForLiveFeed,
  buySignalOf,
  FEED_SHELF_LIMIT,
  insertSortedByBuySignal,
  isBestPicksCandidate,
  mergeHttpPageWithLiveHead,
  prependId,
} from "@/domain/feed-routing";
import type { FeedImageUpdateData, FeedItem } from "@/models/feed";
import type SearchStore from "@/store/searchStore";

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
  unreadByTab: Record<string, number> = {};
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

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  setSearchStore(store: SearchStore): void {
    this.searchStore = store;
  }

  setActiveCategory(key: string): void {
    this.activeCategory = key;
    this.ackTabUnread(key);
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

  unreadCount(tabKey: string): number {
    return this.unreadByTab[tabKey] ?? 0;
  }

  isBucketLoading(bucket: string): boolean {
    return this.loadingBuckets.has(bucket);
  }

  isBucketDirty(bucket: string): boolean {
    return this.dirtyBuckets.has(bucket);
  }

  ackTabUnread(tabKey: string): void {
    if ((this.unreadByTab[tabKey] ?? 0) === 0) return;
    this.unreadByTab = { ...this.unreadByTab, [tabKey]: 0 };
  }

  setHubStatus(status: FeedHubStatus): void {
    this.hubStatus = status;
  }

  upsertItem(feed: FeedItem): void {
    const existing = this.items.get(feed.id);
    this.items.set(feed.id, existing ? { ...existing, ...feed } : feed);
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

  private markUnread(bucket: string): void {
    if (bucket === "for-you" || bucket === "sold") return;
    if (this.activeCategory === bucket) return;
    const next = (this.unreadByTab[bucket] ?? 0) + 1;
    this.unreadByTab = { ...this.unreadByTab, [bucket]: next };
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

  handleReceiveFeed(feed: FeedItem): void {
    if (!this.searchStore?.hasLoadedFeedTabAvailability) {
      this.pendingFeeds.push(feed);
      return;
    }
    this.applyLiveFeed(feed);
  }

  flushPendingFeeds(): void {
    if (!this.pendingFeeds.length) return;
    const queued = this.pendingFeeds;
    this.pendingFeeds = [];
    for (const feed of queued) {
      this.applyLiveFeed(feed);
    }
  }

  private applyLiveFeed(raw: FeedItem): void {
    const feed: FeedItem = {
      ...raw,
      isNew: true,
      receivedAt: Date.now(),
      searchGroupIds: raw.searchGroupIds ?? [],
    };

    const tabs = this.searchStore?.feedTabs ?? [];
    const buckets = bucketsForLiveFeed(feed, tabs);

    runInAction(() => {
      const already = this.items.has(feed.id);
      this.upsertItem(feed);
      this.liveHeadIds.add(feed.id);

      for (const bucket of buckets) {
        const mode =
          bucket === "best-picks" ? "sorted-best-picks" : "prepend";
        const had = (this.lists[bucket] ?? []).includes(feed.id);
        this.putInBucket(bucket, feed.id, mode);
        if (!already && !had) {
          this.markUnread(bucket);
        }
      }

      // Low-confidence Best Picks: dirty so open refreshes server ranking.
      if (!isBestPicksCandidate(feed)) {
        this.touchSet("dirtyBuckets", (s) => {
          s.add("best-picks");
        });
      }
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

  onHubReconnected(): void {
    runInAction(() => {
      this.touchSet("dirtyBuckets", (s) => {
        s.add("best-picks");
        if (this.activeCategory && this.activeCategory !== "for-you") {
          s.add(this.activeCategory);
        }
      });
    });
    if (this.activeCategory && this.activeCategory !== "for-you") {
      void this.loadBucket(this.activeCategory, { force: true });
    }
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
    this.items.clear();
    this.lists = {};
    this.shelves = {};
    this.unreadByTab = {};
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
