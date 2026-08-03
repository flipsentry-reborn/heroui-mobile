import {
  resolveDisplayValuation,
  type FeedItem,
} from "@/models/feed";

export const FEED_DISPLAY_PREFS_STORAGE_KEY = "flipsentry.feedDisplayPrefs";

export const MIN_PROFIT_MIN = 0;
export const MIN_PROFIT_MAX = 3000;
export const MIN_PROFIT_STEP = 1;

/**
 * Persisted score buckets (match backend DealDisplayPreferenceHelper):
 * 100 = all tiers (no buy-signal filter)
 * 75  = Great only   (buySignal >= 75)
 * 50  = Good+Great   (buySignal >= 50)
 * 25  = Fair+Good+Great (buySignal >= 25)
 *
 * Tier bands (see getValuationTier):
 * Great >= 75, Good >= 50, Fair >= 25, Bad < 25.
 */
export const DEAL_SCORE_ALL = 100;
export const DEAL_SCORE_OPTIONS = [100, 75, 50, 25] as const;
export type DealScoreOption = (typeof DEAL_SCORE_OPTIONS)[number];

export type ScoreTierKey = "showGreat" | "showGood" | "showFair" | "showBad";

/** Worst → best. Selecting a tier selects that tier and every better one. */
export const SCORE_TIER_KEYS: ScoreTierKey[] = [
  "showBad",
  "showFair",
  "showGood",
  "showGreat",
];

export type FeedDisplayPrefs = {
  minProfit: number;
  showGreat: boolean;
  showGood: boolean;
  showFair: boolean;
  showBad: boolean;
  /** Always true for now — unvalued listings always pass. */
  showNoValuation: true;
};

export const DEFAULT_FEED_DISPLAY_PREFS: FeedDisplayPrefs = {
  minProfit: 0,
  showGreat: true,
  showGood: true,
  showFair: true,
  showBad: true,
  showNoValuation: true,
};

export function clampMinProfit(value: number): number {
  if (!Number.isFinite(value)) return MIN_PROFIT_MIN;
  const stepped = Math.round(value / MIN_PROFIT_STEP) * MIN_PROFIT_STEP;
  return Math.min(MIN_PROFIT_MAX, Math.max(MIN_PROFIT_MIN, stepped));
}

export function normalizeDealScore(value: number | null | undefined): DealScoreOption {
  if (value === 75 || value === 50 || value === 25 || value === 100) return value;
  if (value == null || !Number.isFinite(value) || value >= 100 || value <= 0) {
    return DEAL_SCORE_ALL;
  }
  if (value >= 75) return 75;
  if (value >= 50) return 50;
  if (value >= 25) return 25;
  return DEAL_SCORE_ALL;
}

/**
 * Cascade → persisted min buy-signal floor:
 * Bad/all → 100, Fair+ → 25, Good+ → 50, Great → 75.
 */
export function deriveMinBuySignal(prefs: FeedDisplayPrefs): DealScoreOption {
  if (!hasAnyScoreTierSelected(prefs) || prefs.showBad) return DEAL_SCORE_ALL;
  if (prefs.showFair) return 25;
  if (prefs.showGood) return 50;
  return 75;
}

/** Query/API: omit filter when score is "all" (100). */
export function effectiveMinBuySignalForQuery(
  prefs: FeedDisplayPrefs,
): number | undefined {
  const score = deriveMinBuySignal(prefs);
  return score < DEAL_SCORE_ALL ? score : undefined;
}

export function deriveMinProfit(prefs: FeedDisplayPrefs): number | undefined {
  return prefs.minProfit > 0 ? prefs.minProfit : undefined;
}

export function prefsFromDealSettings(
  minBuySignal: number | null | undefined,
  minProfit: number | null | undefined,
): FeedDisplayPrefs {
  const score = normalizeDealScore(minBuySignal);
  const profit = clampMinProfit(typeof minProfit === "number" ? minProfit : 0);
  if (score >= DEAL_SCORE_ALL) {
    return {
      minProfit: profit,
      showGreat: true,
      showGood: true,
      showFair: true,
      showBad: true,
      showNoValuation: true,
    };
  }
  if (score >= 75) {
    // Great only
    return {
      minProfit: profit,
      showGreat: true,
      showGood: false,
      showFair: false,
      showBad: false,
      showNoValuation: true,
    };
  }
  if (score >= 50) {
    // Good + Great
    return {
      minProfit: profit,
      showGreat: true,
      showGood: true,
      showFair: false,
      showBad: false,
      showNoValuation: true,
    };
  }
  // Fair + Good + Great (min 25)
  return {
    minProfit: profit,
    showGreat: true,
    showGood: true,
    showFair: true,
    showBad: false,
    showNoValuation: true,
  };
}

