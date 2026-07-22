import { requests } from "@/api/http/client";
import type { PaginatedResult } from "@/models/pagination";
import type {
  FeedItem,
  FeedTabAvailability,
  LocalCompItem,
} from "@/models/feed";

export type { FeedTabAvailability };

export const liveFeed = {
  list: (params?: URLSearchParams) =>
    requests.get<PaginatedResult<FeedItem[]>>("/api/feed", params),
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
  getDetails: (id: string) => requests.get<FeedItem>(`/api/feed/${id}`),
  getLocalComps: (id: string, sameYear?: boolean, days?: number) => {
    const params = new URLSearchParams();
    if (sameYear) params.append("sameYear", "true");
    if (days != null && days !== 3) params.append("days", days.toString());
    const qs = params.toString();
    return requests.get<LocalCompItem[]>(
      `/api/feed/${id}/local-comps${qs ? `?${qs}` : ""}`,
    );
  },
};

export const liveSoldListings = {
  list: (params?: URLSearchParams) =>
    requests.get<PaginatedResult<FeedItem[]>>("/api/feed/sold-nearby", params),
};
