import { describe, it, expect, afterEach, vi } from 'vitest';
import { followCursor, paginate } from '../../src/utils/paginate.js';
import { ModDexNotFoundError, ModDexRateLimitError, ModDexValidationError } from '../../src/errors.js';
import { createTestClient } from './client.js';
import { errorResponse, jsonResponse } from './http.js';
import { MOCK_PROJECT_LIST_ITEM as MOCK_PROJECT_SUMMARY, paginated, syncPage } from './fixtures.js';
import type { ModDexPaginatedResponse } from '../../src/types/index.js';

async function collect<T>(iterable: AsyncIterable<T>): Promise<T[]> {
  const items: T[] = [];
  for await (const item of iterable) items.push(item);
  return items;
}

describe('paginate', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('walks pages until current_page reaches last_page', async () => {
    const requested: number[] = [];
    const items = await collect(
      paginate(async (page) => {
        requested.push(page);
        return paginated([page * 10, page * 10 + 1], page, 3);
      }),
    );
    expect(requested).toEqual([1, 2, 3]);
    expect(items).toEqual([10, 11, 20, 21, 30, 31]);
  });

  it('starts from startPage', async () => {
    const requested: number[] = [];
    await collect(
      paginate(async (page) => {
        requested.push(page);
        return paginated([page], page, 3);
      }, { startPage: 2 }),
    );
    expect(requested).toEqual([2, 3]);
  });

  it('stops on an empty page even if last_page says otherwise', async () => {
    const fetchPage = vi.fn(async (page: number): Promise<ModDexPaginatedResponse<number>> => paginated([], page, 9));
    expect(await collect(paginate(fetchPage))).toEqual([]);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it('fetches lazily, one page at a time', async () => {
    const fetchPage = vi.fn(async (page: number) => paginated([page], page, 5));
    for await (const item of paginate(fetchPage)) {
      if (item === 2) break;
    }
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });

  it('waits for Retry-After and retries the same page after a 429', async () => {
    vi.useFakeTimers();
    const { client, mockFetch } = createTestClient([
      jsonResponse(paginated([MOCK_PROJECT_SUMMARY], 1, 2)),
      errorResponse(429, { message: 'Too Many Attempts.' }, { 'Retry-After': '5' }),
      jsonResponse(paginated([{ ...MOCK_PROJECT_SUMMARY, id: 2 }], 2, 2)),
    ]);

    const done = collect(client.projects.iterate());

    await vi.advanceTimersByTimeAsync(4_999);
    expect(mockFetch.callCount()).toBe(2);

    await vi.advanceTimersByTimeAsync(1);
    const items = await done;

    expect(items.map((project) => project.id)).toEqual([1234, 2]);
    expect(mockFetch.calls.map((call) => new URL(call.url).searchParams.get('page'))).toEqual(['1', '2', '2']);
  });

  it('retries after a 503 too', async () => {
    vi.useFakeTimers();
    const { client, mockFetch } = createTestClient([
      errorResponse(503, { code: 'service_unavailable' }, { 'Retry-After': '2' }),
      jsonResponse(paginated([MOCK_PROJECT_SUMMARY])),
    ]);

    const done = collect(client.projects.iterate({ q: 'sodium' }));
    await vi.advanceTimersByTimeAsync(2_000);
    expect(await done).toHaveLength(1);
    expect(mockFetch.callCount()).toBe(2);
  });

  it('falls back to a 60 second wait when Retry-After is missing', async () => {
    vi.useFakeTimers();
    const { client, mockFetch } = createTestClient([
      errorResponse(429, { message: 'Too Many Attempts.' }),
      jsonResponse(paginated([MOCK_PROJECT_SUMMARY])),
    ]);

    const done = collect(client.projects.iterate());
    await vi.advanceTimersByTimeAsync(59_999);
    expect(mockFetch.callCount()).toBe(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(await done).toHaveLength(1);
  });

  it('gives up after maxRateLimitRetries', async () => {
    const { client, mockFetch } = createTestClient([
      errorResponse(429, {}, { 'Retry-After': '0' }),
      errorResponse(429, {}, { 'Retry-After': '0' }),
      errorResponse(429, {}, { 'Retry-After': '0' }),
    ]);

    await expect(collect(client.projects.iterate({}, { maxRateLimitRetries: 2 }))).rejects.toBeInstanceOf(
      ModDexRateLimitError,
    );
    expect(mockFetch.callCount()).toBe(3);
  });

  it('does not retry other errors', async () => {
    const { client, mockFetch } = createTestClient([errorResponse(404, { message: 'Not Found' })]);
    await expect(collect(client.projects.iterateReviews(404))).rejects.toBeInstanceOf(ModDexNotFoundError);
    expect(mockFetch.callCount()).toBe(1);
  });
});

describe('followCursor', () => {
  it('passes each next_cursor back until has_more is false', async () => {
    const requested: (string | undefined)[] = [];
    const pages = await collect(
      followCursor(async (cursor) => {
        requested.push(cursor);
        const index = requested.length;
        return syncPage([index], `c${index}`, index < 3);
      }, 'start'),
    );
    expect(requested).toEqual(['start', 'c1', 'c2']);
    expect(pages.map((page) => page.meta.next_cursor)).toEqual(['c1', 'c2', 'c3']);
  });

  it('retries a rate limited page, then throws other errors', async () => {
    vi.useFakeTimers();
    let calls = 0;
    const done = collect(
      followCursor(async () => {
        calls++;
        if (calls === 1) throw new ModDexRateLimitError('Too Many Attempts.', { retryAfter: 1 });
        throw new ModDexValidationError('The cursor is invalid.', { code: 'invalid_cursor' });
      }),
    );
    const assertion = expect(done).rejects.toBeInstanceOf(ModDexValidationError);
    await vi.advanceTimersByTimeAsync(1_000);
    await assertion;
    expect(calls).toBe(2);
  });
});
