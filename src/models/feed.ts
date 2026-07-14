// Feed models — adapted from mobile-app/models/feed.ts (UI mock shapes)

export type FeedPlatform = "facebookMarketplace" | "offerUp" | "craigslist" | "kijiji";

export interface KeywordMatch {
  keyword: string;
  start: number;
  end: number;
  color: string;
}

export interface KeywordTags {
  title: KeywordMatch[];
  description: KeywordMatch[];
}

export interface MarketplaceImage {
  imageUrl: string;
  expiresAt: string | null;
}

export interface FeedImage {
  mainImageUrl: MarketplaceImage;
  marketplaceImages: MarketplaceImage[];
  imageUrlHostedByUs: string;
}

export interface VehicleSpecifications {
  vehicleYear?: number;
  vehicleMileage?: number;
  vehicleTransmission?: string;
}

export interface FeedSellerInfo {
  sellerId: string;
  name: string;
  avatarUrl: string;
  isAutosDealer: boolean;
  isBusinessAccount: boolean;
  ratingAverage?: number;
  ratingCount?: number;
}

export interface ListingValuation {
  calculated: boolean;
  valuationType?: "car" | "iphone";
  platform: string;
  listingId: string;
  make: string;
  model: string;
  trim: string | null;
  year: number;
  mileage: number;
  price: number;
  fairPrice: number;
  profit: number;
  buySignal: number;
  compCount: number;
  percentileRank: number;
  medianCvs: number;
  targetCvs: number;
  mileageLow: number;
  mileageHigh: number;
  warnings: string[];
  calculatedAt: string;
  iphoneModel?: string;
  storageGb?: number;
  batteryHealth?: number;
}

export interface FeedItem {
  id: string;
  platform: FeedPlatform;
  listingId: string;
  creationTime: string;
  appUserId: string;
  title: string;
  description: string;
  price: number;
  location: {
    latitude: number;
    longitude: number;
  };
  locationText: string;
  distanceMiles?: number;
  images: FeedImage;
  searchSettingIds: string[];
  keywordTags: KeywordTags;
  createdAt: string;
  seenAt: string[];
  isFavorite: boolean;
  favoritedAt: string | null;
  isSpamReported: boolean;
  spamReportedAt: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
  isSniped: boolean;
  condition: string;
  vehicleSpecifications?: VehicleSpecifications;
  currency: string;
  currencySymbol: string;
  scamKeywords?: KeywordMatch[];
  dealerKeywords?: KeywordMatch[];
  phoneKeywords?: KeywordMatch[];
  damagedKeywords?: KeywordMatch[];
  majorDamagedKeywords?: KeywordMatch[];
  salvageTitleKeywords?: KeywordMatch[];
  rebuiltTitleKeywords?: KeywordMatch[];
  negociableKeywords?: KeywordMatch[];
  urgentKeywords?: KeywordMatch[];
  motivatedKeywords?: KeywordMatch[];
  scamKeywordTexts?: string[];
  dealerKeywordTexts?: string[];
  phoneKeywordTexts?: string[];
  damagedKeywordTexts?: string[];
  majorDamagedKeywordTexts?: string[];
  salvageTitleKeywordTexts?: string[];
  rebuiltTitleKeywordTexts?: string[];
  negociableKeywordTexts?: string[];
  urgentKeywordTexts?: string[];
  motivatedKeywordTexts?: string[];
  dealershipReasonKeywords?: string[];
  isAdvertised?: boolean;
  advertisedCount?: number;
  isDealership?: boolean;
  dealershipName?: string;
  isDamaged?: boolean;
  isMajorDamaged?: boolean;
  isSalvageTitle?: boolean;
  isRebuiltTitle?: boolean;
  isNegociable?: boolean;
  isUrgent?: boolean;
  isMotivated?: boolean;
  seller?: FeedSellerInfo;
  isSellerBlocked?: boolean;
  listingUrl?: string;
  reviewScore?: number;
  reviewCount?: number;
  valuation?: ListingValuation;
  isSold?: boolean;
  isSoldAt?: string;
  isPending?: boolean;
  isPendingAt?: string;
  iphoneBatteryHealth?: number;
  iphoneStorageGb?: number;
}

