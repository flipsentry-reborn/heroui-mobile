// Feed models — aligned with backend FeedDto / ListingValuationDto

export type FeedPlatform =
  | "facebookMarketplace"
  | "offerUp"
  | "craigslist"
  | "kijiji";

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
  /** Kept for older clients; live API always null after Cloudflare removal. */
  imageUrlHostedByUs?: string | null;
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

export interface ExternalMarketplacePrice {
  min?: number | null;
  median?: number | null;
  max?: number | null;
  /** Country-adjusted fair baked at evaluation (US includes random 5–7% discount) */
  fair?: number | null;
}

/** Legacy fallback only — new payloads always include baked `fair` from the API. */
const US_DISCOUNT_FALLBACK = 0.06;

/** Prefers baked `fair`; does not re-roll the US random discount on the client. */
export function resolveExternalFairPrice(
  countryCode: string | null | undefined,
  marketplace?: ExternalMarketplacePrice | null,
): number | null {
  if (!marketplace) return null;
  if (marketplace.fair != null) return marketplace.fair;

  const { min, median, max } = marketplace;
  const code = (countryCode ?? "").toUpperCase();

  if (code === "US") {
    const base = min ?? median ?? max;
    return base == null ? null : Math.round(base * (1 - US_DISCOUNT_FALLBACK) * 100) / 100;
  }
  if (code === "CA") {
    const base = max ?? median ?? min;
    // Legacy fallback only — new payloads use baked `fair` (max + 3–7% markup).
    return base == null ? null : Math.round(base * 1.05 * 100) / 100;
  }
  return median ?? min ?? max ?? null;
}

export interface ExternalVehicleOption {
  make?: string | null;
  model?: string | null;
  trim?: string | null;
  modelId?: string | null;
  vehicleId?: string | null;
  matchScore?: number | null;
  isSelected?: boolean;
  hasPricing?: boolean;
  marketplace?: ExternalMarketplacePrice | null;
}

/** @deprecated Prefer ExternalVehicleOption — kept for mock trim fixtures. */
export type VehicleTrimEstimate = ExternalVehicleOption;

/** @deprecated Prefer ExternalMarketplacePrice. */
export type MarketplacePrice = ExternalMarketplacePrice;

export interface ExternalValuationNote {
  /** year_from_listing_text | listing_mileage_implausible | mileage_from_listing_text | … */
  type: string;
  /** info | warning */
  severity: string;
  message: string;
}

export interface ExternalValuationAnalysis {
  yearSource?: string | null;
  yearUsed?: number;
  mileageSource?: string | null;
  mileageUsed?: number;
  parsedMileageValue?: number | null;
  parsedMileageUnit?: string | null;
  zipcodeUsed?: string | null;
  zipcodeSource?: string | null;
  notes?: ExternalValuationNote[] | null;
}

export interface ListingValuation {
  calculated: boolean;
  valuationType?: "car" | "iphone" | "samsung";
  /** "comps" | "external" — which backend source produced this DTO */
  valuationSource?: "comps" | "external" | string | null;
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
  countryCode?: string | null;
  /** Other trim/option prices from external (book) valuation */
  vehicleOptions?: ExternalVehicleOption[] | null;
  /** Provenance + user-facing notes from vehicle estimation */
  analysis?: ExternalValuationAnalysis | null;
  iphoneModel?: string;
  samsungModel?: string;
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
  /** Search groups this feed matched (SignalR routing). */
  searchGroupIds?: string[];
  keywordTags: KeywordTags;
  createdAt: string;
  /** Seconds from listing to found (minus platform lag); from backend. */
  foundInSeconds?: number;
  seenAt: string[];
  viewedAt?: string[];
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
  /** Null/undefined for legacy rows; set true/false on new ingest. */
  isCarListing?: boolean | null;
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
  /** Server-computed status badges (Dealer, Spam, Salvage, etc.) */
  statusBadges?: string[];
  /** Built-in comps valuation (null when weak/missing) */
  compValuation?: ListingValuation | null;
  /** External book valuation (null when not completed) */
  externalValuation?: ListingValuation | null;
  isSold?: boolean;
  isSoldAt?: string;
  isPending?: boolean;
  isPendingAt?: string;
  isRemoved?: boolean;
  isRemovedAt?: string;
  iphoneBatteryHealth?: number;
  iphoneStorageGb?: number;

