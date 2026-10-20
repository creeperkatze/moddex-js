import { describe, it, expect, beforeAll } from 'vitest';
import { ModDexClient } from '../../src/client/moddex.js';
import { ModDexAuthenticationError, ModDexNotFoundError } from '../../src/errors.js';
import {
  MOCK_FILE,
  MOCK_PROJECT,
  MOCK_PROJECT_LIST_ITEM,
  MOCK_PROJECT_SUMMARY,
  MOCK_REVIEW,
  MOCK_TAG,
} from '../utils/fixtures.js';

/**
 * Live tests against moddex.gg. Skipped unless MODDEX_LIVE=1 or MODDEX_API_TOKEN is set. A token is optional.
 * They make about fifteen requests, well under the 60 requests per minute allowed without a token.
 *
 *   MODDEX_LIVE=1 pnpm test:live
 *
 * Responses are compared key by key with the typed fixtures, so a field ModDex adds, renames or removes fails here.
 */
const token = process.env.MODDEX_API_TOKEN;
const baseUrl = process.env.MODDEX_API_BASE_URL;
const enabled = process.env.MODDEX_LIVE === '1' || !!token;

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

/** Asserts that `actual` has exactly the keys of `expected`, recursing into nested objects and first array items. */
function expectSameShape(actual: unknown, expected: unknown, path = 'response'): void {
  if (Array.isArray(actual) && Array.isArray(expected)) {
    if (actual.length > 0 && expected.length > 0) expectSameShape(actual[0], expected[0], `${path}[0]`);
    return;
  }
  if (!isObject(actual) || !isObject(expected)) return;

  expect(Object.keys(actual).sort(), path).toEqual(Object.keys(expected).sort());
  for (const key of Object.keys(expected)) {
    expectSameShape(actual[key], expected[key], `${path}.${key}`);
  }
}

describe.skipIf(!enabled)('live API', () => {
  let client: ModDexClient;
  let projectId: number;

  beforeAll(async () => {
    client = new ModDexClient({ token, baseUrl, client: 'moddex-js-live-tests/2.0.0', timeoutMs: 20_000 });
    projectId = (await client.lookup.get('modrinth', 'AANobbMI')).data.id;
  });

  it('looks a project up by Modrinth ID in the full shape', async () => {
    const { data, matched } = await client.lookup.get('modrinth', 'AANobbMI');
    expectSameShape(data, MOCK_PROJECT, 'project');
    expect(matched.key).toBe('modrinth_id');
    expect(client.rateLimit?.limit).toEqual(expect.any(Number));
  });

  it('adds include blocks', async () => {
    const project = await client.projects.get(projectId, { include: ['ratings', 'counts'] });
    expect(project.ratings?.histogram).toHaveLength(10);
    expect(project.counts.followers).toEqual(expect.any(Number));
  });

  it('lists a looked-up project reviews with the project summary', async () => {
    const page = await client.lookup.listReviews('modrinth', 'sodium', { per_page: 2 });
    expectSameShape(page.meta.project, MOCK_PROJECT_SUMMARY, 'meta.project');
    const first = page.data[0];
    if (first) {
      expectSameShape({ ...first, developer_response: null }, MOCK_REVIEW, 'review');
      expect((await client.reviews.get(first.id)).id).toBe(first.id);
    }
  });

  it('lists projects in the list shape', async () => {
    const page = await client.projects.list({ type: 'mod', per_page: 2 });
    expect(page.meta.per_page).toBe(2);
    expectSameShape(page.data[0], MOCK_PROJECT_LIST_ITEM, 'list item');
  });

  it('lists files and dependencies', async () => {
    const files = await client.projects.listFiles(projectId, { per_page: 1 });
    expectSameShape(files.data[0], MOCK_FILE, 'file');
    expect(files.meta.platforms.length).toBeGreaterThan(0);

    const dependencies = await client.projects.listDependencies(projectId);
    expect(Array.isArray(dependencies.incompatible)).toBe(true);
    expect(dependencies.meta.source).toEqual(expect.any(Number));
  });

  it('batches links, which need literal commas between them', async () => {
    const urls = ['https://modrinth.com/mod/sodium', 'https://www.curseforge.com/minecraft/modpacks/rlcraft'];
    const result = await client.lookup.batch({ urls });
    expect(Object.keys(result.urls).sort()).toEqual(urls.sort());
    expectSameShape(result.urls[urls[0]!], MOCK_PROJECT_SUMMARY, 'batch entry');
  });

  it('lists catalog tags', async () => {
    const tags = await client.catalog.listTags({ type: 'genre' });
    expect(tags.every((tag) => tag.type === 'genre')).toBe(true);
    expectSameShape(tags[0], MOCK_TAG, 'tag');
  });

  it('reads a sync feed page', async () => {
    const page = await client.sync.listReviews({ since: '2026-10-01', per_page: 1 });
    expect(page.meta.next_cursor).toEqual(expect.any(String));
    expect(typeof page.meta.has_more).toBe('boolean');
  });

  it('throws ModDexNotFoundError for an unknown slug', async () => {
    await expect(client.lookup.get('moddex', 'moddex-js-this-slug-does-not-exist')).rejects.toBeInstanceOf(
      ModDexNotFoundError,
    );
  });

  it('throws ModDexAuthenticationError for an invalid token', async () => {
    const badClient = new ModDexClient({ token: 'invalid-token', baseUrl });
    const err = await badClient.lookup.get('modrinth', 'sodium').catch((error: unknown) => error);
    expect(err).toBeInstanceOf(ModDexAuthenticationError);
    expect((err as ModDexAuthenticationError).code).toBe('unauthenticated');
  });
});
