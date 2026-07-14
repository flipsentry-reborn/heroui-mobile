export type DistanceUnit = "mi" | "km";
export type RefundPreference = "no_preference" | "grant" | "decline";

export interface UserPreferences {
  showScams: boolean;
  showDealers: boolean;
  showDealerships: boolean;
  showMajorDamaged: boolean;
  showRebuiltTitle: boolean;
  showSalvageTitle: boolean;
  distanceUnit: DistanceUnit;
  darkMode: boolean;
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
    darkMode: true,
  },
  refundSaver: {
    preference: "no_preference",
    collectingRefundDataConsent: true,
  },
  hasActiveSubscription: false,
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
