export interface User {
  id: string;
  email: string;
  token: string;
  emailConfirmed: boolean;
  numberConfirmed: boolean;
  firstName: string;
  lastName: string;
  isFirstLogin: boolean;
  phoneNumber: string;
  isTrialUsed: boolean;
  allowSmsAndEmailNotifications: boolean;
  trialStartedAt?: string;
  trialEndsAt?: string;
  trialTier?: "starter" | "hunter" | "master" | "custom";
}

export interface UserNotificationSettings {
  pushNotificationsEnabled: boolean;
  scheduledSilenceEnabled: boolean;
  scheduledSilenceStartHour: number;
  scheduledSilenceEndHour: number;
  scheduledSilenceTimeZoneId: string | null;
  isCurrentlySilenced: boolean;
  silenceReason: "push_disabled" | "scheduled" | null;
}

export interface UserPreferences {
  showScams: boolean;
  showDealers: boolean;
  showAdvertised: boolean;
  showDealerships: boolean;
  showMajorIssue: boolean;
  showRebuiltTitle: boolean;
  showSalvageTitle: boolean;
  distanceUnit: "mi" | "km";
}

export interface UserLoginFormValues {
  email: string;
  password: string;
}

export interface UserRegisterFormValues {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  allowSmsAndEmailNotifications: boolean;
}

export interface PhoneVerificationRequest {
  phoneNumber: string;
}

export interface PhoneVerificationCodeRequest {
  phoneNumber: string;
  verificationCode: string;
}

export interface PhoneLoginSendCodeRequest {
  phoneNumber: string;
}

export interface PhoneLoginVerifyRequest {
  phoneNumber: string;
  code: string;
}
