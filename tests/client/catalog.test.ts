import { describe, it, expect } from 'vitest';
import { createTestClient } from '../utils/client.js';
import { jsonResponse } from '../utils/http.js';
import { MOCK_TAG } from '../utils/fixtures.js';

describe('CatalogApi', () => {
  it('lists tags by type and unwraps the data envelope', async () => {
    const { client, mockFetch } = createTestClient([jsonResponse({ data: [MOCK_TAG] })]);
    expect(await client.catalog.listTags({ type: 'genre' })).toEqual([MOCK_TAG]);
    expect(mockFetch.lastCall()?.url).toBe('https://moddex.gg/api/v2/tags?type=genre');
  });

  it('lists loaders and Minecraft versions', async () => {
    const loaders = [{ slug: 'fabric', name: 'Fabric' }];
    const versions = [{ version: '1.21.1', type: 'release', released_at: '2024-08-08' }];
    const { client, mockFetch } = createTestClient([jsonResponse({ data: loaders }), jsonResponse({ data: versions })]);
    expect(await client.catalog.listLoaders()).toEqual(loaders);
    expect(await client.catalog.listMinecraftVersions({ type: 'release' })).toEqual(versions);
    expect(mockFetch.calls.map((call) => call.url)).toEqual([
      'https://moddex.gg/api/v2/loaders',
      'https://moddex.gg/api/v2/minecraft-versions?type=release',
    ]);
  });

  it('gets the catalog filters', async () => {
    const data = {
      parameters: [],
      modes: ['any', 'all'],
      minecraft_version_groups: ['1.21'],
      sorts: [{ sort: 'name', default_direction: 'asc' }],
      default_sort: 'bayesian_rating',
      default_sort_with_q: 'relevance',
      per_page: { default: 20, max: 50 },
      max_page_depth: 10000,
    };
    const { client, mockFetch } = createTestClient([jsonResponse({ data })]);
    expect(await client.catalog.getFilters()).toEqual(data);
    expect(mockFetch.lastCall()?.url).toBe('https://moddex.gg/api/v2/catalog/filters');
  });
});
