import AsyncStorage from "@react-native-async-storage/async-storage";
import { makeAutoObservable, reaction, runInAction } from "mobx";

import { setAuthToken } from "@/api/agent";

const JWT_KEY = "jwt";

export default class CommonStore {
  token: string | null = null;
  appLoaded = false;
  /** One-shot notice for UI toast when bootstrap/getUser can't reach the API. */
  pendingServerUnreachableToast = false;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });

    reaction(
      () => this.token,
      (token) => {
        if (token) {
          void AsyncStorage.setItem(JWT_KEY, token);
        } else {
          void AsyncStorage.removeItem(JWT_KEY);
        }
      },
    );
  }

  setToken(token: string | null): void {
    this.token = token;
    setAuthToken(token);
  }

  setAppLoaded(): void {
    this.appLoaded = true;
  }

  queueServerUnreachableToast(): void {
    this.pendingServerUnreachableToast = true;
  }

  consumeServerUnreachableToast(): boolean {
    if (!this.pendingServerUnreachableToast) return false;
    this.pendingServerUnreachableToast = false;
    return true;
  }

  async loadToken(): Promise<void> {
    const token = await AsyncStorage.getItem(JWT_KEY);
    runInAction(() => {
      this.token = token;
      this.appLoaded = true;
    });
    setAuthToken(token);
  }
}
