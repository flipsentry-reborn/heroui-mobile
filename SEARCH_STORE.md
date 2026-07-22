# SearchStore + Creation / Edit Rules

Phase 1–2 port of FlipSentry search-group logic into heroui-mobile. Mock only; no real API.

## Why these choices

| Choice | Why |
|--------|-----|
| **Tiers: Starter / Hunter / Master** | Real FlipSentry marketing model from `mobile-app` trial copy (`7` / `15` / `22` searches; `5-min` / `3-min` / Instant). Replaces HeroUI placeholder tiers for enforceable mock rules. |
| **Hardcoded `allowedSlotSettings`** | Production app loads slots from `GET /api/subscription/status`. Mock needs deterministic tables so create/edit UI can show limits and speeds without a backend. |
| **MobX (split stores)** | User override of earlier “no MobX” PORTING rule. Old `SearchStore` was a god store (groups + feed history + slots). We split: `SearchStore` = groups CRUD; `SubscriptionStore` = tier + slot tables. |
| **Pure `src/domain/search-rules.ts`** | Slot math and validation stay testable without MobX; shared by create + edit sheets. |
| **`src/api/agent.ts` mock façade** | Same call-site shape as mobile-app (`agent.GroupSearch.*`, `agent.Subscription.*`) so stores stay portable; implementations call `mocks/services/*` only — no Axios. |
| **AsyncStorage** | React Native equivalent of localStorage; already used for appearance. Keys below. |
| **Edit = same sheet** | Edit opens the create bottom sheet prefilled (`editingGroup`), not the old multi-step actions sheet. |

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

1. Each active setting row consumes **1 slot** at its `runIntervalSeconds`.
2. Facebook → one setting per selected location; other platforms → one location (center preferred).
3. Create is blocked when draft usage exceeds remaining capacity for any interval.
4. **Edit credit-back:** global remaining already subtracts the group’s active settings. While editing, UI uses `creditSettingsIntoIntervalOptions` (+1 remaining per active setting, capped at allowed). Mock `updateGroup` validates against used slots from **other** groups only (`countUsedSlotsExcludingGroup`).
5. Paused groups (`isActive === false` on all settings) credit **0** — those slots are already free.
6. Home plan credits card stays **global** (no credit-back).

## Architecture

```text
UI (observer) → useStore() → SearchStore / SubscriptionStore
                              → agent (mock)
                              → mocks/services/*
                              → AsyncStorage + fixtures
                              → domain/search-rules
```

**Edit path:** Home `SearchCards` → `onEdit` → `SearchBottomSheet` with `editingGroup` → `loadGroupForEdit` prefills form + location draft → Save → `searchStore.updateGroup`.

## Persistence keys

| Key | Contents |
|-----|----------|
| `@flipsentry/search-groups` | `SearchGroup[]` |
| `@flipsentry/subscription` | `{ currentTier, hasActiveSubscription, hasActiveTrial }` |

First launch seeds from fixtures; thereafter storage is source of truth.

## API surface (mock)

| Call | Role |
|------|------|
| `GroupSearch.list` | Load groups |
| `GroupSearch.create` | Create + slot check vs global remaining |
| `GroupSearch.update` | Update + slot check excluding edited group |
| `GroupSearch.delete` | Delete |
| `GroupSearch.setActive` | Pause / resume (store ready; UI optional) |

## Still out of scope

- Old-app multi-step Edit actions sheet
- Persisting keywords / full iPhone model price objects beyond `customLabel`
- Feed search history UI

## Related (implemented elsewhere)

- `FeedStore` + live FeedHub SignalR — see `src/store/feedStore.ts` / `src/api/signalr/feedHub.ts`
