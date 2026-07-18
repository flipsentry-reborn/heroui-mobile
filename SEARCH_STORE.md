# SearchStore + Creation Rules

Phase 1 port of FlipSentry search-group logic into heroui-mobile. Mock only; no real API.

## Why these choices

| Choice | Why |
|--------|-----|
| **Tiers: Starter / Hunter / Master** | Real FlipSentry marketing model from `mobile-app` trial copy (`7` / `15` / `22` searches; `5-min` / `3-min` / Instant). Replaces HeroUI placeholder tiers for enforceable mock rules. |
| **Hardcoded `allowedSlotSettings`** | Production app loads slots from `GET /api/subscription/status`. Mock needs deterministic tables so create UI can show limits and speeds without a backend. |
| **MobX (split stores)** | User override of earlier “no MobX” PORTING rule. Old `SearchStore` was a god store (groups + feed history + slots). We split: `SearchStore` = groups CRUD; `SubscriptionStore` = tier + slot tables. |
| **Pure `src/domain/search-rules.ts`** | Slot math and validation stay testable without MobX; shared by SearchStore now and CreateGroupStore later. |
| **`src/api/agent.ts` mock façade** | Same call-site shape as mobile-app (`agent.GroupSearch.*`, `agent.Subscription.*`) so stores stay portable; implementations call `mocks/services/*` only — no Axios. |
| **AsyncStorage** | React Native equivalent of localStorage; already used for appearance. Keys below. |
| **Edit deferred** | Create + list / toggle / delete first. `UpdateSearchGroup` types live in models for phase 2. |

## Mock slot tables

Defined in [`src/mocks/data/tier-slots.ts`](src/mocks/data/tier-slots.ts):

| Tier | Total slots | Interval capacities |
|------|-------------|---------------------|
| **starter** | 7 | `300s` × 7 (5-min only) |
| **hunter** | 15 | `180s` × 10, `300s` × 5 |
| **master** | 22 | `60s` × 12, `180s` × 6, `300s` × 4 |

Minimum interval = **60s** (Instant). Labels: `60` → Instant; else `N min`.

## Slot consumption rules

From mobile-app `CreateGroupStore` (enforced in `search-rules`):

1. `slotsNeeded` = number of enabled platforms + extra Facebook suggested locations (center location is included in platform base).
2. Create is blocked when `slotsNeeded` exceeds remaining capacity for the selected interval (and overall remaining).
3. Non-Facebook platforms: one location only.
4. Edit does not consume “new” slots (phase 2); when editing an active group, credit its current interval usage back into options.

Geometry constants (for later wizard): default basic radius `40`; presets `[10, 20, 40, 100, 200]`; equivalent radius `5–250` mi; boundary points within `600` mi.

## Architecture

```text
UI (observer) → useStore() → SearchStore / SubscriptionStore
                              → agent (mock)
                              → mocks/services/*
                              → AsyncStorage + fixtures
                              → domain/search-rules
```

## Persistence keys

| Key | Contents |
|-----|----------|
| `@flipsentry/search-groups` | `SearchGroup[]` |
| `@flipsentry/subscription` | `{ currentTier, hasActiveSubscription, hasActiveTrial }` |

First launch seeds from fixtures; thereafter storage is source of truth.

## Phase 2 (out of scope here)

- Edit search / `loadGroupForEdit`
- Full `CreateGroupStore` wizard
- Feed search history (belongs in FeedStore)
- Real Axios / SignalR
