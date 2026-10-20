import { describe, it, expect } from 'vitest';
import { createTestClient, rawQuery } from '../utils/client.js';
import { errorResponse, jsonResponse } from '../utils/http.js';
import { MOCK_FILE, MOCK_PROJECT, MOCK_PROJECT_SUMMARY, MOCK_REVIEW, paginated } from '../utils/fixtures.js';
import { ModDexAmbiguousError, ModDexConflictError, ModDexNotFoundError } from '../../src/errors.js';
import type { LookupMatch } from '../../src/types/index.js';

const MATCHED: LookupMatch = {
  key: 'modrinth_slug',
  value: 'sodium',
  via_facet: false,
  via_alias: false,
  alternatives: [],
};

describe('LookupApi', () => {
  it('looks a project up by platform and value', async () => {
    const body = { data: MOCK_PROJECT, matched: MATCHED };
    const { client, mockFetch } = createTestClient([jsonResponse(body)]);
    const result = await client.lookup.get('modrinth', 'sodium', { type: 'mod', include: ['ratings', 'counts'] });
    expect(result).toEqual(body);
    expect(mockFetch.lastCall()?.url).toBe(
      'https://moddex.gg/api/v2/lookup/modrinth/sodium?type=mod&include=ratings,counts',
    );
  });

  it('encodes the value as a single path segment', async () => {
    const { client, mockFetch } = createTestClient([jsonResponse({ data: MOCK_PROJECT, matched: MATCHED })]);
    await client.lookup.get('moddex', 'a/b?c');
    expect(mockFetch.lastCall()?.url).toBe('https://moddex.gg/api/v2/lookup/moddex/a%2Fb%3Fc');
  });

  it('finds a project by explicit keys and a link', async () => {
    const { client, mockFetch } = createTestClient([jsonResponse({ data: MOCK_PROJECT, matched: {} })]);
    await client.lookup.find({ curseforge_id: 394468, url: 'https://modrinth.com/mod/sodium' });
    expect(new URL(mockFetch.lastCall()!.url).pathname).toBe('/api/v2/lookup');
    expect(rawQuery(mockFetch.lastCall())).toBe('curseforge_id=394468&url=https%3A%2F%2Fmodrinth.com%2Fmod%2Fsodium');
  });

  it('lists reviews with the project in meta', async () => {
    const body = paginated([MOCK_REVIEW]);
    const withProject = { ...body, meta: { ...body.meta, project: MOCK_PROJECT_SUMMARY, matched: MATCHED } };
    const { client, mockFetch } = createTestClient([jsonResponse(withProject)]);
    const result = await client.lookup.listReviews('modrinth', 'AANobbMI', { sort: 'helpful', unmasked: true });
    expect(result.meta.project).toEqual(MOCK_PROJECT_SUMMARY);
    expect(mockFetch.lastCall()?.url).toBe(
      'https://moddex.gg/api/v2/lookup/modrinth/AANobbMI/reviews?sort=helpful&unmasked=1',
    );
  });

  it('iterates every review page', async () => {
    const { client, mockFetch } = createTestClient([
      jsonResponse(paginated([MOCK_REVIEW], 1, 2)),
      jsonResponse(paginated([{ ...MOCK_REVIEW, id: 78 }], 2, 2)),
    ]);
    const ids: number[] = [];
    for await (const review of client.lookup.iterateReviews('curseforge', 394468)) ids.push(review.id);
    expect(ids).toEqual([77, 78]);
    expect(mockFetch.calls.map((call) => new URL(call.url).pathname)).toEqual([
      '/api/v2/lookup/curseforge/394468/reviews',
      '/api/v2/lookup/curseforge/394468/reviews',
    ]);
  });

  it('batches links, encoding each one but keeping the commas between them', async () => {
    const data = { modrinth: {}, curseforge: {}, moddex: {}, urls: { 'https://modrinth.com/mod/sodium': null } };
    const { client, mockFetch } = createTestClient([jsonResponse({ data })]);
    const result = await client.lookup.batch({
      urls: ['https://modrinth.com/mod/sodium', 'https://www.curseforge.com/minecraft/modpacks/a,b'],
      modrinth: ['AANobbMI', 'lithium'],
    });
    expect(result).toEqual(data);
    expect(rawQuery(mockFetch.lastCall())).toBe(
      'urls=https%3A%2F%2Fmodrinth.com%2Fmod%2Fsodium,https%3A%2F%2Fwww.curseforge.com%2Fminecraft%2Fmodpacks%2Fa%2Cb' +
        '&modrinth=AANobbMI,lithium',
    );
  });

  it('looks a file up and unwraps the data envelope', async () => {
    const match = { file: MOCK_FILE, project: MOCK_PROJECT_SUMMARY, secondary: false };
    const { client, mockFetch } = createTestClient([jsonResponse({ data: match })]);
    const result = await client.lookup.file({ sha1: MOCK_FILE.sha1! });
    expect(result).toEqual(match);
    expect(mockFetch.lastCall()?.url).toBe(`https://moddex.gg/api/v2/lookup/files?sha1=${MOCK_FILE.sha1}`);
  });

  it('batches file lookups', async () => {
    const data = { sha1: {}, curseforge_file_id: { '5432101': null } };
    const { client, mockFetch } = createTestClient([jsonResponse({ data })]);
    const result = await client.lookup.fileBatch({ curseforge_file_id: [5432101, 5432102] });
    expect(result).toEqual(data);
    expect(rawQuery(mockFetch.lastCall())).toBe('curseforge_file_id=5432101,5432102');
  });

  it('throws ModDexNotFoundError when nothing matches', async () => {
    const { client } = createTestClient([
      errorResponse(404, { message: 'No ModDex project matches.', code: 'not_found' }),
    ]);
    const err = await client.lookup.get('modrinth', 'missing').catch((error: unknown) => error);
    expect(err).toBeInstanceOf(ModDexNotFoundError);
    expect((err as ModDexNotFoundError).code).toBe('not_found');
  });

  it('throws ModDexAmbiguousError with the candidates when a slug is shared', async () => {
    const candidates = [MOCK_PROJECT_SUMMARY, { ...MOCK_PROJECT_SUMMARY, id: 5678, type: 'modpack' }];
    const { client } = createTestClient([
      errorResponse(422, {
        message: 'More than one project matches.',
        code: 'ambiguous',
        hint: 'Pass type=mod or type=modpack.',
        candidates,
      }),
    ]);
    const err = (await client.lookup.get('curseforge', 'sodium').catch((error: unknown) => error)) as ModDexAmbiguousError;
    expect(err).toBeInstanceOf(ModDexAmbiguousError);
    expect(err.candidates).toEqual(candidates);
    expect(err.hint).toBe('Pass type=mod or type=modpack.');
  });

  it('throws ModDexConflictError with the matches when keys hit different projects', async () => {
    const matches = { curseforge_id: 1234, modrinth_id: 5678 };
    const { client } = createTestClient([
      errorResponse(409, { message: 'The identifiers match different projects.', code: 'conflict', matches }),
    ]);
    const err = (await client.lookup
      .find({ curseforge_id: 1, modrinth_id: 'AANobbMI' })
      .catch((error: unknown) => error)) as ModDexConflictError;
    expect(err).toBeInstanceOf(ModDexConflictError);
    expect(err.matches).toEqual(matches);
  });
});
