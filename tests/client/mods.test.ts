import { describe, it, expect } from 'vitest';
import { createTestClient } from '../utils/client.js';
import { jsonResponse } from '../utils/http.js';
import { MOCK_MOD, MOCK_REVIEW, paginated } from '../utils/fixtures.js';

describe('ModsApi', () => {
  it('gets a mod by slug and unwraps the data envelope', async () => {
    const { client, mockFetch } = createTestClient([jsonResponse({ data: MOCK_MOD })]);
    const mod = await client.mods.get('create');
    expect(mod).toEqual(MOCK_MOD);
    expect(mockFetch.lastCall()?.url).toBe('https://moddex.gg/api/v1/mods/create');
  });

  it('encodes the slug as a single path segment', async () => {
    const { client, mockFetch } = createTestClient([jsonResponse({ data: MOCK_MOD })]);
    await client.mods.get('a/b?c');
    expect(mockFetch.lastCall()?.url).toBe('https://moddex.gg/api/v1/mods/a%2Fb%3Fc');
  });

  it('lists reviews with sorting and pagination', async () => {
    const body = paginated([MOCK_REVIEW]);
    const { client, mockFetch } = createTestClient([jsonResponse(body)]);
    const result = await client.mods.listReviews('create', {
      sort: 'helpful_votes',
      direction: 'asc',
      page: 3,
      per_page: 10,
    });
    expect(result).toEqual(body);
    const url = new URL(mockFetch.lastCall()!.url);
    expect(url.pathname).toBe('/api/v1/mods/create/reviews');
    expect(url.searchParams.get('sort')).toBe('helpful_votes');
    expect(url.searchParams.get('direction')).toBe('asc');
    expect(url.searchParams.get('page')).toBe('3');
    expect(url.searchParams.get('per_page')).toBe('10');
  });

  it('iterates every review page', async () => {
    const { client, mockFetch } = createTestClient([
      jsonResponse(paginated([MOCK_REVIEW], 1, 2)),
      jsonResponse(paginated([{ ...MOCK_REVIEW, id: 2 }], 2, 2)),
    ]);
    const ids: number[] = [];
    for await (const review of client.mods.iterateReviews('create', { sort: 'rating' })) {
      ids.push(review.id);
    }
    expect(ids).toEqual([1, 2]);
    expect(mockFetch.calls.every((call) => new URL(call.url).pathname === '/api/v1/mods/create/reviews')).toBe(true);
  });
});
