import AsyncStorage from "@react-native-async-storage/async-storage";
import { Uniwind } from "uniwind";

export type AppearanceMode = "light" | "dark" | "system";

const APPEARANCE_STORAGE_KEY = "@flipsentry/appearance";

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

export function isAppearanceMode(value: unknown): value is AppearanceMode {
  return value === "light" || value === "dark" || value === "system";
}

/** Apply app appearance via Uniwind (HeroUI tokens follow). */
export function applyAppearance(mode: AppearanceMode | null | undefined): void {
  const next = isAppearanceMode(mode) ? mode : "dark";
  Uniwind.setTheme(next);
}

/** Read last-chosen appearance from local storage (null if unset/invalid). */
export async function loadCachedAppearance(): Promise<AppearanceMode | null> {
  try {
    const raw = await AsyncStorage.getItem(APPEARANCE_STORAGE_KEY);
    return isAppearanceMode(raw) ? raw : null;
  } catch {
    return null;
  }
}

/** Persist appearance so it survives app reopen. */
export async function saveCachedAppearance(mode: AppearanceMode): Promise<void> {
  try {
    await AsyncStorage.setItem(APPEARANCE_STORAGE_KEY, mode);
  } catch {
    // Best-effort cache; ignore storage failures in mock builds.
  }
}