  /** Client-only: arrived via SignalR in this session. */
  isNew?: boolean;
  receivedAt?: number;
}

export interface FeedImageUpdateData {
  feedId: string;
  marketplaceListingId?: string;
  images: FeedImage;
}

/** Late comps/external patch via SignalR `ReceiveFeedValuationUpdate`. */
export interface FeedValuationUpdateData {
  feedId: string;
  compValuation?: ListingValuation | null;
  externalValuation?: ListingValuation | null;
}

export type FeedValuationsSource = {
  compValuation?: ListingValuation | null;
  externalValuation?: ListingValuation | null;
};

/**
 * Display winner matching backend ValuationDisplayHelper.Resolve:
 * completed external first, else comps.
 */
export function resolveDisplayValuation(
  source?: FeedValuationsSource | null,
): ListingValuation | null {
  if (!source) return null;
  if (source.externalValuation?.calculated) return source.externalValuation;
  if (source.compValuation?.calculated) return source.compValuation;
  // Tolerate payloads that omit `calculated` but still have fairPrice
  if (source.externalValuation?.fairPrice != null) return source.externalValuation;
  if (source.compValuation?.fairPrice != null) return source.compValuation;
  return null;
}

/** Mileage from description/title/year estimate — not the structured listing field. */
const UNCERTAIN_MILEAGE_SOURCES = new Set([
  "title",
  "description",
  "estimated_from_year",
]);

export type FeedMileageDisplay = {
  /** Miles used for display (backend stores miles). */
  miles: number;
  /** True when inferred (description/title/estimate) — UI should append "?". */
  uncertain: boolean;
  source?: string | null;
};

/**
 * Prefer listing mileage when trusted; otherwise show valuation-used mileage
 * with uncertain=true so the UI can append "?".
 */
export function resolveFeedMileageDisplay(
  item?: FeedValuationsSource & {
    vehicleSpecifications?: { vehicleMileage?: number } | null;
  } | null,
): FeedMileageDisplay | null {
  if (!item) return null;

  const listingMiles = item.vehicleSpecifications?.vehicleMileage;
  const external = item.externalValuation;
  const analysis = external?.analysis;
  const source = analysis?.mileageSource ?? null;
  const usedMiles =
    analysis?.mileageUsed ??
    (external?.mileage != null && external.mileage > 0 ? external.mileage : null) ??
    (item.compValuation?.mileage != null && item.compValuation.mileage > 0
      ? item.compValuation.mileage
      : null);

  const sourceUncertain =
    source != null && UNCERTAIN_MILEAGE_SOURCES.has(source);

  if (listingMiles != null && listingMiles > 0 && !sourceUncertain) {
    return { miles: listingMiles, uncertain: false, source: source ?? "request" };
  }

  if (usedMiles != null && usedMiles > 0 && sourceUncertain) {
    return { miles: usedMiles, uncertain: true, source };
  }

  if ((listingMiles == null || listingMiles <= 0) && usedMiles != null && usedMiles > 0) {
    return {
      miles: usedMiles,
      uncertain: source != null ? source !== "request" : true,
      source,
    };
  }

  if (listingMiles != null && listingMiles > 0) {
    return { miles: listingMiles, uncertain: sourceUncertain, source };
  }

  return null;
}

export interface FeedValuationWarning {
  message: string;
  /** info | warning — drives detail accordion icons. */
  severity: "info" | "warning";
  type?: string;
}

function normalizeWarningSeverity(severity?: string | null): "info" | "warning" {
  return severity?.toLowerCase() === "info" ? "info" : "warning";
}

