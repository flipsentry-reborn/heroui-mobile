import type { PlanAccent } from "@/mocks/data/subscription";

/**
 * Pre–bright-dark canvas (`global.css` before elevated outdoor wash).
 * Used on subscription page in dark mode only — near-black Uber wash.
 */
export const SUBSCRIPTION_DARK_BACKGROUND = "oklch(12% 0 0)";

/**
 * Accent glow wash (top-right → bottom-left).
 * End sits past the corner so the transparent/dark zone does not land early.
 */
export const PLAN_GLOW_GRADIENT = {
  start: { x: 1, y: 0 },
  end: { x: -0.08, y: 1.18 },
} as const;

/** Shared card accents for subscription screen + settings plan card. */
export const PLAN_ACCENTS: Record<
  PlanAccent,
  {
    gradient: [string, string, string];
    iconFrom: string;
    iconTo: string;
    glow: string;
  }
> = {
  teal: {
    gradient: ["#0b1220", "#071018", "#050505"],
    iconFrom: "#22d3ee",
    iconTo: "#0ea5a4",
    glow: "rgba(34, 211, 238, 0.4)",
  },
  purple: {
    gradient: ["#12081f", "#0a0614", "#050505"],
    iconFrom: "#7538F8",
    iconTo: "#F690EC",
    glow: "rgba(117, 56, 248, 0.45)",
  },
  rose: {
    gradient: ["#1f0814", "#12060c", "#050505"],
    iconFrom: "#FB7185",
    iconTo: "#E11D48",
    glow: "rgba(251, 113, 133, 0.45)",
  },
  gold: {
    gradient: ["#1a1208", "#0e0b06", "#050505"],
    iconFrom: "#FBBF24",
    iconTo: "#F59E0B",
    glow: "rgba(251, 191, 36, 0.4)",
  },
};
