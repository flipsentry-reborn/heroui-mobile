/**
 * Home UI view model for search groups.
 * Slot / tier rules live in domain + SubscriptionStore; this is the persisted list shape.
 */

export type HomePlatform = "facebook" | "offerUp" | "craigslist" | "kijiji";
export type SearchType = "car" | "iphone" | "custom";

export interface SearchSetting {
  id: string;
  platform: HomePlatform;
  locationName: string;
  isActive: boolean;
  runIntervalSeconds: number;
}

export interface CarQuery {
  makes: string[];
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  minMileage?: number;
  maxMileage?: number;
}

export interface SearchGroup {
  id: string;
  searchType: SearchType;
  locationName: string;
  radiusMiles: number;
  carQuery?: CarQuery;
  customLabel?: string;
  settings: SearchSetting[];
}

export interface CreditBucket {
  intervalSeconds: number;
  total: number;
  remaining: number;
}

export interface HomePlan {
  tier: "starter" | "hunter" | "master";
  displayName: string;
  maxSearches: number;
  usedSearches: number;
  credits: CreditBucket[];
}

export interface HomeState {
  plan: HomePlan;
  groups: SearchGroup[];
}

function setting(
  id: string,
  platform: HomePlatform,
  locationName: string,
  isActive: boolean,
  runIntervalSeconds: number,
): SearchSetting {
  return { id, platform, locationName, isActive, runIntervalSeconds };
}

/**
 * Hunter seed (15 slots: 180×10 + 300×5).
 * Active settings use 10 slots → 5 remaining for create demos.
 */
export const homeGroupsFixture: SearchGroup[] = [
  {
    id: "g1",
    searchType: "car",
    locationName: "Atlanta, GA, USA",
    radiusMiles: 35,
    carQuery: {
      makes: ["Honda", "Toyota"],
      minPrice: 5000,
      maxPrice: 18000,
      minYear: 2016,
      maxYear: 2022,
      maxMileage: 90000,
    },
    settings: [
      setting("g1-fb", "facebook", "Atlanta, GA", true, 180),
      setting("g1-ou", "offerUp", "Atlanta, GA", true, 180),
      setting("g1-cl", "craigslist", "Marietta, GA", true, 300),
    ],
  },
  {
    id: "g2",
    searchType: "iphone",
    locationName: "Atlanta, GA, USA",
    radiusMiles: 25,
    customLabel: "iPhone 13–15 Pro",
    settings: [
      setting("g2-fb", "facebook", "Atlanta, GA", true, 180),
      setting("g2-ou", "offerUp", "Decatur, GA", true, 180),
    ],
  },
  {
    id: "g3",
    searchType: "car",
    locationName: "Miami, FL, USA",
    radiusMiles: 40,
    carQuery: {
      makes: ["BMW", "Mercedes-Benz"],
      minPrice: 12000,
      maxPrice: 35000,
      minYear: 2015,
      maxMileage: 70000,
    },
    settings: [
      setting("g3-fb", "facebook", "Miami, FL", true, 180),
      setting("g3-ou", "offerUp", "Fort Lauderdale, FL", true, 300),
      setting("g3-cl", "craigslist", "Miami, FL", true, 300),
    ],
  },
  {
    id: "g4",
    searchType: "custom",
    locationName: "Atlanta, GA, USA",
    radiusMiles: 20,
    customLabel: "Cameras & lenses",
    settings: [
      setting("g4-fb", "facebook", "Atlanta, GA", true, 180),
      setting("g4-ou", "offerUp", "Buckhead, GA", true, 180),
    ],
  },
];

/** @deprecated Prefer building plan from SubscriptionStore + groups. */
export const homeFixture: HomeState = {
  plan: {
    tier: "hunter",
    displayName: "Hunter",
    maxSearches: 15,
    usedSearches: 10,
    credits: [
      { intervalSeconds: 180, total: 10, remaining: 3 },
      { intervalSeconds: 300, total: 5, remaining: 2 },
    ],
  },
  groups: homeGroupsFixture,
};