export type ValuationTier = "greatDeal" | "goodValue" | "fairPrice" | "overpriced";

export function getValuationTier(buySignal: number): ValuationTier {
  if (buySignal >= 75) return "greatDeal";
  if (buySignal >= 50) return "goodValue";
  if (buySignal >= 25) return "fairPrice";
  return "overpriced";
}

type FeedStatusSource = Pick<
  FeedItem,
  | "isDealership"
  | "isDamaged"
  | "isMajorDamaged"
  | "isSalvageTitle"
  | "isRebuiltTitle"
  | "isNegociable"
  | "isUrgent"
  | "isMotivated"
  | "scamKeywords"
  | "scamKeywordTexts"
  | "damagedKeywords"
  | "damagedKeywordTexts"
  | "majorDamagedKeywords"
  | "majorDamagedKeywordTexts"
  | "salvageTitleKeywords"
  | "salvageTitleKeywordTexts"
  | "rebuiltTitleKeywords"
  | "rebuiltTitleKeywordTexts"
  | "negociableKeywords"
  | "negociableKeywordTexts"
  | "urgentKeywords"
  | "urgentKeywordTexts"
  | "motivatedKeywords"
  | "motivatedKeywordTexts"
>;

function keywordSignalCount(matches?: KeywordMatch[], texts?: string[]): number {
  return Math.max(matches?.length ?? 0, texts?.length ?? 0);
}

export function getOrderedStatusBadges(feed?: FeedStatusSource | null): string[] {
  if (!feed) return [];

  const spamCount = keywordSignalCount(feed.scamKeywords, feed.scamKeywordTexts);
  const hasMajorDamaged =
    (feed.isMajorDamaged ?? false) ||
    keywordSignalCount(feed.majorDamagedKeywords, feed.majorDamagedKeywordTexts) > 0;
  const hasSalvageTitle =
    (feed.isSalvageTitle ?? false) ||
    keywordSignalCount(feed.salvageTitleKeywords, feed.salvageTitleKeywordTexts) > 0;
  const hasRebuiltTitle =
    (feed.isRebuiltTitle ?? false) ||
    keywordSignalCount(feed.rebuiltTitleKeywords, feed.rebuiltTitleKeywordTexts) > 0;
  const hasUrgent =
    (feed.isUrgent ?? false) ||
    keywordSignalCount(feed.urgentKeywords, feed.urgentKeywordTexts) > 0;
  const hasMotivated =
    (feed.isMotivated ?? false) ||
    keywordSignalCount(feed.motivatedKeywords, feed.motivatedKeywordTexts) > 0;
  const hasNegociable =
    (feed.isNegociable ?? false) ||
    keywordSignalCount(feed.negociableKeywords, feed.negociableKeywordTexts) > 0;

  const badges: string[] = [];
  if (feed.isDealership) badges.push("Dealer");
  if (!feed.isDealership && spamCount > 0) badges.push("Spam");
  if (hasSalvageTitle && !hasRebuiltTitle) badges.push("Salvage");
  if (hasRebuiltTitle) badges.push("Rebuilt");
  if (!hasSalvageTitle && !hasRebuiltTitle && hasMajorDamaged) badges.push("Major Damage");
  if (hasNegociable) badges.push("Negotiable");
  if (hasUrgent) badges.push("ASAP");
  if (hasMotivated) badges.push("Committed");

  return badges;
}

export const PLATFORM_LABEL: Record<FeedPlatform, string> = {
  facebookMarketplace: "Facebook",
  offerUp: "OfferUp",
  craigslist: "Craigslist",
  kijiji: "Kijiji",
};
