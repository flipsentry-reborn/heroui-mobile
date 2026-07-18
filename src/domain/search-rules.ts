import type { SubscriptionSlotSetting } from "@/models/subscription";

/** Min run interval (Instant). Matches mobile-app CreateGroupStore. */
export const MIN_INTERVAL_SECONDS = 60;

export const DEFAULT_BASIC_RADIUS_MILES = 40;
export const BASIC_RADIUS_PRESETS_MILES = [10, 20, 40, 100, 200] as const;
export const MIN_EQUIVALENT_RADIUS_MILES = 5;
export const MAX_EQUIVALENT_RADIUS_MILES = 250;
export const MAX_BOUNDARY_POINT_DISTANCE_MILES = 600;

export interface IntervalOption {
  interval: number;
  allowed: number;
  remaining: number;
  label: string;
}

export function normalizeSlotSettings(
  settings: SubscriptionSlotSetting[] | null | undefined,
): SubscriptionSlotSetting[] {
  return (settings ?? [])
    .map((setting) => ({
      interval: Math.max(0, Math.floor(setting.interval)),
      value: Math.max(0, Math.floor(setting.value)),
    }))
    .filter((setting) => setting.interval > 0)
    .sort((left, right) => left.interval - right.interval);
}

export function normalizeIntervalSeconds(
  interval: number | null | undefined,
): number | null {
  if (typeof interval !== "number" || !Number.isFinite(interval)) {
    return null;
  }
  const normalized = Math.floor(interval);
  return normalized >= MIN_INTERVAL_SECONDS ? normalized : null;
}

export function formatIntervalLabel(seconds: number): string {
  if (seconds === 60) return "Instant";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}-min`;
  const hours = minutes / 60;
  return Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`;
}

/** Count used slots per interval from setting rows (active only by default). */
export function countUsedSlotsByInterval(
  settings: Array<{ runIntervalSeconds: number; isActive?: boolean }>,
  options?: { includeInactive?: boolean },
): Map<number, number> {
  const used = new Map<number, number>();
  for (const setting of settings) {
    if (!options?.includeInactive && setting.isActive === false) continue;
    const interval = normalizeIntervalSeconds(setting.runIntervalSeconds);
    if (interval == null) continue;
    used.set(interval, (used.get(interval) ?? 0) + 1);
  }
  return used;
}

export function computeRemainingSlotSettings(
  allowed: SubscriptionSlotSetting[],
  usedByInterval: Map<number, number>,
): SubscriptionSlotSetting[] {
  return normalizeSlotSettings(allowed).map((setting) => ({
    interval: setting.interval,
    value: Math.max(0, setting.value - (usedByInterval.get(setting.interval) ?? 0)),
  }));
}

export function sumSlotValues(settings: SubscriptionSlotSetting[]): number {
  return settings.reduce((sum, s) => sum + Math.max(0, s.value), 0);
}

/**
 * slotsNeeded = enabled platforms + additional Facebook suggested locations.
 * Center location is covered by the platform base count.
 */
export function computeSlotsNeeded(input: {
  enabledPlatforms: Iterable<string>;
  additionalFacebookLocationCount?: number;
}): number {
  const platforms = new Set(
    [...input.enabledPlatforms].map((p) => p.toLowerCase()),
  );
  if (platforms.size === 0) return 0;
  const extra =
    platforms.has("facebook")
      ? Math.max(0, input.additionalFacebookLocationCount ?? 0)
      : 0;
  return platforms.size + extra;
}

export function buildIntervalOptions(
  allowed: SubscriptionSlotSetting[],
  remaining: SubscriptionSlotSetting[],
): IntervalOption[] {
  const remainingByInterval = new Map(
    remaining.map((s) => [s.interval, s.value]),
  );
  return normalizeSlotSettings(allowed).map((setting) => ({
    interval: setting.interval,
    allowed: setting.value,
    remaining: remainingByInterval.get(setting.interval) ?? 0,
    label: formatIntervalLabel(setting.interval),
  }));
}

export function canCreateSearch(remainingSlots: number): boolean {
  return remainingSlots > 0;
}

