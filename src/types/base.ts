/**
 * A value that can be serialized as a URL query parameter. Booleans are sent as `1` / `0`.
 * Arrays are sent as a comma-separated list, each item encoded on its own.
 */
export type QueryValue = string | number | boolean | readonly (string | number)[] | null | undefined;

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

/** Envelope returned by paginated ModDex endpoints. `M` adds endpoint-specific fields to `meta`. */
export interface ModDexPaginatedResponse<T, M extends object = object> {
  data: T[];
  links: PaginationLinks;
  meta: PaginationMeta & M;
}

/** Common query parameters for paginated endpoints. `page × per_page` may not exceed 10,000. */
export interface PaginationOptions {
  /** One-based page number to fetch. */
  page?: number;
  /** Results per page. See each endpoint for its default and maximum. */
  per_page?: number;
}

/** Query parameter for endpoints that return review text. */
export interface MaskingOptions {
  /**
   * Return review text without profanity masking. Masked text replaces each profane word with asterisks.
   * @defaultValue false
   */
  unmasked?: boolean;
}

/** Options for {@link paginate}, {@link followCursor} and the `iterate*` helpers. */
export interface PaginateOptions {
  /**
   * One-based page to start from. Ignored by cursor feeds.
   * @defaultValue 1
   */
  startPage?: number;
  /**
   * How many times a single page is retried after a `429 Too Many Requests` or `503 Service Unavailable`
   * response, waiting for the `Retry-After` duration before each retry.
   * @defaultValue 3
   */
  maxRateLimitRetries?: number;
}

/** In-memory response cache settings. */
export interface CacheOptions {
  /**
   * How long a cached response stays fresh, in milliseconds. ModDex itself caches responses for 5 minutes.
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

/** Rate limit state reported by the `X-RateLimit-*` response headers. */
export interface RateLimit {
  /** Your limit for this kind of request, per minute. */
  limit: number;
  /** Requests left in the current window. */
  remaining: number;
  /** When the window resets, or `null` if the header was missing or unreadable. */
  resetAt: Date | null;
}

/** Options for creating a {@link ModDexClient}. */
export interface ModDexClientOptions {
  /**
   * Optional personal API token, created under **Settings > API Tokens** on moddex.gg.
   * Every v2 endpoint is public: a token only raises your rate limits. Tokens expire after 90 days.
   */
  token?: string;
  /**
   * Identifies your app as `<name>/<version>`, e.g. `my-app/1.0.0`. Sent as the `X-Client` header, which ModDex
   * asks every client to send so it can tell traffic apart and get in touch before blocking anything.
   */
  client?: string;
  /**
   * Base URL of the ModDex website. API paths are appended to it.
   * @defaultValue "https://moddex.gg"
   */
  baseUrl?: string;
  /**
   * Request timeout in milliseconds.
   * @defaultValue 10000
   */
  timeoutMs?: number;
  /** Value to send as the `User-Agent` header on every request. Ignored by browsers, use `client` there. */
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
