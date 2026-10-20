import { describe, it, expect } from 'vitest';
import { createTestClient, rawQuery } from '../utils/client.js';
import { jsonResponse } from '../utils/http.js';
import { MOCK_REVIEW, paginated } from '../utils/fixtures.js';

describe('ReviewsApi', () => {
  it('gets a review by id and unwraps the data envelope', async () => {
    const { client, mockFetch } = createTestClient([jsonResponse({ data: MOCK_REVIEW })]);
    const review = await client.reviews.get(77, { unmasked: true });
    expect(review).toEqual(MOCK_REVIEW);
    expect(mockFetch.lastCall()?.url).toBe('https://moddex.gg/api/v2/reviews/77?unmasked=1');
  });

  it('lists reviews across projects', async () => {
    const body = paginated([MOCK_REVIEW]);
    const { client, mockFetch } = createTestClient([jsonResponse(body)]);
    const result = await client.reviews.list({
      project_ids: [1234, 5678],
      since: '2026-10-01',
      written_only: false,
    });
    expect(result).toEqual(body);
    expect(new URL(mockFetch.lastCall()!.url).pathname).toBe('/api/v2/reviews');
    expect(rawQuery(mockFetch.lastCall())).toBe('project_ids=1234,5678&since=2026-10-01&written_only=0');
  });

  it('iterates every page', async () => {
    const { client } = createTestClient([
      jsonResponse(paginated([MOCK_REVIEW], 1, 2)),
      jsonResponse(paginated([{ ...MOCK_REVIEW, id: 78 }], 2, 2)),
    ]);
    const ids: number[] = [];
    for await (const review of client.reviews.iterate({ type: 'modpack' })) ids.push(review.id);
    expect(ids).toEqual([77, 78]);
  });
});
