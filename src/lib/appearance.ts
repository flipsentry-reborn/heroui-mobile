import { Uniwind } from "uniwind";

export type AppearanceMode = "light" | "dark" | "system";

export const APPEARANCE_OPTIONS: {
  value: AppearanceMode;
  title: string;
  description: string;
  icon: "sunny-outline" | "moon-outline" | "phone-portrait-outline";
}[] = [
  {
    value: "light",
    title: "Light",
    description: "Always use light appearance",
    icon: "sunny-outline",
  },
  {
    value: "dark",
    title: "Dark",
    description: "Always use dark appearance",
    icon: "moon-outline",
  },
  {
    value: "system",
    title: "System",
    description: "Match your device settings",
    icon: "phone-portrait-outline",
  },
];

/** Apply app appearance via Uniwind (HeroUI tokens follow). */
export function applyAppearance(mode: AppearanceMode): void {
  if (mode === "system") {
    // Runtime accepts "system" for adaptive light/dark
    (Uniwind.setTheme as (theme: string) => void)("system");
    return;
  }
  Uniwind.setTheme(mode);
}
