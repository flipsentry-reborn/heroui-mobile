import { homeFixture, type HomeState, type SearchGroup } from "@/mocks/data/home";

let state: HomeState = structuredClone(homeFixture);

function delay(ms = 100): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function getHome(): Promise<HomeState> {
  await delay();
  return structuredClone(state);
}

export async function toggleGroupActive(
  groupId: string,
  active: boolean,
): Promise<SearchGroup | null> {
  await delay(150);
  const group = state.groups.find((g) => g.id === groupId);
  if (!group) return null;
  group.settings = group.settings.map((s) => ({ ...s, isActive: active }));
  return structuredClone(group);
}

export async function deleteGroup(groupId: string): Promise<boolean> {
  await delay(150);
  const before = state.groups.length;
  state.groups = state.groups.filter((g) => g.id !== groupId);
  state.plan.usedSearches = state.groups.length;
  return state.groups.length < before;
}

export function formatIntervalLabel(seconds: number): string {
  if (seconds === 60) return "Instant";
  return `${Math.floor(seconds / 60)} min`;
}

export function formatPriceShort(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return Number.isInteger(k) ? `${k}k` : `${k.toFixed(1)}k`;
  }
  return String(n);
}

export function cityFromLocation(locationName: string): string {
  return locationName.split(",").slice(0, 2).join(",").trim() || "Unknown";
}

export function groupStatus(group: SearchGroup): {
  label: string;
  tone: "success" | "warning" | "muted";
} {
  const total = group.settings.length;
  const active = group.settings.filter((s) => s.isActive).length;
  if (active === total && total > 0) return { label: "All Active", tone: "success" };
  if (active === 0) return { label: "Paused", tone: "muted" };
  return { label: `${active}/${total} Active`, tone: "warning" };
}
