import type { PlanAccent } from "@/mocks/data/subscription";

/**
 * Pre–bright-dark canvas (`global.css` before elevated outdoor wash).
 * Used on subscription page in dark mode only — near-black Uber wash.
 * Hex (not oklch): ScrollShadow → colorKit only parses hex/rgb/hsl.
 * `oklch(12% 0 0)` ≈ `#060606`.
 */
export const SUBSCRIPTION_DARK_BACKGROUND = "#060606";

/**
 * Accent glow wash (top-right → bottom-left).
 * End sits past the corner so the transparent/dark zone does not land early.
 */
export const PLAN_GLOW_GRADIENT = {
  start: { x: 1, y: 0 },
  end: { x: -0.08, y: 1.18 },
} as const;

export type PlanPalette = {
  gradient: [string, string, string, string];
  iconFrom: string;
  iconTo: string;
  glow: string;
  /** Softer counter-glow that gives the dark surface more depth. */
  ambientGlow: string;
  /** Bolt fill on the hexagon badge. Defaults to white on colored plans. */
  boltFill?: string;
  /** Primary text on the plan card surface. */
  text: string;
  /** Secondary / muted text on the plan card surface. */
  textMuted: string;
};

/** Shared card accents for subscription screen + settings plan card. */
export const PLAN_ACCENTS: Record<PlanAccent, PlanPalette> = {
  teal: {
    gradient: ["#0B1B26", "#09161F", "#071016", "#040506"],
    iconFrom: "#22d3ee",
    iconTo: "#0ea5a4",
    glow: "rgba(34, 211, 238, 0.32)",
    ambientGlow: "rgba(14, 165, 164, 0.14)",
    text: "#FFFFFF",
    textMuted: "rgba(255,255,255,0.55)",
  },
  purple: {
    gradient: ["#1B0B2E", "#130A25", "#0B0817", "#040506"],
    iconFrom: "#7538F8",
    iconTo: "#F690EC",
    glow: "rgba(117, 56, 248, 0.34)",
    ambientGlow: "rgba(246, 144, 236, 0.13)",
    text: "#FFFFFF",
    textMuted: "rgba(255,255,255,0.55)",
  },
  rose: {
    gradient: ["#260C19", "#1A0912", "#10080D", "#040506"],
    iconFrom: "#FB7185",
    iconTo: "#E11D48",
    glow: "rgba(251, 113, 133, 0.33)",
    ambientGlow: "rgba(225, 29, 72, 0.14)",
    text: "#FFFFFF",
    textMuted: "rgba(255,255,255,0.55)",
  },
  gold: {
    gradient: ["#281B08", "#1C1408", "#100D08", "#050505"],
    iconFrom: "#FBBF24",
    iconTo: "#F59E0B",
    glow: "rgba(251, 191, 36, 0.31)",
    ambientGlow: "rgba(245, 158, 11, 0.13)",
    text: "#FFFFFF",
    textMuted: "rgba(255,255,255,0.55)",
  },
};

/** Unsubscribed / free — white surface + white badge (dark bolt for contrast). */
export const NOT_SUBSCRIBED_PALETTE: PlanPalette = {
  gradient: ["#FFFFFF", "#FAFAFA", "#F5F5F5", "#F0F0F0"],
  iconFrom: "#FFFFFF",
  iconTo: "#F2F2F2",
  glow: "rgba(0, 0, 0, 0.04)",
  ambientGlow: "rgba(0, 0, 0, 0.025)",
  boltFill: "#111111",
  text: "#111111",
  textMuted: "rgba(0,0,0,0.45)",
};

export const NOT_SUBSCRIBED_ICON_STROKE = "rgba(0,0,0,0.14)";
