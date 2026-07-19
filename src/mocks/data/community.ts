/** Community hunters + delayed click activity (visible after ~24h). */

export interface CommunityHunter {
  id: string;
  displayName: string;
  handle: string;
  city: string;
  /** Used for Similar nearby filtering only — not shown in UI. */
  distanceMiles: number | null;
  clicksYesterday: number;
  showActivity: boolean;
  initials: string;
  /** Human-readable last-online label for UI. */
  lastOnlineLabel: string;
  /** What they usually hunt. */
  huntsFocus: string;
  memberSince: string;
}

export interface CommunityClickEvent {
  id: string;
  hunterId: string;
  feedItemId: string;
  /** Days since click (min 1 — activity is delayed 24h). */
  daysAgo: number;
}

function click(
  id: string,
  hunterId: string,
  feedItemId: string,
  daysAgo = 1,
): CommunityClickEvent {
  return { id, hunterId, feedItemId, daysAgo };
}

export interface CommunityTrendingItem {
  feedItemId: string;
  clickCount: number;
  hunterIds: string[];
}

export const CURRENT_HUNTER_ID = "hunter-me";

export const COMMUNITY_HUNTERS: CommunityHunter[] = [
  {
    id: "hunter-me",
    displayName: "You",
    handle: "you",
    city: "Voorhees, NJ",
    distanceMiles: 0,
    clicksYesterday: 5,
    showActivity: true,
    initials: "YO",
    lastOnlineLabel: "Online now",
    huntsFocus: "Cars & phones",
    memberSince: "2024",
  },
  {
    id: "hunter-jordan",
    displayName: "Jordan Lee",
    handle: "jordan",
    city: "Atlanta, GA",
    distanceMiles: 12,
    clicksYesterday: 8,
    showActivity: true,
    initials: "JL",
    lastOnlineLabel: "12m ago",
    huntsFocus: "Cars",
    memberSince: "2023",
  },
  {
    id: "hunter-sam",
    displayName: "Sam Rivera",
    handle: "samr",
    city: "Marietta, GA",
    distanceMiles: 18,
    clicksYesterday: 4,
    showActivity: true,
    initials: "SR",
    lastOnlineLabel: "1h ago",
    huntsFocus: "Phones",
    memberSince: "2024",
  },
  {
    id: "hunter-alex",
    displayName: "Alex Kim",
    handle: "alexk",
    city: "Decatur, GA",
    distanceMiles: 22,
    clicksYesterday: 11,
    showActivity: true,
    initials: "AK",
    lastOnlineLabel: "Online now",
    huntsFocus: "Cars",
    memberSince: "2022",
  },
  {
    id: "hunter-casey",
    displayName: "Casey Ng",
    handle: "caseyn",
    city: "Philadelphia, PA",
    distanceMiles: 28,
    clicksYesterday: 3,
    showActivity: false,
    initials: "CN",
    lastOnlineLabel: "3h ago",
    huntsFocus: "Furniture",
    memberSince: "2025",
  },
  {
    id: "hunter-morgan",
    displayName: "Morgan Blake",
    handle: "morganb",
    city: "Miami, FL",
    distanceMiles: null,
    clicksYesterday: 9,
    showActivity: true,
    initials: "MB",
    lastOnlineLabel: "25m ago",
    huntsFocus: "Cars",
    memberSince: "2023",
  },
  {
    id: "hunter-riley",
    displayName: "Riley Chen",
    handle: "rileyc",
    city: "Austin, TX",
    distanceMiles: null,
    clicksYesterday: 6,
    showActivity: true,
    initials: "RC",
    lastOnlineLabel: "2h ago",
    huntsFocus: "Phones",
    memberSince: "2024",
  },
  {
    id: "hunter-quinn",
    displayName: "Quinn Ortiz",
    handle: "quinno",
    city: "Denver, CO",
    distanceMiles: null,
    clicksYesterday: 2,
    showActivity: true,
    initials: "QO",
    lastOnlineLabel: "Yesterday",
    huntsFocus: "Bikes",
    memberSince: "2025",
  },
  {
    id: "hunter-drew",
    displayName: "Drew Patel",
    handle: "drewp",
    city: "Chicago, IL",
    distanceMiles: null,
    clicksYesterday: 1,
    showActivity: true,
    initials: "DP",
    lastOnlineLabel: "4h ago",
    huntsFocus: "Cars",
    memberSince: "2024",
  },
  {
    id: "hunter-sky",
    displayName: "Sky Nguyen",
    handle: "skyn",
    city: "Seattle, WA",
    distanceMiles: null,
    clicksYesterday: 1,
    showActivity: true,
    initials: "SN",
    lastOnlineLabel: "Online now",
    huntsFocus: "Electronics",
    memberSince: "2023",
  },
  {
    id: "hunter-blake",
    displayName: "Blake Torres",
    handle: "blaket",
    city: "Phoenix, AZ",
    distanceMiles: null,
    clicksYesterday: 1,
    showActivity: true,
    initials: "BT",
    lastOnlineLabel: "6h ago",
    huntsFocus: "Cars",
    memberSince: "2025",
  },
  {
    id: "hunter-jamie",
    displayName: "Jamie Cole",
    handle: "jamiec",
    city: "Boston, MA",
    distanceMiles: null,
    clicksYesterday: 1,
    showActivity: true,
    initials: "JC",
    lastOnlineLabel: "45m ago",
    huntsFocus: "Phones",
    memberSince: "2024",
  },
  {
    id: "hunter-avery",
    displayName: "Avery Brooks",
    handle: "averyb",
    city: "Nashville, TN",
    distanceMiles: null,
    clicksYesterday: 1,
    showActivity: true,
    initials: "AB",
    lastOnlineLabel: "Yesterday",
    huntsFocus: "Furniture",
    memberSince: "2022",
  },
];

