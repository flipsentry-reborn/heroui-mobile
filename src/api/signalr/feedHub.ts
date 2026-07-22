import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  HttpTransportType,
  LogLevel,
} from "@microsoft/signalr";
import { AppState, type AppStateStatus } from "react-native";

import { API_URL } from "@/api/config";
import { debugLog } from "@/lib/debug-log";
import type { FeedImageUpdateData, FeedItem } from "@/models/feed";

const LOG = "FeedHub";

export type FeedHubHandlers = {
  onReceiveFeed: (feed: FeedItem) => void;
  onImageUpdate?: (update: FeedImageUpdateData) => void;
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

function setStatus(
  status: "disconnected" | "connecting" | "connected",
): void {
  handlers?.onStatusChange?.(status);
}

function bindHandlers(hub: HubConnection): void {
  hub.off("ReceiveFeed");
  hub.off("ReceiveFeedImageUpdate");

  hub.on("ReceiveFeed", (feed: FeedItem) => {
    handlers?.onReceiveFeed(feed);
  });
  hub.on("ReceiveFeedImageUpdate", (update: FeedImageUpdateData) => {
    handlers?.onImageUpdate?.(update);
  });

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
    setStatus("connected");
    handlers?.onReconnected?.();
  });
  hub.onclose((error) => {
    debugLog.warn(LOG, "closed", {
      error: error?.message ?? String(error ?? ""),
    });
    setStatus("disconnected");
  });
}

async function ensureStarted(): Promise<void> {
  if (!connection || !tokenFactory || !handlers) return;
  if (connection.state === HubConnectionState.Connected) {
    setStatus("connected");
    return;
  }
  if (connection.state === HubConnectionState.Connecting) return;

  setStatus("connecting");
  try {
    await connection.start();
    debugLog.info(LOG, "started", {
      state: connection.state,
      connectionId: connection.connectionId ?? null,
    });
    setStatus("connected");
  } catch (error) {
    debugLog.warn(LOG, "start failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    setStatus("disconnected");
  }
}

function onAppStateChange(next: AppStateStatus): void {
  if (next !== "active") {
    debugLog.info(LOG, "app state", { next });
    return;
  }
  if (!connection || !tokenFactory) return;

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
    handlers?.onReconnected?.();
  });
}

export async function startFeedHub(options: {
  getAccessToken: FeedHubAccessTokenFactory;
  handlers: FeedHubHandlers;
}): Promise<void> {
  tokenFactory = options.getAccessToken;
  handlers = options.handlers;

  if (connection) {
    bindHandlers(connection);
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
    .withAutomaticReconnect([0, 2000, 5000, 10000, 20000])
    .configureLogging(__DEV__ ? LogLevel.Information : LogLevel.Warning)
    .build();

  bindHandlers(connection);

  if (!appStateSub) {
    appStateSub = AppState.addEventListener("change", onAppStateChange);
  }

  startPromise = ensureStarted().finally(() => {
    startPromise = null;
  });
  await startPromise;
}

export async function stopFeedHub(): Promise<void> {
  appStateSub?.remove();
  appStateSub = null;
  tokenFactory = null;
  handlers = null;

  const hub = connection;
  connection = null;
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
