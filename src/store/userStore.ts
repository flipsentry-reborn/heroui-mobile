import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, type Href } from "expo-router";
import { makeAutoObservable, runInAction } from "mobx";

import agent, { resetAgent } from "@/api/agent";
import { USE_MOCK } from "@/api/config";
import { isMockJwt } from "@/lib/auth-token";
import type CommonStore from "@/store/commonStore";
import { resolvePostAuthHref } from "@/lib/post-auth-href";
import {
  getHttpStatus,
  isServerUnreachableError,
} from "@/lib/user-error-message";
import type {
  User,
  UserLoginFormValues,
  UserNotificationSettings,
  UserPreferences,
  UserRegisterFormValues,
} from "@/models/user";
import type SearchStore from "@/store/searchStore";

export default class UserStore {
  user: User | null = null;
  preferences: UserPreferences | null = null;
  notificationSettings: UserNotificationSettings | null = null;
  loading = false;
  bootstrapped = false;
  /**
   * Soft signal from login/register payload only (API may clear isFirstLogin later).
   * Not used as the onboarding gate — storage + empty search groups are authoritative.
   */
  wasFirstLoginAtAuth: boolean | null = null;

  private commonStore: CommonStore;
  private searchStore: SearchStore | null = null;
  private storeResetFunction: (() => void) | null = null;
  private sessionReadyHandler: (() => Promise<void>) | null = null;

  constructor(commonStore: CommonStore) {
    makeAutoObservable(this, {}, { autoBind: true });
    this.commonStore = commonStore;
  }

  setStoreResetFunction(resetFunction: () => void): void {
    this.storeResetFunction = resetFunction;
  }

  setSessionReadyHandler(handler: () => Promise<void>): void {
    this.sessionReadyHandler = handler;
  }

  setSearchStore(searchStore: SearchStore): void {
    this.searchStore = searchStore;
  }

  private async notifySessionReady(): Promise<void> {
    if (!this.isLoggedIn || !this.isPhoneVerified) return;
    try {
      await this.sessionReadyHandler?.();
    } catch {
      // Feed hub / search hydrate is best-effort
    }
  }

  /** After verified login/phone — onboarding wizard or feed. */
  private async navigateAfterAuth(): Promise<void> {
    await this.notifySessionReady();
    if (this.searchStore == null) {
      router.replace("/feed" as Href);
      return;
    }
    const href = await resolvePostAuthHref(this.searchStore);
    router.replace(href);
  }

  get isLoggedIn(): boolean {
    return !!this.user;
  }

  /** JWT present — session should not be treated as logged out on transient API failures. */
  get hasSession(): boolean {
    return !!this.commonStore.token;
  }

  get isPhoneVerified(): boolean {
    return this.user?.numberConfirmed ?? false;
  }

  private applyUser(user: User, options?: { captureFirstLogin?: boolean }): void {
    this.commonStore.setToken(user.token);
    this.user = user;
    if (options?.captureFirstLogin && this.wasFirstLoginAtAuth == null) {
      this.wasFirstLoginAtAuth = user.isFirstLogin === true;
    }
  }

  /**
   * Load current user with the stored JWT.
   * Only a 401 clears the session — network/5xx must not log the user out.
   */
  async getUser(): Promise<User | null> {
    try {
      const user = await agent.Account.current();
      runInAction(() => {
        this.applyUser(user);
      });
      return user;
    } catch (error) {
      if (getHttpStatus(error) === 401) {
        // During bootstrap the index gate routes on hasSession; once UI is up, navigate away.
        await this.logout({ skipNavigate: !this.bootstrapped });
        return null;
      }
      if (isServerUnreachableError(error)) {
        this.commonStore.queueServerUnreachableToast();
      }
      throw error;
    }
  }

  async bootstrap(): Promise<void> {
    await this.commonStore.loadToken();
    const token = this.commonStore.token;
    if (token) {
      // Drop tokens that don't match the current dual-mode (mock jwt ↔ live jwt).
      if (USE_MOCK !== isMockJwt(token)) {
        this.commonStore.setToken(null);
      } else {
        try {
          await this.getUser();
        } catch {
          // Keep JWT; auth gates use hasSession so a down API does not look like logout.
        }
      }
    }
    runInAction(() => {
      this.bootstrapped = true;
    });
  }

