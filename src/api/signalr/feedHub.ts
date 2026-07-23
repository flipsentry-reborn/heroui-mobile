import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  HttpTransportType,
  LogLevel,
  type IRetryPolicy,
  type RetryContext,
} from "@microsoft/signalr";
import { AppState, type AppStateStatus } from "react-native";

import { API_URL } from "@/api/config";
import { debugLog } from "@/lib/debug-log";
import type {
  FeedImageUpdateData,
  FeedItem,
  FeedValuationUpdateData,
} from "@/models/feed";

const LOG = "FeedHub";

/** Backoff steps (ms) before saturating at the last value forever. */
const RECONNECT_DELAYS_MS = [0, 2000, 5000, 10000, 20000, 30000] as const;
const START_RETRY_MAX_MS = 30_000;
const JITTER_RATIO = 0.15;

export type FeedHubHandlers = {
  onReceiveFeed: (feed: FeedItem) => void;
  onImageUpdate?: (update: FeedImageUpdateData) => void;
  onValuationUpdate?: (update: FeedValuationUpdateData) => void;
  onReconnected?: () => void;
  onStatusChange?: (
    status: "disconnected" | "connecting" | "connected",
  ) => void;
};

export type FeedHubAccessTokenFactory = () => string | Promise<string>;

let connection: HubConnection | null = null;
let appStateSub: { remove: () => void } | null = null;
let tokenFactory: FeedHubAccessTokenFactory | null = null;
let handlers: FeedHubHandlers | null = null;
let startPromise: Promise<void> | null = null;
let lifecycleBound = false;
let startRetryTimer: ReturnType<typeof setTimeout> | null = null;
let startRetryAttempt = 0;
let intentionalStop = false;

function withJitter(delayMs: number): number {
  if (delayMs <= 0) return 0;
  const spread = delayMs * JITTER_RATIO;
  return Math.max(0, Math.round(delayMs + (Math.random() * 2 - 1) * spread));
}

function delayForAttempt(attempt: number): number {
  const index = Math.min(Math.max(attempt, 0), RECONNECT_DELAYS_MS.length - 1);
  return withJitter(RECONNECT_DELAYS_MS[index]);
}

/** Never returns null — keeps retrying with capped exponential backoff + jitter. */
const durableReconnectPolicy: IRetryPolicy = {
  nextRetryDelayInMilliseconds(retryContext: RetryContext): number {
    const delay = delayForAttempt(retryContext.previousRetryCount);
    debugLog.info(LOG, "reconnect schedule", {
      previousRetryCount: retryContext.previousRetryCount,
      delayMs: delay,
      elapsedMs: retryContext.elapsedMilliseconds,
    });
    return delay;
  },
};

function setStatus(
  status: "disconnected" | "connecting" | "connected",
): void {
  handlers?.onStatusChange?.(status);
}

function clearStartRetry(): void {
  if (startRetryTimer) {
    clearTimeout(startRetryTimer);
    startRetryTimer = null;
  }
  startRetryAttempt = 0;
}

function scheduleStartRetry(): void {
  if (intentionalStop || !connection || !tokenFactory || !handlers) return;
  if (startRetryTimer) return;

  const delay = Math.min(delayForAttempt(startRetryAttempt), START_RETRY_MAX_MS);
  startRetryAttempt += 1;
  debugLog.info(LOG, "start retry scheduled", {
    attempt: startRetryAttempt,
    delayMs: delay,
  });

  startRetryTimer = setTimeout(() => {
    startRetryTimer = null;
    if (intentionalStop || !connection || !tokenFactory || !handlers) return;
    void ensureStarted();
  }, delay);
}

function bindMessageHandlers(hub: HubConnection): void {
  hub.off("ReceiveFeed");
  hub.off("ReceiveFeedImageUpdate");
  hub.off("ReceiveFeedValuationUpdate");

  hub.on("ReceiveFeed", (feed: FeedItem) => {
    handlers?.onReceiveFeed(feed);
  });
  hub.on("ReceiveFeedImageUpdate", (update: FeedImageUpdateData) => {
    handlers?.onImageUpdate?.(update);
  });
  hub.on("ReceiveFeedValuationUpdate", (update: FeedValuationUpdateData) => {
    handlers?.onValuationUpdate?.(update);
  });
}

