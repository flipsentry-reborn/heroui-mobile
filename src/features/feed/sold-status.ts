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
 * Time from listing creation → sold/pending/removed, matching legacy detail.
 * Facebook Marketplace subtracts a 7-minute platform delay.
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

  const delayMs = facebookDelayMs(item.platform);
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

function facebookDelayMs(platform: FeedPlatform): number {
  return platform === "facebookMarketplace" ? 7 * 60000 : 0;
}
