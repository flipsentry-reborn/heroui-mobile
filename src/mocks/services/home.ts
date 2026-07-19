import {
  buildIntervalOptions,
  computeRemainingSlotSettings,
  countUsedSlotsByInterval,
  countUsedSlotsExcludingGroup,
  formatIntervalLabel as formatIntervalLabelDomain,
  sumSlotValues,
} from "@/domain/search-rules";
import {
  homeGroupsFixture,
  type CreditBucket,
  type HomePlan,
  type HomePlatform,
  type HomeState,
  type SearchGroup,
  type SearchSetting,
  type SearchType,
} from "@/mocks/data/home";
import {
  getAllowedSlotSettings,
  TIER_DISPLAY_NAMES,
  totalSlotsForTier,
} from "@/mocks/data/tier-slots";
import { readJson, writeJson } from "@/lib/storage";
import type { FlipSentryTier } from "@/models/subscription";
import {
  getPersistedSubscription,
} from "@/mocks/services/subscription";

const GROUPS_KEY = "@flipsentry/search-groups";

let groups: SearchGroup[] = structuredClone(homeGroupsFixture);
let hydrated = false;

function delay(ms = 100): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function nowIso(): string {
  return new Date().toISOString();
}

function timeMs(value: string | undefined): number {
  if (value == null || value.length === 0) return 0;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : 0;
}

/** Active first, then newest `updatedAt`, then newest `createdAt`. */
export function sortSearchGroups(groupList: SearchGroup[]): SearchGroup[] {
  return [...groupList].sort((a, b) => {
    const aPaused = isGroupPaused(a);
    const bPaused = isGroupPaused(b);
    if (aPaused !== bPaused) return aPaused ? 1 : -1;
    const updatedDiff = timeMs(b.updatedAt) - timeMs(a.updatedAt);
    if (updatedDiff !== 0) return updatedDiff;
    return timeMs(b.createdAt) - timeMs(a.createdAt);
  });
}

function normalizeGroup(group: SearchGroup, index: number): SearchGroup {
  const fallback = new Date(Date.now() - index * 60_000).toISOString();
  const createdAt = group.createdAt ?? fallback;
  return {
    ...group,
    createdAt,
    updatedAt: group.updatedAt ?? createdAt,
  };
}

async function ensureHydrated(): Promise<void> {
  if (hydrated) return;
  const stored = await readJson<SearchGroup[]>(GROUPS_KEY);
  if (stored != null && Array.isArray(stored)) {
    groups = sortSearchGroups(stored.map(normalizeGroup));
    await writeJson(GROUPS_KEY, groups);
  } else {
    groups = sortSearchGroups(structuredClone(homeGroupsFixture));
    await writeJson(GROUPS_KEY, groups);
  }
  hydrated = true;
}

async function persistGroups(): Promise<void> {
  await writeJson(GROUPS_KEY, groups);
}

function allSettings(): SearchSetting[] {
  return groups.flatMap((g) => g.settings);
}

export function buildHomePlan(
  tier: FlipSentryTier | null,
  groupList: SearchGroup[],
): HomePlan {
  const effectiveTier: FlipSentryTier = tier ?? "hunter";
  const allowed = getAllowedSlotSettings(effectiveTier);
  const usedByInterval = countUsedSlotsByInterval(
    groupList.flatMap((g) => g.settings),
  );
  const remaining = computeRemainingSlotSettings(allowed, usedByInterval);
  const credits: CreditBucket[] = allowed.map((s) => ({
    intervalSeconds: s.interval,
    total: s.value,
    remaining:
      remaining.find((r) => r.interval === s.interval)?.value ?? 0,
  }));
  const usedSlots = sumSlotValues(allowed) - sumSlotValues(remaining);

  return {
    tier: effectiveTier,
    displayName: TIER_DISPLAY_NAMES[effectiveTier],
    maxSearches: totalSlotsForTier(effectiveTier),
    usedSearches: usedSlots,
    credits,
  };
}

export async function listGroups(): Promise<SearchGroup[]> {
  await ensureHydrated();
  await delay();
  return structuredClone(sortSearchGroups(groups));
}

export async function getHome(): Promise<HomeState> {
  await ensureHydrated();
  await delay();
  const sub = await getPersistedSubscription();
  const tier = sub.hasActiveSubscription ? sub.currentTier : null;
  return {
    plan: buildHomePlan(tier, groups),
    groups: structuredClone(sortSearchGroups(groups)),
  };
}

export interface CreateHomeSearchSettingInput {
  platform: HomePlatform;
  locationName: string;
  runIntervalSeconds: number;
}

export interface CreateHomeSearchInput {
  searchType: SearchType;
  locationName: string;
  radiusMiles: number;
  settings: CreateHomeSearchSettingInput[];
  carQuery?: SearchGroup["carQuery"];
  customLabel?: string;
  containsText?: string[];
  excludeText?: string[];
}

export type UpdateHomeSearchInput = CreateHomeSearchInput;

function assertDraftFitsRemaining(
  draftSettings: CreateHomeSearchSettingInput[],
  usedByInterval: Map<number, number>,
  allowed: ReturnType<typeof getAllowedSlotSettings>,
): void {
  const remaining = computeRemainingSlotSettings(allowed, usedByInterval);
  const draftUsage = countUsedSlotsByInterval(
    draftSettings.map((setting) => ({
      runIntervalSeconds: setting.runIntervalSeconds,
      isActive: true,
    })),
  );

  for (const [interval, count] of draftUsage.entries()) {
    const left = remaining.find((r) => r.interval === interval)?.value ?? 0;
    if (count > left) {
      throw new Error(
        `Not enough ${formatIntervalLabelDomain(interval)} slots. Need ${count}, have ${left}.`,
      );
    }
  }
}

