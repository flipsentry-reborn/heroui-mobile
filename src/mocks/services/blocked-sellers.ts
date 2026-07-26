import {
  blockedSellersFixture,
  type MockBlockedSeller,
} from "@/mocks/data/blocked-sellers";
import { readJson, writeJson } from "@/lib/storage";

const KEY = "@flipsentry/blocked-sellers";

let sellers: MockBlockedSeller[] = structuredClone(blockedSellersFixture);
let hydrated = false;

function delay(ms = 100): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function hydrate(): Promise<void> {
  if (hydrated) return;
  hydrated = true;
  const stored = await readJson<MockBlockedSeller[]>(KEY);
  if (stored != null) sellers = stored;
}

async function persist(): Promise<void> {
  await writeJson(KEY, sellers);
}

export async function listBlockedSellers(): Promise<MockBlockedSeller[]> {
  await hydrate();
  await delay();
  return structuredClone(sellers);
}

export async function blockSeller(data: {
  source: string;
  sellerId: string;
  sellerName: string;
  sellerAvatarUrl: string;
}): Promise<MockBlockedSeller> {
  await hydrate();
  await delay();
  const existing = sellers.find(
    (s) => s.source === data.source && s.sellerId === data.sellerId,
  );
  if (existing) return structuredClone(existing);
  const created: MockBlockedSeller = {
    id: `bs-${Date.now()}`,
    source: data.source,
    sellerId: data.sellerId,
    sellerName: data.sellerName,
    sellerAvatarUrl: data.sellerAvatarUrl,
  };
  sellers = [created, ...sellers];
  await persist();
  return structuredClone(created);
}

export async function unblockSeller(id: string): Promise<boolean> {
  await hydrate();
  await delay();
  const before = sellers.length;
  sellers = sellers.filter((s) => s.id !== id);
  await persist();
  return sellers.length < before;
}
