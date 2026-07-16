import {
 initialSettingsState,
 type RefundPreference,
 type SettingsState,
 type UserPreferences,
} from "@/mocks/data/settings";

let state: SettingsState = structuredClone(initialSettingsState);

function delay(ms = 120): Promise<void> {
 return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getSettings(): Promise<SettingsState> {
 await delay();
 return structuredClone(state);
}

export async function updatePreferences(
 patch: Partial<UserPreferences>,
): Promise<UserPreferences> {
 await delay();
 state = {
 ...state,
 preferences: { ...state.preferences, ...patch },
 };
 return structuredClone(state.preferences);
}

export async function updateRefundPreference(
 preference: RefundPreference,
): Promise<RefundPreference> {
 await delay();
 state = {
 ...state,
 refundSaver: { ...state.refundSaver, preference },
 };
 return preference;
}

export async function updateRefundConsent(consent: boolean): Promise<boolean> {
 await delay();
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
  await delay(40);
  state = {
    ...state,
    hasActiveSubscription: flags.hasActiveSubscription,
    hasActiveTrial: flags.hasActiveTrial ?? state.hasActiveTrial,
  };
}

export async function mockLogout(): Promise<void> {
 await delay(200);
}

/** Mock account delete via session token - no password challenge. */
export async function mockDeleteAccount(): Promise<void> {
 await delay(280);
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
