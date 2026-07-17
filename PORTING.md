# FlipSentry → HeroUI Mobile Port

Expo Go UI rebuild of `mobile-app` using **HeroUI Native + Pro**. 
Always mock. No real API calls. Keep everything simple.

## Goal

Port FlipSentry screens and flows into `heroui-mobile` so we can iterate on UI with Expo Go. Real networking, maps, and native modules stay in `mobile-app` until we merge later.

## Locked decisions

| Decision | Choice |
|----------|--------|
| Visual language | Uber neutrals - oklch grayscale, dark white accent / light black accent (see `global.css`) |
| Components | `heroui-native-pro` first → `heroui-native` OSS → minimal custom only |
| Styling | Uniwind + `className` only — **never** `StyleSheet` / NativeWind / shadcn |
| Data | Mock only via `src/mocks/*` |
| Reference | `mobile-app` = flows/screens reference only |

UI preferences, settings type scale, buttons, and copy rules: **`DESIGN.md`**.

## Cursor AI tooling

| Tool | Role |
|------|------|
| MCP `heroui-native-pro` | Live component docs / theme (`native-mcp.heroui.pro`) - use before implementing screens |
| MCP `heroui-pro` | Web React docs (optional; not for RN screens) |
| Skill `heroui-native-pro` | Native Pro patterns (user skills) |
| Skill `heroui-pro-design-taste` | Design system polish (user skills) |
| Rules `.cursor/rules/*.mdc` | Project constraints (theme, mock-only, port scope) |

Config: `.cursor/mcp.json` (gitignored). Rules: `.cursor/rules/`.

## Principles

| Rule | Detail |
|------|--------|
| Expo Go first | Ship only what runs in Expo Go |
| Mock always | Screens call `mocks/services/*` only - never axios / SignalR / real APIs |
| Screens thin | `src/app` routes compose UI; little business logic |
| Models on demand | Copy/adapt from `mobile-app/models` when a screen needs them |
| HeroUI only | Prefer `heroui-native-pro`, then `heroui-native`; no web `@heroui/react` for screens |
| No StyleSheet | Never `StyleSheet.create` — use Uniwind `className` + HeroUI props (see `.cursor/rules/no-stylesheet.mdc`) |
| No heavy state lib yet | Local state / light context is enough for mocked UI |
| Stubs for native gaps | Maps, etc. → placeholder PNG; wire real later in `mobile-app` |

## Folder structure

```text
heroui-mobile/
├── src/
│ ├── app/ # Expo Router screens only
│ │ ├── _layout.tsx
│ │ ├── index.tsx # gate → auth | main
│ │ ├── (auth)/ # login, register, forgot, verify
│ │ ├── (onboarding)/ # optional
│ │ └── (main)/
│ │ ├── _layout.tsx
│ │ ├── (tabs)/ # home, feed, help, settings
│ │ ├── feed/ # detail, etc.
│ │ ├── home/ # category flows (iphone / car / …)
│ │ ├── settings/ # profile, notifications, …
│ │ └── subscription/ # trial / paywall UI only
│ ├── components/ # shared UI (HeroUI wrappers)
│ ├── features/ # optional per-domain UI pieces
│ │ ├── feed/
│ │ ├── home/
│ │ └── settings/
│ ├── mocks/
│ │ ├── data/ # fixtures
│ │ └── services/ # getFeed(), getUser(), … → Promise.resolve
│ ├── models/ # from mobile-app/models as needed
│ ├── lib/ # small helpers (money, dates)
│ ├── constants/ # routes, category ids
│ ├── assets/
│ │ └── placeholders/ # empty.png for maps / media stubs
│ └── global.css # HeroUI + Theme Builder tokens
├── assets/ # app icon / splash
└── PORTING.md
```

## Tabs (match old app)

- Home
- Feed
- Help
- Settings

## Auth (mocked)

1. Show login (and related auth screens) as UI.
2. Fake login → navigate into `(main)` tabs.
3. Optional: persist a mock “session” flag in memory/AsyncStorage for reload convenience - still no real API.

## Mocking rules

- Every data read/write goes through `src/mocks/services/*`.
- Services return typed fixtures from `src/mocks/data/*`.
- Use delays (`setTimeout` / fake latency) only when useful for loading UI.
- Never import from `mobile-app` API clients or env that hits backends.

## Models

- Source of truth for shapes: `../mobile-app/models` (and any colocated types in `mobile-app/app`).
- Copy into `src/models` only when a screen needs them.
- Prefer plain TypeScript types/interfaces; keep them small.

## Expo Go stubs

| Feature in old app | In heroui-mobile |
|--------------------|------------------|
| Mapbox / maps | `Image` + `src/assets/placeholders/empty.png` + label |
| Push notifications | UI only (toggles, sheets) |
| SignalR live feed | Mock list / pull-to-refresh with fixtures |
| Payments / IAP | Buttons + mock success/fail sheets |
| Custom native modules | Skip; note TODO → implement in `mobile-app` |

## Port order

1. App shell + theme (`global.css`) + tab layout 
2. Auth screens (mock login) 
3. Feed list + detail 
4. Home / search setup flows 
5. Settings 
6. Subscription / trial UI - see **`SUBSCRIPTION.md`** for plan data / accents / reuse 

## Out of scope (for now)

- Real API, auth tokens, CI install tokens usage in the app runtime 
- EAS/dev-client-only native map work 
- Full 1:1 file copy of `mobile-app` 
- NativeWind / old RN primitives component stack 
- MobX stores from the old app 

## Theme

Theme tokens live in `src/global.css`. Target Uber neutrals (black/white accent).  
Restart Metro after theme changes.

## Fonts

App-wide Britti Sans (HeroUI Pro pricing face). See **`FONTS.md`**.  
Configure weights in `src/global.css` `@theme`; load files in `src/app/_layout.tsx`.

## Related docs

| Doc | Topic |
|-----|--------|
| `DESIGN.md` | UI preferences, copy rules, search filter labels (no “Any”) |
| `FONTS.md` | Britti Sans setup |
| `SUBSCRIPTION.md` | Plan cards / accents / reuse |

## Related repos

- **UI playground (this repo):** `heroui-mobile` 
- **Production app:** `mobile-app` - later target for real native features and APIs 
