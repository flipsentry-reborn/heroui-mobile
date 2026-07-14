import type { FeedItem } from "@/models/feed";
import type { FeedCategoryKey } from "@/mocks/data/feed";
import { MOCK_FEED_ITEMS } from "@/mocks/data/feed";

export type GetFeedParams = {
  category?: FeedCategoryKey;
  query?: string;
};

function delay(ms = 450): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function matchesCategory(item: FeedItem, category: FeedCategoryKey): boolean {
  if (category === "all") return true;
  if (category === "saved") return item.isFavorite;
  if (category === "best-picks") {
    return (item.valuation?.buySignal ?? 0) >= 60;
  }
  if (category === "car") return item.valuation?.valuationType === "car" || !!item.vehicleSpecifications;
  if (category === "iphone") {
    return item.valuation?.valuationType === "iphone" || item.iphoneStorageGb != null;
  }
  if (category === "custom") {
    return !item.vehicleSpecifications && item.iphoneStorageGb == null && item.valuation?.valuationType !== "car";
  }
  return true;
}

export async function getFeed(params: GetFeedParams = {}): Promise<FeedItem[]> {
  await delay();
  const category = params.category ?? "all";
  const query = (params.query ?? "").trim().toLowerCase();

  return MOCK_FEED_ITEMS.filter((item) => {
    if (!matchesCategory(item, category)) return false;
    if (!query) return true;
    return (
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.locationText.toLowerCase().includes(query)
    );
  }).map((item) => ({ ...item }));
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
