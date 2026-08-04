/**
 * Map heroui feed category tabs → live Feed.list query params.
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
    if (params.bestPicksSortBy && params.bestPicksSortBy !== "buysignal") {
      qs.append("bestPicksSortBy", params.bestPicksSortBy);
    }
    if (params.bestPicksSortDir && params.bestPicksSortDir !== "desc") {
      qs.append("bestPicksSortDir", params.bestPicksSortDir);
    }
    if (params.bestPicksMaxHours != null && params.bestPicksMaxHours > 0) {
      qs.append("bestPicksMaxHours", String(params.bestPicksMaxHours));
    }
  } else if (category === "sold") {
    appendSoldParams(qs, params);
  }

  // Saved never scopes by filterIds. Other categories may combine category
  // flags with filterIds and/or groupIds (selected filters + your searches).
  if (category !== "saved") {
    const filterIds =
      params.filterIds != null && params.filterIds.length > 0
        ? params.filterIds
        : category.startsWith("filter:")
          ? [category.slice("filter:".length)]
          : [];
    for (const id of filterIds) {
      if (id) qs.append("filterIds", id);
    }

    const groupIds =
      params.groupIds != null && params.groupIds.length > 0
        ? params.groupIds
        : category !== "all" &&
            category !== "for-you" &&
            category !== "price-drop" &&
            category !== "best-picks" &&
            category !== "sold" &&
            !category.startsWith("filter:") &&
            !category.startsWith("type:") &&
            !category.startsWith("custom:")
          ? [category.replace(/^group-/, "")]
          : [];
    for (const id of groupIds) {
      if (id) qs.append("groupIds", id);
    }
  }

  // Default clean bucket for main feed
  if (category !== "saved" && category !== "sold") {
    qs.append("contentBucket", "Clean");
  }

  // Best Picks uses its own score floor — ignore deal display prefs.
  if (category !== "best-picks") {
    // 100 = all scores (no server buy-signal filter).
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

function appendSoldParams(qs: URLSearchParams, params: GetFeedParams) {
  const status = params.soldStatus ?? "all";
  if (status === "sold") {
    qs.append("isSold", "true");
  } else if (status === "pending") {
    qs.append("isPending", "true");
  } else {
    qs.append("isSold", "true");
    qs.append("isPending", "true");
  }
  if (params.maxDays != null) {
    qs.append("maxDays", String(params.maxDays));
  }
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
