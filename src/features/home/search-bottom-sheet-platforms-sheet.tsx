import type { HomePlatform } from "@/mocks/data/home";
import { DEFAULT_US_LOCATION_PLATFORMS } from "@/lib/location-platforms";

export const SEARCH_PLATFORMS: { id: HomePlatform; label: string }[] = [
  { id: "facebook", label: "Facebook" },
  { id: "offerUp", label: "OfferUp" },
  { id: "craigslist", label: "Craigslist" },
  { id: "kijiji", label: "Kijiji" },
];

export const DEFAULT_SEARCH_PLATFORMS: HomePlatform[] = [
  ...DEFAULT_US_LOCATION_PLATFORMS,
];

export function formatPlatformsLabel(platforms: HomePlatform[]): string {
  if (platforms.length === 0) return "None";
  return String(platforms.length);
}
