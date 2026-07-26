import { API_URL } from "@/api/config";

export type DevHttpLogEntry = {
  id: string;
  at: string;
  phase: "response" | "error";
  method: string;
  url: string;
  status?: number;
  durationMs?: number;
  requestBody?: unknown;
  responseBody?: unknown;
  errorMessage?: string;
};

const SINK_PATH = "/api/dev/client-logs";
const MAX_BODY_CHARS = 80_000;

const pending = new WeakMap<
  Request,
  { id: string; startedAt: number; body?: unknown }
>();

function enabled(): boolean {
  return typeof __DEV__ !== "undefined" && __DEV__;
}

function truncate(value: unknown): unknown {
  if (value == null) return value;
  const text =
    typeof value === "string" ? value : (() => {
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    })();
  if (text.length <= MAX_BODY_CHARS) {
    if (typeof value === "string") {
      try {
        return JSON.parse(text) as unknown;
      } catch {
        return value;
      }
    }
    return value;
  }
  return {
    _truncated: true,
    preview: text.slice(0, MAX_BODY_CHARS),
  };
}

async function readJsonish(source: Request | Response): Promise<unknown> {
  try {
    const text = await source.clone().text();
    if (!text) return undefined;
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text;
    }
  } catch {
    return undefined;
  }
}

function shouldSkip(url: string): boolean {
  return url.includes(SINK_PATH);
}

async function sink(entry: DevHttpLogEntry): Promise<void> {
  // Avoid going through ky (hooks) — raw fetch, fire-and-forget.
  try {
    await fetch(`${API_URL}${SINK_PATH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
  } catch {
    // Sink is best-effort; console still has the entry.
  }
}

export async function devHttpBeforeRequest(request: Request): Promise<void> {
  if (!enabled() || shouldSkip(request.url)) return;
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const body = await readJsonish(request);
  pending.set(request, { id, startedAt: Date.now(), body: truncate(body) });
}

export async function devHttpAfterResponse(
  request: Request,
  response: Response,
): Promise<Response> {
  if (!enabled() || shouldSkip(request.url)) return response;

  const meta = pending.get(request);
  const id = meta?.id ?? `${Date.now().toString(36)}-orphan`;
  const responseBody = truncate(await readJsonish(response));
  const entry: DevHttpLogEntry = {
    id,
    at: new Date().toISOString(),
    phase: "response",
    method: request.method,
    url: request.url,
    status: response.status,
    durationMs: meta != null ? Date.now() - meta.startedAt : undefined,
    requestBody: meta?.body,
    responseBody,
  };

  // Structured one-liner for Metro; full payload also sunk to API/logs.
  console.log(`[http-dev] ${entry.method} ${entry.status} ${entry.url}`, entry);
  void sink(entry);
  return response;
}

export async function devHttpOnError(
  request: Request,
  error: unknown,
): Promise<void> {
  if (!enabled() || shouldSkip(request.url)) return;
  const meta = pending.get(request);
  const entry: DevHttpLogEntry = {
    id: meta?.id ?? `${Date.now().toString(36)}-err`,
    at: new Date().toISOString(),
    phase: "error",
    method: request.method,
    url: request.url,
    durationMs: meta != null ? Date.now() - meta.startedAt : undefined,
    requestBody: meta?.body,
    errorMessage: error instanceof Error ? error.message : String(error),
  };
  console.log(`[http-dev] ${entry.method} ERROR ${entry.url}`, entry);
  void sink(entry);
}

/** Wipe the server-side JSONL before a fresh create→update repro. */
export async function clearDevHttpLogs(): Promise<void> {
  if (!enabled()) return;
  try {
    await fetch(`${API_URL}${SINK_PATH}`, { method: "DELETE" });
  } catch {
    // ignore
  }
}
