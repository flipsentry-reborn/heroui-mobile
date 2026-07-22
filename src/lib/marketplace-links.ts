/**
 * Centralized marketplace deep-link / URL helper.
 *
 * On real mobile devices (iOS, Android) we attempt app deep-links first and
 * fall back to web URLs. On macOS (Catalyst / iPad-on-Mac) and web we skip
 * deep-links entirely because the marketplace apps don't exist there.
 */

import { Linking, Platform } from "react-native";

import type { FeedPlatform } from "@/models/feed";

const isMac = (() => {
  try {
    const constants = (Platform as { constants?: { interfaceIdiom?: string } })
      .constants;
    if (constants?.interfaceIdiom === "mac") return true;
    if (Platform.OS === ("macos" as typeof Platform.OS)) return true;
  } catch {
    // Ignore — default to false.
  }
  return false;
})();

const isWeb = Platform.OS === "web";

/** True when the device is a real phone / tablet (not macOS / web). */
const canDeepLink = !isMac && !isWeb;

/**
 * Open a URL with an optional deep-link attempt. On desktop we skip the
 * deep-link and go straight to the web URL.
 */
function openWithFallback(deepLink: string | undefined, webUrl: string) {
  const primary = canDeepLink && deepLink ? deepLink : webUrl;
  const fallback = canDeepLink && deepLink ? webUrl : undefined;

  Linking.openURL(primary).catch(() => {
    if (fallback) {
      Linking.openURL(fallback).catch((err) =>
        console.error("[marketplace-links] fallback failed:", err),
      );
    }
  });
}

function normalizePlatform(platform: string): FeedPlatform {
  switch (platform.toLowerCase()) {
    case "offerup":
      return "offerUp";
    case "facebook":
    case "facebookmarketplace":
      return "facebookMarketplace";
    case "kijiji":
      return "kijiji";
    case "craigslist":
      return "craigslist";
    default:
      return "facebookMarketplace";
  }
}

/**
 * Get the plain web URL for a marketplace listing.
 */
export function getListingUrl(
  platform: FeedPlatform | string,
  listingId: string,
  listingUrl?: string | null,
): string {
  const normalized = normalizePlatform(platform);
  switch (normalized) {
    case "offerUp":
      return `https://offerup.com/item/detail/${listingId}`;
    case "craigslist":
      return listingUrl || "https://craigslist.org";
    case "kijiji":
      return listingUrl || "https://www.kijiji.ca";
    case "facebookMarketplace":
    default:
      return (
        listingUrl ||
        `https://www.facebook.com/marketplace/item/${listingId}`
      );
  }
}

/**
 * Open a marketplace listing in the platform's app (mobile) or website
 * (macOS / web).
 */
export function openListing(
  platform: FeedPlatform | string,
  listingId: string,
  listingUrl?: string | null,
) {
  const normalized = normalizePlatform(platform);
  switch (normalized) {
    case "offerUp": {
      const web = `https://offerup.com/item/detail/${listingId}`;
      const deep = `offerup://item/${listingId}`;
      openWithFallback(deep, web);
      break;
    }
    case "craigslist": {
      const web = listingUrl || "https://craigslist.org";
      openWithFallback(undefined, web);
      break;
    }
    case "kijiji": {
      const web = listingUrl || "https://www.kijiji.ca";
      openWithFallback(undefined, web);
      break;
    }
    case "facebookMarketplace":
    default: {
      const web = `https://www.facebook.com/marketplace/item/${listingId}`;
      const deep = `fb://www_link?url=${web}`;
      openWithFallback(deep, web);
      break;
    }
  }
}

/**
 * Open a seller's profile on the marketplace.
 */
export function openSellerProfile(
  platform: FeedPlatform | string,
  sellerId: string,
) {
  const normalized = normalizePlatform(platform);
  switch (normalized) {
    case "offerUp": {
      const web = `https://offerup.com/p/${sellerId}`;
      const deep = `offerup://profile/${sellerId}`;
      openWithFallback(deep, web);
      break;
    }
    case "kijiji": {
      const web = `https://www.kijiji.ca/o-profile/${sellerId}`;
      openWithFallback(undefined, web);
      break;
    }
    case "craigslist":
    case "facebookMarketplace":
    default:
      // No public seller profiles on these platforms.
      return;
  }
}

/**
 * Get the plain web URL for a seller profile.
 */
export function getSellerProfileUrl(
  platform: string,
  sellerId: string,
): string | null {
  switch (platform.toLowerCase()) {
    case "offerup":
      return `https://offerup.com/p/${sellerId}`;
    case "kijiji":
      return `https://www.kijiji.ca/o-profile/${sellerId}`;
    case "facebook":
    case "facebookmarketplace":
      return null;
    default:
      return null;
  }
}
