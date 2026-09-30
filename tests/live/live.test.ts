import { describe, it, expect, beforeAll } from 'vitest';
import { ModDexClient } from '../../src/client/moddex.js';
import { ModDexAuthenticationError, ModDexNotFoundError } from '../../src/errors.js';
import type { ProjectSummary } from '../../src/types/index.js';

/**
 * Live tests against moddex.gg. Skipped unless MODDEX_API_TOKEN is set.
 * They make about ten requests, well under the 60 requests per minute limit.
 *
 *   MODDEX_API_TOKEN=... pnpm test:live
 */
const token = process.env.MODDEX_API_TOKEN;
const baseUrl = process.env.MODDEX_API_BASE_URL;

describe.skipIf(!token)('live API', () => {
  let client: ModDexClient;
  let mod: ProjectSummary | undefined;
  let modpack: ProjectSummary | undefined;

  beforeAll(async () => {
    client = new ModDexClient({ token: token!, baseUrl, userAgent: 'moddex-js live tests', timeoutMs: 20_000 });

    const [mods, modpacks] = await Promise.all([
      client.projects.list({ type: 'mod', sort: 'total_reviews', direction: 'desc', per_page: 1 }),
      client.projects.list({ type: 'modpack', sort: 'total_reviews', direction: 'desc', per_page: 1 }),
    ]);
    mod = mods.data[0];
    modpack = modpacks.data[0];
  });

  it('reads the authenticated user and the token expiry header', async () => {
    const user = await client.user.get();
    expect(typeof user.id).toBe('number');
    expect(typeof user.username).toBe('string');
    expect(client.tokenExpiry?.raw).toEqual(expect.any(String));
  });

  it('lists projects with pagination metadata', async () => {
    const result = await client.projects.list({ per_page: 2 });
    expect(result.data.length).toBeLessThanOrEqual(2);
    expect(result.meta.per_page).toBe(2);
    expect(result.meta.current_page).toBe(1);
    expect(result.links).toHaveProperty('next');
  });

  it('gets a mod and its reviews by slug', async (context) => {
    if (!mod) return context.skip();
    const details = await client.mods.get(mod.slug);
    expect(details.slug).toBe(mod.slug);
    expect(details.type).toBe('mod');

    const reviews = await client.mods.listReviews(mod.slug, { per_page: 2 });
    expect(Array.isArray(reviews.data)).toBe(true);

    const first = reviews.data[0];
    if (first) {
      expect(Object.keys(first.author).sort()).toEqual(['id', 'name']);
      const review = await client.reviews.get(first.id);
      expect(review.id).toBe(first.id);
    }
  });

  it('gets a modpack by slug', async (context) => {
    if (!modpack) return context.skip();
    const details = await client.modpacks.get(modpack.slug);
    expect(details.slug).toBe(modpack.slug);
    expect(details.type).toBe('modpack');
  });

  it('lists tags by type', async () => {
    const tags = await client.tags.list({ type: 'genre' });
    expect(tags.data.every((tag) => tag.type === 'genre')).toBe(true);
  });

  it('throws ModDexNotFoundError for an unknown slug', async () => {
    await expect(client.mods.get('moddex-js-this-slug-does-not-exist')).rejects.toBeInstanceOf(ModDexNotFoundError);
  });

  it('throws ModDexAuthenticationError for an invalid token', async () => {
    const badClient = new ModDexClient({ token: 'invalid-token', baseUrl });
    const err = await badClient.user.get().catch((error: unknown) => error);
    expect(err).toBeInstanceOf(ModDexAuthenticationError);
  });
});
