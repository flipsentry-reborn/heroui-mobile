import { HTTPError, isHTTPError, isNetworkError, isTimeoutError } from "ky";

const FALLBACK = "Something went wrong";

export const SERVER_UNREACHABLE_MESSAGE =
  "We can't reach the server. Please try again — this usually resolves within 5 minutes.";

/** Ky / fetch-style messages that embed method + absolute URL. */
const REQUEST_FAILED_RE =
  /^Request failed with status code\s+\d+/i;

const ABSOLUTE_URL_RE = /https?:\/\/[^\s]+/gi;

/** HTTP status from ky HTTPError or errors normalized by the HTTP client. */
export function getHttpStatus(error: unknown): number | undefined {
  if (isHTTPError(error) || error instanceof HTTPError) {
    return error.response.status;
  }
  if (error && typeof error === "object") {
    if ("status" in error && typeof (error as { status: unknown }).status === "number") {
      return (error as { status: number }).status;
    }
    const response = (error as { response?: { status?: unknown } }).response;
    if (response && typeof response.status === "number") {
      return response.status;
    }
  }
  return undefined;
}

/** True when the request never got a usable API response (down / timeout / offline). */
export function isServerUnreachableError(error: unknown): boolean {
  if (isTimeoutError(error) || isNetworkError(error)) return true;
  const status = getHttpStatus(error);
  if (status != null) {
    return status >= 500;
  }
  return true;
}

/**
 * Safe copy for UI toasts / inline form errors.
 * Never surfaces request URLs or raw transport phrasing.
 */
export function toUserErrorMessage(error: unknown): string {
  if (Array.isArray(error)) {
    const joined = error
      .filter((part): part is string => typeof part === "string")
      .map((part) => part.trim())
      .filter(Boolean)
      .join(", ");
    return sanitizeMessage(joined) || FALLBACK;
  }

  if (error instanceof Error) {
    return sanitizeMessage(error.message) || FALLBACK;
  }

  if (typeof error === "string") {
    return sanitizeMessage(error) || FALLBACK;
  }

  return FALLBACK;
}

function sanitizeMessage(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) return "";
  if (REQUEST_FAILED_RE.test(trimmed)) return FALLBACK;
  if (/https?:\/\//i.test(trimmed)) {
    const withoutUrls = trimmed
      .replace(ABSOLUTE_URL_RE, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!withoutUrls || REQUEST_FAILED_RE.test(withoutUrls)) return FALLBACK;
    return withoutUrls;
  }
  return trimmed;
}

export function userMessageForHttpStatus(status: number): string {
  if (status === 400) return "Please check your details and try again";
  if (status === 401) return "Invalid email or password";
  if (status === 403) return "You don't have permission to do that";
  if (status === 404) return "Not found";
  if (status === 409) return "This action conflicts with existing data";
  if (status === 429) return "Too many attempts. Please wait and try again";
  if (status >= 500) return "Server error. Please try again";
  return FALLBACK;
}
