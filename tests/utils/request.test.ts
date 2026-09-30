import { describe, it, expect } from 'vitest';
import {
  appendQuery,
  buildApiUrl,
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
    expect(buildApiUrl('https://moddex.gg', '/api/v1/tags')).toBe('https://moddex.gg/api/v1/tags');
  });

  it('skips null and undefined query values', () => {
    const url = buildApiUrl('https://moddex.gg', 'api/v1/tags', { type: null, per_page: undefined });
    expect(url).toBe('https://moddex.gg/api/v1/tags');
  });
});

describe('appendQuery', () => {
  it('sends booleans as 1 and 0', () => {
    const url = appendQuery(new URL('https://moddex.gg/api/v1/projects'), { featured: true, other: false });
    expect(url.searchParams.get('featured')).toBe('1');
    expect(url.searchParams.get('other')).toBe('0');
  });

  it('stringifies numbers', () => {
    const url = appendQuery(new URL('https://moddex.gg/api/v1/projects'), { page: 2 });
    expect(url.searchParams.get('page')).toBe('2');
  });
});

describe('toErrorBody', () => {
  it('keeps well-typed Laravel error fields', () => {
    expect(
      toErrorBody({ message: 'Unauthenticated.', error: 'token_expired', hint: 'Create a new token.' }),
    ).toEqual({ message: 'Unauthenticated.', error: 'token_expired', hint: 'Create a new token.' });
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
