import type { FeedItem } from "@/models/feed";
import { isCarListing } from "@/models/feed";
import type { FeedCategoryKey } from "@/mocks/data/feed";
import { MOCK_FEED_ITEMS } from "@/mocks/data/feed";
import { getLocalCompsForFeed } from "@/mocks/data/local-comps";

export type GetLocalCompsParams = {
  sameYear?: boolean;
  days?: number;
};

export type GetFeedParams = {
  category?: FeedCategoryKey;
  query?: string;
  limit?: number;
};

function delay(ms = 450): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function matchesCategory(item: FeedItem, category: FeedCategoryKey): boolean {
  if (category === "for-you" || category === "all") return true;
  if (category === "saved") return item.isFavorite;
  if (category === "best-picks") {
    return (item.valuation?.buySignal ?? 0) >= 60;
  }
  if (category === "price-drop") {
    // Mock: listings with positive estimated profit count as price drops
    return (item.valuation?.profit ?? 0) > 0;
  }
  if (category === "car") {
    return item.valuation?.valuationType === "car" || !!item.vehicleSpecifications;
  }
  if (category === "iphone") {
    return (
      item.valuation?.valuationType === "iphone" || item.iphoneStorageGb != null
    );
  }
  return true;
}

export async function getFeed(params: GetFeedParams = {}): Promise<FeedItem[]> {
  await delay();
  const category = params.category ?? "all";
  const query = (params.query ?? "").trim().toLowerCase();

  const items = MOCK_FEED_ITEMS.filter((item) => {
    if (!matchesCategory(item, category)) return false;
    if (!query) return true;
    return (
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.locationText.toLowerCase().includes(query)
    );
  }).map((item) => ({ ...item }));

  if (params.limit != null && params.limit > 0) {
    return items.slice(0, params.limit);
  }
  return items;
}

export async function getFeedById(id: string): Promise<FeedItem | null> {
  await delay(200);
  const item = MOCK_FEED_ITEMS.find((f) => f.id === id);
  return item ? { ...item, images: { ...item.images, marketplaceImages: [...item.images.marketplaceImages] } } : null;
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
    source.vehicleSpecifications?.vehicleYear ?? source.valuation?.year ?? null;
  const cutoffMs = Date.now() - days * 24 * 60 * 60 * 1000;

  return getLocalCompsForFeed(feedId).filter((comp) => {
    const year =
      comp.vehicleSpecifications?.vehicleYear ?? comp.valuation?.year ?? null;
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
