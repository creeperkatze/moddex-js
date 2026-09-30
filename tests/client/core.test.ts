import { describe, it, expect, afterEach, vi } from 'vitest';
import { createTestClient } from '../utils/client.js';
import { createMockFetch, errorResponse, jsonResponse, textResponse } from '../utils/http.js';
import { MOCK_USER, MOCK_TAG, paginated } from '../utils/fixtures.js';
import {
  ModDexAuthenticationError,
  ModDexError,
  ModDexForbiddenError,
  ModDexNetworkError,
  ModDexNotFoundError,
  ModDexRateLimitError,
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
      const { client, mockFetch } = createTestClient([jsonResponse({ data: MOCK_USER })]);
      await client.user.get();
      expect(mockFetch.lastCall()?.headers.get('Authorization')).toBe('Bearer test-token');
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

    it('requires a non-empty token', () => {
      expect(() => new ModDexClient({ token: '' })).toThrow(TypeError);
      expect(() => new ModDexClient({ token: '   ' })).toThrow(TypeError);
      expect(() => new ModDexClient(undefined as unknown as { token: string })).toThrow(TypeError);
    });
  });

  describe('errors', () => {
    it.each([
      ['token_missing', 'Provide a token in the Authorization header.'],
      ['token_invalid', 'Create a new token under Settings > API Tokens.'],
      ['token_expired', 'Tokens expire after 90 days. Create a new one.'],
    ])('throws ModDexAuthenticationError with code %s on 401', async (code, hint) => {
      const { client } = createTestClient([errorResponse(401, { message: 'Unauthenticated.', error: code, hint })]);
      const err = await catchError(client.user.get());
      expect(err).toBeInstanceOf(ModDexAuthenticationError);
      expect(err).toBeInstanceOf(ModDexError);
      const authError = err as ModDexAuthenticationError;
      expect(authError.status).toBe(401);
      expect(authError.message).toBe('Unauthenticated.');
      expect(authError.code).toBe(code);
      expect(authError.hint).toBe(hint);
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
      const { client } = createTestClient([errorResponse(404, { message: 'Not Found' })]);
      const err = await catchError(client.mods.get('does-not-exist'));
      expect(err).toBeInstanceOf(ModDexNotFoundError);
      expect((err as ModDexNotFoundError).status).toBe(404);
      expect((err as ModDexNotFoundError).body).toEqual({ message: 'Not Found' });
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
      await client.tags.list({ type: 'genre' });
      await client.tags.list({ type: 'theme' });
      await client.tags.list({ type: 'genre' });
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
