import { ModDexClientCore } from './core.js';
import { ModpacksApi } from './modpacks.js';
import { ModsApi } from './mods.js';
import { ProjectsApi } from './projects.js';
import { ReviewsApi } from './reviews.js';
import { TagsApi } from './tags.js';
import { UserApi } from './user.js';
import type { ModDexClientOptions, TokenExpiry } from '../types/base.js';

/**
 * Client for the ModDex API.
 * @example
 * ```ts
 * import ModDexClient from 'moddex-js';
 * const client = new ModDexClient({ token: 'your-api-token' });
 * const mod = await client.mods.get('create');
 * ```
 */
export class ModDexClient {
  readonly #core: ModDexClientCore;

  readonly user: UserApi;
  readonly projects: ProjectsApi;
  readonly mods: ModsApi;
  readonly modpacks: ModpacksApi;
  readonly reviews: ReviewsApi;
  readonly tags: TagsApi;

  constructor(options: ModDexClientOptions) {
    this.#core = new ModDexClientCore(options);

    this.user = new UserApi(this.#core);
    this.projects = new ProjectsApi(this.#core);
    this.mods = new ModsApi(this.#core);
    this.modpacks = new ModpacksApi(this.#core);
    this.reviews = new ReviewsApi(this.#core);
    this.tags = new TagsApi(this.#core);
  }

  /**
   * Expiry of the API token, read from the `X-ModDex-Token-Expires` header of the most recent response
   * that carried it. `null` until the first successful request. Cached responses do not update it.
   */
  get tokenExpiry(): TokenExpiry | null {
    return this.#core.tokenExpiry;
  }

  /** Removes every cached response. No-op when caching is disabled. */
  clearCache(): void {
    this.#core.clearCache();
  }
}
