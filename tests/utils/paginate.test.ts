import { describe, it, expect, afterEach, vi } from 'vitest';
import { paginate } from '../../src/utils/paginate.js';
import { ModDexNotFoundError, ModDexRateLimitError } from '../../src/errors.js';
import { createTestClient } from './client.js';
import { errorResponse, jsonResponse } from './http.js';
import { MOCK_PROJECT_SUMMARY, paginated } from './fixtures.js';
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

    expect(items.map((project) => project.id)).toEqual([1, 2]);
    expect(mockFetch.calls.map((call) => new URL(call.url).searchParams.get('page'))).toEqual(['1', '2', '2']);
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
    await expect(collect(client.mods.iterateReviews('missing'))).rejects.toBeInstanceOf(ModDexNotFoundError);
    expect(mockFetch.callCount()).toBe(1);
  });
});