export function isOverSlotLimit(input: {
  slotsNeeded: number;
  remainingForInterval: number;
  editing?: boolean;
}): boolean {
  if (input.editing) return false;
  return input.slotsNeeded > input.remainingForInterval;
}

/** Non-Facebook platforms may only use one location. */
export function maxLocationsForPlatform(platform: string): number {
  return platform.toLowerCase() === "facebook" ? Number.POSITIVE_INFINITY : 1;
}

export type DraftRunSpeed = "none" | "instant" | "3min" | "5min";

const SPEED_TO_INTERVAL: Record<Exclude<DraftRunSpeed, "none">, number> = {
  instant: 60,
  "3min": 180,
  "5min": 300,
};

export function runSpeedToIntervalSeconds(
  speed: DraftRunSpeed,
): number | null {
  if (speed === "none") return null;
  return SPEED_TO_INTERVAL[speed];
}

export function intervalSecondsToRunSpeed(
  interval: number,
): Exclude<DraftRunSpeed, "none"> | null {
  if (interval === 60) return "instant";
  if (interval === 180) return "3min";
  if (interval === 300) return "5min";
  return null;
}

/** Speeds offered for a tier (always includes `none`). */
export function filterSpeedsForTier(
  intervalOptions: IntervalOption[],
): DraftRunSpeed[] {
  const allowed = new Set(
    intervalOptions.map((o) => intervalSecondsToRunSpeed(o.interval)),
  );
  const speeds: DraftRunSpeed[] = [];
  if (allowed.has("instant")) speeds.push("instant");
  if (allowed.has("3min")) speeds.push("3min");
  if (allowed.has("5min")) speeds.push("5min");
  speeds.push("none");
  return speeds;
}

export interface DraftLocationSpeed {
  locationId: string;
  locationName: string;
  speed: DraftRunSpeed;
}

export interface DraftSettingRow {
  platform: string;
  locationId: string;
  locationName: string;
  runIntervalSeconds: number;
}

function normalizePlatformId(platform: string): string {
  return platform.toLowerCase() === "offerup" ? "offerup" : platform.toLowerCase();
}

function isFacebook(platform: string): boolean {
  return normalizePlatformId(platform) === "facebook";
}

/** Locations with speed ≠ none, center first when present. */
export function selectedDraftLocations(
  locationSpeeds: DraftLocationSpeed[],
  centerId: string | null,
): DraftLocationSpeed[] {
  const selected = locationSpeeds.filter((row) => row.speed !== "none");
  if (centerId == null) return selected;
  return [
    ...selected.filter((row) => row.locationId === centerId),
    ...selected.filter((row) => row.locationId !== centerId),
  ];
}

/**
 * Build setting rows for create:
 * - Facebook → every selected location
 * - Other platforms → center if selected, else first selected location
 */
export function buildDraftSettingRows(input: {
  platforms: Iterable<string>;
  locationSpeeds: DraftLocationSpeed[];
  centerId: string | null;
}): DraftSettingRow[] {
  const platforms = [...new Set([...input.platforms].map(normalizePlatformId))];
  const selected = selectedDraftLocations(
    input.locationSpeeds,
    input.centerId,
  );
  if (platforms.length === 0 || selected.length === 0) return [];

  const centerSelected =
    input.centerId != null
      ? selected.find((row) => row.locationId === input.centerId)
      : undefined;
  const singleLocation = centerSelected ?? selected[0];

  const rows: DraftSettingRow[] = [];
  for (const platform of platforms) {
    const locations = isFacebook(platform) ? selected : [singleLocation];
    for (const location of locations) {
      const interval = runSpeedToIntervalSeconds(location.speed);
      if (interval == null) continue;
      rows.push({
        platform,
        locationId: location.locationId,
        locationName: location.locationName,
        runIntervalSeconds: interval,
      });
    }
  }
  return rows;
}

export function projectDraftSlotUsage(input: {
  platforms: Iterable<string>;
  locationSpeeds: DraftLocationSpeed[];
  centerId: string | null;
}): Map<number, number> {
  return countUsedSlotsByInterval(
    buildDraftSettingRows(input).map((row) => ({
      runIntervalSeconds: row.runIntervalSeconds,
      isActive: true,
    })),
  );
}

