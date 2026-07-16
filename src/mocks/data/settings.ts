import type { AppearanceMode } from "@/lib/appearance";

export type DistanceUnit = "mi" | "km";
export type RefundPreference = "no_preference" | "grant" | "decline";
export type { AppearanceMode };

export interface UserPreferences {
  showScams: boolean;
  showDealers: boolean;
  showDealerships: boolean;
  showMajorDamaged: boolean;
  showRebuiltTitle: boolean;
  showSalvageTitle: boolean;
  distanceUnit: DistanceUnit;
  appearance: AppearanceMode;
}

export interface RefundSaverSettings {
  preference: RefundPreference;
  collectingRefundDataConsent: boolean;
}

export interface MockUserProfile {
  firstName: string;
  lastName: string;
  email: string;
  emailConfirmed: boolean;
  phoneNumber: string | null;
  numberConfirmed: boolean;
}

export interface SettingsState {
  preferences: UserPreferences;
  refundSaver: RefundSaverSettings;
  hasActiveSubscription: boolean;
  hasActiveTrial: boolean;
  profile: MockUserProfile;
}

export const initialSettingsState: SettingsState = {
  preferences: {
    showScams: true,
    showDealers: true,
    showDealerships: true,
    showMajorDamaged: true,
    showRebuiltTitle: true,
    showSalvageTitle: true,
    distanceUnit: "mi",
    appearance: "dark",
  },
  refundSaver: {
    preference: "no_preference",
    collectingRefundDataConsent: true,
  },
  hasActiveSubscription: true,
  hasActiveTrial: false,
  profile: {
    firstName: "Alex",
    lastName: "Rivera",
    email: "alex@flipsentry.com",
    emailConfirmed: true,
    phoneNumber: "+1 404 555 0199",
    numberConfirmed: true,
  },
};
