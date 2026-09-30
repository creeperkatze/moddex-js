import { describe, it, expect } from 'vitest';
import { createTestClient } from '../utils/client.js';
import { jsonResponse } from '../utils/http.js';
import { MOCK_TAG, paginated } from '../utils/fixtures.js';

describe('TagsApi', () => {
  it('lists tags filtered by type', async () => {
    const body = paginated([MOCK_TAG], 1, 1, 50);
    const { client, mockFetch } = createTestClient([jsonResponse(body)]);
    const result = await client.tags.list({ type: 'genre', per_page: 100 });
    expect(result).toEqual(body);
    const url = new URL(mockFetch.lastCall()!.url);
    expect(url.pathname).toBe('/api/v1/tags');
    expect(url.searchParams.get('type')).toBe('genre');
    expect(url.searchParams.get('per_page')).toBe('100');
  });

  it('iterates every tag', async () => {
    const { client } = createTestClient([
      jsonResponse(paginated([MOCK_TAG], 1, 2)),
      jsonResponse(paginated([{ ...MOCK_TAG, id: 2, slug: 'magic' }], 2, 2)),
    ]);
    const slugs: string[] = [];
    for await (const tag of client.tags.iterate()) {
      slugs.push(tag.slug);
    }
    expect(slugs).toEqual(['technology', 'magic']);
  });
});
