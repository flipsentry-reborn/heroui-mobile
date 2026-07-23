/**
 * Map heroui feed category tabs → live Feed.list / SoldListings query params.
 */

import type { GetFeedParams } from "@/mocks/services/feed";

export function buildLiveFeedParams(
  params: GetFeedParams,
  pageNumber = 1,
  pageSize = 40,
): URLSearchParams {
  const qs = new URLSearchParams();
  // Prefer explicit pageSize; limit is only a shelf/preview hint from callers.
  const size = params.pageSize ?? pageSize;
  const page = params.pageNumber ?? pageNumber;
  qs.append("pageNumber", String(page));
  qs.append("pageSize", String(size));

  const category = params.category ?? "all";
  const query = (params.query ?? "").trim();
  if (query) qs.append("search", query);

  if (category === "saved") {
    qs.append("isFavorite", "true");
  } else if (category === "best-picks") {
    qs.append("isBestPicks", "true");
    qs.append("bestPicksMaxHours", "72");
  } else if (category === "sold") {
    // Sold uses SoldListings endpoint separately
  } else if (params.groupIds != null && params.groupIds.length > 0) {
    for (const id of params.groupIds) {
      qs.append("groupIds", id);
    }
  } else if (
    category !== "all" &&
    category !== "for-you" &&
    category !== "price-drop" &&
    !category.startsWith("type:") &&
    !category.startsWith("custom:")
  ) {
    // Legacy / user search group id
    qs.append("groupIds", category.replace(/^group-/, ""));
  }

  // Default clean bucket for main feed
  if (category !== "saved" && category !== "sold") {
    qs.append("contentBucket", "Clean");
  }

  return qs;
}

export function buildLiveSoldParams(
  params: GetFeedParams,
  pageNumber = 1,
  pageSize = 40,
): URLSearchParams {
  const qs = new URLSearchParams();
  const size = params.pageSize ?? pageSize;
  const page = params.pageNumber ?? pageNumber;
  qs.append("pageNumber", String(page));
  qs.append("pageSize", String(size));
  const query = (params.query ?? "").trim();
  if (query) qs.append("search", query);
  if (params.maxDays != null) {
    qs.append("maxDays", String(params.maxDays));
  }
  if (params.soldStatus && params.soldStatus !== "all") {
    qs.append("soldStatus", params.soldStatus);
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
  // Server already scoped by groupIds for typed/custom tabs.
  if (groupIds != null && groupIds.length > 0) {
    return items;
  }

  if (
    category === "for-you" ||
    category === "all" ||
    category === "saved" ||
    category === "best-picks" ||
    category === "sold"
  ) {
    return items;
  }
  if (category === "price-drop") {
    return items.filter((i) => (displayValuation(i)?.profit ?? 0) > 0);
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
