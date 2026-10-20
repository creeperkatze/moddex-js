import { describe, it, expect, afterEach, vi } from 'vitest';
import { createTestClient } from '../utils/client.js';
import { createMockFetch, errorResponse, jsonResponse, textResponse } from '../utils/http.js';
import { MOCK_TAG, MOCK_USER, paginated } from '../utils/fixtures.js';
import {
  ModDexAuthenticationError,
  ModDexError,
  ModDexForbiddenError,
  ModDexNetworkError,
  ModDexNotFoundError,
  ModDexRateLimitError,
  ModDexServiceUnavailableError,
  ModDexTimeoutError,
  ModDexValidationError,
} from '../../src/errors.js';
import { ModDexClient } from '../../src/client/moddex.js';

async function catchError(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (err) {
    return err;
  }
  throw new Error('Expected promise to reject');
}

describe('ModDexClientCore', () => {
  describe('requests', () => {
    it('sends the token as a bearer Authorization header', async () => {
      const { client, mockFetch } = createTestClient([jsonResponse({ data: MOCK_USER })], { token: 'test-token' });
      await client.user.get();
      expect(mockFetch.lastCall()?.headers.get('Authorization')).toBe('Bearer test-token');
    });

    it('sends no Authorization header without a token', async () => {
      const { client, mockFetch } = createTestClient([jsonResponse({ data: [] })]);
      await client.catalog.listLoaders();
      expect(mockFetch.lastCall()?.headers.has('Authorization')).toBe(false);
    });

    it('identifies the app with the X-Client header when configured', async () => {
      const { client, mockFetch } = createTestClient([jsonResponse({ data: [] })], { client: 'my-app/1.0.0' });
      await client.catalog.listLoaders();
      expect(mockFetch.lastCall()?.headers.get('X-Client')).toBe('my-app/1.0.0');
    });

    it('asks for JSON and uses GET', async () => {
      const { client, mockFetch } = createTestClient([jsonResponse({ data: MOCK_USER })]);
      await client.user.get();
      expect(mockFetch.lastCall()?.headers.get('Accept')).toBe('application/json');
      expect(mockFetch.lastCall()?.method).toBe('GET');
    });

    it('sends a custom User-Agent header when configured', async () => {
      const { client, mockFetch } = createTestClient([jsonResponse({ data: MOCK_USER })], {
        userAgent: 'my-app/1.0',
      });
      await client.user.get();
      expect(mockFetch.lastCall()?.headers.get('User-Agent')).toBe('my-app/1.0');
    });

    it('defaults to https://moddex.gg and strips trailing slashes from a custom base URL', async () => {
      const first = createTestClient([jsonResponse({ data: MOCK_USER })], { baseUrl: undefined });
      await first.client.user.get();
      expect(first.mockFetch.lastCall()?.url).toBe('https://moddex.gg/api/user');

      const second = createTestClient([jsonResponse({ data: MOCK_USER })], { baseUrl: 'https://proxy.example.com/' });
      await second.client.user.get();
      expect(second.mockFetch.lastCall()?.url).toBe('https://proxy.example.com/api/user');
    });

    it('works without options, and rejects a blank token', () => {
      expect(() => new ModDexClient()).not.toThrow();
      expect(() => new ModDexClient({ token: '' })).toThrow(TypeError);
      expect(() => new ModDexClient({ token: '   ' })).toThrow(TypeError);
    });
  });

  describe('errors', () => {
    it.each([
      ['unauthenticated', 'Create a new token and update the Authorization header.'],
      ['token_expired', 'Create a new token and update the Authorization header.'],
    ])('throws ModDexAuthenticationError with code %s on 401', async (code, hint) => {
      const { client } = createTestClient([errorResponse(401, { message: 'Unauthenticated.', code, hint })]);
      const err = await catchError(client.projects.get(1));
      expect(err).toBeInstanceOf(ModDexAuthenticationError);
      expect((err as ModDexAuthenticationError).code).toBe(code);
      expect((err as ModDexAuthenticationError).hint).toBe(hint);
    });

    it('reads the v1 error field that user.get() still answers with', async () => {
      const { client } = createTestClient([
        errorResponse(401, { message: 'API token is missing.', error: 'token_missing', hint: 'Include a token.' }),
      ]);
      const err = await catchError(client.user.get());
      expect(err).toBeInstanceOf(ModDexAuthenticationError);
      expect(err).toBeInstanceOf(ModDexError);
      const authError = err as ModDexAuthenticationError;
      expect(authError.status).toBe(401);
      expect(authError.message).toBe('API token is missing.');
      expect(authError.code).toBe('token_missing');
      expect(authError.hint).toBe('Include a token.');
      expect(authError.name).toBe('ModDexAuthenticationError');
    });

    it('leaves code and hint null when a 401 body only has a message', async () => {
      const { client } = createTestClient([errorResponse(401, { message: 'Unauthenticated.' })]);
      const err = (await catchError(client.user.get())) as ModDexAuthenticationError;
      expect(err.code).toBeNull();
      expect(err.hint).toBeNull();
    });

    it('throws ModDexForbiddenError on 403', async () => {
      const { client } = createTestClient([errorResponse(403, { message: 'Your email address is not verified.' })]);
      const err = await catchError(client.user.get());
      expect(err).toBeInstanceOf(ModDexForbiddenError);
      expect((err as ModDexForbiddenError).message).toBe('Your email address is not verified.');
    });

    it('throws ModDexNotFoundError on 404', async () => {
      const body = { message: 'No ModDex project matches.', code: 'not_found' };
      const { client } = createTestClient([errorResponse(404, body)]);
      const err = await catchError(client.lookup.get('moddex', 'does-not-exist'));
      expect(err).toBeInstanceOf(ModDexNotFoundError);
      expect((err as ModDexNotFoundError).status).toBe(404);
      expect((err as ModDexNotFoundError).code).toBe('not_found');
      expect((err as ModDexNotFoundError).body).toEqual(body);
    });

    it('throws ModDexValidationError with the errors object on 422', async () => {
      const errors = { per_page: ['The per page field must not be greater than 50.'] };
      const { client } = createTestClient([
        errorResponse(422, { message: 'The per page field must not be greater than 50.', errors }),
      ]);
      const err = await catchError(client.projects.list({ per_page: 500 }));
      expect(err).toBeInstanceOf(ModDexValidationError);
      expect((err as ModDexValidationError).errors).toEqual(errors);
    });

    it.each(['page_depth_exceeded', 'invalid_cursor'])('throws ModDexValidationError for %s', async (code) => {
      const { client } = createTestClient([errorResponse(422, { message: 'Invalid.', code })]);
      const err = (await catchError(client.projects.list())) as ModDexValidationError;
      expect(err).toBeInstanceOf(ModDexValidationError);
      expect(err.code).toBe(code);
    });

    it('defaults validation errors to an empty object', async () => {
      const { client } = createTestClient([errorResponse(422, { message: 'Invalid.' })]);
      const err = (await catchError(client.projects.list())) as ModDexValidationError;
      expect(err.errors).toEqual({});
    });

    it('throws ModDexRateLimitError with retryAfter from the Retry-After header on 429', async () => {
      const { client } = createTestClient([
        errorResponse(429, { message: 'Too Many Attempts.' }, { 'Retry-After': '42' }),
      ]);
      const err = await catchError(client.projects.list());
      expect(err).toBeInstanceOf(ModDexRateLimitError);
      expect((err as ModDexRateLimitError).retryAfter).toBe(42);
      expect((err as ModDexRateLimitError).message).toBe('Too Many Attempts.');
    });

    it('sets retryAfter to null when a 429 has no Retry-After header', async () => {
      const { client } = createTestClient([errorResponse(429, { message: 'Too Many Attempts.' })]);
      const err = (await catchError(client.projects.list())) as ModDexRateLimitError;
      expect(err.retryAfter).toBeNull();
    });

    it('throws ModDexServiceUnavailableError with retryAfter and hint on 503', async () => {
      const { client } = createTestClient([
        errorResponse(
          503,
          { message: 'Service temporarily unavailable.', code: 'service_unavailable', hint: 'Search is down.' },
          { 'Retry-After': '30' },
        ),
      ]);
      const err = (await catchError(client.projects.list({ q: 'sodium' }))) as ModDexServiceUnavailableError;
      expect(err).toBeInstanceOf(ModDexServiceUnavailableError);
      expect(err.retryAfter).toBe(30);
      expect(err.hint).toBe('Search is down.');
    });

    it('throws a plain ModDexError for other statuses and non-JSON bodies', async () => {
      const { client } = createTestClient([textResponse('Bad Gateway', 502)]);
      const err = await catchError(client.projects.list());
      expect(err).toBeInstanceOf(ModDexError);
      expect(err).not.toBeInstanceOf(ModDexNotFoundError);
      expect((err as ModDexError).status).toBe(502);
      expect((err as ModDexError).message).toBe('Bad Gateway');
    });

    it('throws ModDexError when a successful response is not JSON', async () => {
      const { client } = createTestClient([textResponse('<html></html>')]);
      const err = await catchError(client.user.get());
      expect(err).toBeInstanceOf(ModDexError);
      expect((err as ModDexError).status).toBe(200);
    });

    it('wraps fetch failures in ModDexNetworkError', async () => {
      const cause = new TypeError('fetch failed');
      const client = new ModDexClient({ token: 't', fetch: () => Promise.reject(cause) });
      const err = await catchError(client.user.get());
      expect(err).toBeInstanceOf(ModDexNetworkError);
      expect((err as ModDexNetworkError).status).toBe(0);
      expect((err as ModDexNetworkError).cause).toBe(cause);
    });

    it('throws ModDexTimeoutError when the request exceeds timeoutMs', async () => {
      const hangingFetch = (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
        });
      const client = new ModDexClient({ token: 't', timeoutMs: 5, fetch: hangingFetch });
      const err = await catchError(client.user.get());
      expect(err).toBeInstanceOf(ModDexTimeoutError);
      expect((err as ModDexTimeoutError).status).toBe(0);
    });
  });

  describe('token expiry', () => {
    it('is null before any request', () => {
      const { client } = createTestClient();
      expect(client.tokenExpiry).toBeNull();
    });

    it('exposes X-ModDex-Token-Expires from the latest response', async () => {
      const { client } = createTestClient([
        jsonResponse({ data: MOCK_USER }, 200, { 'X-ModDex-Token-Expires': '2026-12-29T12:00:00+00:00' }),
        jsonResponse({ data: MOCK_USER }, 200, { 'X-ModDex-Token-Expires': '2026-12-30T12:00:00+00:00' }),
      ]);

      await client.user.get();
      expect(client.tokenExpiry?.raw).toBe('2026-12-29T12:00:00+00:00');
      expect(client.tokenExpiry?.expiresAt?.toISOString()).toBe('2026-12-29T12:00:00.000Z');

      await client.user.get();
      expect(client.tokenExpiry?.expiresAt?.toISOString()).toBe('2026-12-30T12:00:00.000Z');
    });

    it('keeps the previous value when a response has no header', async () => {
      const { client } = createTestClient([
        jsonResponse({ data: MOCK_USER }, 200, { 'X-ModDex-Token-Expires': '2026-12-29T12:00:00+00:00' }),
        jsonResponse({ data: MOCK_USER }),
      ]);
      await client.user.get();
      await client.user.get();
      expect(client.tokenExpiry?.raw).toBe('2026-12-29T12:00:00+00:00');
    });

    it('keeps the raw value and a null date when the header is not a date', async () => {
      const { client } = createTestClient([
        jsonResponse({ data: MOCK_USER }, 200, { 'X-ModDex-Token-Expires': 'soon' }),
      ]);
      await client.user.get();
      expect(client.tokenExpiry).toEqual({ raw: 'soon', expiresAt: null });
    });

    it('returns a copy that callers cannot use to change client state', async () => {
      const { client } = createTestClient([
        jsonResponse({ data: MOCK_USER }, 200, { 'X-ModDex-Token-Expires': '2026-12-29T12:00:00+00:00' }),
      ]);
      await client.user.get();
      client.tokenExpiry!.raw = 'changed';
      expect(client.tokenExpiry?.raw).toBe('2026-12-29T12:00:00+00:00');
    });
  });

  describe('rate limit', () => {
    it('is null before any request', () => {
      const { client } = createTestClient();
      expect(client.rateLimit).toBeNull();
    });

    it('exposes the X-RateLimit-* headers of the latest response', async () => {
      const { client } = createTestClient([
        jsonResponse({ data: [] }, 200, {
          'X-RateLimit-Limit': '60',
          'X-RateLimit-Remaining': '59',
          'X-RateLimit-Reset': '1792453389',
        }),
      ]);
      await client.catalog.listLoaders();
      expect(client.rateLimit).toEqual({ limit: 60, remaining: 59, resetAt: new Date(1792453389 * 1000) });
    });

    it('updates from error responses too', async () => {
      const { client } = createTestClient([
        errorResponse(429, { code: 'rate_limited' }, { 'X-RateLimit-Limit': '60', 'X-RateLimit-Remaining': '0' }),
      ]);
      await catchError(client.catalog.listLoaders());
      expect(client.rateLimit).toEqual({ limit: 60, remaining: 0, resetAt: null });
    });
  });

  describe('cache', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('is off by default', async () => {
      const { client, mockFetch } = createTestClient([
        jsonResponse({ data: MOCK_USER }),
        jsonResponse({ data: MOCK_USER }),
      ]);
      await client.user.get();
      await client.user.get();
      expect(mockFetch.callCount()).toBe(2);
    });

    it('serves repeated requests from memory when enabled', async () => {
      const { client, mockFetch } = createTestClient([jsonResponse({ data: MOCK_USER })], { cache: true });
      const first = await client.user.get();
      const second = await client.user.get();
      expect(second).toEqual(first);
      expect(mockFetch.callCount()).toBe(1);
    });

    it('keys entries by full URL including the query', async () => {
      const { client, mockFetch } = createTestClient(
        [jsonResponse(paginated([MOCK_TAG])), jsonResponse(paginated([MOCK_TAG]))],
        { cache: true },
      );
      await client.catalog.listTags({ type: 'genre' });
      await client.catalog.listTags({ type: 'theme' });
      await client.catalog.listTags({ type: 'genre' });
      expect(mockFetch.callCount()).toBe(2);
    });

    it('refetches after the TTL expires', async () => {
      vi.useFakeTimers();
      const { client, mockFetch } = createTestClient(
        [jsonResponse({ data: MOCK_USER }), jsonResponse({ data: MOCK_USER })],
        { cache: { ttlMs: 1_000 } },
      );
      await client.user.get();
      vi.advanceTimersByTime(999);
      await client.user.get();
      expect(mockFetch.callCount()).toBe(1);
      vi.advanceTimersByTime(1);
      await client.user.get();
      expect(mockFetch.callCount()).toBe(2);
    });

    it('does not cache errors', async () => {
      const { client, mockFetch } = createTestClient(
        [errorResponse(404, { message: 'Not Found' }), jsonResponse({ data: MOCK_USER })],
        { cache: true },
      );
      await expect(client.user.get()).rejects.toBeInstanceOf(ModDexNotFoundError);
      await expect(client.user.get()).resolves.toEqual(MOCK_USER);
      expect(mockFetch.callCount()).toBe(2);
    });

    it('returns copies so mutating a result does not change the cache', async () => {
      const { client } = createTestClient([jsonResponse({ data: MOCK_USER })], { cache: true });
      const first = await client.user.get();
      first.name = 'Alex';
      const second = await client.user.get();
      expect(second.name).toBe('Steve');
    });

    it('clearCache() forces the next request to hit the network', async () => {
      const { client, mockFetch } = createTestClient(
        [jsonResponse({ data: MOCK_USER }), jsonResponse({ data: MOCK_USER })],
        { cache: true },
      );
      await client.user.get();
      client.clearCache();
      await client.user.get();
      expect(mockFetch.callCount()).toBe(2);
    });
  });

  describe('default fetch', () => {
    const originalFetch = globalThis.fetch;

    afterEach(() => {
      globalThis.fetch = originalFetch;
    });

    it('invokes globalThis.fetch with a `this` receiver it accepts', async () => {
      // Simulates a browser's branded fetch, which throws "Illegal invocation" if `this` isn't the global.
      globalThis.fetch = function (this: unknown) {
        if (this !== globalThis) {
          throw new TypeError("Failed to execute 'fetch' on 'Window': Illegal invocation");
        }
        return Promise.resolve(jsonResponse({ data: MOCK_USER }));
      } as typeof fetch;

      const client = new ModDexClient({ token: 't' });
      await expect(client.user.get()).resolves.toEqual(MOCK_USER);
    });

    it('looks up globalThis.fetch per request instead of capturing it at construction', async () => {
      const client = new ModDexClient({ token: 't' });

      const lateFetch = createMockFetch([jsonResponse({ data: MOCK_USER })]);
      globalThis.fetch = lateFetch as unknown as typeof fetch;

      await expect(client.user.get()).resolves.toEqual(MOCK_USER);
      expect(lateFetch.callCount()).toBe(1);
    });

    it('throws a helpful error when no fetch is available', async () => {
      globalThis.fetch = undefined as unknown as typeof fetch;
      const client = new ModDexClient({ token: 't' });
      const err = await catchError(client.user.get());
      expect(err).toBeInstanceOf(ModDexError);
      expect((err as ModDexError).message).toMatch(/fetch/);
    });
  });
});
