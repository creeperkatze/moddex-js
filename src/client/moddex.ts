import { CatalogApi } from './catalog.js';
import { ModDexClientCore } from './core.js';
import { LookupApi } from './lookup.js';
import { ProjectsApi } from './projects.js';
import { ReviewsApi } from './reviews.js';
import { SyncApi } from './sync.js';
import { UserApi } from './user.js';
import type { ModDexClientOptions, RateLimit, TokenExpiry } from '../types/base.js';

/**
 * Client for the ModDex API v2. Every endpoint is public, so a token is optional.
 * @example
 * ```ts
 * import ModDexClient from 'moddex-js';
 * const client = new ModDexClient({ client: 'my-app/1.0.0' });
 * const { data: reviews, meta } = await client.lookup.listReviews('modrinth', 'sodium');
 * ```
 */
export class ModDexClient {
  readonly #core: ModDexClientCore;

  readonly lookup: LookupApi;
  readonly projects: ProjectsApi;
  readonly reviews: ReviewsApi;
  readonly catalog: CatalogApi;
  readonly sync: SyncApi;
  readonly user: UserApi;

  constructor(options: ModDexClientOptions = {}) {
    this.#core = new ModDexClientCore(options);

    this.lookup = new LookupApi(this.#core);
    this.projects = new ProjectsApi(this.#core);
    this.reviews = new ReviewsApi(this.#core);
    this.catalog = new CatalogApi(this.#core);
    this.sync = new SyncApi(this.#core);
    this.user = new UserApi(this.#core);
  }

  /**
   * Expiry of the API token, read from the `X-ModDex-Token-Expires` header of the most recent response
   * that carried it. `null` without a token and until the first successful request. Cached responses do not update it.
   */
  get tokenExpiry(): TokenExpiry | null {
    return this.#core.tokenExpiry;
  }

  /**
   * Rate limit state, read from the `X-RateLimit-*` headers of the most recent response that carried them.
   * `null` until the first request. Cached responses do not update it.
   */
  get rateLimit(): RateLimit | null {
    return this.#core.rateLimit;
  }

  /** Removes every cached response. No-op when caching is disabled. */
  clearCache(): void {
    this.#core.clearCache();
  }
}