function remainingByIntervalMap(
  intervalOptions: IntervalOption[],
): Map<number, number> {
  return new Map(intervalOptions.map((o) => [o.interval, o.remaining]));
}

export function canAssignLocationSpeed(input: {
  platforms: Iterable<string>;
  locationSpeeds: DraftLocationSpeed[];
  centerId: string | null;
  locationId: string;
  nextSpeed: DraftRunSpeed;
  intervalOptions: IntervalOption[];
}): { ok: boolean; reason?: string } {
  if (input.nextSpeed === "none") return { ok: true };

  const platforms = [...input.platforms];
  if (platforms.length === 0) {
    return { ok: false, reason: "Select at least one platform." };
  }

  const interval = runSpeedToIntervalSeconds(input.nextSpeed);
  if (interval == null) {
    return { ok: false, reason: "That speed is not available on your plan." };
  }

  const tierAllows = input.intervalOptions.some((o) => o.interval === interval);
  if (!tierAllows) {
    return { ok: false, reason: "That speed is not available on your plan." };
  }

  const capacity = remainingByIntervalMap(input.intervalOptions);
  const anyCapacity = [...capacity.values()].some((value) => value > 0);
  if (!anyCapacity) {
    return {
      ok: false,
      reason:
        "No slots available. Free a slot or pick a slower speed.",
    };
  }

  const nextSpeeds = input.locationSpeeds.map((row) =>
    row.locationId === input.locationId
      ? { ...row, speed: input.nextSpeed }
      : row,
  );
  if (!nextSpeeds.some((row) => row.locationId === input.locationId)) {
    const existing = input.locationSpeeds.find(
      (row) => row.locationId === input.locationId,
    );
    nextSpeeds.push({
      locationId: input.locationId,
      locationName: existing?.locationName ?? input.locationId,
      speed: input.nextSpeed,
    });
  }

  const usage = projectDraftSlotUsage({
    platforms,
    locationSpeeds: nextSpeeds,
    centerId: input.centerId,
  });

  for (const [usageInterval, count] of usage.entries()) {
    const remaining = capacity.get(usageInterval) ?? 0;
    if (count > remaining) {
      return {
        ok: false,
        reason: `Not enough remaining ${formatIntervalLabel(usageInterval)} slots.`,
      };
    }
  }

  return { ok: true };
}

/** Which speeds a row may pick given current draft (None always enabled). */
export function availableSpeedsForLocation(input: {
  platforms: Iterable<string>;
  locationSpeeds: DraftLocationSpeed[];
  centerId: string | null;
  locationId: string;
  intervalOptions: IntervalOption[];
}): Array<{ speed: DraftRunSpeed; enabled: boolean }> {
  const tierSpeeds = filterSpeedsForTier(input.intervalOptions);
  return tierSpeeds.map((speed) => {
    if (speed === "none") return { speed, enabled: true };
    const result = canAssignLocationSpeed({
      ...input,
      nextSpeed: speed,
    });
    return { speed, enabled: result.ok };
  });
}

export function validateLocationDraft(input: {
  platforms: Iterable<string>;
  locationSpeeds: DraftLocationSpeed[];
  centerId: string | null;
  intervalOptions: IntervalOption[];
}): string | null {
  const platforms = [...input.platforms];
  if (platforms.length === 0) return "Select at least one platform.";

  const selected = selectedDraftLocations(
    input.locationSpeeds,
    input.centerId,
  );
  if (selected.length === 0) return "Select at least one location.";

  const usage = projectDraftSlotUsage(input);
  const capacity = remainingByIntervalMap(input.intervalOptions);
  for (const [interval, count] of usage.entries()) {
    const remaining = capacity.get(interval) ?? 0;
    if (count > remaining) {
      return `Not enough remaining ${formatIntervalLabel(interval)} slots.`;
    }
  }

  if ([...usage.values()].reduce((a, b) => a + b, 0) === 0) {
    return "No slots available at any speed.";
  }

  return null;
}

export function formatPlatformLabel(platform: string): string {
  switch (normalizePlatformId(platform)) {
    case "facebook":
      return "Facebook";
    case "offerup":
      return "OfferUp";
    case "craigslist":
      return "Craigslist";
    case "kijiji":
      return "Kijiji";
    default:
      return platform;
  }
}
