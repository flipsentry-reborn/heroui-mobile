import { mockDelay } from "@/mocks/delay";
import { readJson, writeJson } from "@/lib/storage";
import type { FeedUserFilterTab } from "@/models/feed";
import type {
  CreateUserFilterInput,
  UpdateUserFilterInput,
  UserFilter,
} from "@/models/user-filter";

const STORAGE_KEY = "@flipsentry/user-filters";
const SEEDED_KEY = "@flipsentry/user-filters-seeded";

const SEED_FILTERS: UserFilter[] = [
  {
    id: "filter-toyota",
    name: "Toyota deals",
    color: "#3B82F6",
    filterType: "Vehicle",
    vehicleQuery: {
      anyMake: true,
      vehicleSelection: [],
      minPrice: undefined,
      maxPrice: 15000,
      minYear: 2015,
      maxYear: undefined,
      minMileage: undefined,
      maxMileage: undefined,
    },
    customQuery: null,
    searchGroupIds: [],
    titleIncluders: ["toyota"],
    descriptionIncluders: [],
    notificationEnabled: true,
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "filter-iphone-deals",
    name: "iPhone deals",
    color: "#8B5CF6",
    filterType: "Custom",
    vehicleQuery: null,
    customQuery: {
      minPrice: undefined,
      maxPrice: 800,
    },
    searchGroupIds: ["g2"],
    titleIncluders: ["iphone"],
    descriptionIncluders: [],
    notificationEnabled: true,
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

function normalizeFilter(filter: UserFilter): UserFilter {
  const searchGroupIds =
    filter.filterType === "Custom"
      ? (filter.searchGroupIds ?? []).map(String).filter(Boolean)
      : [];
  return {
    ...filter,
    searchGroupIds,
    customQuery:
      filter.customQuery == null
        ? filter.customQuery
        : {
            minPrice: filter.customQuery.minPrice,
            maxPrice: filter.customQuery.maxPrice,
          },
  };
}

let cache: UserFilter[] | null = null;

async function ensureHydrated(): Promise<UserFilter[]> {
  if (cache) return cache;
  const stored = await readJson<UserFilter[]>(STORAGE_KEY);
  const seeded = await readJson<boolean>(SEEDED_KEY);
  if (stored != null && stored.length > 0) {
    cache = stored.map(normalizeFilter);
    return cache;
  }
  // First launch (or empty store before seed flag): ship demo filters.
  if (!seeded) {
    cache = structuredClone(SEED_FILTERS);
    await writeJson(STORAGE_KEY, cache);
    await writeJson(SEEDED_KEY, true);
    return cache;
  }
  cache = (stored ?? []).map(normalizeFilter);
  return cache;
}

async function persist(filters: UserFilter[]): Promise<void> {
  cache = filters;
  await writeJson(STORAGE_KEY, filters);
}

function numOrUndef(value: number | null | undefined): number | undefined {
  return value == null ? undefined : value;
}

export async function listFilters(): Promise<UserFilter[]> {
  await mockDelay();
  const filters = await ensureHydrated();
  return [...filters].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

/** Active filter ids — used when hydrating mock feed badges. */
export async function getActiveFilterIds(): Promise<Set<string>> {
  const filters = await ensureHydrated();
  return new Set(filters.filter((f) => f.isActive).map((f) => f.id));
}

/** Sync read of active ids when the filters cache is already warm. */
export function peekActiveFilterIds(): Set<string> | null {
  if (cache == null) return null;
  return new Set(cache.filter((f) => f.isActive).map((f) => f.id));
}

/** Backend-replica filter tabs for mock Feed.getTabAvailability. */
export async function getFilterTabs(): Promise<FeedUserFilterTab[]> {
  const filters = await ensureHydrated();
  return filters
    .filter((f) => f.isActive)
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .map((f) => ({
      key: `filter:${f.id}`,
      label: f.name,
      color: f.color,
      filterIds: [f.id],
    }));
}

export async function getFilter(id: string): Promise<UserFilter> {
  await mockDelay();
  const filters = await ensureHydrated();
  const found = filters.find((f) => f.id === id);
  if (!found) throw new Error("Filter not found");
  return found;
}

export async function createFilter(
  input: CreateUserFilterInput,
): Promise<UserFilter> {
  await mockDelay();
  const filters = await ensureHydrated();
  const color = input.color.trim().toUpperCase();
  if (filters.some((f) => f.color.trim().toUpperCase() === color)) {
    throw new Error("This color is already used by another filter");
  }
  if (input.filterType === "Custom") {
    const groupIds = (input.searchGroupIds ?? []).map(String).filter(Boolean);
    if (groupIds.length === 0) {
      throw new Error("Custom filters require at least one search group");
    }
  }
  const now = new Date().toISOString();
  const filter: UserFilter = {
    id: `filter-${Date.now()}`,
    name: input.name.trim(),
    color,
    filterType: input.filterType,
    vehicleQuery:
      input.filterType === "Vehicle"
        ? {
            anyMake: true,
            vehicleSelection: [],
            minPrice: numOrUndef(input.vehicleQuery?.minPrice),
            maxPrice: numOrUndef(input.vehicleQuery?.maxPrice),
            minYear: numOrUndef(input.vehicleQuery?.minYear),
            maxYear: numOrUndef(input.vehicleQuery?.maxYear),
            minMileage: numOrUndef(input.vehicleQuery?.minMileage),
            maxMileage: numOrUndef(input.vehicleQuery?.maxMileage),
          }
        : null,
    customQuery:
      input.filterType === "Custom"
        ? {
            minPrice: numOrUndef(input.customQuery?.minPrice),
            maxPrice: numOrUndef(input.customQuery?.maxPrice),
          }
        : null,
    searchGroupIds:
      input.filterType === "Custom"
        ? [...new Set((input.searchGroupIds ?? []).map(String).filter(Boolean))]
        : [],
    titleIncluders: input.titleIncluders ?? [],
    descriptionIncluders: input.descriptionIncluders ?? [],
    notificationEnabled: input.notificationEnabled ?? true,
    isActive: input.isActive ?? true,
    createdAt: now,
    updatedAt: now,
  };
  await persist([filter, ...filters]);
  return filter;
}

export async function updateFilter(
  id: string,
  input: UpdateUserFilterInput,
): Promise<UserFilter> {
  await mockDelay();
  const filters = await ensureHydrated();
  const index = filters.findIndex((f) => f.id === id);
  if (index < 0) throw new Error("Filter not found");
  const existing = filters[index];
  const nextColor = input.color?.trim().toUpperCase() ?? existing.color;
  if (
    filters.some(
      (f) =>
        f.id !== id && f.color.trim().toUpperCase() === nextColor,
    )
  ) {
    throw new Error("This color is already used by another filter");
  }
  let searchGroupIds = existing.searchGroupIds ?? [];
  if (existing.filterType === "Custom" && input.searchGroupIds !== undefined) {
    searchGroupIds = [
      ...new Set(input.searchGroupIds.map(String).filter(Boolean)),
    ];
    if (searchGroupIds.length === 0) {
      throw new Error("Custom filters require at least one search group");
    }
  } else if (existing.filterType === "Vehicle") {
    searchGroupIds = [];
  }

  const updated: UserFilter = {
    ...existing,
    name: input.name?.trim() ?? existing.name,
    color: nextColor,
    vehicleQuery:
      existing.filterType === "Vehicle" && input.vehicleQuery !== undefined
        ? {
            anyMake: true,
            vehicleSelection: [],
            minPrice: numOrUndef(input.vehicleQuery?.minPrice),
            maxPrice: numOrUndef(input.vehicleQuery?.maxPrice),
            minYear: numOrUndef(input.vehicleQuery?.minYear),
            maxYear: numOrUndef(input.vehicleQuery?.maxYear),
            minMileage: numOrUndef(input.vehicleQuery?.minMileage),
            maxMileage: numOrUndef(input.vehicleQuery?.maxMileage),
          }
        : existing.vehicleQuery,
    customQuery:
      existing.filterType === "Custom" && input.customQuery !== undefined
        ? {
            minPrice: numOrUndef(input.customQuery?.minPrice),
            maxPrice: numOrUndef(input.customQuery?.maxPrice),
          }
        : existing.customQuery,
    searchGroupIds,
    titleIncluders: input.titleIncluders ?? existing.titleIncluders,
    descriptionIncluders:
      input.descriptionIncluders ?? existing.descriptionIncluders,
    notificationEnabled:
      input.notificationEnabled ?? existing.notificationEnabled,
    isActive: input.isActive ?? existing.isActive,
    updatedAt: new Date().toISOString(),
  };
  const next = [...filters];
  next[index] = updated;
  await persist(next);
  return updated;
}

export async function deleteFilter(id: string): Promise<boolean> {
  await mockDelay();
  const filters = await ensureHydrated();
  await persist(filters.filter((f) => f.id !== id));
  return true;
}
