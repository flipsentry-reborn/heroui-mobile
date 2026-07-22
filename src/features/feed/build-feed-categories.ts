import type { FeedFilterTab, FeedTabAvailability } from "@/models/feed";

export type FeedCategoryDef = {
  key: string;
  label: string;
  /** Show HeroUI Pro Badge on the tab (e.g. AI / Beta). */
  badge?: string;
  groupIds?: string[];
};

/** System tabs always present on mobile (For You is mobile-only). */
const BASE_LEADING: FeedCategoryDef[] = [
  { key: "for-you", label: "For You" },
  { key: "all", label: "All" },
];

const PRICE_DROP_TAB: FeedCategoryDef = {
  key: "price-drop",
  label: "Price",
  badge: "Beta",
};

const SAVED_TAB: FeedCategoryDef = { key: "saved", label: "Saved" };

/**
 * Build feed category tabs from `/api/feed/tab-availability`.
 * Order: For You → All → Best's? → Price → typed/custom tabs → Sold? → Saved
 */
export function buildFeedCategories(
  availability: FeedTabAvailability | null | undefined,
): FeedCategoryDef[] {
  const categories: FeedCategoryDef[] = [...BASE_LEADING];

  if (availability?.showFeatured) {
    categories.push({ key: "best-picks", label: "Best's", badge: "AI" });
  }

  categories.push(PRICE_DROP_TAB);

  for (const tab of availability?.tabs ?? []) {
    categories.push({
      key: tab.key,
      label: tab.label,
      groupIds: tab.groupIds,
    });
  }

  if (availability?.showSold) {
    categories.push({ key: "sold", label: "Sold" });
  }

  categories.push(SAVED_TAB);
  return categories;
}

/** Your Searches accordion children = server filter tabs only. */
export function buildYourSearchChildren(
  tabs: FeedFilterTab[] | null | undefined,
): FeedCategoryDef[] {
  return (tabs ?? []).map((tab) => ({
    key: tab.key,
    label: tab.label,
    groupIds: tab.groupIds,
  }));
}

export function buildForYouShelves(availability: FeedTabAvailability | null | undefined): {
  key: string;
  label: string;
  badge?: string;
  isAccordion?: boolean;
  featured?: boolean;
}[] {
  const shelves: {
    key: string;
    label: string;
    badge?: string;
    isAccordion?: boolean;
    featured?: boolean;
  }[] = [{ key: "all", label: "All" }];

  if (availability?.showFeatured) {
    shelves.push({
      key: "best-picks",
      label: "Best Picks",
      badge: "AI",
      featured: true,
    });
  }

  shelves.push({ key: "price-drop", label: "Price Dropped", badge: "Beta" });

  if ((availability?.tabs?.length ?? 0) > 0) {
    shelves.push({
      key: "your-searches",
      label: "Your Searches",
      isAccordion: true,
    });
  }

  if (availability?.showSold) {
    shelves.push({ key: "sold", label: "Sold" });
  }

  shelves.push({ key: "saved", label: "Saved" });
  return shelves;
}