export function parseFeedDisplayPrefs(raw: unknown): FeedDisplayPrefs | null {
  if (raw == null || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.minBuySignal === "number" || typeof obj.minProfit === "number") {
    return prefsFromDealSettings(
      typeof obj.minBuySignal === "number" ? obj.minBuySignal : DEAL_SCORE_ALL,
      typeof obj.minProfit === "number" ? obj.minProfit : 0,
    );
  }
  return normalizeScoreTierCascade({
    minProfit: clampMinProfit(
      typeof obj.minProfit === "number" ? obj.minProfit : DEFAULT_FEED_DISPLAY_PREFS.minProfit,
    ),
    showGreat:
      typeof obj.showGreat === "boolean"
        ? obj.showGreat
        : DEFAULT_FEED_DISPLAY_PREFS.showGreat,
    showGood:
      typeof obj.showGood === "boolean"
        ? obj.showGood
        : DEFAULT_FEED_DISPLAY_PREFS.showGood,
    showFair:
      typeof obj.showFair === "boolean"
        ? obj.showFair
        : DEFAULT_FEED_DISPLAY_PREFS.showFair,
    showBad:
      typeof obj.showBad === "boolean"
        ? obj.showBad
        : DEFAULT_FEED_DISPLAY_PREFS.showBad,
    showNoValuation: true,
  });
}

/**
 * Cascade rules (worst → best / "this and better"):
 * - Select Fair → Fair + Good + Great (Bad off)
 * - Select Good → Good + Great
 * - Select Great → Great only
 * - Select Bad → all tiers
 * - Deselect Fair → Bad + Fair off (Good/Great stay if on)
 */
export function applyScoreTierSelection(
  prefs: FeedDisplayPrefs,
  key: ScoreTierKey,
  selected: boolean,
): Pick<FeedDisplayPrefs, ScoreTierKey> {
  const index = SCORE_TIER_KEYS.indexOf(key);
  const next: Pick<FeedDisplayPrefs, ScoreTierKey> = {
    showGreat: prefs.showGreat,
    showGood: prefs.showGood,
    showFair: prefs.showFair,
    showBad: prefs.showBad,
  };

  if (selected) {
    for (let i = 0; i < SCORE_TIER_KEYS.length; i += 1) {
      next[SCORE_TIER_KEYS[i]] = i >= index;
    }
  } else {
    for (let i = 0; i <= index; i += 1) {
      next[SCORE_TIER_KEYS[i]] = false;
    }
  }

  return next;
}

/** Force cascade consistency from the worst selected tier upward. */
export function normalizeScoreTierCascade(prefs: FeedDisplayPrefs): FeedDisplayPrefs {
  if (prefs.showBad) {
    return { ...prefs, showGreat: true, showGood: true, showFair: true, showBad: true };
  }
  if (prefs.showFair) {
    return { ...prefs, showGreat: true, showGood: true, showFair: true, showBad: false };
  }
  if (prefs.showGood) {
    return { ...prefs, showGreat: true, showGood: true, showFair: false, showBad: false };
  }
  if (prefs.showGreat) {
    return { ...prefs, showGreat: true, showGood: false, showFair: false, showBad: false };
  }
  return { ...prefs, showGreat: false, showGood: false, showFair: false, showBad: false };
}

function hasAnyScoreTierSelected(prefs: FeedDisplayPrefs): boolean {
  return prefs.showGreat || prefs.showGood || prefs.showFair || prefs.showBad;
}

/**
 * Same rule as backend GetAll / notify: score 100 = all; else buySignal >= score.
 * Unvalued listings always pass. Min profit floors valued listings only.
 */
export function matchesFeedDisplayPrefs(
  item: Pick<FeedItem, "compValuation" | "externalValuation">,
  prefs: FeedDisplayPrefs,
): boolean {
  const valuation = resolveDisplayValuation(item);
  if (valuation == null || valuation.buySignal == null) {
    return prefs.showNoValuation;
  }

  const minBuySignal = deriveMinBuySignal(prefs);
  if (minBuySignal < DEAL_SCORE_ALL && valuation.buySignal < minBuySignal) {
    return false;
  }

  const minProfit = deriveMinProfit(prefs);
  if (minProfit != null && (valuation.profit ?? 0) < minProfit) {
    return false;
  }

  return true;
}

export function areFeedDisplayPrefsEqual(
  a: FeedDisplayPrefs,
  b: FeedDisplayPrefs,
): boolean {
  return (
    a.minProfit === b.minProfit &&
    a.showGreat === b.showGreat &&
    a.showGood === b.showGood &&
    a.showFair === b.showFair &&
    a.showBad === b.showBad
  );
}
