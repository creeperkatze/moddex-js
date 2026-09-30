import type { ModDexClientCore } from './core.js';
import type { ListTagsOptions, Tag } from '../types/index.js';
import type { ModDexPaginatedResponse, PaginateOptions } from '../types/base.js';
import { paginate } from '../utils/paginate.js';

/** API namespace for taxonomy tags (genres, features, themes, dev environments). */
export class TagsApi {
  constructor(private readonly core: ModDexClientCore) {}

  /** Returns one page of tags, optionally filtered by type. */
  async list(options?: ListTagsOptions): Promise<ModDexPaginatedResponse<Tag>> {
    return this.core.requestJson<ModDexPaginatedResponse<Tag>>('api/v1/tags', { query: options });
  }

  /** Iterates every tag, fetching pages as needed and waiting out rate limits. */
  iterate(
    options?: Omit<ListTagsOptions, 'page'>,
    paginateOptions?: PaginateOptions,
  ): AsyncGenerator<Tag, void, undefined> {
    return paginate((page) => this.list({ ...options, page }), paginateOptions);
  }
}