  /** Retry /api/user after a transient outage, then start hubs if verified. */
  async restoreSession(): Promise<User | null> {
    const user = await this.getUser();
    await this.notifySessionReady();
    return user;
  }

  async login(creds: UserLoginFormValues): Promise<void> {
    this.loading = true;
    try {
      const user = await agent.Account.login(creds);
      runInAction(() => {
        this.applyUser(user, { captureFirstLogin: true });
      });
      try {
        await agent.Subscription.sync();
      } catch {
        // non-blocking
      }
      if (!user.numberConfirmed) {
        router.replace("/verify" as Href);
      } else {
        await this.navigateAfterAuth();
      }
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  async sendPhoneLoginCode(phoneNumber: string): Promise<void> {
    await agent.Account.sendPhoneLoginCode({ phoneNumber });
  }

  async verifyPhoneLogin(phoneNumber: string, code: string): Promise<void> {
    this.loading = true;
    try {
      const user = await agent.Account.verifyPhoneLogin({ phoneNumber, code });
      runInAction(() => {
        this.applyUser(user, { captureFirstLogin: true });
      });
      try {
        await agent.Subscription.sync();
      } catch {
        // non-blocking
      }
      await this.navigateAfterAuth();
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  async register(creds: UserRegisterFormValues): Promise<void> {
    this.loading = true;
    try {
      const user = await agent.Account.register(creds);
      runInAction(() => {
        this.applyUser(user, { captureFirstLogin: true });
      });
      try {
        await agent.Subscription.sync();
      } catch {
        // non-blocking
      }
      router.replace("/verify" as Href);
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  async sendPhoneVerification(phoneNumber: string): Promise<void> {
    await agent.Account.sendPhoneVerification({ phoneNumber });
    if (this.user) {
      runInAction(() => {
        if (this.user) this.user.phoneNumber = phoneNumber;
      });
    }
  }

  async verifyPhone(
    phoneNumber: string,
    verificationCode: string,
  ): Promise<void> {
    await agent.Account.verifyPhone({ phoneNumber, verificationCode });
    await this.getUser();
    await this.navigateAfterAuth();
  }

  async forgotPassword(email: string): Promise<void> {
    await agent.Account.forgotPassword(email);
  }

  async loadPreferences(): Promise<void> {
    try {
      const prefs = await agent.Account.getPreferences();
      runInAction(() => {
        this.preferences = prefs;
      });
    } catch {
      // ignore
    }
  }

  async updatePreferences(prefs: UserPreferences): Promise<void> {
    const updated = await agent.Account.updatePreferences(prefs);
    runInAction(() => {
      this.preferences = updated;
    });
  }

  async loadNotificationSettings(): Promise<void> {
    try {
      const settings = await agent.Account.getNotificationSettings();
      runInAction(() => {
        this.notificationSettings = settings;
      });
    } catch {
      // ignore
    }
  }

  async updateNotificationSettings(
    patch: Partial<UserNotificationSettings>,
  ): Promise<void> {
    const updated = await agent.Account.updateNotificationSettings(patch);
    runInAction(() => {
      this.notificationSettings = updated;
    });
  }

  async deleteAccount(password: string): Promise<void> {
    await agent.Account.deleteAccount(password);
    await this.logout({ skipNavigate: false });
  }

  async logout(opts?: { skipNavigate?: boolean }): Promise<void> {
    this.commonStore.setToken(null);
    runInAction(() => {
      this.user = null;
      this.preferences = null;
      this.notificationSettings = null;
      this.wasFirstLoginAtAuth = null;
    });
    resetAgent();
    try {
      await AsyncStorage.multiRemove([
        "jwt",
        "@flipsentry/mock-session",
      ]);
    } catch {
      // ignore
    }
    this.storeResetFunction?.();
    if (!opts?.skipNavigate) {
      router.replace("/welcome" as Href);
    }
  }
}
