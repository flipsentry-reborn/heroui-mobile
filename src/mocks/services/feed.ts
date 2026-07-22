import type { FeedItem } from "@/models/feed";
import { isCarListing, resolveDisplayValuation } from "@/models/feed";
import { MOCK_FEED_ITEMS } from "@/mocks/data/feed";
import { getLocalCompsForFeed } from "@/mocks/data/local-comps";

export type GetLocalCompsParams = {
  sameYear?: boolean;
  days?: number;
};

export type SoldStatusFilter = "all" | "sold" | "pending";

export type GetFeedParams = {
  /** System key (all, best-picks, …), typed tab (type:car), or custom:* tab. */
  category?: string;
  /** From tab-availability for typed/custom tabs — forwarded to live Feed.list. */
  groupIds?: string[];
  query?: string;
  limit?: number;
  /** Live API page size (default 40). Catch-up uses 10. */
  pageSize?: number;
  /** Sold page: Sold / Pending chip filter. */
  soldStatus?: SoldStatusFilter;
  /** Sold page: only listings sold/pending within this many days. */
  maxDays?: number | null;
};

function delay(ms = 450): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function matchesSoldStatus(
  item: FeedItem,
  status: SoldStatusFilter = "all",
): boolean {
  if (status === "sold") return !!item.isSold;
  if (status === "pending") return !!item.isPending;
  return !!item.isSold || !!item.isPending;
}

function matchesMaxDays(item: FeedItem, maxDays: number | null | undefined): boolean {
  if (maxDays == null) return true;
  const cutoff = Date.now() - maxDays * 24 * 60 * 60 * 1000;
  const stamps: number[] = [];
  if (item.isSold && item.isSoldAt) {
    stamps.push(new Date(item.isSoldAt).getTime());
  }
  if (item.isPending && item.isPendingAt) {
    stamps.push(new Date(item.isPendingAt).getTime());
  }
  if (stamps.length === 0 && item.creationTime) {
    stamps.push(new Date(item.creationTime).getTime());
  }
  return stamps.some((t) => Number.isFinite(t) && t >= cutoff);
}

function matchesCategory(
  item: FeedItem,
  category: string,
  groupIds?: string[],
): boolean {
  if (category === "for-you" || category === "all") return true;
  if (category === "sold") return !!item.isSold || !!item.isPending;
  if (category === "saved") return item.isFavorite;
  if (category === "best-picks") {
    return (resolveDisplayValuation(item)?.buySignal ?? 0) >= 60;
  }
  if (category === "price-drop") {
    // Mock: listings with positive estimated profit count as price drops
    return (resolveDisplayValuation(item)?.profit ?? 0) > 0;
  }
  if (category === "car" || category === "type:car") {
    return (
      resolveDisplayValuation(item)?.valuationType === "car" ||
      !!item.vehicleSpecifications
    );
  }
  if (category === "iphone" || category === "type:iphone") {
    return (
      resolveDisplayValuation(item)?.valuationType === "iphone" ||
      item.iphoneStorageGb != null
    );
  }
  if (category === "type:samsung") {
    return resolveDisplayValuation(item)?.valuationType === "samsung";
  }
  if (category === "couch" || category === "custom:couch") {
    return item.searchSettingIds.includes("group-couch");
  }
  if (category === "xbox" || category === "custom:xbox") {
    return item.searchSettingIds.includes("group-xbox");
  }
  if (groupIds != null && groupIds.length > 0) {
    return groupIds.some(
      (id) =>
        item.searchSettingIds.includes(id) ||
        item.searchSettingIds.includes(`group-${id}`),
    );
  }
  if (category.startsWith("custom:")) {
    const slug = category.slice("custom:".length).trim();
    return (
      item.searchSettingIds.includes(`group-${slug}`) ||
      item.searchSettingIds.some((id) => id.includes(slug))
    );
  }
  // User-created searches (e.g. pinball / group-pinball)
  return (
    item.searchSettingIds.includes(category) ||
    item.searchSettingIds.includes(`group-${category}`)
  );
}

export async function getFeed(params: GetFeedParams = {}): Promise<FeedItem[]> {
  await delay();
  const category = params.category ?? "all";
  const query = (params.query ?? "").trim().toLowerCase();
  const soldStatus = params.soldStatus ?? "all";
  const maxDays = params.maxDays;

  const items = MOCK_FEED_ITEMS.filter((item) => {
    if (!matchesCategory(item, category, params.groupIds)) return false;
    if (category === "sold") {
      if (!matchesSoldStatus(item, soldStatus)) return false;
      if (!matchesMaxDays(item, maxDays)) return false;
    }
    if (!query) return true;
    return (
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.locationText.toLowerCase().includes(query)
    );
  }).map((item) => ({ ...item }));

  const take =
    params.limit != null && params.limit > 0
      ? params.limit
      : params.pageSize != null && params.pageSize > 0
        ? params.pageSize
        : null;
  if (take != null) {
    return items.slice(0, take);
  }
  return items;
}

/** Sync lookup for instant first paint on detail open (no artificial lag). */
export function peekFeedById(id: string): FeedItem | null {
  const item = MOCK_FEED_ITEMS.find((f) => f.id === id);
  if (!item) return null;
  return {
    ...item,
    images: {
      ...item.images,
      marketplaceImages: [...item.images.marketplaceImages],
    },
  };
}

export async function getFeedById(id: string): Promise<FeedItem | null> {
  return peekFeedById(id);
}

export async function toggleFavorite(id: string): Promise<FeedItem | null> {
  await delay(120);
  const item = MOCK_FEED_ITEMS.find((f) => f.id === id);
  if (!item) return null;
  item.isFavorite = !item.isFavorite;
  item.favoritedAt = item.isFavorite ? new Date().toISOString() : null;
  return { ...item };
}

export async function getLocalComps(
  feedId: string,
  params: GetLocalCompsParams = {},
): Promise<FeedItem[]> {
  await delay(400);

  const source = MOCK_FEED_ITEMS.find((f) => f.id === feedId);
  if (!source || !isCarListing(source)) return [];

  const sameYear = params.sameYear ?? false;
  const days = params.days ?? 3;
  const sourceYear =
    source.vehicleSpecifications?.vehicleYear ??
    resolveDisplayValuation(source)?.year ??
    null;
  const cutoffMs = Date.now() - days * 24 * 60 * 60 * 1000;

  return getLocalCompsForFeed(feedId).filter((comp) => {
    const year =
      comp.vehicleSpecifications?.vehicleYear ??
      resolveDisplayValuation(comp)?.year ??
      null;
    if (sameYear && sourceYear != null && year !== sourceYear) {
      return false;
    }
    if (comp.creationTime) {
      const postedMs = new Date(comp.creationTime).getTime();
      if (postedMs < cutoffMs) return false;
    }
    return true;
  });
}
