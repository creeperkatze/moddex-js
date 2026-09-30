import type { CacheOptions } from '../types/base.js';

const DEFAULT_TTL_MS = 60_000;
const DEFAULT_MAX_ENTRIES = 500;

interface CacheEntry {
  expiresAt: number;
  value: unknown;
}

/** In-memory TTL cache for parsed response bodies. Values are cloned on read and write so callers cannot mutate cached data. */
export class ResponseCache {
  readonly #entries = new Map<string, CacheEntry>();
  readonly #ttlMs: number;
  readonly #maxEntries: number;
  readonly #now: () => number;

  constructor(options: CacheOptions = {}, now: () => number = Date.now) {
    this.#ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
    this.#maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES;
    this.#now = now;

    if (!(this.#ttlMs > 0)) throw new TypeError('cache.ttlMs must be a positive number');
    if (!(this.#maxEntries > 0)) throw new TypeError('cache.maxEntries must be a positive number');
  }

  get size(): number {
    return this.#entries.size;
  }

  get(key: string): { value: unknown } | undefined {
    const entry = this.#entries.get(key);
    if (!entry) return undefined;

    if (entry.expiresAt <= this.#now()) {
      this.#entries.delete(key);
      return undefined;
    }

    return { value: structuredClone(entry.value) };
  }

  set(key: string, value: unknown): void {
    this.#entries.delete(key);

    while (this.#entries.size >= this.#maxEntries) {
      const oldest = this.#entries.keys().next().value;
      if (oldest === undefined) break;
      this.#entries.delete(oldest);
    }

    this.#entries.set(key, { expiresAt: this.#now() + this.#ttlMs, value: structuredClone(value) });
  }

  clear(): void {
    this.#entries.clear();
  }
}
