export interface Pagination {
  /** Filler for shared header shape (V2 is cursor-only). */
  currentPage?: number;
  itemsPerPage: number;
  totalItems: number;
  /** Filler for shared header shape; prefer nextCursor for hasMore. */
  totalPages?: number;
  /** Opaque cursor for GetAllV2 next page. */
  nextCursor?: string | null;
}

export class PaginatedResult<T> {
  data: T;
  pagination: Pagination;

  constructor(data: T, pagination: Pagination) {
    this.data = data;
    this.pagination = pagination;
  }
}