function bindLifecycleOnce(hub: HubConnection): void {
  if (lifecycleBound) return;
  lifecycleBound = true;

  hub.onreconnecting((error) => {
    debugLog.warn(LOG, "reconnecting", {
      state: hub.state,
      error: error?.message ?? String(error ?? ""),
    });
    setStatus("connecting");
  });
  hub.onreconnected((connectionId) => {
    debugLog.info(LOG, "reconnected", {
      connectionId: connectionId ?? null,
      state: hub.state,
    });
    clearStartRetry();
    setStatus("connected");
    handlers?.onReconnected?.();
  });
  hub.onclose((error) => {
    debugLog.warn(LOG, "closed", {
      error: error?.message ?? String(error ?? ""),
      intentionalStop,
    });
    setStatus("disconnected");
    // Durable policy normally reconnects; if the hub fully closed (e.g. stop
    // during reconnect), resume via start retry unless we intended to stop.
    if (!intentionalStop) {
      scheduleStartRetry();
    }
  });
}

async function ensureStarted(): Promise<void> {
  if (!connection || !tokenFactory || !handlers || intentionalStop) return;
  if (connection.state === HubConnectionState.Connected) {
    clearStartRetry();
    setStatus("connected");
    return;
  }
  if (
    connection.state === HubConnectionState.Connecting ||
    connection.state === HubConnectionState.Reconnecting
  ) {
    return;
  }

  setStatus("connecting");
  try {
    await connection.start();
    if (intentionalStop) return;
    debugLog.info(LOG, "started", {
      state: connection.state,
      connectionId: connection.connectionId ?? null,
    });
    clearStartRetry();
    setStatus("connected");
  } catch (error) {
    if (intentionalStop) return;
    debugLog.warn(LOG, "start failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    setStatus("disconnected");
    scheduleStartRetry();
  }
}

function onAppStateChange(next: AppStateStatus): void {
  if (next !== "active") {
    debugLog.info(LOG, "app state", { next });
    return;
  }
  if (!connection || !tokenFactory || intentionalStop) return;

  // Mobile often keeps HubConnectionState.Connected while backgrounded, but
  // ReceiveFeed events are still missed — always run catch-up on resume.
  if (connection.state === HubConnectionState.Connected) {
    debugLog.info(LOG, "app active; hub connected → catch-up", {
      connectionId: connection.connectionId ?? null,
    });
    handlers?.onReconnected?.();
    return;
  }

  debugLog.info(LOG, "app active; ensuring hub + catch-up", {
    state: connection.state,
  });
  void ensureStarted().then(() => {
    if (intentionalStop) return;
    if (connection?.state === HubConnectionState.Connected) {
      handlers?.onReconnected?.();
    }
  });
}

export async function startFeedHub(options: {
  getAccessToken: FeedHubAccessTokenFactory;
  handlers: FeedHubHandlers;
}): Promise<void> {
  intentionalStop = false;
  tokenFactory = options.getAccessToken;
  handlers = options.handlers;

  if (connection) {
    bindMessageHandlers(connection);
    if (startPromise) {
      await startPromise;
      return;
    }
    startPromise = ensureStarted().finally(() => {
      startPromise = null;
    });
    await startPromise;
    return;
  }

  const url = `${API_URL}/hubs/feed`;
  debugLog.info(LOG, "building connection", { url });
  connection = new HubConnectionBuilder()
    .withUrl(url, {
      accessTokenFactory: () => tokenFactory?.() ?? "",
      transport: HttpTransportType.WebSockets,
      skipNegotiation: true,
      headers: {
        "X-Platform": "mobile",
      },
    })
    .withAutomaticReconnect(durableReconnectPolicy)
    .configureLogging(__DEV__ ? LogLevel.Information : LogLevel.Warning)
    .build();

  lifecycleBound = false;
  bindMessageHandlers(connection);
  bindLifecycleOnce(connection);

  if (!appStateSub) {
    appStateSub = AppState.addEventListener("change", onAppStateChange);
  }

  startPromise = ensureStarted().finally(() => {
    startPromise = null;
  });
  await startPromise;
}

export async function stopFeedHub(): Promise<void> {
  intentionalStop = true;
  clearStartRetry();
  appStateSub?.remove();
  appStateSub = null;
  tokenFactory = null;
  handlers = null;

  const hub = connection;
  connection = null;
  lifecycleBound = false;

  if (!hub) {
    setStatus("disconnected");
    return;
  }

  try {
    if (hub.state !== HubConnectionState.Disconnected) {
      await hub.stop();
    }
  } catch (error) {
    debugLog.warn(LOG, "stop failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  } finally {
    setStatus("disconnected");
    debugLog.info(LOG, "stopped");
  }
}

export function getFeedHubState(): HubConnectionState | null {
  return connection?.state ?? null;
}
