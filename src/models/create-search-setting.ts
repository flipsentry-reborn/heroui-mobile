export type SearchPlatform = "facebook" | "offerup" | "craigslist" | "kijiji";

export interface CarQuery {
  anyMake?: boolean;
  vehicleSelection?: { make: string }[];
  selectedModels?: { makeId: string; modelName: string }[];
  minPrice?: number;
  maxPrice?: number;
  minMileage?: number;
  maxMileage?: number;
  minYear?: number;
  maxYear?: number;
}

export interface CustomQuery {
  query: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface IphoneQuery {
  model: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface SamsungQuery {
  model: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface UserActiveSetting {
  maxSearchSettings: number;
  maxActiveSearchSettings: number;
  allowedSlotSettings: Array<{ interval: number; value: number }>;
  remainingSlotSettings: Array<{ interval: number; value: number }>;
}
