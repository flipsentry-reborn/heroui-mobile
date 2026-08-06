import type { FeedItem, KeywordMatch } from "@/models/feed";
import type { UserPreferences } from "@/models/user";

/** Listing-type gates persisted on user preferences (`show*` API fields). */
export type FeedHidePrefs = {
  showScams: boolean;
  showDealers: boolean;
  showDealerships: boolean;
  showMajorIssue: boolean;
  showRebuiltTitle: boolean;
  showSalvageTitle: boolean;
};

export const DEFAULT_FEED_HIDE_PREFS: FeedHidePrefs = {
  showScams: true,
  showDealers: true,
  showDealerships: true,
  showMajorIssue: true,
  showRebuiltTitle: true,
  showSalvageTitle: true,
};

export function hidePrefsFromUserPreferences(
  prefs: UserPreferences | null | undefined,
): FeedHidePrefs {
  if (prefs == null) return { ...DEFAULT_FEED_HIDE_PREFS };
  return {
    showScams: prefs.showScams,
    showDealers: prefs.showDealers,
    showDealerships: prefs.showDealerships,
    showMajorIssue: prefs.showMajorIssue,
    showRebuiltTitle: prefs.showRebuiltTitle ?? true,
    showSalvageTitle: prefs.showSalvageTitle ?? true,
  };
}

export function areFeedHidePrefsEqual(a: FeedHidePrefs, b: FeedHidePrefs): boolean {
  return (
    a.showScams === b.showScams &&
    a.showDealers === b.showDealers &&
    a.showDealerships === b.showDealerships &&
    a.showMajorIssue === b.showMajorIssue &&
    a.showRebuiltTitle === b.showRebuiltTitle &&
    a.showSalvageTitle === b.showSalvageTitle
  );
}

function keywordSignalCount(matches?: KeywordMatch[], texts?: string[]): number {
  return Math.max(matches?.length ?? 0, texts?.length ?? 0);
}

type HideSource = Pick<
  FeedItem,
  | "isDealership"
  | "isMajorDamaged"
  | "isSalvageTitle"
  | "isRebuiltTitle"
  | "scamKeywords"
  | "scamKeywordTexts"
  | "phoneKeywords"
  | "phoneKeywordTexts"
  | "dealerKeywords"
  | "dealerKeywordTexts"
  | "majorDamagedKeywords"
  | "majorDamagedKeywordTexts"
  | "salvageTitleKeywords"
  | "salvageTitleKeywordTexts"
  | "rebuiltTitleKeywords"
  | "rebuiltTitleKeywordTexts"
>;

/**
 * Client gate mirroring backend ShouldNotifyUser listing-type checks.
 * Switch off (`show*` false) hides matching listings from feed buckets.
 */
export function matchesFeedHidePrefs(
  item: HideSource,
  prefs: FeedHidePrefs,
): boolean {
  const isScamItem =
    keywordSignalCount(item.scamKeywords, item.scamKeywordTexts) > 0 ||
    keywordSignalCount(item.phoneKeywords, item.phoneKeywordTexts) > 0;
  if (isScamItem && !prefs.showScams) return false;

  const isDealerItem =
    keywordSignalCount(item.dealerKeywords, item.dealerKeywordTexts) > 0;
  if (isDealerItem && !prefs.showDealers) return false;

  if (item.isDealership && !prefs.showDealerships) return false;

  const isMajorDamaged =
    (item.isMajorDamaged ?? false) ||
    keywordSignalCount(item.majorDamagedKeywords, item.majorDamagedKeywordTexts) >
      0;
  if (isMajorDamaged && !prefs.showMajorIssue) return false;

  const isRebuiltTitle =
    (item.isRebuiltTitle ?? false) ||
    keywordSignalCount(item.rebuiltTitleKeywords, item.rebuiltTitleKeywordTexts) >
      0;
  if (isRebuiltTitle && !prefs.showRebuiltTitle) return false;

  const isSalvageTitle =
    (item.isSalvageTitle ?? false) ||
    keywordSignalCount(item.salvageTitleKeywords, item.salvageTitleKeywordTexts) >
      0;
  if (isSalvageTitle && !prefs.showSalvageTitle) return false;

  return true;
}
