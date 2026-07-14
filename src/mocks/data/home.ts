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
  tier: "hunter";
  displayName: "Hunter";
  maxSearches: 8;
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

/** Hunter plan · 8 car searches (mock). */
export const homeFixture: HomeState = {
  plan: {
    tier: "hunter",
    displayName: "Hunter",
    maxSearches: 8,
    usedSearches: 8,
    credits: [
      { intervalSeconds: 60, total: 3, remaining: 2 },
      { intervalSeconds: 300, total: 3, remaining: 3 },
      { intervalSeconds: 900, total: 2, remaining: 1 },
    ],
  },
  groups: [
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
        setting("g1-fb", "facebook", "Atlanta, GA", true, 60),
        setting("g1-ou", "offerUp", "Atlanta, GA", true, 300),
        setting("g1-cl", "craigslist", "Marietta, GA", true, 900),
      ],
    },
    {
      id: "g2",
      searchType: "car",
      locationName: "Austin, TX, USA",
      radiusMiles: 50,
      carQuery: {
        makes: ["Ford"],
        minPrice: 8000,
        maxPrice: 25000,
        minYear: 2018,
        maxYear: 2024,
      },
      settings: [
        setting("g2-fb", "facebook", "Austin, TX", true, 60),
        setting("g2-cl", "craigslist", "Round Rock, TX", false, 300),
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
        setting("g3-fb", "facebook", "Miami, FL", true, 60),
        setting("g3-ou", "offerUp", "Fort Lauderdale, FL", true, 60),
        setting("g3-cl", "craigslist", "Miami, FL", true, 300),
        setting("g3-kj", "kijiji", "Miami, FL", false, 900),
      ],
    },
    {
      id: "g4",
      searchType: "car",
      locationName: "Chicago, IL, USA",
      radiusMiles: 45,
      carQuery: {
        makes: ["Any"],
        maxPrice: 12000,
        minYear: 2012,
        maxYear: 2019,
      },
      settings: [
        setting("g4-fb", "facebook", "Chicago, IL", false, 300),
        setting("g4-cl", "craigslist", "Chicago, IL", false, 900),
      ],
    },
    {
      id: "g5",
      searchType: "car",
      locationName: "Denver, CO, USA",
      radiusMiles: 60,
      carQuery: {
        makes: ["Subaru", "Jeep"],
        minPrice: 10000,
        maxPrice: 28000,
        minYear: 2017,
      },
      settings: [
        setting("g5-fb", "facebook", "Denver, CO", true, 60),
        setting("g5-ou", "offerUp", "Aurora, CO", true, 300),
      ],
    },
    {
      id: "g6",
      searchType: "car",
      locationName: "Seattle, WA, USA",
      radiusMiles: 30,
      carQuery: {
        makes: ["Tesla", "Toyota"],
        minPrice: 15000,
        maxPrice: 40000,
        minYear: 2019,
      },
      settings: [
        setting("g6-fb", "facebook", "Seattle, WA", true, 60),
        setting("g6-cl", "craigslist", "Bellevue, WA", true, 300),
        setting("g6-ou", "offerUp", "Seattle, WA", true, 900),
      ],
    },
    {
      id: "g7",
      searchType: "car",
      locationName: "Phoenix, AZ, USA",
      radiusMiles: 55,
      carQuery: {
        makes: ["Chevrolet", "GMC"],
        minPrice: 7000,
        maxPrice: 22000,
        maxMileage: 100000,
      },
      settings: [
        setting("g7-fb", "facebook", "Phoenix, AZ", true, 300),
        setting("g7-cl", "craigslist", "Mesa, AZ", true, 900),
      ],
    },
    {
      id: "g8",
      searchType: "car",
      locationName: "Nashville, TN, USA",
      radiusMiles: 40,
      carQuery: {
        makes: ["Nissan", "Hyundai"],
        minPrice: 4000,
        maxPrice: 15000,
        minYear: 2014,
        maxYear: 2021,
      },
      settings: [
        setting("g8-fb", "facebook", "Nashville, TN", true, 60),
        setting("g8-ou", "offerUp", "Nashville, TN", false, 300),
        setting("g8-cl", "craigslist", "Murfreesboro, TN", true, 900),
      ],
    },
  ],
};
