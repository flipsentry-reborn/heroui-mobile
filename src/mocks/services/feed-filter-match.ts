/**
 * Mock-only helpers — never used by live HTTP filters/feed.
 * Agent routes Filters/Feed through `@/mocks/services/*` only when USE_MOCK.
 */
import { USE_MOCK } from "@/api/config";
import { MOCK_FEED_ITEMS } from "@/mocks/data/feed";
import { isCarListing, type FeedItem } from "@/models/feed";
import type { UserFilter } from "@/models/user-filter";

/**
 * Fixture aliases: home SearchGroups use g1/g2/g3/g4 while some feed rows
 * only carry legacy searchSettingIds like "group-iphones".
 */
function resolveFeedSearchGroupIds(item: FeedItem): Set<string> {
  const ids = new Set<string>((item.searchGroupIds ?? []).map(String));
  for (const raw of item.searchSettingIds ?? []) {
    const sid = String(raw);
    ids.add(sid);
    if (sid === "group-iphones" || sid.startsWith("g2")) ids.add("g2");
    if (sid === "group-cars" || sid.startsWith("g1")) ids.add("g1");
    if (sid.startsWith("g3")) ids.add("g3");
    if (sid === "group-custom" || sid.startsWith("g4")) ids.add("g4");
  }
  if (item.iphoneStorageGb != null) ids.add("g2");
  if (isCarListing(item)) ids.add("g1");
  return ids;
}

function isCarOriginFeed(item: FeedItem): boolean {
  const groups = resolveFeedSearchGroupIds(item);
  return (
    isCarListing(item) ||
    groups.has("g1") ||
    groups.has("g3") ||
    (item.searchSettingIds ?? []).some(
      (id) => id === "group-cars" || id.startsWith("g1") || id.startsWith("g3"),
    )
  );
}

function priceInRange(
  price: number,
  min?: number | null,
  max?: number | null,
): boolean {
  if (min != null && price < min) return false;
  if (max != null && price > max) return false;
  return true;
}

function matchesKeywords(
  title: string,
  description: string,
  titleIncluders: string[] | undefined,
  descriptionIncluders: string[] | undefined,
): boolean {
  const titleHay = title.toLowerCase();
  const descHay = `${title} ${description}`.toLowerCase();
  const titles = (titleIncluders ?? [])
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  const descs = (descriptionIncluders ?? [])
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  if (titles.length > 0 && !titles.some((term) => titleHay.includes(term))) {
    return false;
  }
  if (descs.length > 0 && !descs.some((term) => descHay.includes(term))) {
    return false;
  }
  return true;
}

function hasGroupOverlap(item: FeedItem, searchGroupIds: string[]): boolean {
  if (searchGroupIds.length === 0) return false;
  const feedGroups = resolveFeedSearchGroupIds(item);
  return searchGroupIds.some((id) => feedGroups.has(String(id)));
}

/** Mirror backend UserFilterMatcher for mock retag. */
export function itemMatchesUserFilter(
  item: FeedItem,
  filter: UserFilter,
): boolean {
  if (
    !matchesKeywords(
      item.title ?? "",
      item.description ?? "",
      filter.titleIncluders,
      filter.descriptionIncluders,
    )
  ) {
    return false;
  }

  if (filter.filterType === "Vehicle") {
    if (!isCarOriginFeed(item)) return false;
    const q = filter.vehicleQuery;
    if (!priceInRange(item.price, q?.minPrice, q?.maxPrice)) return false;
    const year = item.vehicleSpecifications?.vehicleYear;
    if (q?.minYear != null && year != null && year < q.minYear) return false;
    if (q?.maxYear != null && year != null && year > q.maxYear) return false;
    const mileage = item.vehicleSpecifications?.vehicleMileage;
    if (q?.minMileage != null && mileage != null && mileage < q.minMileage) {
      return false;
    }
    if (q?.maxMileage != null && mileage != null && mileage > q.maxMileage) {
      return false;
    }
    return true;
  }

  if (!hasGroupOverlap(item, filter.searchGroupIds ?? [])) return false;
  const q = filter.customQuery;
  return priceInRange(item.price, q?.minPrice, q?.maxPrice);
}

function clearFilterLinks(filterId: string): void {
  for (const item of MOCK_FEED_ITEMS) {
    if (!item.filterIds?.includes(filterId) && !item.filters?.some((f) => f.id === filterId)) {
      continue;
    }
    item.filterIds = (item.filterIds ?? []).filter((id) => id !== filterId);
    item.filters = (item.filters ?? []).filter((f) => f.id !== filterId);
    if (item.filterIds.length === 0) item.filterIds = undefined;
    if (item.filters.length === 0) item.filters = undefined;
  }
}

/**
 * Mock counterpart of backend UserFilterRetagService:
 * clear existing links for this filter, then tag matching local feed rows.
 */
export function retagMockFeedsForFilter(filter: UserFilter): void {
  if (!USE_MOCK) return;
  clearFilterLinks(filter.id);
  if (!filter.isActive) return;

  for (const item of MOCK_FEED_ITEMS) {
    if (!itemMatchesUserFilter(item, filter)) continue;
    const filterIds = [...(item.filterIds ?? [])];
    if (!filterIds.includes(filter.id)) filterIds.push(filter.id);
    item.filterIds = filterIds;
    const summaries = [...(item.filters ?? [])].filter((f) => f.id !== filter.id);
    summaries.push({
      id: filter.id,
      name: filter.name,
      color: filter.color,
      updatedAt: filter.updatedAt,
    });
    item.filters = summaries;
  }
}

/** Remove a deleted filter's links from local feed fixtures. */
export function clearMockFilterLinks(filterId: string): void {
  if (!USE_MOCK) return;
  clearFilterLinks(filterId);
}
