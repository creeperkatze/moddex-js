import { ModDexRateLimitError, ModDexServiceUnavailableError } from '../errors.js';
import type { ModDexPaginatedResponse, PaginateOptions } from '../types/base.js';
import type { SyncResponse } from '../types/sync.js';

const DEFAULT_MAX_RATE_LIMIT_RETRIES = 3;
/** Wait used when a `429` or `503` response has no readable `Retry-After` header: the length of the rate limit window. */
const FALLBACK_RETRY_AFTER_SECONDS = 60;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Iterates every item of a paginated endpoint, fetching one page at a time as the loop advances.
 *
 * When a page request fails with {@link ModDexRateLimitError} or {@link ModDexServiceUnavailableError}, the page is
 * retried after waiting for the `Retry-After` duration, up to `maxRateLimitRetries` times. Other errors are thrown
 * immediately.
 *
 * @example
 * ```ts
 * for await (const project of paginate((page) => client.projects.list({ page, per_page: 50 }))) {
 *   console.log(project.name);
 * }
 * ```
 */
export async function* paginate<T>(
  fetchPage: (page: number) => Promise<ModDexPaginatedResponse<T>>,
  options: PaginateOptions = {},
): AsyncGenerator<T, void, undefined> {
  const maxRetries = options.maxRateLimitRetries ?? DEFAULT_MAX_RATE_LIMIT_RETRIES;
  let page = options.startPage ?? 1;

  while (true) {
    const response = await fetchWithRetry(() => fetchPage(page), maxRetries);

    yield* response.data;

    const { current_page, last_page } = response.meta;
    if (response.data.length === 0 || current_page >= last_page) return;
    page = current_page + 1;
  }
}

/**
 * Follows a sync feed's cursor, yielding each page until the feed has no more rows ready. Pages are yielded whole,
 * so the last one's `meta.next_cursor` can be stored and passed back later to poll for new changes.
 *
 * Retries rate limited and unavailable pages like {@link paginate}.
 *
 * @example
 * ```ts
 * let cursor = loadCursor();
 * for await (const page of followCursor((cursor) => client.sync.listReviews({ cursor }), cursor)) {
 *   page.data.forEach(store);
 *   cursor = page.meta.next_cursor;
 * }
 * saveCursor(cursor);
 * ```
 */
export async function* followCursor<T>(
  fetchPage: (cursor: string | undefined) => Promise<SyncResponse<T>>,
  startCursor?: string,
  options: Pick<PaginateOptions, 'maxRateLimitRetries'> = {},
): AsyncGenerator<SyncResponse<T>, void, undefined> {
  const maxRetries = options.maxRateLimitRetries ?? DEFAULT_MAX_RATE_LIMIT_RETRIES;
  let cursor = startCursor;

  while (true) {
    const response: SyncResponse<T> = await fetchWithRetry(() => fetchPage(cursor), maxRetries);

    yield response;

    if (!response.meta.has_more) return;
    cursor = response.meta.next_cursor;
  }
}

async function fetchWithRetry<T>(fetchPage: () => Promise<T>, maxRetries: number): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fetchPage();
    } catch (err) {
      const retryable = err instanceof ModDexRateLimitError || err instanceof ModDexServiceUnavailableError;
      if (!retryable || attempt >= maxRetries) throw err;
      await sleep((err.retryAfter ?? FALLBACK_RETRY_AFTER_SECONDS) * 1000);
    }
  }
}
