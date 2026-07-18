# Design & product decisions

Living preferences for the FlipSentry → HeroUI mobile UI port.  
For port process / folder layout see **`PORTING.md`**. For fonts / subscription details see **`FONTS.md`** and **`SUBSCRIPTION.md`**.

---

## North star

- **Uber-inspired neutrals**, not legacy teal/green brand hardcodes.
- **HeroUI Native + Pro** as the component system; Uniwind `className` for styling.
- **Mock-only** data so Expo Go stays fast and honest.
- Prefer **calm, list-based settings** over flashy marketing chrome (except subscription).

---

## Visual language

| Prefer | Avoid |
|--------|--------|
| Semantic tokens (`bg-background`, `text-foreground`, `bg-accent`, `text-muted`) | Hardcoded greens (`#1DB954`) or old brand teal |
| Dark: near-black bg, **white** accent / black label | Neon purple glow themes as the app default |
| Light: light gray bg, **black** accent / white label | Cream / terracotta “AI default” palettes |
| Small radius (`--radius: 0.25rem` in `global.css`) | Large pill buttons for primary actions in settings |
| Subtle borders / surfaces from HeroUI | Heavy multi-layer shadows, emoji decoration |

Theme source of truth: `src/global.css`. Restart Metro (`npx expo start -c`) after token changes.

### Buttons

| Context | Pattern |
|---------|---------|
| Most actions | `Button variant="secondary"` |
| Primary / accent (Logout, Subscribe CTA, Enable Notifications) | `variant="primary"` + `className="min-h-11 w-full bg-accent"` + `Button.Label className="text-sm text-accent-foreground"` |
| Destructive soft | `variant="danger-soft"` + same `min-h-11` height |
| Settings / system screens | **Default radius** (not `rounded-full`) so Logout / Subscribe / Enable match |

Accent is intentionally high-contrast black/white (Uber), used sparingly.

### Copy

- No em dashes (`—` / `–`) in prose. Use commas, periods, or hyphens.
- Short helper lines under sections (`Typography type="body-xs" className="text-muted"`).
- Mock toasts / alerts may say they are mock when useful.
- **Never use the keyword “Any”** for open filters (competitor language). See **Search filter copy** below.

---

## Search filter copy

House style for unconstrained / open-ended search criteria. Shared helper: `formatOpenRangeLabel` in `src/features/home/search-bottom-sheet-price-sheet.tsx` (also used by search cards). Criteria rows use `formatPriceRangeLabel` (same rules, NBSP hyphens when both ends are set).

### Do not use

| Avoid | Why |
|-------|-----|
| `Any`, `Any - Any`, `Any Make` | Competitor-style keyword; banned product-wide |
| Soft / inventing a brand synonym for “Any” | Prefer explicit open-range forms below |

### Open ranges (price, year, mileage, and similar)

| Case | Display | Examples |
|------|---------|----------|
| Max only | `≤{max}` | `≤15k`, `≤2018`, `≤50k mi` |
| Min only | `{min}+` | `15k+`, `2018+`, `10k+ mi` |
| Both ends | `{min}-{max}` | `5k-15k`, `2016-2022`, `10k-50k mi` |
| Neither (criteria summary) | `No limit` | Price / year / mileage row with nothing set |

- Optional unit (e.g. ` mi`) is appended after the whole token: `≤50k mi`, `10k+ mi`, `10k-50k mi`.
- Use ASCII hyphen `-` (or NBSP-hyphen in criteria), not em/en dashes.
- Search **cards** and **criteria** value labels both follow this table.

### Other empty / unconstrained labels

| Context | Prefer | Avoid |
|---------|--------|--------|
| Car makes (no specific filter) | `All makes` | `Any`, `Any Make` |
| Keywords / platforms / iPhone models (none selected) | `None` | `Any` |
| Number field placeholders | `Min` / `Max` | `Any`, `Empty` (for min/max fields) |
| Year wheel open option | `Min` / `Max` | `Any`, `No min`, `No max` |
| Search type unset / custom query empty | `Empty` (editor empty, not a filter bound) | — |

### Implementation checklist

1. New open-ended range UI → call `formatOpenRangeLabel` (or `formatPriceRangeLabel` for criteria).
2. Do not hardcode `Any` / `No min` / `No max` as chip or criteria **summaries** (wheels/placeholders use `Min` / `Max`).
3. Makes “select all” row label and summary → `All makes`.
4. If you add a new unconstrained filter, pick from the tables above; do not reintroduce `Any`.

---

## Typography (Britti Sans)

