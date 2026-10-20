import type { ModDexClientCore } from './core.js';
import type { ListReviewsOptions, Review } from '../types/index.js';
import type { MaskingOptions, ModDexPaginatedResponse, ModDexResponse, PaginateOptions } from '../types/base.js';
import { paginate } from '../utils/paginate.js';
import { pathSegment } from '../utils/request.js';

/** API namespace for reviews across every project. */
export class ReviewsApi {
  constructor(private readonly core: ModDexClientCore) {}

  /**
   * Returns one page of every public review on ModDex, newest first. To act on every new review as it appears,
   * follow `sync.listReviews` instead: a review held for moderation keeps its writing date when approved.
   */
  async list(options?: ListReviewsOptions): Promise<ModDexPaginatedResponse<Review>> {
    return this.core.requestJson<ModDexPaginatedResponse<Review>>('api/v2/reviews', { query: options });
  }

  /** Iterates every review matching the filters, fetching pages as needed and waiting out rate limits. */
  iterate(
    options?: Omit<ListReviewsOptions, 'page'>,
    paginateOptions?: PaginateOptions,
  ): AsyncGenerator<Review, void, undefined> {
    return paginate((page) => this.list({ ...options, page }), paginateOptions);
  }

  /** Returns one approved review or quick rating. Pending, rejected and deleted reviews throw {@link ModDexNotFoundError}. */
  async get(id: number, options?: MaskingOptions): Promise<Review> {
    const response = await this.core.requestJson<ModDexResponse<Review>>(`api/v2/reviews/${pathSegment(id)}`, {
      query: options,
    });
    return response.data;
  }
}
