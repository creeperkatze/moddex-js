import { ModDexRateLimitError } from '../errors.js';
import type { ModDexPaginatedResponse, PaginateOptions } from '../types/base.js';

const DEFAULT_MAX_RATE_LIMIT_RETRIES = 3;
/** Wait used when a `429` response has no readable `Retry-After` header: the length of the rate limit window. */
const FALLBACK_RETRY_AFTER_SECONDS = 60;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Iterates every item of a paginated endpoint, fetching one page at a time as the loop advances.
 *
 * When a page request fails with {@link ModDexRateLimitError}, the page is retried after waiting for the
 * `Retry-After` duration, up to `maxRateLimitRetries` times. Other errors are thrown immediately.
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
    const response = await fetchWithRateLimitRetry(() => fetchPage(page), maxRetries);

    yield* response.data;

    const { current_page, last_page } = response.meta;
    if (response.data.length === 0 || current_page >= last_page) return;
    page = current_page + 1;
  }
}

async function fetchWithRateLimitRetry<T>(fetchPage: () => Promise<T>, maxRetries: number): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fetchPage();
    } catch (err) {
      if (!(err instanceof ModDexRateLimitError) || attempt >= maxRetries) throw err;
      await sleep((err.retryAfter ?? FALLBACK_RETRY_AFTER_SECONDS) * 1000);
    }
  }
}
