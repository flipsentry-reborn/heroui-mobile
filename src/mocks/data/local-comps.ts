import type { FeedItem } from "@/models/feed";
import { isCarListing } from "@/models/feed";
import { MOCK_FEED_ITEMS } from "@/mocks/data/feed";

const CAR_ITEMS = MOCK_FEED_ITEMS.filter(isCarListing);

/** Other car listings for a feed id (excludes the listing itself). */
export function getLocalCompsForFeed(feedId: string): FeedItem[] {
  return CAR_ITEMS.filter((item) => item.id !== feedId).map((item) => ({
    ...item,
    images: {
      ...item.images,
      marketplaceImages: [...item.images.marketplaceImages],
    },
  }));
}