/**
 * Deduped KBB / external valuation warnings for the detail accordion.
 * Comp (basic calculation) warnings stay in that sheet only.
 * Prefers analysis notes (typed severity), then leftover `warnings` strings.
 */
export function collectFeedValuationWarningItems(
  source?: FeedValuationsSource | null,
): FeedValuationWarning[] {
  if (!source) return [];
  const v = source.externalValuation;
  if (!v) return [];

  const seen = new Set<string>();
  const out: FeedValuationWarning[] = [];

  for (const note of v.analysis?.notes ?? []) {
    const msg = note?.message?.trim();
    if (!msg || seen.has(msg)) continue;
    if (note.severity === "info" && !/mileage|year|trim|zip/i.test(msg)) continue;
    seen.add(msg);
    out.push({
      message: msg,
      severity: normalizeWarningSeverity(note.severity),
      type: note.type,
    });
  }
  for (const w of v.warnings ?? []) {
    const msg = w?.trim();
    if (!msg || seen.has(msg)) continue;
    seen.add(msg);
    out.push({ message: msg, severity: "warning" });
  }
  return out;
}

/** Deduped KBB / external valuation warning messages. */
export function collectFeedValuationWarnings(
  source?: FeedValuationsSource | null,
): string[] {
  return collectFeedValuationWarningItems(source).map((w) => w.message);
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
  | "statusBadges"
  | "isCarListing"
  | "vehicleSpecifications"
  | "compValuation"
  | "externalValuation"
>;

function keywordSignalCount(matches?: KeywordMatch[], texts?: string[]): number {
  return Math.max(matches?.length ?? 0, texts?.length ?? 0);
}

function normalizeBusinessDealerBadge(label: string, isCarFeed: boolean): string {
  if (label === "Business" && isCarFeed) return "Dealer";
  if (label === "Dealer" && !isCarFeed) return "Business";
  return label;
}

export function getOrderedStatusBadges(feed?: FeedStatusSource | null): string[] {
  if (!feed) return [];

  const isCarFeed = isCarListing(feed);

  if (feed.statusBadges != null && feed.statusBadges.length > 0) {
    return feed.statusBadges.map((label) =>
      normalizeBusinessDealerBadge(label, isCarFeed),
    );
  }

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
  if (feed.isDealership) badges.push(isCarFeed ? "Dealer" : "Business");
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

export interface LocalCompItem {
  feedId?: string;
  platform: string;
  listingId: string;
  title: string;
  price: number;
  currency: string;
  currencySymbol: string;
  imageUrl: string | null;
  locationText: string | null;
  latitude: number | null;
  longitude: number | null;
  distanceMiles: number;
  vehicleYear: number | null;
  mileageInMiles: number | null;
  postedDate: string | null;
  buySignal: number | null;
  fairPrice: number | null;
  listingUrl: string | null;
  imageUrls: string[];
  description: string | null;
}

export function isCarListing(
  item: Pick<
    FeedItem,
    | "isCarListing"
    | "vehicleSpecifications"
    | "compValuation"
    | "externalValuation"
  > | null | undefined,
): boolean {
  if (!item) return false;
  if (item.isCarListing != null) return item.isCarListing;
  const valuation = resolveDisplayValuation(item);
  const valuationType = valuation?.valuationType?.trim().toLowerCase();
  if (valuationType === "car") return true;
  if (valuationType === "iphone" || valuationType === "samsung") return false;
  const specs = item.vehicleSpecifications;
  if (
    specs &&
    (specs.vehicleYear != null ||
      specs.vehicleMileage != null ||
      !!specs.vehicleTransmission)
  ) {
    return true;
  }
  return false;
}

/** Matches backend FeedFilterTabDto / FeedTabAvailabilityDto. */
export interface FeedFilterTab {
  key: string;
  label: string;
  groupIds: string[];
}

export interface FeedTabAvailability {
  showFeatured: boolean;
  showSold: boolean;
  tabs: FeedFilterTab[];
}
