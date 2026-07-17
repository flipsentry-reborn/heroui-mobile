export interface LocationResult {
  id: string;
  name: string;
  displayName: string;
  secondaryText: string;
  latitude: number;
  longitude: number;
}

/** US places for mock autocomplete + nearby suggestions. */
export const locationsFixture: LocationResult[] = [
  {
    id: "voorhees-nj",
    name: "Voorhees",
    displayName: "Voorhees, NJ, USA",
    secondaryText: "New Jersey, USA",
    latitude: 39.8501,
    longitude: -74.996,
  },
  {
    id: "cherry-hill-nj",
    name: "Cherry Hill",
    displayName: "Cherry Hill, NJ, USA",
    secondaryText: "New Jersey, USA",
    latitude: 39.9348,
    longitude: -75.0307,
  },
  {
    id: "philadelphia-pa",
    name: "Philadelphia",
    displayName: "Philadelphia, PA, USA",
    secondaryText: "Pennsylvania, USA",
    latitude: 39.9526,
    longitude: -75.1652,
  },
  {
    id: "camden-nj",
    name: "Camden",
    displayName: "Camden, NJ, USA",
    secondaryText: "New Jersey, USA",
    latitude: 39.9259,
    longitude: -75.1196,
  },
  {
    id: "atlanta-ga",
    name: "Atlanta",
    displayName: "Atlanta, GA, USA",
    secondaryText: "Georgia, USA",
    latitude: 33.749,
    longitude: -84.388,
  },
  {
    id: "marietta-ga",
    name: "Marietta",
    displayName: "Marietta, GA, USA",
    secondaryText: "Georgia, USA",
    latitude: 33.9526,
    longitude: -84.5499,
  },
  {
    id: "decatur-ga",
    name: "Decatur",
    displayName: "Decatur, GA, USA",
    secondaryText: "Georgia, USA",
    latitude: 33.7748,
    longitude: -84.2963,
  },
  {
    id: "buckhead-ga",
    name: "Buckhead",
    displayName: "Buckhead, Atlanta, GA, USA",
    secondaryText: "Georgia, USA",
    latitude: 33.8395,
    longitude: -84.3794,
  },
  {
    id: "miami-fl",
    name: "Miami",
    displayName: "Miami, FL, USA",
    secondaryText: "Florida, USA",
    latitude: 25.7617,
    longitude: -80.1918,
  },
  {
    id: "fort-lauderdale-fl",
    name: "Fort Lauderdale",
    displayName: "Fort Lauderdale, FL, USA",
    secondaryText: "Florida, USA",
    latitude: 26.1224,
    longitude: -80.1373,
  },
  {
    id: "denver-co",
    name: "Denver",
    displayName: "Denver, CO, USA",
    secondaryText: "Colorado, USA",
    latitude: 39.7392,
    longitude: -104.9903,
  },
  {
    id: "aurora-co",
    name: "Aurora",
    displayName: "Aurora, CO, USA",
    secondaryText: "Colorado, USA",
    latitude: 39.7294,
    longitude: -104.8319,
  },
  {
    id: "austin-tx",
    name: "Austin",
    displayName: "Austin, TX, USA",
    secondaryText: "Texas, USA",
    latitude: 30.2672,
    longitude: -97.7431,
  },
  {
    id: "round-rock-tx",
    name: "Round Rock",
    displayName: "Round Rock, TX, USA",
    secondaryText: "Texas, USA",
    latitude: 30.5083,
    longitude: -97.6789,
  },
  {
    id: "chicago-il",
    name: "Chicago",
    displayName: "Chicago, IL, USA",
    secondaryText: "Illinois, USA",
    latitude: 41.8781,
    longitude: -87.6298,
  },
  {
    id: "evanston-il",
    name: "Evanston",
    displayName: "Evanston, IL, USA",
    secondaryText: "Illinois, USA",
    latitude: 42.0451,
    longitude: -87.6877,
  },
  {
    id: "nashville-tn",
    name: "Nashville",
    displayName: "Nashville, TN, USA",
    secondaryText: "Tennessee, USA",
    latitude: 36.1627,
    longitude: -86.7816,
  },
  {
    id: "murfreesboro-tn",
    name: "Murfreesboro",
    displayName: "Murfreesboro, TN, USA",
    secondaryText: "Tennessee, USA",
    latitude: 35.8456,
    longitude: -86.3903,
  },
  {
    id: "los-angeles-ca",
    name: "Los Angeles",
    displayName: "Los Angeles, CA, USA",
    secondaryText: "California, USA",
    latitude: 34.0522,
    longitude: -118.2437,
  },
  {
    id: "pasadena-ca",
    name: "Pasadena",
    displayName: "Pasadena, CA, USA",
    secondaryText: "California, USA",
    latitude: 34.1478,
    longitude: -118.1445,
  },
];

export const DEFAULT_RADIUS_MILES = 40;
export const MIN_RADIUS_MILES = 5;
export const MAX_RADIUS_MILES = 250;
export const RADIUS_STEP_MILES = 5;

export interface LocationDraft {
  main: LocationResult | null;
  radiusMiles: number;
  otherIds: string[];
}

export const defaultLocationDraft: LocationDraft = {
  main: locationsFixture[0] ?? null,
  radiusMiles: DEFAULT_RADIUS_MILES,
  otherIds: [],
};
