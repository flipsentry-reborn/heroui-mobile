import type { HomePlatform } from "@/mocks/data/home";

export const SEARCH_PLATFORMS: { id: HomePlatform; label: string }[] = [
  { id: "facebook", label: "Facebook" },
  { id: "offerUp", label: "OfferUp" },
  { id: "craigslist", label: "Craigslist" },
  { id: "kijiji", label: "Kijiji" },
];

export const DEFAULT_SEARCH_PLATFORMS: HomePlatform[] = ["facebook"];

export function formatPlatformsLabel(platforms: HomePlatform[]): string {
  if (platforms.length === 0) return "None";
  return String(platforms.length);
}
