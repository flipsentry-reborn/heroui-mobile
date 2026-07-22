/**
 * Mock Account service for USE_MOCK=true.
 * Credentials: test@flipsentry.com / +12345678901 / password — OTP 000000
 */

import { readJson, removeKey, writeJson } from "@/lib/storage";
import type {
  PhoneLoginSendCodeRequest,
  PhoneLoginVerifyRequest,
  PhoneVerificationCodeRequest,
  PhoneVerificationRequest,
  User,
  UserLoginFormValues,
  UserNotificationSettings,
  UserPreferences,
  UserRegisterFormValues,
} from "@/models/user";

const SESSION_KEY = "@flipsentry/mock-session";
const MOCK_OTP = "000000";
const MOCK_EMAIL = "test@flipsentry.com";
const MOCK_PHONE = "+12345678901";
const MOCK_PASSWORD = "password";

function delay(ms = 220): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function makeToken(userId: string): string {
  return `mock-jwt-${userId}`;
}

function baseUser(partial: Partial<User> & Pick<User, "id" | "email">): User {
  return {
    id: partial.id,
    email: partial.email,
    token: partial.token ?? makeToken(partial.id),
    emailConfirmed: partial.emailConfirmed ?? true,
    numberConfirmed: partial.numberConfirmed ?? true,
    firstName: partial.firstName ?? "Test",
    lastName: partial.lastName ?? "User",
    isFirstLogin: partial.isFirstLogin ?? false,
    phoneNumber: partial.phoneNumber ?? MOCK_PHONE,
    isTrialUsed: partial.isTrialUsed ?? false,
    allowSmsAndEmailNotifications:
      partial.allowSmsAndEmailNotifications ?? true,
    trialStartedAt: partial.trialStartedAt,
    trialEndsAt: partial.trialEndsAt,
    trialTier: partial.trialTier,
  };
}

let sessionUser: User | null = null;
let hydrated = false;

const defaultPreferences: UserPreferences = {
  showScams: false,
  showDealers: false,
  showAdvertised: true,
  showDealerships: false,
  showMajorIssue: false,
  showRebuiltTitle: false,
  showSalvageTitle: false,
  distanceUnit: "mi",
};

const defaultNotificationSettings: UserNotificationSettings = {
  pushNotificationsEnabled: true,
  scheduledSilenceEnabled: false,
  scheduledSilenceStartHour: 22,
  scheduledSilenceEndHour: 8,
  scheduledSilenceTimeZoneId: null,
  isCurrentlySilenced: false,
  silenceReason: null,
};

let preferences: UserPreferences = structuredClone(defaultPreferences);
let notificationSettings: UserNotificationSettings = structuredClone(
  defaultNotificationSettings,
);

async function ensureHydrated(): Promise<void> {
  if (hydrated) return;
  const stored = await readJson<User>(SESSION_KEY);
  if (stored?.token) {
    sessionUser = stored;
  }
  hydrated = true;
}

async function persistSession(user: User | null): Promise<void> {
  sessionUser = user;
  if (user) {
    await writeJson(SESSION_KEY, user);
  } else {
    await removeKey(SESSION_KEY);
  }
}

export async function login(creds: UserLoginFormValues): Promise<User> {
  await delay();
  await ensureHydrated();
  const email = creds.email.trim().toLowerCase();
  if (email !== MOCK_EMAIL || creds.password !== MOCK_PASSWORD) {
    throw new Error("Invalid email or password");
  }
  const user = baseUser({
    id: "mock-user-1",
    email: MOCK_EMAIL,
    numberConfirmed: true,
    phoneNumber: MOCK_PHONE,
  });
  await persistSession(user);
  return structuredClone(user);
}

export async function register(
  creds: UserRegisterFormValues,
): Promise<User> {
  await delay(280);
  await ensureHydrated();
  const email = creds.email.trim().toLowerCase();
  if (!email || !creds.password || creds.password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }
  const user = baseUser({
    id: `mock-user-${Date.now()}`,
    email,
    firstName: creds.firstName.trim() || "New",
    lastName: creds.lastName.trim() || "User",
    numberConfirmed: false,
    phoneNumber: "",
    isFirstLogin: true,
    allowSmsAndEmailNotifications: creds.allowSmsAndEmailNotifications,
  });
  await persistSession(user);
  return structuredClone(user);
}