/** Clicks already past the 24h delay (daysAgo >= 1). */
export const COMMUNITY_CLICKS: CommunityClickEvent[] = [
  click("c1", "hunter-jordan", "feed-1", 1),
  click("c2", "hunter-alex", "feed-1", 2),
  click("c3", "hunter-sam", "feed-1", 1),
  click("c4", "hunter-morgan", "feed-2", 1),
  click("c5", "hunter-jordan", "feed-2", 3),
  click("c6", "hunter-riley", "feed-2", 1),
  click("c7", "hunter-alex", "feed-2", 2),
  click("c8", "hunter-me", "feed-2", 1),
  click("c9", "hunter-sam", "feed-3", 4),
  click("c10", "hunter-quinn", "feed-3", 1),
  click("c11", "hunter-jordan", "feed-4", 1),
  click("c12", "hunter-alex", "feed-4", 2),
  click("c13", "hunter-morgan", "feed-4", 1),
  click("c14", "hunter-riley", "feed-4", 5),
  click("c15", "hunter-me", "feed-4", 1),
  click("c15b", "hunter-sam", "feed-4", 2),
  click("c15c", "hunter-quinn", "feed-4", 3),
  click("c15d", "hunter-casey", "feed-4", 1),
  click("c15e", "hunter-drew", "feed-4", 2),
  click("c15f", "hunter-sky", "feed-4", 1),
  click("c15g", "hunter-blake", "feed-4", 4),
  click("c15h", "hunter-jamie", "feed-4", 1),
  click("c15i", "hunter-avery", "feed-4", 2),
  click("c16", "hunter-sam", "feed-5", 1),
  click("c17", "hunter-jordan", "feed-5", 3),
  click("c18", "hunter-alex", "feed-6", 1),
  click("c19", "hunter-morgan", "feed-6", 2),
  click("c20", "hunter-riley", "feed-7", 1),
  click("c21", "hunter-me", "feed-7", 2),
  click("c22", "hunter-quinn", "feed-8", 1),
  click("c23", "hunter-sam", "feed-8", 5),
];

export const COMMUNITY_TRENDING: CommunityTrendingItem[] = [
  {
    feedItemId: "feed-2",
    clickCount: 4,
    hunterIds: ["hunter-morgan", "hunter-jordan", "hunter-riley", "hunter-alex"],
  },
  {
    feedItemId: "feed-4",
    clickCount: 13,
    hunterIds: [
      "hunter-jordan",
      "hunter-alex",
      "hunter-morgan",
      "hunter-riley",
      "hunter-me",
      "hunter-sam",
      "hunter-quinn",
      "hunter-drew",
      "hunter-sky",
      "hunter-blake",
      "hunter-jamie",
      "hunter-avery",
    ],
  },
  {
    feedItemId: "feed-1",
    clickCount: 3,
    hunterIds: ["hunter-jordan", "hunter-alex", "hunter-sam"],
  },
  {
    feedItemId: "feed-6",
    clickCount: 2,
    hunterIds: ["hunter-alex", "hunter-morgan"],
  },
  {
    feedItemId: "feed-5",
    clickCount: 2,
    hunterIds: ["hunter-sam", "hunter-jordan"],
  },
];
