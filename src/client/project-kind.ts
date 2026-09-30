import type { ModDexClientCore } from './core.js';
import type { ListReviewsOptions, Project, Review } from '../types/index.js';
import type { ModDexPaginatedResponse, ModDexResponse, PaginateOptions } from '../types/base.js';
import { paginate } from '../utils/paginate.js';

/** Shared implementation of the `/api/v1/mods` and `/api/v1/modpacks` namespaces. */
export abstract class ProjectKindApi {
  constructor(
    private readonly core: ModDexClientCore,
    private readonly segment: 'mods' | 'modpacks',
  ) {}

  /** Returns full details by ModDex slug. Throws {@link ModDexNotFoundError} for an unknown slug. */
  async get(slug: string): Promise<Project> {
    const response = await this.core.requestJson<ModDexResponse<Project>>(this.#path(slug));
    return response.data;
  }

  /** Returns one page of approved, written reviews. Quick ratings are excluded. */
  async listReviews(slug: string, options?: ListReviewsOptions): Promise<ModDexPaginatedResponse<Review>> {
    return this.core.requestJson<ModDexPaginatedResponse<Review>>(`${this.#path(slug)}/reviews`, { query: options });
  }

  /** Iterates every approved, written review, fetching pages as needed and waiting out rate limits. */
  iterateReviews(
    slug: string,
    options?: Omit<ListReviewsOptions, 'page'>,
    paginateOptions?: PaginateOptions,
  ): AsyncGenerator<Review, void, undefined> {
    return paginate((page) => this.listReviews(slug, { ...options, page }), paginateOptions);
  }

  #path(slug: string): string {
    return `api/v1/${this.segment}/${encodeURIComponent(slug)}`;
  }
}
