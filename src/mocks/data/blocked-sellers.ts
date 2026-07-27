export interface MockBlockedSeller {
  id: string;
  source: string;
  sellerId: string;
  sellerName: string;
  sellerAvatarUrl: string;
}

export const blockedSellersFixture: MockBlockedSeller[] = [
  {
    id: "bs1",
    source: "facebookMarketplace",
    sellerId: "seller-quickflip",
    sellerName: "QuickFlip Motors",
    sellerAvatarUrl: "",
  },
  {
    id: "bs2",
    source: "offerUp",
    sellerId: "seller-dealz",
    sellerName: "dealz4u_atl",
    sellerAvatarUrl: "",
  },
];
