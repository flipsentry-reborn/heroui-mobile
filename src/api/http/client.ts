import ky, { HTTPError, type KyInstance } from "ky";

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

type ApiErrorBody = {
  error?: string;
  message?: string;
  errors?: Record<string, string[]>;
};

/**
 * Match prior axios reject shapes used by auth screens / catalogs:
 * - 400 + ASP.NET model state → string[]
 * - 400 / API message fields → Error
 * - otherwise keep HTTPError (call sites read `.response.status`)
 */
async function normalizeHttpError(error: unknown): Promise<unknown> {
  if (!(error instanceof HTTPError)) return error;

  const status = error.response.status;
  let data: ApiErrorBody | string | undefined;
  try {
    data = (await error.response.clone().json()) as ApiErrorBody;
  } catch {
    try {
      data = await error.response.clone().text();
    } catch {
      data = undefined;
    }
  }

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
      return modelStateErrors;
    }
    const message = data.error || data.message || JSON.stringify(data);
    return new Error(message);
  }

  if (data && typeof data === "object" && (data.error || data.message)) {
    return new Error(data.error || data.message);
  }

  return error;
}

async function withNormalizedErrors<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    throw await normalizeHttpError(error);
  }
}

/** Empty / non-JSON bodies (common on DELETE) should not throw. */
async function readBody<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

const http: KyInstance = ky.create({
  baseUrl: API_URL,
  timeout: 30_000,
  // Match axios: no automatic retries.
  retry: 0,
  hooks: {
    beforeRequest: [
      ({ request }) => {
        if (authToken) {
          request.headers.set("Authorization", `Bearer ${authToken}`);
        }
      },
    ],
    afterResponse: [
      async ({ response }) => {
        const pagination = response.headers.get("pagination");
        if (!pagination) return response;

        const data: unknown = await response.json();
        return new Response(
          JSON.stringify({
            data,
            pagination: JSON.parse(pagination),
          }),
          {
            status: response.status,
            statusText: response.statusText,
            headers: { "Content-Type": "application/json" },
          },
        );
      },
    ],
  },
});

export const requests = {
  get: <T>(url: string, params?: URLSearchParams) =>
    withNormalizedErrors(() =>
      http.get(url, { searchParams: params }).then((res) => readBody<T>(res)),
    ),
  post: <T>(url: string, body: unknown = {}) =>
    withNormalizedErrors(() =>
      http.post(url, { json: body }).then((res) => readBody<T>(res)),
    ),
  put: <T>(url: string, body: unknown) =>
    withNormalizedErrors(() =>
      http.put(url, { json: body }).then((res) => readBody<T>(res)),
    ),
  delete: <T>(url: string) =>
    withNormalizedErrors(() =>
      http.delete(url).then((res) => readBody<T>(res)),
    ),
};

export default http;
