import axios, { AxiosError, type AxiosResponse } from "axios";

import { API_URL } from "@/api/config";

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

/** Register a handler invoked on 401 responses (e.g. clear session). */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

export function resetHttpClient(): void {
  authToken = null;
}

const http = axios.create({
  baseURL: API_URL,
  timeout: 30_000,
});

http.interceptors.request.use((config) => {
  if (authToken && config.headers) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

http.interceptors.response.use(
  async (response) => {
    const pagination = response.headers["pagination"];
    if (pagination) {
      response.data = {
        data: response.data,
        pagination: JSON.parse(pagination as string),
      };
    }
    return response;
  },
  (error: AxiosError) => {
    const status = error.response?.status;
    const data = error.response?.data as
      | { error?: string; message?: string; errors?: Record<string, string[]> }
      | string
      | undefined;

    if (status === 401 && authToken) {
      onUnauthorized?.();
    }

    if (status === 400 && data && typeof data === "object") {
      if (data.errors && typeof data.errors === "object") {
        const modelStateErrors: string[] = [];
        for (const key of Object.keys(data.errors)) {
          const messages = data.errors[key];
          if (messages) modelStateErrors.push(...messages);
        }
        return Promise.reject(modelStateErrors);
      }
      const message = data.error || data.message || JSON.stringify(data);
      return Promise.reject(new Error(message));
    }

    if (data && typeof data === "object" && (data.error || data.message)) {
      return Promise.reject(new Error(data.error || data.message));
    }

    return Promise.reject(error);
  },
);

const responseBody = <T>(response: AxiosResponse<T>): T => response.data;

export const requests = {
  get: <T>(url: string, params?: URLSearchParams) =>
    http.get<T>(url, { params }).then(responseBody),
  post: <T>(url: string, body: unknown = {}) =>
    http.post<T>(url, body).then(responseBody),
  put: <T>(url: string, body: unknown) =>
    http.put<T>(url, body).then(responseBody),
  delete: <T>(url: string) => http.delete<T>(url).then(responseBody),
};

export default http;
