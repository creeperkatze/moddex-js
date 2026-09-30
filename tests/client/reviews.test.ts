import { describe, it, expect } from 'vitest';
import { createTestClient } from '../utils/client.js';
import { jsonResponse } from '../utils/http.js';
import { MOCK_REVIEW } from '../utils/fixtures.js';

describe('ReviewsApi', () => {
  it('gets a review by id and unwraps the data envelope', async () => {
    const { client, mockFetch } = createTestClient([jsonResponse({ data: MOCK_REVIEW })]);
    const review = await client.reviews.get(1);
    expect(review).toEqual(MOCK_REVIEW);
    expect(review.author).toEqual({ id: 1, name: 'Steve' });
    expect(mockFetch.lastCall()?.url).toBe('https://moddex.gg/api/v1/reviews/1');
  });
});
