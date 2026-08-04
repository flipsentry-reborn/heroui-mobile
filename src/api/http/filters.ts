import { requests } from "@/api/http/client";
import type { CarQuery } from "@/models/create-search-setting";
import type {
  CreateUserFilterInput,
  FilterCustomQuery,
  UpdateUserFilterInput,
  UserFilter,
  UserFilterType,
} from "@/models/user-filter";

interface ApiUserFilter {
  id: string;
  name: string;
  color: string;
  filterType: string;
  vehicleQuery?: CarQuery | null;
  customQuery?: FilterCustomQuery | null;
  searchGroupIds?: string[] | null;
  titleIncluders?: string[];
  descriptionIncluders?: string[];
  notificationEnabled: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function mapCustomQuery(
  customQuery?: FilterCustomQuery | null,
): FilterCustomQuery | null {
  if (customQuery == null) return null;
  return {
    minPrice: customQuery.minPrice,
    maxPrice: customQuery.maxPrice,
  };
}

function mapSearchGroupIds(
  filterType: UserFilterType,
  ids?: string[] | null,
): string[] {
  if (filterType !== "Custom") return [];
  return (ids ?? []).map(String).filter(Boolean);
}

function mapFilter(api: ApiUserFilter): UserFilter {
  const filterType =
    api.filterType?.toLowerCase() === "custom" ? "Custom" : "Vehicle";
  return {
    id: String(api.id),
    name: api.name,
    color: api.color,
    filterType: filterType as UserFilterType,
    vehicleQuery: api.vehicleQuery ?? null,
    customQuery: mapCustomQuery(api.customQuery),
    searchGroupIds: mapSearchGroupIds(
      filterType as UserFilterType,
      api.searchGroupIds,
    ),
    titleIncluders: api.titleIncluders ?? [],
    descriptionIncluders: api.descriptionIncluders ?? [],
    notificationEnabled: api.notificationEnabled ?? true,
    isActive: api.isActive ?? true,
    createdAt: api.createdAt,
    updatedAt: api.updatedAt,
  };
}

function buildCreatePayload(input: CreateUserFilterInput) {
  return {
    name: input.name,
    color: input.color,
    filterType: input.filterType,
    vehicleQuery:
      input.filterType === "Vehicle"
        ? {
            anyMake: true,
            vehicleSelection: [],
            minPrice: input.vehicleQuery?.minPrice ?? null,
            maxPrice: input.vehicleQuery?.maxPrice ?? null,
            minYear: input.vehicleQuery?.minYear ?? null,
            maxYear: input.vehicleQuery?.maxYear ?? null,
            minMileage: input.vehicleQuery?.minMileage ?? null,
            maxMileage: input.vehicleQuery?.maxMileage ?? null,
          }
        : null,
    customQuery:
      input.filterType === "Custom"
        ? {
            minPrice: input.customQuery?.minPrice ?? null,
            maxPrice: input.customQuery?.maxPrice ?? null,
          }
        : null,
    searchGroupIds:
      input.filterType === "Custom" ? (input.searchGroupIds ?? []) : [],
    titleIncluders: input.titleIncluders ?? [],
    descriptionIncluders: input.descriptionIncluders ?? [],
    notificationEnabled: input.notificationEnabled ?? true,
    isActive: input.isActive ?? true,
  };
}

function buildUpdatePayload(input: UpdateUserFilterInput) {
  return {
    name: input.name,
    color: input.color,
    vehicleQuery: input.vehicleQuery
      ? {
          anyMake: true,
          vehicleSelection: [],
          minPrice: input.vehicleQuery.minPrice ?? null,
          maxPrice: input.vehicleQuery.maxPrice ?? null,
          minYear: input.vehicleQuery.minYear ?? null,
          maxYear: input.vehicleQuery.maxYear ?? null,
          minMileage: input.vehicleQuery.minMileage ?? null,
          maxMileage: input.vehicleQuery.maxMileage ?? null,
        }
      : input.vehicleQuery,
    customQuery:
      input.customQuery != null
        ? {
            minPrice: input.customQuery.minPrice ?? null,
            maxPrice: input.customQuery.maxPrice ?? null,
          }
        : input.customQuery,
    searchGroupIds: input.searchGroupIds,
    titleIncluders: input.titleIncluders,
    descriptionIncluders: input.descriptionIncluders,
    notificationEnabled: input.notificationEnabled,
    isActive: input.isActive,
  };
}

export const liveFilters = {
  list: async (): Promise<UserFilter[]> => {
    const rows = await requests.get<ApiUserFilter[]>("/api/filters");
    return (rows ?? []).map(mapFilter);
  },
  get: async (id: string): Promise<UserFilter> => {
    const row = await requests.get<ApiUserFilter>(`/api/filters/${id}`);
    return mapFilter(row);
  },
  create: async (input: CreateUserFilterInput): Promise<UserFilter> => {
    const created = await requests.post<ApiUserFilter>(
      "/api/filters",
      buildCreatePayload(input),
    );
    return mapFilter(created);
  },
  update: async (
    id: string,
    input: UpdateUserFilterInput,
  ): Promise<UserFilter> => {
    const updated = await requests.put<ApiUserFilter>(
      `/api/filters/${id}`,
      buildUpdatePayload(input),
    );
    return mapFilter(updated);
  },
  delete: async (id: string): Promise<boolean> => {
    await requests.delete(`/api/filters/${id}`);
    return true;
  },
};
