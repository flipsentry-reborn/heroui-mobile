import {
  COMMUNITY_CLICKS,
  COMMUNITY_HUNTERS,
  COMMUNITY_TRENDING,
  CURRENT_HUNTER_ID,
  type CommunityClickEvent,
  type CommunityHunter,
  type CommunityTrendingItem,
} from "@/mocks/data/community";
import { MOCK_FEED_ITEMS } from "@/mocks/data/feed";
import type { FeedItem } from "@/models/feed";

const LOCAL_RADIUS_MI = 40;

export type CommunityActivityRow = {
  event: CommunityClickEvent;
  hunter: CommunityHunter;
  feedItem: FeedItem;
};

export function formatDaysAgo(daysAgo: number): string {
  if (daysAgo <= 1) return "1 day ago";
  return `${daysAgo} days ago`;
}

export type CommunityTrendingRow = {
  trending: CommunityTrendingItem;
  feedItem: FeedItem;
  hunters: CommunityHunter[];
};

export type CommunityClicker = {
  hunter: CommunityHunter;
  /** Hidden hunters still count toward total. */
  visible: boolean;
};

function delay(ms = 200): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function hunterById(id: string): CommunityHunter | undefined {
  return COMMUNITY_HUNTERS.find((h) => h.id === id);
}

function feedById(id: string): FeedItem | undefined {
  return MOCK_FEED_ITEMS.find((f) => f.id === id);
}

function resolveActivity(event: CommunityClickEvent): CommunityActivityRow | null {
  const hunter = hunterById(event.hunterId);
  const feedItem = feedById(event.feedItemId);
  if (!hunter || !feedItem) return null;
  if (!hunter.showActivity && hunter.id !== CURRENT_HUNTER_ID) return null;
  return { event, hunter, feedItem };
}

export async function getCommunityActivity(): Promise<CommunityActivityRow[]> {
  await delay();
  return COMMUNITY_CLICKS.map(resolveActivity).filter(
    (row): row is CommunityActivityRow => row != null,
  );
}

export type CommunityHunterFeed = {
  hunter: CommunityHunter;
  /** Most recent clicks first. */
  clicks: CommunityActivityRow[];
};

function buildHunterFeeds(): CommunityHunterFeed[] {
  const byHunter = new Map<string, CommunityActivityRow[]>();
  for (const event of COMMUNITY_CLICKS) {
    const row = resolveActivity(event);
    if (!row) continue;
    if (row.hunter.id === CURRENT_HUNTER_ID) continue;
    const list = byHunter.get(row.hunter.id) ?? [];
    list.push(row);
    byHunter.set(row.hunter.id, list);
  }
  const feeds: CommunityHunterFeed[] = [];
  for (const [hunterId, clicks] of byHunter) {
    const hunter = hunterById(hunterId);
    if (!hunter) continue;
    const sorted = [...clicks].sort(
      (a, b) => a.event.daysAgo - b.event.daysAgo,
    );
    feeds.push({ hunter, clicks: sorted });
  }
  return feeds.sort(
    (a, b) => b.hunter.clicksYesterday - a.hunter.clicksYesterday,
  );
}

/** Hunters who have visible activity, sorted by clicks yesterday. */
export async function getCommunityHunterFeeds(): Promise<CommunityHunterFeed[]> {
  await delay();
  return buildHunterFeeds();
}

/** Nearby hunters with activity — for the Active nearby rail. */
export async function getActiveNearbyHunters(): Promise<CommunityHunter[]> {
  await delay(120);
  return buildHunterFeeds()
    .map((f) => f.hunter)
    .filter((h) => h.distanceMiles != null && h.distanceMiles <= LOCAL_RADIUS_MI)
    .slice(0, 12);
}

export async function getCommunityTrending(): Promise<CommunityTrendingRow[]> {
  await delay();
  return COMMUNITY_TRENDING.map((trending) => {
    const feedItem = feedById(trending.feedItemId);
    if (!feedItem) return null;
    const hunters = trending.hunterIds
      .map(hunterById)
      .filter((h): h is CommunityHunter => h != null && h.showActivity);
    return { trending, feedItem, hunters };
  }).filter((row): row is CommunityTrendingRow => row != null);
}

export async function getCommunityHunters(scope: "nearby" | "all"): Promise<
  CommunityHunter[]
> {
  await delay();
  const others = COMMUNITY_HUNTERS.filter((h) => h.id !== CURRENT_HUNTER_ID);
  if (scope === "nearby") {
    return others
      .filter((h) => h.distanceMiles != null && h.distanceMiles <= LOCAL_RADIUS_MI)
      .sort((a, b) => (a.distanceMiles ?? 99) - (b.distanceMiles ?? 99));
  }
  return [...others].sort((a, b) => b.clicksYesterday - a.clicksYesterday);
}

export async function getHunter(id: string): Promise<CommunityHunter | null> {
  await delay(120);
  return hunterById(id) ?? null;
}

export async function getHunterActivity(
  hunterId: string,
): Promise<CommunityActivityRow[]> {
  await delay();
  const hunter = hunterById(hunterId);
  if (!hunter) return [];
  if (!hunter.showActivity && hunterId !== CURRENT_HUNTER_ID) return [];
  return COMMUNITY_CLICKS.filter((e) => e.hunterId === hunterId)
    .map(resolveActivity)
    .filter((row): row is CommunityActivityRow => row != null);
}

export async function getItemClickers(
  feedItemId: string,
): Promise<{ total: number; clickers: CommunityClicker[] }> {
  await delay(120);
  const events = COMMUNITY_CLICKS.filter((e) => e.feedItemId === feedItemId);
  const byHunter = new Map<string, CommunityClicker>();
  for (const event of events) {
    if (byHunter.has(event.hunterId)) continue;
    const hunter = hunterById(event.hunterId);
    if (!hunter) continue;
    const visible = hunter.showActivity || hunter.id === CURRENT_HUNTER_ID;
    byHunter.set(event.hunterId, { hunter, visible });
  }
  const clickers = [...byHunter.values()];
  return { total: clickers.length, clickers };
}

export function getCurrentHunter(): CommunityHunter {
  return hunterById(CURRENT_HUNTER_ID)!;
}
