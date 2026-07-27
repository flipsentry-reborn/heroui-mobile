import ky, { HTTPError, type KyInstance } from "ky";

import { API_URL } from "@/api/config";
import { userMessageForHttpStatus } from "@/lib/user-error-message";

let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
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
 * Normalize API error bodies for UI / stores:
 * - FluentValidation ExceptionMiddleware → bare JSON string or string[]
 * - ASP.NET model state → { errors: { field: string[] } }
 * - Result.Failure → { error } / { message }
 * - otherwise keep HTTPError (call sites read `.response.status`)
 *   with `.message` rewritten so UI never shows method/URL.
 */
async function normalizeHttpError(error: unknown): Promise<unknown> {
  if (!(error instanceof HTTPError)) return error;

  const status = error.response.status;
  let data: unknown;
  try {
    data = await error.response.clone().json();
  } catch {
    try {
      data = await error.response.clone().text();
    } catch {
      data = undefined;
    }
  }

  if (typeof data === "string" && data.trim()) {
    return withHttpStatus(new Error(data.trim()), status);
  }

  if (Array.isArray(data)) {
    const messages = data
      .filter((part): part is string => typeof part === "string")
      .map((part) => part.trim())
      .filter(Boolean);
    if (messages.length > 0) {
      return withHttpStatus(new Error(messages.join(", ")), status);
    }
  }

  if (data && typeof data === "object") {
    const body = data as ApiErrorBody;
    if (status === 400 && body.errors && typeof body.errors === "object") {
      const modelStateErrors: string[] = [];
      for (const key of Object.keys(body.errors)) {
        const messages = body.errors[key];
        if (messages) modelStateErrors.push(...messages);
      }
      if (modelStateErrors.length > 0) {
        return withHttpStatus(new Error(modelStateErrors.join(", ")), status);
      }
    }
    const message = body.error || body.message;
    if (typeof message === "string" && message.trim()) {
      return withHttpStatus(new Error(message.trim()), status);
    }
  }

  // Ky's default message includes "POST https://…". Strip that for UI.
  error.message = userMessageForHttpStatus(status);
  return error;
}

/** Attach status so call sites can distinguish 401 vs network after body parsing. */
function withHttpStatus(error: Error, status: number): Error {
  (error as Error & { status: number }).status = status;
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
      async ({ request }) => {
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
