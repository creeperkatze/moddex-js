import { describe, it, expect } from 'vitest';
import { createTestClient, rawQuery } from '../utils/client.js';
import { jsonResponse } from '../utils/http.js';
import {
  MOCK_DEPENDENCY,
  MOCK_FILE,
  MOCK_PROJECT,
  MOCK_PROJECT_LIST_ITEM,
  MOCK_REVIEW,
  paginated,
} from '../utils/fixtures.js';

describe('ProjectsApi', () => {
  it('lists projects and returns the full paginated envelope', async () => {
    const body = paginated([MOCK_PROJECT_LIST_ITEM], 1, 5);
    const { client, mockFetch } = createTestClient([jsonResponse(body)]);
    const result = await client.projects.list();
    expect(result).toEqual(body);
    expect(mockFetch.lastCall()?.url).toBe('https://moddex.gg/api/v2/projects');
  });

  it('sends filters as comma-separated lists, booleans as 1/0', async () => {
    const { client, mockFetch } = createTestClient([jsonResponse(paginated([]))]);
    await client.projects.list({
      q: 'create addon',
      type: 'mod',
      genres: ['tech', 'magic'],
      genres_mode: 'all',
      loaders_exclude: ['forge'],
      featured: true,
      mc_exact: false,
      sort: 'downloads_count',
      page: 2,
    });
    expect(rawQuery(mockFetch.lastCall())).toBe(
      'q=create%20addon&type=mod&genres=tech,magic&genres_mode=all&loaders_exclude=forge&featured=1&mc_exact=0' +
        '&sort=downloads_count&page=2',
    );
  });

  it('omits undefined options and empty lists', async () => {
    const { client, mockFetch } = createTestClient([jsonResponse(paginated([]))]);
    await client.projects.list({ type: undefined, genres: [], sort: 'name' });
    expect(rawQuery(mockFetch.lastCall())).toBe('sort=name');
  });

  it('iterates every page', async () => {
    const second = { ...MOCK_PROJECT_LIST_ITEM, id: 2, slug: 'lithium' };
    const { client, mockFetch } = createTestClient([
      jsonResponse(paginated([MOCK_PROJECT_LIST_ITEM], 1, 2)),
      jsonResponse(paginated([second], 2, 2)),
    ]);

    const slugs: string[] = [];
    for await (const project of client.projects.iterate({ type: 'mod', per_page: 1 })) {
      slugs.push(project.slug);
    }

    expect(slugs).toEqual(['sodium', 'lithium']);
    const pages = mockFetch.calls.map((call) => new URL(call.url).searchParams);
    expect(pages.map((params) => params.get('page'))).toEqual(['1', '2']);
    expect(pages.every((params) => params.get('type') === 'mod' && params.get('per_page') === '1')).toBe(true);
  });

  it('gets a project with include blocks and unwraps the data envelope', async () => {
    const { client, mockFetch } = createTestClient([jsonResponse({ data: MOCK_PROJECT })]);
    const project = await client.projects.get(1234, { include: ['description', 'ratings'] });
    expect(project).toEqual(MOCK_PROJECT);
    expect(mockFetch.lastCall()?.url).toBe('https://moddex.gg/api/v2/projects/1234?include=description,ratings');
  });

  it('lists reviews with filters', async () => {
    const { client, mockFetch } = createTestClient([jsonResponse(paginated([MOCK_REVIEW]))]);
    await client.projects.listReviews(1234, {
      sort: 'rating',
      min_rating: 3.5,
      play_statuses: ['playing', 'completed'],
      has_developer_response: true,
    });
    expect(mockFetch.lastCall()?.url).toBe(
      'https://moddex.gg/api/v2/projects/1234/reviews?sort=rating&min_rating=3.5&play_statuses=playing,completed' +
        '&has_developer_response=1',
    );
  });

  it('lists files with the platform meta', async () => {
    const body = paginated([MOCK_FILE]);
    const withPlatform = { ...body, meta: { ...body.meta, platform: 'modrinth', platforms: ['modrinth'] } };
    const { client, mockFetch } = createTestClient([jsonResponse(withPlatform)]);
    const result = await client.projects.listFiles(1234, { platform: 'modrinth', include: ['changelog'] });
    expect(result.meta.platforms).toEqual(['modrinth']);
    expect(mockFetch.lastCall()?.url).toBe(
      'https://moddex.gg/api/v2/projects/1234/files?platform=modrinth&include=changelog',
    );
  });

  it('lists dependencies with the incompatible list', async () => {
    const body = { ...paginated([MOCK_DEPENDENCY]), incompatible: [] };
    const { client, mockFetch } = createTestClient([jsonResponse(body)]);
    const result = await client.projects.listDependencies(1234, { relation_type: 'required' });
    expect(result.incompatible).toEqual([]);
    expect(mockFetch.lastCall()?.url).toBe(
      'https://moddex.gg/api/v2/projects/1234/dependencies?relation_type=required',
    );
  });

  it('iterates dependents and modpack contents', async () => {
    const { client, mockFetch } = createTestClient([
      jsonResponse(paginated([{ relation_type: 'include', project: MOCK_PROJECT_LIST_ITEM }])),
      jsonResponse({ ...paginated([MOCK_DEPENDENCY]), incompatible: [] }),
    ]);
    const dependents = [];
    for await (const dependent of client.projects.iterateDependents(1234, { type: 'modpack' })) {
      dependents.push(dependent);
    }
    const contents = [];
    for await (const dependency of client.projects.iterateContents(5678)) contents.push(dependency);

    expect(dependents).toHaveLength(1);
    expect(contents).toEqual([MOCK_DEPENDENCY]);
    expect(mockFetch.calls.map((call) => new URL(call.url).pathname)).toEqual([
      '/api/v2/projects/1234/dependents',
      '/api/v2/projects/5678/contents',
    ]);
  });

  it('lists similar projects with the computed flag', async () => {
    const body = { ...paginated([]), computed: false, computed_at: null };
    const { client, mockFetch } = createTestClient([jsonResponse(body)]);
    const result = await client.projects.listSimilar(1234);
    expect(result.computed).toBe(false);
    expect(mockFetch.lastCall()?.url).toBe('https://moddex.gg/api/v2/projects/1234/similar');
  });

  it('gets community tags and unwraps the data envelope', async () => {
    const data = { active: [], proposed: [] };
    const { client, mockFetch } = createTestClient([jsonResponse({ data })]);
    expect(await client.projects.getCommunityTags(1234)).toEqual(data);
    expect(mockFetch.lastCall()?.url).toBe('https://moddex.gg/api/v2/projects/1234/community-tags');
  });
});
