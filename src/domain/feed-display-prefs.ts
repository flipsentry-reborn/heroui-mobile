import {
  getValuationTier,
  resolveDisplayValuation,
  type FeedItem,
  type ValuationTier,
} from "@/models/feed";

export const FEED_DISPLAY_PREFS_STORAGE_KEY = "flipsentry.feedDisplayPrefs";

export const MIN_PROFIT_MIN = 0;
export const MIN_PROFIT_MAX = 5000;
export const MIN_PROFIT_STEP = 50;

/** Matches getValuationTier floors — used for GetAll minBuySignal. */
export const TIER_MIN_BUY_SIGNAL: Record<ValuationTier, number> = {
  greatDeal: 75,
  goodValue: 50,
  fairPrice: 25,
  overpriced: 0,
};

/** Above max buy signal (0–100) so only unvalued listings pass GetAll. */
export const ONLY_NO_VALUATION_MIN_BUY_SIGNAL = 101;

export type ScoreTierKey = "showGreat" | "showGood" | "showFair" | "showBad";

/** Best → worst. Selecting a tier also selects every worse tier below it. */
export const SCORE_TIER_KEYS: ScoreTierKey[] = [
  "showGreat",
  "showGood",
  "showFair",
  "showBad",
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

const TIER_FLAG: Record<ValuationTier, keyof FeedDisplayPrefs> = {
  greatDeal: "showGreat",
  goodValue: "showGood",
  fairPrice: "showFair",
  overpriced: "showBad",
};

export function clampMinProfit(value: number): number {
  if (!Number.isFinite(value)) return MIN_PROFIT_MIN;
  const stepped = Math.round(value / MIN_PROFIT_STEP) * MIN_PROFIT_STEP;
  return Math.min(MIN_PROFIT_MAX, Math.max(MIN_PROFIT_MIN, stepped));
}

export function parseFeedDisplayPrefs(raw: unknown): FeedDisplayPrefs | null {
  if (raw == null || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
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
 * Cascade rules (best → worst):
 * - Select Great → Great + Good + Fair + Bad
 * - Select Good → Good + Fair + Bad
 * - Deselect Good → Great + Good off (Fair/Bad stay if on)
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
    for (let i = index; i < SCORE_TIER_KEYS.length; i += 1) {
      next[SCORE_TIER_KEYS[i]] = true;
    }
  } else {
    for (let i = 0; i <= index; i += 1) {
      next[SCORE_TIER_KEYS[i]] = false;
    }
  }

  return next;
}

/** Force cascade consistency from the best selected tier downward. */
export function normalizeScoreTierCascade(prefs: FeedDisplayPrefs): FeedDisplayPrefs {
  if (prefs.showGreat) {
    return { ...prefs, showGreat: true, showGood: true, showFair: true, showBad: true };
  }
  if (prefs.showGood) {
    return { ...prefs, showGreat: false, showGood: true, showFair: true, showBad: true };
  }
  if (prefs.showFair) {
    return { ...prefs, showGreat: false, showGood: false, showFair: true, showBad: true };
  }
  if (prefs.showBad) {
    return { ...prefs, showGreat: false, showGood: false, showFair: false, showBad: true };
  }
  return { ...prefs, showGreat: false, showGood: false, showFair: false, showBad: false };
}

export function isTierShown(prefs: FeedDisplayPrefs, tier: ValuationTier): boolean {
  const key = TIER_FLAG[tier];
  return prefs[key] === true;
}

/**
 * Maps selected score tiers → GetAll `minBuySignal`.
 * Unvalued listings always pass on the server when this is set.
 */
export function deriveMinBuySignal(prefs: FeedDisplayPrefs): number | undefined {
  const floors: number[] = [];
  if (prefs.showGreat) floors.push(TIER_MIN_BUY_SIGNAL.greatDeal);
  if (prefs.showGood) floors.push(TIER_MIN_BUY_SIGNAL.goodValue);
  if (prefs.showFair) floors.push(TIER_MIN_BUY_SIGNAL.fairPrice);
  if (prefs.showBad) floors.push(TIER_MIN_BUY_SIGNAL.overpriced);

  if (floors.length === 4) return undefined;
  if (floors.length === 0) return ONLY_NO_VALUATION_MIN_BUY_SIGNAL;
  return Math.min(...floors);
}

export function deriveMinProfit(prefs: FeedDisplayPrefs): number | undefined {
  return prefs.minProfit > 0 ? prefs.minProfit : undefined;
}

/** Exact client match for tier gaps + profit (No Valuation always allowed). */
export function matchesFeedDisplayPrefs(
  item: Pick<FeedItem, "compValuation" | "externalValuation">,
  prefs: FeedDisplayPrefs,
): boolean {
  const valuation = resolveDisplayValuation(item);
  if (valuation == null || valuation.buySignal == null) {
    return prefs.showNoValuation;
  }

  const tier = getValuationTier(valuation.buySignal);
  if (!isTierShown(prefs, tier)) return false;

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