export async function current(): Promise<User> {
  await delay(80);
  await ensureHydrated();
  if (!sessionUser) {
    throw new Error("Unauthorized");
  }
  // Refresh token on current() like backend
  const refreshed = {
    ...sessionUser,
    token: makeToken(sessionUser.id),
  };
  await persistSession(refreshed);
  return structuredClone(refreshed);
}

export async function sendPhoneLoginCode(
  request: PhoneLoginSendCodeRequest,
): Promise<void> {
  await delay();
  if (request.phoneNumber.trim() !== MOCK_PHONE) {
    throw new Error("Phone number not found. Use +12345678901 in mock mode.");
  }
}

export async function verifyPhoneLogin(
  request: PhoneLoginVerifyRequest,
): Promise<User> {
  await delay();
  if (request.phoneNumber.trim() !== MOCK_PHONE) {
    throw new Error("Phone number not found");
  }
  if (request.code.trim() !== MOCK_OTP) {
    throw new Error("Invalid verification code");
  }
  const user = baseUser({
    id: "mock-user-1",
    email: MOCK_EMAIL,
    numberConfirmed: true,
    phoneNumber: MOCK_PHONE,
  });
  await persistSession(user);
  return structuredClone(user);
}

export async function sendPhoneVerification(
  request: PhoneVerificationRequest,
): Promise<void> {
  await delay();
  await ensureHydrated();
  if (!sessionUser) throw new Error("Unauthorized");
  const phone = request.phoneNumber.trim();
  if (!/^\+[0-9]{1,4}[0-9]{7,}$/.test(phone)) {
    throw new Error("Invalid phone number format");
  }
  sessionUser = { ...sessionUser, phoneNumber: phone };
  await persistSession(sessionUser);
}

export async function verifyPhone(
  request: PhoneVerificationCodeRequest,
): Promise<void> {
  await delay();
  await ensureHydrated();
  if (!sessionUser) throw new Error("Unauthorized");
  if (request.verificationCode.trim() !== MOCK_OTP) {
    throw new Error("Invalid verification code");
  }
  sessionUser = {
    ...sessionUser,
    phoneNumber: request.phoneNumber.trim(),
    numberConfirmed: true,
  };
  await persistSession(sessionUser);
}

export async function forgotPassword(email: string): Promise<void> {
  await delay();
  if (email.trim().toLowerCase() !== MOCK_EMAIL) {
    // Match backend: don't leak whether email exists
    return;
  }
}

export async function resetPassword(
  _email: string,
  _token: string,
  _newPassword: string,
): Promise<void> {
  await delay();
}

export async function deleteAccount(password: string): Promise<void> {
  await delay(280);
  await ensureHydrated();
  if (!sessionUser) throw new Error("Unauthorized");
  if (password !== MOCK_PASSWORD) {
    throw new Error("Invalid password");
  }
  await persistSession(null);
}

export async function getPreferences(): Promise<UserPreferences> {
  await delay(80);
  return structuredClone(preferences);
}

export async function updatePreferences(
  prefs: UserPreferences,
): Promise<UserPreferences> {
  await delay(80);
  preferences = structuredClone(prefs);
  return structuredClone(preferences);
}

export async function getNotificationSettings(): Promise<UserNotificationSettings> {
  await delay(80);
  return structuredClone(notificationSettings);
}

export async function updateNotificationSettings(
  patch: Partial<UserNotificationSettings>,
): Promise<UserNotificationSettings> {
  await delay(80);
  notificationSettings = { ...notificationSettings, ...patch };
  return structuredClone(notificationSettings);
}

export async function startTrial(_deviceId: string): Promise<number> {
  await delay();
  return 7;
}

export async function clearMockSession(): Promise<void> {
  await persistSession(null);
}

export async function getMockSessionUser(): Promise<User | null> {
  await ensureHydrated();
  return sessionUser ? structuredClone(sessionUser) : null;
}

export const MOCK_ACCOUNT_CREDENTIALS = {
  email: MOCK_EMAIL,
  phone: MOCK_PHONE,
  password: MOCK_PASSWORD,
  otp: MOCK_OTP,
} as const;
