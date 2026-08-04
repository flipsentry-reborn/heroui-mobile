# UserFilters — Scoped Vehicle vs Custom

How FlipSentry UserFilters tag listings, appear in the feed, and differ between **Vehicle** and **Custom**. Applies to backend + heroui-mobile (mock + live). See also [`SEARCH_STORE.md`](./SEARCH_STORE.md) for search-group slots.

## Why this exists

Enabled filters used to narrow **All / For You / typed tabs** via a client `activeFilterIds` AND on `filterIds`. Turning on a Vehicle filter hid iPhone / couch / other custom deals. Custom filters also had no search-group scope, so they could tag anything.

## Core rules

| Rule | Behavior |
|------|----------|
| **`isActive`** | Controls tagging, dedicated `filter:{id}` tab, and notifications. **Does not** narrow All / typed / Best Picks / Price Drop. |
| **Vehicle** | Car-origin feeds only. No `searchGroupIds` picker / storage. Criteria: price, year, mileage, keywords. |
| **Custom** | Requires **≥1** `searchGroupIds` (non-car: iPhone / Custom searches). Match only when feed groups intersect those ids. Criteria: price + keywords. |
| **Narrowing** | Only on dedicated `filter:{id}` tabs (via `filterIds` query / tab availability). |
| **Live SignalR** | `bucketsForLiveFeed` still adds `filter:{id}` when `feed.filterIds` overlaps filter tabs; it does **not** gate All on active filters. |

## End-to-end flow

```
Create / update UserFilter (API or mock)
        │
        ▼
Backend: validate + persist SearchGroups (Custom only)
        │
        ▼
Retag: clear old Item↔Filter links → MatchAll → write links
        │
        ▼
Feed item carries filterIds / filters[] summaries
        │
        ├─ All / typed tabs     → no filterIds query from isActive
        ├─ filter:{id} tab      → filterIds = [that id]
        └─ Live ReceiveFeed     → buckets include filter tabs by overlap only
```

### Matching (`UserFilterMatcher.MatchAll`)

1. Keywords (title / description includers) always apply.
2. **Vehicle:** skip unless `isCarOriginFeed` (car SearchGroup and/or car listing). Then price / year / mileage.
3. **Custom:** skip unless `searchGroupIds` intersects feed’s search groups. Then price.

### Client feed gate (removed)

`FeedStore.filterIdsFor(bucket)`:

- `saved` → no filterIds
- typed / All → **no** `activeFilterIds` fallback
- `filter:{id}` → that id (via tab hydration or key parse)

`bucketsForLiveFeed(..., _activeFilterIds)` ignores the selection AND.

## Backend surface

- Join entity `UserFilterSearchGroup` + migration with Custom backfill to all of the user’s search groups.
- DTO field `SearchGroupIds`: required (≥1) on create/update for Custom; cleared/ignored for Vehicle.
- Retag: `UserFilterRetagService` / create path in `ItemFilterProcessingService`.
- Tests: `Tests/UnitTests/Core/Helpers/UserFilterMatcherTests.cs`.

## Client models / API

- `UserFilter.searchGroupIds: string[]` (empty for Vehicle).
- Create/Update inputs accept optional `searchGroupIds` (Custom only).
- Live HTTP: `src/api/http/filters.ts` maps `searchGroupIds` both ways.
- Agent: screens → `FilterStore` → `agent.Filters` → mock **or** live (`USE_MOCK` / `extra.useMock`). Screens never branch on mock.

## UI

- **Vehicle:** no search-groups row.
- **Custom:** required “Search groups” row → `filter-search-groups-sheet.tsx`
  - Non-car groups only; title like Home (`Iphones` / custom query).
  - Location · radius; platform icons; Active / Paused chips.
  - Active first; paused visible but not selectable.
- Filters list summary shows selected group titles for Custom.

## Mock-only retag

Live retag is server-side. Mock mirrors it in `src/mocks/services/feed-filter-match.ts`:

- `retagMockFeedsForFilter` / `clearMockFilterLinks` mutate `MOCK_FEED_ITEMS.filterIds`.
- Called from mock Filters create / update / delete / hydrate.
- Guarded with `USE_MOCK`. GetFeed only **reads** tagged ids (no dynamic match per request).
- Fixture aliases: `group-iphones` → `g2`, `group-cars` → `g1`, etc.

## Quick checklist

- [ ] Custom save blocked with zero search groups
- [ ] Vehicle never sends / stores search groups
- [ ] Enabling a Vehicle filter does not empty All of iPhones
- [ ] `filter:{id}` tab still shows only tagged deals
- [ ] Mock create/update retags local feed; live relies on API
