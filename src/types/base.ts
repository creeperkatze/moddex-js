/** A value that can be serialized as a URL query parameter. Booleans are sent as `1` / `0`. */
export type QueryValue = string | number | boolean | null | undefined;

/** Sort direction accepted by list endpoints. */
export type SortDirection = 'asc' | 'desc';

/** Envelope returned by non-paginated ModDex endpoints. */
export interface ModDexResponse<T> {
  data: T;
}

/** Links to neighbouring pages included in paginated responses. */
export interface PaginationLinks {
  first: string;
  last: string;
  /** `null` on the first page. */
  prev: string | null;
  /** `null` on the last page. */
  next: string | null;
}

/** Pagination metadata included in paginated responses. */
export interface PaginationMeta {
  /** One-based index of the returned page. */
  current_page: number;
  /** One-based index of the last available page. */
  last_page: number;
  /** Number of items per page. */
  per_page: number;
  /** Total number of items across all pages. */
  total: number;
}

/** Envelope returned by paginated ModDex endpoints. */
export interface ModDexPaginatedResponse<T> {
  data: T[];
  links: PaginationLinks;
  meta: PaginationMeta;
}

/** Common query parameters for paginated endpoints. */
export interface PaginationOptions {
  /** One-based page number to fetch. */
  page?: number;
  /** Results per page. See each endpoint for its default and maximum. */
  per_page?: number;
}

/** Options for {@link paginate} and the `iterate*` helpers. */
export interface PaginateOptions {
  /**
   * One-based page to start from.
   * @defaultValue 1
   */
  startPage?: number;
  /**
   * How many times a single page is retried after a `429 Too Many Requests` response,
   * waiting for the `Retry-After` duration before each retry.
   * @defaultValue 3
   */
  maxRateLimitRetries?: number;
}

/** In-memory response cache settings. */
export interface CacheOptions {
  /**
   * How long a cached response stays fresh, in milliseconds.
   * @defaultValue 60000
   */
  ttlMs?: number;
  /**
   * Maximum number of cached responses. The oldest entry is evicted when the limit is reached.
   * @defaultValue 500
   */
  maxEntries?: number;
}

/** Token expiry reported by the `X-ModDex-Token-Expires` response header. */
export interface TokenExpiry {
  /** The raw header value. */
  raw: string;
  /** The parsed expiry date, or `null` if the header value is not a parseable date. */
  expiresAt: Date | null;
}

/** Options for creating a {@link ModDexClient}. */
export interface ModDexClientOptions {
  /**
   * Personal API token, created under **Settings > API Tokens** on moddex.gg.
   * Sent as `Authorization: Bearer <token>` on every request.
   */
  token: string;
  /**
   * Base URL of the ModDex API.
   * @defaultValue "https://moddex.gg"
   */
  baseUrl?: string;
  /**
   * Request timeout in milliseconds.
   * @defaultValue 10000
   */
  timeoutMs?: number;
  /** Value to send as the `User-Agent` header on every request. Ignored by browsers. */
  userAgent?: string;
  /**
   * Custom fetch implementation. When omitted, `globalThis.fetch` is looked up at request time,
   * so polyfills or mocks installed after the client is created are picked up.
   */
  fetch?: typeof globalThis.fetch;
  /**
   * Enables in-memory caching of successful responses. `true` uses the default {@link CacheOptions}.
   * @defaultValue false
   */
  cache?: boolean | CacheOptions;
}