export async function createGroup(
  input: CreateHomeSearchInput,
): Promise<SearchGroup> {
  await ensureHydrated();
  await delay(200);

  if (input.settings.length === 0) {
    throw new Error("Select at least one platform and location.");
  }

  const sub = await getPersistedSubscription();
  const tier = sub.hasActiveSubscription ? sub.currentTier : null;
  const allowed = getAllowedSlotSettings(tier);
  assertDraftFitsRemaining(
    input.settings,
    countUsedSlotsByInterval(allSettings()),
    allowed,
  );

  const id = `g-${Date.now()}`;
  const createdAt = nowIso();
  const settings: SearchSetting[] = input.settings.map((setting, index) => ({
    id: `${id}-${setting.platform}-${index}`,
    platform: setting.platform,
    locationName: setting.locationName,
    isActive: true,
    runIntervalSeconds: setting.runIntervalSeconds,
  }));

  const group: SearchGroup = {
    id,
    searchType: input.searchType,
    locationName: input.locationName,
    radiusMiles: input.radiusMiles,
    carQuery: input.carQuery,
    customLabel: input.customLabel,
    settings,
    createdAt,
    updatedAt: createdAt,
  };

  groups = sortSearchGroups([group, ...groups]);
  await persistGroups();
  return structuredClone(group);
}

export async function updateGroup(
  id: string,
  input: UpdateHomeSearchInput,
): Promise<SearchGroup> {
  await ensureHydrated();
  await delay(200);

  const index = groups.findIndex((group) => group.id === id);
  if (index < 0) {
    throw new Error("Search not found.");
  }
  if (input.settings.length === 0) {
    throw new Error("Select at least one platform and location.");
  }

  const existing = groups[index];
  const wasPaused =
    existing.settings.length > 0 &&
    existing.settings.every((setting) => !setting.isActive);

  const sub = await getPersistedSubscription();
  const tier = sub.hasActiveSubscription ? sub.currentTier : null;
  const allowed = getAllowedSlotSettings(tier);
  assertDraftFitsRemaining(
    input.settings,
    countUsedSlotsExcludingGroup(groups, id),
    allowed,
  );

  const settings: SearchSetting[] = input.settings.map((setting, settingIndex) => ({
    id: `${id}-${setting.platform}-${settingIndex}`,
    platform: setting.platform,
    locationName: setting.locationName,
    isActive: !wasPaused,
    runIntervalSeconds: setting.runIntervalSeconds,
  }));

  const updated: SearchGroup = {
    id,
    searchType: input.searchType,
    locationName: input.locationName,
    radiusMiles: input.radiusMiles,
    carQuery: input.carQuery,
    customLabel: input.customLabel,
    settings,
    createdAt: existing.createdAt ?? nowIso(),
    updatedAt: nowIso(),
  };

  groups = sortSearchGroups(
    groups.map((group, i) => (i === index ? updated : group)),
  );
  await persistGroups();
  return structuredClone(updated);
}

export async function toggleGroupActive(
  groupId: string,
  active: boolean,
): Promise<SearchGroup | null> {
  await ensureHydrated();
  await delay(150);
  const group = groups.find((g) => g.id === groupId);
  if (!group) return null;
  group.settings = group.settings.map((s) => ({ ...s, isActive: active }));
  group.updatedAt = nowIso();
  if (group.createdAt == null) group.createdAt = group.updatedAt;
  groups = sortSearchGroups(groups);
  await persistGroups();
  return structuredClone(group);
}

export async function deleteGroup(groupId: string): Promise<boolean> {
  await ensureHydrated();
  await delay(150);
  const before = groups.length;
  groups = groups.filter((g) => g.id !== groupId);
  if (groups.length < before) {
    await persistGroups();
    return true;
  }
  return false;
}

/** Reset in-memory + storage (tests / logout). */
export async function resetHomeMocks(): Promise<void> {
  groups = structuredClone(homeGroupsFixture);
  hydrated = true;
  await persistGroups();
}

export function getSlotOptionsForGroups(
  tier: FlipSentryTier | null,
  groupList: SearchGroup[],
) {
  const allowed = getAllowedSlotSettings(tier);
  const usedByInterval = countUsedSlotsByInterval(
    groupList.flatMap((g) => g.settings),
  );
  const remaining = computeRemainingSlotSettings(allowed, usedByInterval);
  return buildIntervalOptions(allowed, remaining);
}

export function formatIntervalLabel(seconds: number): string {
  return formatIntervalLabelDomain(seconds);
}

export function formatPriceShort(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return Number.isInteger(k) ? `${k}k` : `${k.toFixed(1)}k`;
  }
  return String(n);
}

export function cityFromLocation(locationName: string): string {
  return locationName.split(",").slice(0, 2).join(",").trim() || "Unknown";
}

export function isGroupPaused(group: SearchGroup): boolean {
  return group.settings.length === 0 || group.settings.every((s) => !s.isActive);
}

export function groupStatus(group: SearchGroup): {
  label: string;
  tone: "success" | "warning" | "danger";
} {
  const total = group.settings.length;
  const active = group.settings.filter((s) => s.isActive).length;
  if (active === total && total > 0) return { label: "All Active", tone: "success" };
  if (active === 0) return { label: "Paused", tone: "danger" };
  return { label: `${active}/${total} Active`, tone: "warning" };
}
