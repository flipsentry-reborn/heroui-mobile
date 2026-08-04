import type { CarQuery } from "@/models/create-search-setting";

export type UserFilterType = "Vehicle" | "Custom";

/** Custom filter criteria — price only (no marketplace search query). */
export interface FilterCustomQuery {
  minPrice?: number;
  maxPrice?: number;
}

export interface UserFilter {
  id: string;
  name: string;
  color: string;
  filterType: UserFilterType;
  vehicleQuery?: CarQuery | null;
  customQuery?: FilterCustomQuery | null;
  /** Custom filters only — empty for Vehicle. */
  searchGroupIds: string[];
  titleIncluders: string[];
  descriptionIncluders: string[];
  notificationEnabled: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserFilterInput {
  name: string;
  color: string;
  filterType: UserFilterType;
  vehicleQuery?: CarQuery | null;
  customQuery?: FilterCustomQuery | null;
  /** Required (≥1) for Custom; ignored for Vehicle. */
  searchGroupIds?: string[];
  titleIncluders?: string[];
  descriptionIncluders?: string[];
  notificationEnabled?: boolean;
  isActive?: boolean;
}

export interface UpdateUserFilterInput {
  name?: string;
  color?: string;
  vehicleQuery?: CarQuery | null;
  customQuery?: FilterCustomQuery | null;
  /** When set on Custom, replaces scoped search groups (must be ≥1). */
  searchGroupIds?: string[];
  titleIncluders?: string[];
  descriptionIncluders?: string[];
  notificationEnabled?: boolean;
  isActive?: boolean;
}

export interface FeedFilterSummary {
  id: string;
  name: string;
  color: string;
  updatedAt: string;
}

export const FILTER_COLOR_PRESETS = [
  "#EF4444",
  "#F43F5E",
  "#F97316",
  "#F59E0B",
  "#EAB308",
  "#84CC16",
  "#22C55E",
  "#10B981",
  "#14B8A6",
  "#06B6D4",
  "#0EA5E9",
  "#3B82F6",
  "#6366F1",
  "#8B5CF6",
  "#A855F7",
  "#D946EF",
  "#EC4899",
  "#FB7185",
  "#A3A3A3",
  "#64748B",
  "#475569",
  "#111827",
] as const;

export function isValidFilterHex(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color.trim());
}
