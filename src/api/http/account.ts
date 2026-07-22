import { requests } from "@/api/http/client";
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

export const liveAccount = {
  login: (user: UserLoginFormValues) =>
    requests.post<User>("/api/user/login", user),
  register: (user: UserRegisterFormValues) =>
    requests.post<User>("/api/user/register", user),
  forgotPassword: (email: string) =>
    requests.post<void>("/api/user/forgot-password", { email }),
  resetPassword: (email: string, token: string, newPassword: string) =>
    requests.post<void>("/api/user/reset-password", {
      email,
      token,
      newPassword,
    }),
  current: () => requests.get<User>("/api/user"),
  deleteAccount: (password: string) =>
    requests.post<void>("/api/user/delete-account", { password }),
  startTrial: (deviceId: string) =>
    requests.post<number>("/api/user/start-trial", { deviceId }),
  sendPhoneVerification: (request: PhoneVerificationRequest) =>
    requests.post<void>("/api/user/send-phone-verification", request),
  verifyPhone: (request: PhoneVerificationCodeRequest) =>
    requests.post<void>("/api/user/verify-phone", request),
  sendPhoneLoginCode: (request: PhoneLoginSendCodeRequest) =>
    requests.post<void>("/api/user/phone-login/send-code", request),
  verifyPhoneLogin: (request: PhoneLoginVerifyRequest) =>
    requests.post<User>("/api/user/phone-login/verify", request),
  getPreferences: () => requests.get<UserPreferences>("/api/user/preferences"),
  updatePreferences: (prefs: UserPreferences) =>
    requests.put<UserPreferences>("/api/user/preferences", prefs),
  getNotificationSettings: () =>
    requests.get<UserNotificationSettings>("/api/user/notification-settings"),
  updateNotificationSettings: (settings: Partial<UserNotificationSettings>) =>
    requests.put<UserNotificationSettings>(
      "/api/user/notification-settings",
      settings,
    ),
  createMobileWebToken: () =>
    requests.post<{ token: string }>("/api/user/create-mobile-web-token", {}),
};
