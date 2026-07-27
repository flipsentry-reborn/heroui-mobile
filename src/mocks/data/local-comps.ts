import type { FeedItem } from "@/models/feed";
import { isCarListing, resolveDisplayValuation } from "@/models/feed";
import { MOCK_FEED_ITEMS } from "@/mocks/data/feed";

const CAR_ITEMS = MOCK_FEED_ITEMS.filter(isCarListing);

function vehicleKey(item: FeedItem): { make: string; model: string } | null {
  const valuation = resolveDisplayValuation(item);
  const make = valuation?.make?.trim().toLowerCase();
  const model = valuation?.model?.trim().toLowerCase();
  if (!make || !model) return null;
  return { make, model };
}

/** Other car feed items with the same make/model as the seed listing. */
export function getLocalCompsForFeed(feedId: string): FeedItem[] {
  const source = CAR_ITEMS.find((item) => item.id === feedId);
  if (!source) return [];

  const key = vehicleKey(source);
  if (!key) return [];

  return CAR_ITEMS.filter((item) => {
    if (item.id === feedId) return false;
    const other = vehicleKey(item);
    return other?.make === key.make && other?.model === key.model;
  }).map((item) => ({
    ...item,
    images: {
      ...item.images,
      marketplaceImages: [...item.images.marketplaceImages],
    },
  }));
}