Official HeroUI Native approach ([Custom Fonts](https://heroui.com/docs/native/getting-started/theming)):

1. Load with `useFonts` in `src/app/_layout.tsx`
2. Map weights in `global.css` `@theme`:
   - `--font-normal` → Regular  
   - `--font-medium` → Medium  
   - `--font-semibold` → SemiBold  
   - `--font-bold` → Bold  
3. HeroUI `Typography` / `Button.Label` / `ListGroup` use `font-normal|medium|semibold|bold` automatically

| Prefer | Avoid |
|--------|--------|
| Theme classes (`font-normal`, `font-semibold`) | Per-screen Inter / system hardcodes |
| `Fonts.*` only for raw RN `Text` (subscription cards) | Setting `fontFamily` on every `Typography` |
| Names that match `useFonts` keys **and** TTF name tables | Broken variable-font exports with empty name IDs |

Rebuild TTFs with valid names via `scripts/rebuild-britti-fonts.py` if fonts fail to resolve. Details: **`FONTS.md`**.

---

## Settings UI patterns

Settings, Notifications, Profile, and the settings profile header share one list language.

### Building blocks

| Piece | File / API |
|-------|------------|
| Section + rows | `src/features/settings/settings-section.tsx` → `SettingsSection` / `SettingsRow` |
| Appearance picker | `ThemeSelect` (HeroUI `Select`, Light / Dark / System) |
| Profile entry on Settings | `settings-profile-header.tsx` (same row type scale) |
| Profile screen | `src/app/settings/profile.tsx` (sections + rows) |
| Notifications | `src/app/settings/notification.tsx` (reference layout) |

### Type scale (locked)

| Element | Classes / component |
|---------|---------------------|
| Section label | `Typography type="body-xs" className="mx-5 text-muted"` |
| Row title | `text-[15px] font-normal text-foreground` |
| Row description | `text-xs text-muted` |
| Row padding | `ListGroup.Item` → `className="py-2"` |
| Separators | `ml-12 mr-4 opacity-50` |
| List container | `ListGroup variant="secondary" className="mx-3"` |
| Screen scroll | `contentContainerClassName` with `pt-3` / `pb-10` as needed |

### Row content

- Prefer a **title + short description** on every settings row (what it does, not only the label).
- Icons: Ionicons outline, ~20px, `text-muted`.
- Right side: chevron by default, or value / chip / control (`ThemeSelect`, status chip).
- Do **not** invent a second card system for profile/settings lists; reuse `SettingsSection`.

### Appearance

- Store `appearance: "light" | "dark" | "system"` (not a boolean `darkMode`).
- Apply via `src/lib/appearance.ts` + Uniwind themes (including `system`).
- Fitness-style select, not a custom bottom sheet of three giant options.

---

## Subscription

Marketing-grade surface (exception to “calm lists”):

- Gradient plan cards, bolt badge, sparse particles, expandable feature lists
- Settings shows either a compact **Subscribe** CTA or an **active plan** card
- Subscribe button on Settings matches Logout border/height (`min-h-11`, default radius, `bg-accent`)
- Plan accents / data live in mocks + `subscription-theme.ts`

Full reuse guide: **`SUBSCRIPTION.md`**.

---

## Components & tooling

| Prefer | Avoid |
|--------|--------|
| `heroui-native-pro` first, then `heroui-native` | Web `@heroui/react` / `@heroui-pro/react` on screens |
| MCP: `list_components` → `get_component_docs` before building | Guessing compound APIs |
| Uniwind `className` | NativeWind / StyleSheet for colors |
| Split MobX stores (`src/store`) + `agent` mock | God-stores / Axios clients from `mobile-app` |
| `onPress` | `onClick` |

Rules: `.cursor/rules/flipsentry-ui-port.mdc`, `.cursor/rules/heroui-native-screens.mdc`.

---

## Data

| Prefer | Avoid |
|--------|--------|
| Stores → `agent` → `src/mocks/services/*` + fixtures | Axios, SignalR, Adapty, real backends |
| Typed fixtures, AsyncStorage for durable mocks | Importing `mobile-app` API clients |
| Syncing related mocks (e.g. subscribe → settings flags) | Divergent “truth” across services |

`mobile-app` is **screen/flow reference only** — do not copy its styling stack.

---

## Navigation & structure

- Expo Router: thin routes under `src/app`, UI in `src/features/*`
- Tabs: Home, Feed, Help, Settings
- Settings stack: profile, notifications, blocked sellers, subscription, etc.
- Expo Go first; maps / IAP / live feed stay stubbed (see `PORTING.md`)

### Avoid white flash on back / push

Fitness-style setup in `src/app/_layout.tsx`:

1. Expo Router `ThemeProvider` / `DarkTheme` (import from `expo-router`, not `@react-navigation/native`) with `colors.background` / `card` = HeroUI `background`
2. Stack `contentStyle.backgroundColor` from `useThemeColor("background")`
3. `GestureHandlerRootView` same background
4. `expo-system-ui` `SystemUI.setBackgroundColorAsync(background)` when theme changes
5. `app.json` `backgroundColor` fallback for the native root

### Feed categories

- Default tab: **For You** (YouTube-style shelves)
- For You shelves: All / Top Rated / Price Drop / Cars — horizontal rails of 5 items; title row opens that category
- UI: HeroUI `Tabs` with `variant="secondary"` (bottom underline) + `Tabs.ScrollView`
- Pages: `react-native-pager-view` with one mounted list per visited category (swipe + tap tabs)
- Revisiting a category keeps scroll (page stays mounted)
- Lazy: mount a category page on first visit; pull-to-refresh refetches that page only
- Optional Pro `Badge` on a tab label (e.g. Price Drop → Beta)

---

## Checklist for a new settings-like screen

1. Use `SettingsSection` + `SettingsRow` (or the same type scale if you must custom-build).
2. Title 15px + description `text-xs`; section label `body-xs` muted.
3. Primary buttons: `min-h-11`, `bg-accent`, `text-sm`, default radius.
4. Load data only from `mocks/services`.
5. Confirm fonts via theme classes; use `Fonts.*` only for raw `Text`.
6. No em dashes in prose; keep copy short. Search filters: never `Any` — see **Search filter copy**.
7. Match Notifications / Profile spacing (`mx-3` groups, `mx-5` labels).

---

## Related docs

| Doc | Topic |
|-----|--------|
| `PORTING.md` | Scope, folders, port order, Expo stubs |
| `FONTS.md` | Britti load + `@theme` mapping |
| `SUBSCRIPTION.md` | Plans, accents, card behavior |
| `DESIGN.md` (this file) | Preferences and UI decisions |
