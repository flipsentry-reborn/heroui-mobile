# FlipSentry → HeroUI Mobile Port

Expo Go UI rebuild of `mobile-app` using **HeroUI Native + Pro**.  
Supports **Mock** and **Live** API modes via `EXPO_PUBLIC_USE_MOCK`.

## Goal

Port FlipSentry screens and flows into `heroui-mobile`. With `USE_MOCK=true` (default), fixtures power the app. With `USE_MOCK=false`, the unified `agent` talks to the backend at `EXPO_PUBLIC_API_URL` (default `http://192.168.0.106:9000`).

## Locked decisions

| Decision | Choice |
|----------|--------|
| Visual language | Uber neutrals - oklch grayscale, dark white accent / light black accent (see `global.css`) |
| Components | `heroui-native-pro` first → `heroui-native` OSS → minimal custom only |
| Styling | Uniwind + `className` only — **never** `StyleSheet` / NativeWind / shadcn |
| Data | Dual: mocks **or** live REST via `agent` (`USE_MOCK`) |
| State | MobX stores (`src/store`) — split by domain; see **`SEARCH_STORE.md`** |
| API façade | `src/api/agent.ts` — mock services or `src/api/http/*` (Axios) |
| Reference | `mobile-app` = flows/screens reference only |

UI preferences, settings type scale, buttons, and copy rules: **`DESIGN.md`**.

## Cursor AI tooling

| Tool | Role |
|------|------|
| MCP `heroui-native-pro` | Live component docs / theme (`native-mcp.heroui.pro`) - use before implementing screens |
| MCP `heroui-pro` | Web React docs (optional; not for RN screens) |
| Skill `heroui-native-pro` | Native Pro patterns (user skills) |
| Skill `heroui-pro-design-taste` | Design system polish (user skills) |
| Rules `.cursor/rules/*.mdc` | Project constraints (theme, dual-mode API, port scope) |

Config: `.cursor/mcp.json` (gitignored). Rules: `.cursor/rules/`.

## Principles

| Rule | Detail |
|------|--------|
| Expo Go first | Ship only what runs in Expo Go |
| Dual API | Screens → MobX stores → `agent` → mocks **or** live HTTP. No SignalR/Adapty yet. Screens never branch on `USE_MOCK`. |
| Screens thin | `src/app` routes compose UI; domain logic in stores + `src/domain/*` |
| Models on demand | Copy/adapt from `mobile-app/models` into `src/models` when needed |
| HeroUI only | Prefer `heroui-native-pro`, then `heroui-native`; no web `@heroui/react` for screens |
| No StyleSheet | Never `StyleSheet.create` — use Uniwind `className` + HeroUI props (see `.cursor/rules/no-stylesheet.mdc`) |
| MobX (split) | Prefer focused stores (SearchStore, SubscriptionStore). Do not port god-stores from mobile-app |
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
│ │ ├── data/ # fixtures (incl. tier-slots)
│ │ └── services/ # AsyncStorage-backed mock APIs
│ ├── models/ # from mobile-app/models as needed
│ ├── domain/ # pure rules (search slots, etc.)
│ ├── store/ # MobX root + domain stores
│ ├── api/ # agent.ts + http/* + config (Mock/Live)
│ ├── lib/ # small helpers (money, dates, storage)
│ ├── constants/ # routes, category ids
│ ├── assets/
│ │ └── placeholders/ # empty.png for maps / media stubs
│ └── global.css # HeroUI + Theme Builder tokens
├── assets/ # app icon / splash
├── SEARCH_STORE.md # search stores + creation rules
└── PORTING.md
```

## Tabs (match old app)

- Home
- Feed
- Help
- Settings

## Auth

Routes: `(auth)/login` (Login | Create Account; email or phone), `(auth)/verify`, `(auth)/forgot-password`.  
Gate: `src/app/index.tsx` → login → phone verify → tabs.

### Mock credentials (`USE_MOCK=true`)

| Field | Value |
|-------|--------|
| Email | `test@flipsentry.com` |
| Phone | `+12345678901` |
| Password | `password` |
| OTP | `000000` |

### Live (`USE_MOCK=false`)

- JWT in AsyncStorage key `jwt`; Bearer on Axios requests.
- Base URL: `EXPO_PUBLIC_API_URL` (see `.env.example`).
- GroupSearch: **basic radius only** (no advanced/point mode, no population).

## Dual-mode rules

- Preferred path: UI (`observer`) → `useStore()` → `agent` → mocks or `api/http/*`.
- Toggle: `EXPO_PUBLIC_USE_MOCK` / `app.config.ts` → `extra.useMock`.
- Mock services may persist with AsyncStorage; seed from fixtures on first launch.
- Subscription tiers for slot rules: **starter / hunter / master** — see `SEARCH_STORE.md`.

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

- SignalR live feed hub  
- Adapty IAP SDK / Expo push token registration  
- Population heatmap / advanced (point) map search mode  
- EAS/dev-client-only native map work  
- Full 1:1 file copy of `mobile-app`  
- NativeWind / old RN primitives component stack  

## Smoke checklist

1. `EXPO_PUBLIC_USE_MOCK=true` → login with mock credentials → feed/home/settings → logout.  
2. Register → verify with OTP `000000` → tabs.  
3. `EXPO_PUBLIC_USE_MOCK=false` + backend on `192.168.0.106:9000` → email/phone login → feed list → create basic-radius search.

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
| `SEARCH_STORE.md` | MobX SearchStore, slot tables, creation rules |

## Related repos

- **UI playground (this repo):** `heroui-mobile` 
- **Production app:** `mobile-app` - later target for real native features and APIs 
