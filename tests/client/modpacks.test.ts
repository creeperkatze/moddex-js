import { describe, it, expect } from 'vitest';
import { createTestClient } from '../utils/client.js';
import { jsonResponse } from '../utils/http.js';
import { MOCK_MODPACK, MOCK_REVIEW, paginated } from '../utils/fixtures.js';
import type { Review } from '../../src/types/index.js';

const MOCK_MODPACK_REVIEW: Review = {
  ...MOCK_REVIEW,
  id: 7,
  title: 'Brutal but rewarding',
  pack_version: '2.9.3',
  project: { id: 42, name: 'RLCraft', slug: 'rlcraft', type: 'modpack' },
};

describe('ModpacksApi', () => {
  it('gets a modpack by slug', async () => {
    const { client, mockFetch } = createTestClient([jsonResponse({ data: MOCK_MODPACK })]);
    const modpack = await client.modpacks.get('rlcraft');
    expect(modpack).toEqual(MOCK_MODPACK);
    expect(mockFetch.lastCall()?.url).toBe('https://moddex.gg/api/v1/modpacks/rlcraft');
  });

  it('lists modpack reviews', async () => {
    const body = paginated([MOCK_MODPACK_REVIEW]);
    const { client, mockFetch } = createTestClient([jsonResponse(body)]);
    const result = await client.modpacks.listReviews('rlcraft');
    expect(result).toEqual(body);
    expect(mockFetch.lastCall()?.url).toBe('https://moddex.gg/api/v1/modpacks/rlcraft/reviews');
  });

  it('iterates modpack reviews', async () => {
    const { client, mockFetch } = createTestClient([jsonResponse(paginated([MOCK_MODPACK_REVIEW]))]);
    const reviews: Review[] = [];
    for await (const review of client.modpacks.iterateReviews('rlcraft')) {
      reviews.push(review);
    }
    expect(reviews).toEqual([MOCK_MODPACK_REVIEW]);
    expect(new URL(mockFetch.lastCall()!.url).searchParams.get('page')).toBe('1');
  });
});
