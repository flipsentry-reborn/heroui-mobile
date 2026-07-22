import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, type Href } from "expo-router";
import { makeAutoObservable, runInAction } from "mobx";

import agent, { resetAgent } from "@/api/agent";
import type CommonStore from "@/store/commonStore";
import type {
  User,
  UserLoginFormValues,
  UserNotificationSettings,
  UserPreferences,
  UserRegisterFormValues,
} from "@/models/user";

export default class UserStore {
  user: User | null = null;
  preferences: UserPreferences | null = null;
  notificationSettings: UserNotificationSettings | null = null;
  loading = false;
  bootstrapped = false;

  private commonStore: CommonStore;
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

  private async notifySessionReady(): Promise<void> {
    if (!this.isLoggedIn || !this.isPhoneVerified) return;
    try {
      await this.sessionReadyHandler?.();
    } catch {
      // Feed hub / search hydrate is best-effort
    }
  }

  get isLoggedIn(): boolean {
    return !!this.user;
  }

  get isPhoneVerified(): boolean {
    return this.user?.numberConfirmed ?? false;
  }

  private applyUser(user: User): void {
    this.commonStore.setToken(user.token);
    this.user = user;
  }

  async getUser(): Promise<User | null> {
    try {
      const user = await agent.Account.current();
      runInAction(() => {
        this.applyUser(user);
      });
      return user;
    } catch {
      runInAction(() => {
        this.user = null;
      });
      this.commonStore.setToken(null);
      return null;
    }
  }

  async bootstrap(): Promise<void> {
    await this.commonStore.loadToken();
    if (this.commonStore.token) {
      await this.getUser();
    }
    runInAction(() => {
      this.bootstrapped = true;
    });
  }

  async login(creds: UserLoginFormValues): Promise<void> {
    this.loading = true;
    try {
      const user = await agent.Account.login(creds);
      runInAction(() => {
        this.applyUser(user);
      });
      try {
        await agent.Subscription.sync();
      } catch {
        // non-blocking
      }
      if (!user.numberConfirmed) {
        router.replace("/verify" as Href);
      } else {
        await this.notifySessionReady();
        router.replace("/feed" as Href);
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
        this.applyUser(user);
      });
      try {
        await agent.Subscription.sync();
      } catch {
        // non-blocking
      }
      await this.notifySessionReady();
      router.replace("/feed" as Href);
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
        this.applyUser(user);
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
    await this.notifySessionReady();
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
      router.replace("/login" as Href);
    }
  }
}
