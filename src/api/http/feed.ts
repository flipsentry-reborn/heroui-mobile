import { requests } from "@/api/http/client";
import type { PaginatedResult } from "@/models/pagination";
import type { FeedItem, FeedTabAvailability } from "@/models/feed";

export type { FeedTabAvailability };

/** Share one network call when remounts re-run the same GET. */
const inflightGets = new Map<string, Promise<unknown>>();

function dedupeGet<T>(key: string, run: () => Promise<T>): Promise<T> {
  const existing = inflightGets.get(key);
  if (existing) return existing as Promise<T>;
  const promise = run().finally(() => {
    if (inflightGets.get(key) === promise) inflightGets.delete(key);
  });
  inflightGets.set(key, promise);
  return promise;
}

export const liveFeed = {
  list: (params?: URLSearchParams) =>
    dedupeGet(`list:${params?.toString() ?? ""}`, () =>
      requests.get<PaginatedResult<FeedItem[]>>("/api/feed", params),
    ),
  getTabAvailability: () =>
    requests.get<FeedTabAvailability>("/api/feed/tab-availability"),
  setClicked: (id: string) =>
    requests.post<void>(`/api/feed/${id}/click-feed`, {}),
  setViewed: (id: string) =>
    requests.post<void>(`/api/feed/${id}/view-feed`, {}),
  toggleFavorite: (id: string) =>
    requests.post<void>(`/api/feed/${id}/toggle-favorite`, {}),
  delete: (id: string) => requests.post<void>(`/api/feed/${id}/delete`, {}),
  reportSpam: (id: string) =>
    requests.post<void>(`/api/feed/${id}/report-spam`, {}),
  getDetails: (id: string) =>
    dedupeGet(`details:${id}`, () =>
      requests.get<FeedItem>(`/api/feed/${id}`),
    ),
  getLocalComps: (id: string, sameYear?: boolean, days?: number) => {
    const params = new URLSearchParams();
    if (sameYear) params.append("sameYear", "true");
    if (days != null && days !== 3) params.append("days", days.toString());
    const qs = params.toString();
    const path = `/api/feed/${id}/local-comps${qs ? `?${qs}` : ""}`;
    return dedupeGet(`local-comps:${path}`, () =>
      requests.get<FeedItem[]>(path),
    );
  },
};
