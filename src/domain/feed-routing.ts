import {
  resolveDisplayValuation,
  type FeedFilterTab,
  type FeedItem,
} from "@/models/feed";

export const FEED_SHELF_LIMIT = 6;
export const BEST_PICKS_MIN_BUY_SIGNAL = 10;

function hasGroupOverlap(
  feedGroupIds: string[] | undefined,
  tabGroupIds: string[] | undefined,
): boolean {
  if (!feedGroupIds?.length || !tabGroupIds?.length) return false;
  const tabSet = new Set(tabGroupIds.map(String));
  return feedGroupIds.some((id) => tabSet.has(String(id)));
}

/**
 * Typed/custom tabs whose groupIds intersect the feed's searchGroupIds.
 * Falls back to searchSettingIds when searchGroupIds is missing.
 */
export function tabsForFeed(
  feed: FeedItem,
  feedTabs: FeedFilterTab[],
): string[] {
  const keys: string[] = [];
  for (const tab of feedTabs) {
    if (hasGroupOverlap(feed.searchGroupIds, tab.groupIds)) {
      keys.push(tab.key);
      continue;
    }
    // Fallback: setting id sometimes matches group id patterns in mocks.
    if (
      !feed.searchGroupIds?.length &&
      hasGroupOverlap(feed.searchSettingIds, tab.groupIds)
    ) {
      keys.push(tab.key);
    }
  }
  return keys;
}

/** Coarse Best Picks gate — not a full server replica. */
export function isBestPicksCandidate(feed: FeedItem): boolean {
  if (feed.isDealership || feed.isDamaged || feed.isMajorDamaged) return false;
  if ((feed.scamKeywordTexts?.length ?? 0) > 0) return false;
  if ((feed.scamKeywords?.length ?? 0) > 0) return false;
  if (feed.isSellerBlocked) return false;

  const valuation = resolveDisplayValuation(feed);
  if (!valuation?.calculated) return false;
  if ((valuation.buySignal ?? 0) < BEST_PICKS_MIN_BUY_SIGNAL) return false;
  return true;
}

export function buySignalOf(feed: FeedItem): number {
  return resolveDisplayValuation(feed)?.buySignal ?? 0;
}

export function isPriceDropCandidate(feed: FeedItem): boolean {
  return (resolveDisplayValuation(feed)?.profit ?? 0) > 0;
}

/** Buckets a live ReceiveFeed item should enter (never sold). */
export function bucketsForLiveFeed(
  feed: FeedItem,
  feedTabs: FeedFilterTab[],
): string[] {
  const buckets = new Set<string>(["all"]);

  for (const key of tabsForFeed(feed, feedTabs)) {
    buckets.add(key);
  }
  if (isPriceDropCandidate(feed)) {
    buckets.add("price-drop");
  }
  if (isBestPicksCandidate(feed)) {
    buckets.add("best-picks");
  }
  if (feed.isFavorite) {
    buckets.add("saved");
  }
  return [...buckets];
}

export function prependId(ids: string[], id: string, limit?: number): string[] {
  const next = [id, ...ids.filter((x) => x !== id)];
  return limit != null ? next.slice(0, limit) : next;
}

export function insertSortedByBuySignal(
  ids: string[],
  id: string,
  getSignal: (itemId: string) => number,
  limit?: number,
): string[] {
  const without = ids.filter((x) => x !== id);
  const signal = getSignal(id);
  let insertAt = without.findIndex((other) => getSignal(other) < signal);
  if (insertAt < 0) insertAt = without.length;
  const next = [
    ...without.slice(0, insertAt),
    id,
    ...without.slice(insertAt),
  ];
  return limit != null ? next.slice(0, limit) : next;
}

/** Keep live-newer head ids when replacing a page-1 HTTP result. */
export function mergeHttpPageWithLiveHead(
  httpIds: string[],
  existingIds: string[],
  isLiveHead: (id: string) => boolean,
): string[] {
  const httpSet = new Set(httpIds);
  const liveOnlyHead = existingIds.filter(
    (id) => isLiveHead(id) && !httpSet.has(id),
  );
  const merged = [...liveOnlyHead, ...httpIds.filter((id) => !liveOnlyHead.includes(id))];
  // Dedupe while preserving order
  const seen = new Set<string>();
  return merged.filter((id) => {
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}
