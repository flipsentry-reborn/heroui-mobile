# Subscription UI (reuse guide)

HeroUI Pro-inspired plan cards for FlipSentry. UI is mock-only; swap data later for real FlipSentry tiers.

## Files

| Path | Role |
|------|------|
| `src/features/settings/subscription-screen.tsx` | Screen UI: cards, particles, expand animation, CTAs |
| `src/mocks/data/subscription.ts` | Plan models + fixture copy/prices/features |
| `src/mocks/services/subscription.ts` | Mock subscribe / restore |
| `src/app/settings/subscription.tsx` | Route entry |
| `src/lib/fonts.ts` | Britti Sans (`heroSans`) font keys |
| `assets/fonts/BrittiSans-*.ttf` | Display font used on header + cards |

## How a plan is defined

Edit `subscriptionPlans` in `src/mocks/data/subscription.ts`:

```ts
{
 id: "custom", // SubscriptionTier
 displayName: "Custom Heroes",
 description: "Short pitch…",
 price: 249,
 billingPeriod: "month", // "month" | "week" → renders $249/month or $299/week
 priceNote: "Billed monthly · …",
 ctaLabel: "Get Custom Heroes",
 badge?: "Flexible", // optional chip next to title
 accent: "rose", // card glow + bolt colors
 featured?: true, // white primary CTA (Super)
 features: ["…"], // shown when card is expanded
 renewalTitle: "…",
 renewalNote: "…",
}
```

### Billing period

| `billingPeriod` | Price label |
|-----------------|-------------|
| `"month"` | `$199/mo` |
| `"week"` | `$299/wk` |

Current fixtures: Web / Mobile / Custom = **monthly**, Super = **weekly**.

### Accents (card color)

Defined in `ACCENT` inside `subscription-screen.tsx`. Add a new key when you need another look:

| Accent | Used by | Look |
|--------|---------|------|
| `teal` | Web Heroes | Cyan glow |
| `purple` | Mobile Heroes | Purple → pink bolt |
| `rose` | Custom Heroes | Rose / coral |
| `gold` | Super Heroes | Amber / featured |

To add a color:

1. Extend `PlanAccent` in `subscription.ts`
2. Add a matching entry in `ACCENT` in `subscription-screen.tsx` (`gradient`, `iconFrom`, `iconTo`, `glow`)

## FlipSentry swap checklist

When real product specs land:

1. Rename plans / IDs in `subscriptionPlans` (keep or replace `web | mobile | custom | super`)
2. Replace `features`, prices, `billingPeriod`, badges
3. Keep card UI as-is - it maps over `plans` from the mock service
4. Later, point `mocks/services/subscription.ts` at a real purchase API (not in this repo yet)

## UI behavior (do not reimplement)

- Collapsed card: title, description, price, CTA, “Tap to see what's included”
- Tap card (not CTA): expands with staggered feature rows + renewal block
- Particles: sparse, top-right, Reanimated drift
- Font: Britti Sans for heading / plan typography
- Subscribe / restore: mock toasts via `mockSubscribe` / `mockRestorePurchases`

## Route

Settings → Your Subscriptions → `/settings/subscription` 
Stack title: **Subscription** (`src/app/settings/_layout.tsx`).
