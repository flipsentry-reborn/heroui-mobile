import type { PlanAccent } from "@/mocks/data/subscription";

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
