/**
 * Map heroui feed category tabs → live Feed V2 query params (lane + cursor).
 */

import type { GetFeedParams } from "@/mocks/services/feed";

/** Backend V2 group/filter lanes require GUIDs (see FeedTimelineLanes.TryParse). */
const GUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function firstGuidId(ids: string[] | undefined): string | undefined {
  return ids?.find((id) => GUID_RE.test(id));
}

/** Derive V2 timeline lane from heroui category / group / filter ids. */
export function resolveFeedLane(params: GetFeedParams): string {
  const category = params.category ?? "all";

  if (category === "saved") return "saved";
  if (category === "best-picks") return "best";
  if (category === "price-drop") return "pricedrop";

  if (category === "sold") {
    const status = params.soldStatus ?? "all";
    if (status === "sold") return "sold";
    if (status === "pending") return "pending";
    return "soldpending";
  }

  const filterIds =
    params.filterIds != null && params.filterIds.length > 0
      ? params.filterIds
      : category.startsWith("filter:")
        ? [category.slice("filter:".length)]
        : [];
  const filterId = firstGuidId(filterIds);
  if (filterId) {
    return `filter:${filterId}`;
  }

  const groupIds =
    params.groupIds != null && params.groupIds.length > 0
      ? params.groupIds
      : category.startsWith("group:")
        ? [category.slice("group:".length)]
        : category.startsWith("group-")
          ? [category.slice("group-".length)]
          : GUID_RE.test(category)
            ? [category]
            : [];

  // Typed/custom tabs pass groupIds from the store; prefer first group lane.
  const groupId = firstGuidId(groupIds);
  if (groupId) {
    return `group:${groupId}`;
  }

  if (category.startsWith("type:") || category.startsWith("custom:")) {
    // Store should supply groupIds; fall back to all if missing.
    return "all";
  }

  return "all";
}

/** Decode agent-synthesized V1 search cursor (`v1:{pageNumber}`). */
function v1SearchPageFromCursor(cursor?: string | null): number | null {
  if (!cursor?.startsWith("v1:")) return null;
  const n = Number.parseInt(cursor.slice(3), 10);
  return Number.isFinite(n) && n >= 1 ? n : null;
}

/** Legacy V1 params for free-text search only (still pageNumber-based on the wire). */
export function buildLiveFeedV1SearchParams(
  params: GetFeedParams,
  pageNumber = 1,
  pageSize = 40,
): URLSearchParams {
  const qs = new URLSearchParams();
  const size = params.pageSize ?? pageSize;
  const page =
    v1SearchPageFromCursor(params.cursor) ?? params.pageNumber ?? pageNumber;
  qs.append("pageNumber", String(page));
  qs.append("pageSize", String(size));
  const query = (params.query ?? "").trim();
  if (query) qs.append("search", query);
  return qs;
}

/** Live Feed V2 — cursor + pageSize only (no pageNumber). */
export function buildLiveFeedParams(
  params: GetFeedParams,
  pageSize = 40,
): URLSearchParams {
  const qs = new URLSearchParams();
  const size = params.pageSize ?? pageSize;
  qs.append("pageSize", String(size));
  qs.append("lane", resolveFeedLane(params));
  if (params.cursor) qs.append("cursor", params.cursor);

  const category = params.category ?? "all";

  if (category === "best-picks") {
    if (params.bestPicksSortBy && params.bestPicksSortBy !== "buysignal") {
      qs.append("bestPicksSortBy", params.bestPicksSortBy);
    }
    if (params.bestPicksSortDir && params.bestPicksSortDir !== "desc") {
      qs.append("bestPicksSortDir", params.bestPicksSortDir);
    }
    if (params.bestPicksMaxHours != null && params.bestPicksMaxHours > 0) {
      qs.append("bestPicksMaxHours", String(params.bestPicksMaxHours));
    }
  } else if (category === "sold" && params.maxDays != null) {
    qs.append("maxDays", String(params.maxDays));
  }

  // Best Picks / Price Dropped use their own floors — ignore deal display prefs.
  if (category !== "best-picks" && category !== "price-drop") {
    if (
      params.minBuySignal != null &&
      params.minBuySignal > 0 &&
      params.minBuySignal < 100
    ) {
      qs.append("minBuySignal", String(params.minBuySignal));
    }
    if (params.minProfit != null && params.minProfit > 0) {
      qs.append("minProfit", String(params.minProfit));
    }
  }

  return qs;
}

type FeedValuationSlice = {
  buySignal?: number;
  profit?: number;
  fairPrice?: number;
  valuationType?: string;
} | null | undefined;

function displayValuation<T extends {
  compValuation?: FeedValuationSlice;
  externalValuation?: FeedValuationSlice;
}>(item: T): FeedValuationSlice {
  if (item.externalValuation?.buySignal != null || item.externalValuation?.fairPrice != null) {
    return item.externalValuation;
  }
  if (item.compValuation?.buySignal != null || item.compValuation?.fairPrice != null) {
    return item.compValuation;
  }
  return item.externalValuation ?? item.compValuation ?? null;
}

/** Client-side filters for categories the API does not express 1:1. */
export function applyClientCategoryFilter<T extends {
  compValuation?: FeedValuationSlice;
  externalValuation?: FeedValuationSlice;
  vehicleSpecifications?: unknown;
  iphoneStorageGb?: number | null;
  searchSettingIds?: string[];
  isSold?: boolean;
  isPending?: boolean;
}>(items: T[], category: string, groupIds?: string[]): T[] {
  // Server already scoped by group lane for typed/custom tabs.
  if (groupIds != null && groupIds.length > 0) {
    return items;
  }

  if (
    category === "for-you" ||
    category === "all" ||
    category === "saved" ||
    category === "best-picks" ||
    category === "sold" ||
    category === "price-drop"
  ) {
    return items;
  }
  if (category === "car" || category === "type:car") {
    return items.filter(
      (i) =>
        displayValuation(i)?.valuationType === "car" || !!i.vehicleSpecifications,
    );
  }
  if (category === "iphone" || category === "type:iphone") {
    return items.filter(
      (i) =>
        displayValuation(i)?.valuationType === "iphone" || i.iphoneStorageGb != null,
    );
  }
  if (category === "type:samsung") {
    return items.filter((i) => displayValuation(i)?.valuationType === "samsung");
  }
  if (category === "couch" || category === "custom:couch") {
    return items.filter((i) =>
      (i.searchSettingIds ?? []).some((id) => id.includes("couch")),
    );
  }
  if (category === "xbox" || category === "custom:xbox") {
    return items.filter((i) =>
      (i.searchSettingIds ?? []).some((id) => id.includes("xbox")),
    );
  }
  return items;
}
