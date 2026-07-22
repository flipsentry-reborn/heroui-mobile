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
  qs.append("pageNumber", String(pageNumber));
  qs.append("pageSize", String(pageSize));

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
  } else if (
    category !== "all" &&
    category !== "for-you" &&
    category !== "price-drop" &&
    category !== "car" &&
    category !== "iphone" &&
    category !== "couch" &&
    category !== "xbox"
  ) {
    // User search group id
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
  qs.append("pageNumber", String(pageNumber));
  qs.append("pageSize", String(pageSize));
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

/** Client-side filters for categories the API does not express 1:1. */
export function applyClientCategoryFilter<T extends {
  valuation?: { buySignal?: number; profit?: number; valuationType?: string } | null;
  vehicleSpecifications?: unknown;
  iphoneStorageGb?: number | null;
  searchSettingIds?: string[];
  isSold?: boolean;
  isPending?: boolean;
}>(items: T[], category: string): T[] {
  if (category === "for-you" || category === "all" || category === "saved" || category === "best-picks" || category === "sold") {
    return items;
  }
  if (category === "price-drop") {
    return items.filter((i) => (i.valuation?.profit ?? 0) > 0);
  }
  if (category === "car") {
    return items.filter(
      (i) =>
        i.valuation?.valuationType === "car" || !!i.vehicleSpecifications,
    );
  }
  if (category === "iphone") {
    return items.filter(
      (i) =>
        i.valuation?.valuationType === "iphone" || i.iphoneStorageGb != null,
    );
  }
  if (category === "couch") {
    return items.filter((i) =>
      (i.searchSettingIds ?? []).some((id) => id.includes("couch")),
    );
  }
  if (category === "xbox") {
    return items.filter((i) =>
      (i.searchSettingIds ?? []).some((id) => id.includes("xbox")),
    );
  }
  return items;
}
