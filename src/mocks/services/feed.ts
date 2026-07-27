import type { FeedItem } from "@/models/feed";
import type { Pagination } from "@/models/pagination";
import { isCarListing, resolveDisplayValuation } from "@/models/feed";
import { MOCK_FEED_ITEMS } from "@/mocks/data/feed";
import { getLocalCompsForFeed } from "@/mocks/data/local-comps";
import {
  getActiveFilterIds,
  peekActiveFilterIds,
} from "@/mocks/services/filters";

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
  /** From filter tabs — forwarded to live Feed.list as filterIds. */
  filterIds?: string[];
  query?: string;
  limit?: number;
  /** 1-based page for infinite scroll (default 1). */
  pageNumber?: number;
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
  if (status === "sold") return !!item.isSold || !!item.isRemoved;
  if (status === "pending") return !!item.isPending;
  return !!item.isSold || !!item.isPending || !!item.isRemoved;
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
  if (item.isRemoved && item.isRemovedAt) {
    stamps.push(new Date(item.isRemovedAt).getTime());
  }
  if (stamps.length === 0 && item.creationTime) {
    stamps.push(new Date(item.creationTime).getTime());
  }
  return stamps.some((t) => Number.isFinite(t) && t >= cutoff);
}

function matchesFilterIds(
  item: FeedItem,
  filterIds: string[] | undefined,
): boolean {
  if (filterIds == null || filterIds.length === 0) return true;
  const itemIds = item.filterIds ?? [];
  return filterIds.some((id) => itemIds.includes(id));
}

/** Mirror backend: inactive UserFilters must not appear on feed badges. */
function stripInactiveFilters(
  item: FeedItem,
  activeIds: Set<string>,
): FeedItem {
  const filterIds = (item.filterIds ?? []).filter((id) => activeIds.has(id));
  const filters = (item.filters ?? []).filter((f) => activeIds.has(f.id));
  if (
    filterIds.length === (item.filterIds?.length ?? 0) &&
    filters.length === (item.filters?.length ?? 0)
  ) {
    return item;
  }
  return { ...item, filterIds, filters };
}

function matchesCategory(
  item: FeedItem,
  category: string,
  groupIds?: string[],
  filterIds?: string[],
): boolean {
  if (filterIds != null && filterIds.length > 0) {
    return matchesFilterIds(item, filterIds);
  }
  if (category.startsWith("filter:")) {
    const id = category.slice("filter:".length).trim();
    return matchesFilterIds(item, id ? [id] : []);
  }
  if (category === "for-you" || category === "all") return true;
  if (category === "sold") {
    return !!item.isSold || !!item.isPending || !!item.isRemoved;
  }
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
  const activeFilterIds = await getActiveFilterIds();

  const items = MOCK_FEED_ITEMS.filter((item) => {
    if (
      !matchesCategory(item, category, params.groupIds, params.filterIds)
    ) {
      return false;
    }
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
  }).map((item) => stripInactiveFilters({ ...item }, activeFilterIds));

  const take =
    params.limit != null && params.limit > 0
      ? params.limit
      : params.pageSize != null && params.pageSize > 0
        ? params.pageSize
        : null;
  if (take != null) {
    const page = Math.max(1, params.pageNumber ?? 1);
    const start = (page - 1) * take;
    return items.slice(start, start + take);
  }
  return items;
}

/** Paginated mock feed — mirrors live `/api/feed` pagination header shape. */
export async function getFeedPage(
  params: GetFeedParams = {},
): Promise<{ data: FeedItem[]; pagination: Pagination }> {
  const category = params.category ?? "all";
  const query = (params.query ?? "").trim().toLowerCase();
  const soldStatus = params.soldStatus ?? "all";
  const maxDays = params.maxDays;
  const pageSize =
    params.pageSize != null && params.pageSize > 0
      ? params.pageSize
      : params.limit != null && params.limit > 0
        ? params.limit
        : 40;
  const pageNumber = Math.max(1, params.pageNumber ?? 1);

  await delay();
  const activeFilterIds = await getActiveFilterIds();

  const filtered = MOCK_FEED_ITEMS.filter((item) => {
    if (
      !matchesCategory(item, category, params.groupIds, params.filterIds)
    ) {
      return false;
    }
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
  });

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = (pageNumber - 1) * pageSize;
  const data = filtered
    .slice(start, start + pageSize)
    .map((item) => stripInactiveFilters({ ...item }, activeFilterIds));

  return {
    data,
    pagination: {
      currentPage: pageNumber,
      itemsPerPage: pageSize,
      totalItems,
      totalPages,
    },
  };
}

/** Sync lookup for instant first paint on detail open (no artificial lag). */
export function peekFeedById(id: string): FeedItem | null {
  const item = MOCK_FEED_ITEMS.find((f) => f.id === id);
  if (!item) return null;
  const cloned: FeedItem = {
    ...item,
    images: {
      ...item.images,
      marketplaceImages: [...item.images.marketplaceImages],
    },
  };
  const activeIds = peekActiveFilterIds();
  return activeIds != null ? stripInactiveFilters(cloned, activeIds) : cloned;
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
