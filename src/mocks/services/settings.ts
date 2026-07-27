import {
  isAppearanceMode,
  loadCachedAppearance,
  saveCachedAppearance,
} from "@/lib/appearance";
import {
  initialSettingsState,
  type DistanceUnit,
  type RefundPreference,
  type SettingsState,
  type UserPreferences,
} from "@/mocks/data/settings";
import { mockDelay } from "@/mocks/delay";

let state: SettingsState = structuredClone(initialSettingsState);
let appearanceHydrated = false;

async function hydrateAppearanceFromCache(): Promise<void> {
  if (appearanceHydrated) return;
  appearanceHydrated = true;
  const cached = await loadCachedAppearance();
  if (cached != null) {
    state = {
      ...state,
      preferences: { ...state.preferences, appearance: cached },
    };
  }
}

export async function getSettings(): Promise<SettingsState> {
  await hydrateAppearanceFromCache();
  await mockDelay();
  return structuredClone(state);
}

/** Sync read for list cells (mock in-memory prefs). */
export function getDistanceUnitSync(): DistanceUnit {
  return state.preferences.distanceUnit;
}

export async function updatePreferences(
  patch: Partial<UserPreferences>,
): Promise<UserPreferences> {
  await hydrateAppearanceFromCache();
  await mockDelay();
  state = {
    ...state,
    preferences: { ...state.preferences, ...patch },
  };
  if (patch.appearance !== undefined && isAppearanceMode(patch.appearance)) {
    await saveCachedAppearance(patch.appearance);
  }
  return structuredClone(state.preferences);
}

export async function updateRefundPreference(
 preference: RefundPreference,
): Promise<RefundPreference> {
 await mockDelay();
 state = {
 ...state,
 refundSaver: { ...state.refundSaver, preference },
 };
 return preference;
}

export async function updateRefundConsent(consent: boolean): Promise<boolean> {
 await mockDelay();
 state = {
 ...state,
 refundSaver: {
 ...state.refundSaver,
 collectingRefundDataConsent: consent,
 },
 };
 return consent;
}

export async function setSubscriptionFlags(flags: {
  hasActiveSubscription: boolean;
  hasActiveTrial?: boolean;
}): Promise<void> {
  await mockDelay();
  state = {
    ...state,
    hasActiveSubscription: flags.hasActiveSubscription,
    hasActiveTrial: flags.hasActiveTrial ?? state.hasActiveTrial,
  };
}

export async function mockLogout(): Promise<void> {
 await mockDelay();
}

/** Mock account delete via session token - no password challenge. */
export async function mockDeleteAccount(): Promise<void> {
 await mockDelay();
}

export function refundPreferenceLabel(preference: RefundPreference): string {
 switch (preference) {
 case "decline":
 return "Always decline";
 case "grant":
 return "Always refund";
 default:
 return "No preference";
 }
}
