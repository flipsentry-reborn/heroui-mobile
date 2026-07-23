export type FeedLayoutMode = "list" | "grid";

export const DEFAULT_FEED_LAYOUT_MODE: FeedLayoutMode = "grid";

export const FEED_LAYOUT_STORAGE_KEY = "feedLayoutMode";

export function isFeedLayoutMode(value: unknown): value is FeedLayoutMode {
  return value === "list" || value === "grid";
}
