import { describe, it, expect } from 'vitest';
import {
  buildApiUrl,
  buildQueryString,
  extractErrorMessage,
  normalizeBaseUrl,
  parseRetryAfter,
  toErrorBody,
} from '../../src/utils/request.js';

describe('normalizeBaseUrl', () => {
  it('strips trailing slashes', () => {
    expect(normalizeBaseUrl('https://moddex.gg//')).toBe('https://moddex.gg');
  });

  it('throws on empty string', () => {
    expect(() => normalizeBaseUrl('')).toThrow(TypeError);
  });
});

describe('buildApiUrl', () => {
  it('joins base URL and path', () => {
    expect(buildApiUrl('https://moddex.gg', '/api/v2/tags')).toBe('https://moddex.gg/api/v2/tags');
  });

  it('skips null and undefined query values', () => {
    const url = buildApiUrl('https://moddex.gg', 'api/v2/tags', { type: null, per_page: undefined });
    expect(url).toBe('https://moddex.gg/api/v2/tags');
  });

  it('appends the query string', () => {
    expect(buildApiUrl('https://moddex.gg', 'api/v2/tags', { type: 'genre' })).toBe(
      'https://moddex.gg/api/v2/tags?type=genre',
    );
  });
});

describe('buildQueryString', () => {
  it('sends booleans as 1 and 0', () => {
    expect(buildQueryString({ featured: true, other: false })).toBe('featured=1&other=0');
  });

  it('stringifies numbers and encodes strings', () => {
    expect(buildQueryString({ page: 2, q: 'a&b c' })).toBe('page=2&q=a%26b%20c');
  });

  it('encodes list items one by one and joins them with literal commas', () => {
    expect(buildQueryString({ urls: ['https://a.com/x,y', 'b'], ids: [1, 2] })).toBe(
      'urls=https%3A%2F%2Fa.com%2Fx%2Cy,b&ids=1,2',
    );
  });

  it('skips empty lists', () => {
    expect(buildQueryString({ genres: [] })).toBe('');
  });
});

describe('toErrorBody', () => {
  it('keeps well-typed v2 error fields', () => {
    expect(
      toErrorBody({ message: 'API token has expired.', code: 'token_expired', hint: 'Create a new token.', docs_url: 'x' }),
    ).toEqual({ message: 'API token has expired.', code: 'token_expired', hint: 'Create a new token.' });
  });

  it('reads the v1 error field as the code', () => {
    expect(toErrorBody({ message: 'API token is missing.', error: 'token_missing' })).toEqual({
      message: 'API token is missing.',
      code: 'token_missing',
    });
  });

  it('keeps conflict matches and ambiguous candidates', () => {
    expect(toErrorBody({ matches: { curseforge_id: 1, modrinth_id: 'x' }, candidates: [{ id: 1 }, 'x'] })).toEqual({
      matches: { curseforge_id: 1 },
      candidates: [{ id: 1 }],
    });
  });

  it('normalizes validation errors and drops non-string messages', () => {
    expect(toErrorBody({ errors: { per_page: ['too big', 5], sort: 'invalid' } })).toEqual({
      errors: { per_page: ['too big'], sort: ['invalid'] },
    });
  });

  it('returns an empty object for non-object bodies', () => {
    expect(toErrorBody(null)).toEqual({});
    expect(toErrorBody('oops')).toEqual({});
    expect(toErrorBody([1])).toEqual({});
  });
});

describe('extractErrorMessage', () => {
  it('prefers the message field', () => {
    expect(extractErrorMessage({ message: 'Not Found' }, 404)).toBe('Not Found');
  });

  it('falls back to short text bodies, then to the status', () => {
    expect(extractErrorMessage('Bad Gateway', 502)).toBe('Bad Gateway');
    expect(extractErrorMessage('x'.repeat(500), 502)).toBe('HTTP 502');
    expect(extractErrorMessage(null, 500)).toBe('HTTP 500');
  });
});

describe('parseRetryAfter', () => {
  it('parses delta-seconds', () => {
    expect(parseRetryAfter('30')).toBe(30);
    expect(parseRetryAfter(' 0 ')).toBe(0);
  });

  it('parses an HTTP-date relative to now', () => {
    const now = Date.parse('2026-09-30T12:00:00Z');
    expect(parseRetryAfter('Wed, 30 Sep 2026 12:00:45 GMT', now)).toBe(45);
    expect(parseRetryAfter('Wed, 30 Sep 2026 11:00:00 GMT', now)).toBe(0);
  });

  it('returns null for missing or unreadable values', () => {
    expect(parseRetryAfter(null)).toBeNull();
    expect(parseRetryAfter('')).toBeNull();
    expect(parseRetryAfter('soon')).toBeNull();
  });
});
