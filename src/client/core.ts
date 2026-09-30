import { ModDexError, ModDexNetworkError, ModDexTimeoutError } from '../errors.js';
import { ResponseCache } from '../utils/cache.js';
import { createApiError } from '../utils/errors.js';
import { buildApiUrl, normalizeBaseUrl, parseErrorBody } from '../utils/request.js';
import type { ModDexClientOptions, TokenExpiry } from '../types/base.js';

const DEFAULT_BASE_URL = 'https://moddex.gg';
const DEFAULT_TIMEOUT_MS = 10_000;
const TOKEN_EXPIRES_HEADER = 'X-ModDex-Token-Expires';

/** Options passed to individual request methods. */
export interface RequestOptions {
  query?: object;
}

/** Low-level HTTP client used internally by all API namespace classes. */
export class ModDexClientCore {
  readonly #baseUrl: string;
  readonly #token: string;
  readonly #timeoutMs: number;
  readonly #userAgent: string | undefined;
  readonly #fetch: typeof globalThis.fetch | undefined;
  readonly #cache: ResponseCache | undefined;
  #tokenExpiry: TokenExpiry | null = null;

  constructor(options: ModDexClientOptions) {
    if (!options || typeof options.token !== 'string' || options.token.trim() === '') {
      throw new TypeError('A ModDex API token is required. Create one under Settings > API Tokens on moddex.gg.');
    }

    this.#baseUrl = normalizeBaseUrl(options.baseUrl ?? DEFAULT_BASE_URL);
    this.#token = options.token;
    this.#timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.#userAgent = options.userAgent;
    // Stored as given and resolved per request: never bind or capture `globalThis.fetch` up front.
    this.#fetch = options.fetch;

    if (options.cache) {
      this.#cache = new ResponseCache(options.cache === true ? {} : options.cache);
    }
  }

  /** Token expiry from the most recent response that carried the `X-ModDex-Token-Expires` header. */
  get tokenExpiry(): TokenExpiry | null {
    return this.#tokenExpiry ? { ...this.#tokenExpiry } : null;
  }

  /** Removes every cached response. No-op when caching is disabled. */
  clearCache(): void {
    this.#cache?.clear();
  }

  /** Sends a GET request and parses the response body as JSON, using the cache when enabled. */
  async requestJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = buildApiUrl(this.#baseUrl, path, options.query);

    const cached = this.#cache?.get(url);
    if (cached) return cached.value as T;

    const response = await this.#send(url);

    let body: unknown;
    try {
      body = await response.json();
    } catch (err) {
      throw new ModDexError('Response body is not valid JSON', { status: response.status, response, cause: err });
    }

    this.#cache?.set(url, body);
    return body as T;
  }

  async #send(url: string): Promise<Response> {
    const headers = new Headers({
      Accept: 'application/json',
      Authorization: `Bearer ${this.#token}`,
    });

    if (this.#userAgent) {
      headers.set('User-Agent', this.#userAgent);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.#timeoutMs);
    const init: RequestInit = { method: 'GET', headers, signal: controller.signal };

    let response: Response;
    try {
      response = await this.#fetchWith(url, init);
    } catch (err) {
      if (err instanceof ModDexError) throw err;
      if (controller.signal.aborted) {
        throw new ModDexTimeoutError(`Request timed out after ${this.#timeoutMs}ms`, { cause: err });
      }
      const reason = err instanceof Error ? err.message : String(err);
      throw new ModDexNetworkError(`Request failed: ${reason}`, { cause: err });
    } finally {
      clearTimeout(timer);
    }

    this.#readTokenExpiry(response);

    if (!response.ok) {
      throw createApiError(response, await parseErrorBody(response));
    }

    return response;
  }

  #fetchWith(url: string, init: RequestInit): Promise<Response> {
    const customFetch = this.#fetch;
    if (customFetch) return customFetch(url, init);

    if (typeof globalThis.fetch !== 'function') {
      throw new ModDexError('No global fetch is available in this runtime. Pass a `fetch` implementation to the client.');
    }
    // Called as a method on globalThis so browsers' branded fetch gets a valid receiver.
    return globalThis.fetch(url, init);
  }

  #readTokenExpiry(response: Response): void {
    const raw = response.headers.get(TOKEN_EXPIRES_HEADER);
    if (!raw) return;

    const date = new Date(raw);
    this.#tokenExpiry = { raw, expiresAt: Number.isNaN(date.getTime()) ? null : date };
  }
}
