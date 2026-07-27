import type { FeedItem, FeedPlatform } from "@/models/feed";

/** Sold/pending accent — stronger red for feed cards & detail. */
export const SOLD_STATUS_COLOR = "#ef4444";
export const SOLD_STATUS_TEXT_CLASS = "text-sold-status";

type ListingStatusFields = Pick<
  FeedItem,
  | "isSold"
  | "isSoldAt"
  | "isPending"
  | "isPendingAt"
  | "isRemoved"
  | "isRemovedAt"
  | "creationTime"
  | "platform"
>;

/**
 * Mirrors backend `FeedHelpers.GetPlatformListingDelay`:
 * Facebook ~7m, OfferUp ~30m, else 0.
 * Use for wall-clock ages from `creationTime`.
 * For "Found in" duration, prefer API `foundInSeconds` (already delay-adjusted).
 */
export function getPlatformListingDelayMs(platform: FeedPlatform): number {
  switch (platform) {
    case "facebookMarketplace":
      return 7 * 60 * 1000;
    case "offerUp":
      return 30 * 60 * 1000;
    default:
      return 0;
  }
}

/** Card/detail label: removed → "Sold?", then Sold / Pending. */
export function getListingStatusLabel(
  item: Pick<FeedItem, "isSold" | "isPending" | "isRemoved">,
): "Sold?" | "Sold" | "Pending" | null {
  if (item.isRemoved) return "Sold?";
  if (item.isSold) return "Sold";
  if (item.isPending) return "Pending";
  return null;
}

/**
 * Time from listing creation → sold/pending/removed.
 * Subtracts platform listing lag (same as backend GetPlatformListingDelay).
 */
export function formatSoldPendingDuration(
  item: ListingStatusFields,
): string | null {
  if (!item.creationTime) return null;
  const statusAt = item.isRemoved
    ? item.isRemovedAt
    : item.isSold
      ? item.isSoldAt
      : item.isPending
        ? item.isPendingAt
        : undefined;
  if (!statusAt) return null;

  const delayMs = getPlatformListingDelayMs(item.platform);
  const mins = Math.floor(
    (new Date(statusAt).getTime() -
      new Date(item.creationTime).getTime() -
      delayMs) /
      60000,
  );
  if (mins < 1) return null;

  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h > 0 ? `${h}h ` : ""}${m}m`;
}

/** Prefix for detail titles: "Sold? in 7h 0m" / "Sold in 7h 0m" / "Pending in 25m". */
export function formatSoldPendingTitlePrefix(
  item: ListingStatusFields,
): string | null {
  const label = getListingStatusLabel(item);
  if (!label) return null;
  const duration = formatSoldPendingDuration(item);
  return duration ? `${label} in ${duration}` : label;
}

/**
 * Sold-page image badge: when the listing entered the user’s feed (`createdAt`).
 * Matches sold ordering (UnifiedFeed.CreatedAt). No platform lag — that only
 * applies to listing-post → found duration (`foundInSeconds` from API).
 * e.g. "Found 3 hours ago", "Found 1 day ago".
 */
export function formatFoundAgoBadge(
  item: Pick<FeedItem, "createdAt">,
): string | null {
  if (!item.createdAt) return null;
  const mins = Math.max(
    0,
    Math.floor((Date.now() - new Date(item.createdAt).getTime()) / 60000),
  );
  if (mins < 1) return "Found just now";
  if (mins < 60) return `Found ${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) {
    return hours === 1 ? "Found 1 hour ago" : `Found ${hours} hours ago`;
  }
  const days = Math.floor(hours / 24);
  return days === 1 ? "Found 1 day ago" : `Found ${days} days ago`;
}
