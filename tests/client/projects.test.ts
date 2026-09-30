import { describe, it, expect } from 'vitest';
import { createTestClient } from '../utils/client.js';
import { jsonResponse } from '../utils/http.js';
import { MOCK_PROJECT_SUMMARY, paginated } from '../utils/fixtures.js';

describe('ProjectsApi', () => {
  it('lists projects and returns the full paginated envelope', async () => {
    const body = paginated([MOCK_PROJECT_SUMMARY], 1, 5);
    const { client, mockFetch } = createTestClient([jsonResponse(body)]);
    const result = await client.projects.list();
    expect(result).toEqual(body);
    expect(mockFetch.lastCall()?.url).toBe('https://moddex.gg/api/v1/projects');
  });

  it('sends filters, sorting, and pagination as query parameters', async () => {
    const { client, mockFetch } = createTestClient([jsonResponse(paginated([]))]);
    await client.projects.list({
      type: 'modpack',
      sort: 'bayesian_rating',
      direction: 'desc',
      featured: true,
      page: 2,
      per_page: 50,
    });
    const url = new URL(mockFetch.lastCall()!.url);
    expect(url.searchParams.get('type')).toBe('modpack');
    expect(url.searchParams.get('sort')).toBe('bayesian_rating');
    expect(url.searchParams.get('direction')).toBe('desc');
    expect(url.searchParams.get('featured')).toBe('1');
    expect(url.searchParams.get('page')).toBe('2');
    expect(url.searchParams.get('per_page')).toBe('50');
  });

  it('omits undefined options', async () => {
    const { client, mockFetch } = createTestClient([jsonResponse(paginated([]))]);
    await client.projects.list({ type: undefined, sort: 'name' });
    const url = new URL(mockFetch.lastCall()!.url);
    expect([...url.searchParams.keys()]).toEqual(['sort']);
  });

  it('iterates every page', async () => {
    const second = { ...MOCK_PROJECT_SUMMARY, id: 2, slug: 'jei' };
    const { client, mockFetch } = createTestClient([
      jsonResponse(paginated([MOCK_PROJECT_SUMMARY], 1, 2)),
      jsonResponse(paginated([second], 2, 2)),
    ]);

    const slugs: string[] = [];
    for await (const project of client.projects.iterate({ type: 'mod', per_page: 1 })) {
      slugs.push(project.slug);
    }

    expect(slugs).toEqual(['create', 'jei']);
    const pages = mockFetch.calls.map((call) => new URL(call.url).searchParams);
    expect(pages.map((params) => params.get('page'))).toEqual(['1', '2']);
    expect(pages.every((params) => params.get('type') === 'mod' && params.get('per_page') === '1')).toBe(true);
  });
});
