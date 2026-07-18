# Subscription UI (reuse guide)

Plan cards for FlipSentry tiers (**Starter / Hunter / Master**). UI is mock-only; slot capacities are enforced in `SEARCH_STORE.md` / `tier-slots.ts`.

## Files

| Path | Role |
|------|------|
| `src/features/settings/subscription-screen.tsx` | Screen UI: cards, particles, expand animation, CTAs |
| `src/features/settings/settings-subscription-card.tsx` | Settings: active plan card or Subscribe CTA |
| `src/features/settings/subscription-theme.ts` | Shared plan accent colors |
| `src/features/settings/hero-bolt-icon.tsx` | Shared hexagon bolt badge |
| `src/mocks/data/subscription.ts` | Plan models + fixture copy/prices/features |
| `src/mocks/services/subscription.ts` | Mock subscribe / restore |
| `src/app/settings/subscription.tsx` | Route entry |
| `src/lib/fonts.ts` | Britti Sans helpers (see also **`FONTS.md`**) |
| `assets/fonts/BrittiSans-*.ttf` | Font files |
| `src/global.css` `@theme` | App-wide `--font-normal` / `--font-bold` mapping |

## How a plan is defined

Edit `subscriptionPlans` in `src/mocks/data/subscription.ts`:

```ts
{
 id: "hunter", // SubscriptionTier: starter | hunter | master
 displayName: "Hunter",
 description: "Short pitch…",
 price: 49,
 billingPeriod: "month", // "month" | "week"
 priceNote: "Billed monthly",
 ctaLabel: "Get Hunter",
 badge?: "Popular",
 accent: "purple", // card glow + bolt colors
 featured?: true, // solid white CTA (Master)
 features: ["…"], // shown when card is expanded; include slot/speed lines
 renewalTitle: "…",
 renewalNote: "…",
}
```

### Billing period

| `billingPeriod` | Price label |
|-----------------|-------------|
| `"month"` | `$49/mo` |
| `"week"` | `$N/wk` |

Current fixtures: Starter / Hunter / Master = **monthly**.

### Accents (card color)

| Accent | Used by | Look |
|--------|---------|------|
| `teal` | Starter | Cyan glow |
| `purple` | Hunter | Purple → pink bolt |
| `gold` | Master | Amber / featured |
| `rose` | (unused / reserved) | Rose / coral |

To add a color:

1. Extend `PlanAccent` in `subscription.ts`
2. Add a matching entry in `ACCENT` in `subscription-screen.tsx` (`gradient`, `iconFrom`, `iconTo`, `glow`)

## Slot tables

Editable in `src/mocks/data/tier-slots.ts`. Features on each plan are generated from those tables. See **`SEARCH_STORE.md`**.

## Checklist when prices change

1. Edit `subscriptionPlans` in `src/mocks/data/subscription.ts`
2. Keep `id` in `starter | hunter | master` so slot tables stay wired
3. Card UI maps over `plans` from the mock service / store
4. Later, point services at a real purchase API (not in this repo yet)

## UI behavior (do not reimplement)

- Collapsed card: title, description, price, CTA, “Tap to see what's included”
- Tap card (not CTA): expands with staggered feature rows + renewal block
- Particles: sparse, top-right, Reanimated drift
- Font: Britti Sans for heading / plan typography
- Subscribe / restore: mock toasts via `mockSubscribe` / `mockRestorePurchases`

## Settings card

`src/features/settings/settings-subscription-card.tsx` sits on Settings (replaces "Your Subscriptions"):

- **No plan** (`currentTier == null`): Britti "Become a Hero." card + **Subscribe** button
- **Active plan**: same accent gradient / bolt / Britti as pricing cards; tap opens `/settings/subscription`

Subscription state comes from `getSubscription()`. `mockSubscribe` also flips `settings.hasActiveSubscription`.

## Route

Settings card or Subscribe → `/settings/subscription`  
Stack title: **Subscription** (`src/app/settings/_layout.tsx`).
