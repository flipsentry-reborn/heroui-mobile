import { Image } from "react-native";

import type { FeedPlatform } from "@/models/feed";

const facebookDelayIllustration = require("../../../assets/images/7_minute.png");
const offerUpDelayIllustration = require("../../../assets/images/30_minute.png");

function assetAspectRatio(
  asset: Parameters<typeof Image.resolveAssetSource>[0],
): number {
  const source = Image.resolveAssetSource(asset);
  return source.width > 0 && source.height > 0
    ? source.width / source.height
    : 1.5;
}

/** Plain text or a dimmed quoted callout inside the delay body. */
export type DelayBodyPart =
  | { type: "text"; value: string }
  | { type: "quote"; value: string };

export interface PlatformDelayInfo {
  label: string;
  title: string;
  body: DelayBodyPart[];
  illustration: number;
  aspectRatio: number;
}

/**
 * Explainer for marketplace listing lag shown next to "Found in".
 * Facebook ~7m, OfferUp ~30m — matches backend GetPlatformListingDelay UX copy.
 */
export function getPlatformDelayInfo(
  platform: FeedPlatform,
): PlatformDelayInfo | null {
  if (platform === "facebookMarketplace") {
    return {
      label: "(7 min delay)",
      title: "Why this delay exists",
      body: [
        {
          type: "text",
          value:
            "Facebook Marketplace usually surfaces a new listing about ",
        },
        { type: "quote", value: "7 minutes" },
        {
          type: "text",
          value: " after the seller posts it. The ",
        },
        { type: "quote", value: "finding time" },
        {
          type: "text",
          value:
            " on this screen already subtracts that delay so the timing stays realistic.",
        },
      ],
      illustration: facebookDelayIllustration,
      aspectRatio: assetAspectRatio(facebookDelayIllustration),
    };
  }

  if (platform === "offerUp") {
    return {
      label: "(30 min delay)",
      title: "Why this delay exists",
      body: [
        {
          type: "text",
          value: "OfferUp usually surfaces a new listing about ",
        },
        { type: "quote", value: "30 minutes" },
        {
          type: "text",
          value: " after the seller posts it. The ",
        },
        { type: "quote", value: "finding time" },
        {
          type: "text",
          value:
            " on this screen already subtracts that delay so the timing stays realistic.",
        },
      ],
      illustration: offerUpDelayIllustration,
      aspectRatio: assetAspectRatio(offerUpDelayIllustration),
    };
  }

  return null;
}
