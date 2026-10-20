import type { ModDexClientCore } from './core.js';
import type {
  ProjectSyncRow,
  Review,
  SyncProjectsOptions,
  SyncResponse,
  SyncReviewsOptions,
} from '../types/index.js';
import type { ModDexResponse, PaginateOptions } from '../types/base.js';
import { followCursor } from '../utils/paginate.js';

/**
 * API namespace for the cursor feeds, for keeping a copy of ModDex data in sync. ModDex's terms require removing
 * content within 7 days of its removal from ModDex: delete tombstoned projects with their reviews, and at least
 * daily delete every stored review that `listReviewIds` doesn't list.
 */
export class SyncApi {
  constructor(private readonly core: ModDexClientCore) {}

  /** Returns one page of project changes, in order: live projects in the list shape, or tombstones. */
  async listProjects(options?: SyncProjectsOptions): Promise<SyncResponse<ProjectSyncRow>> {
    return this.core.requestJson<SyncResponse<ProjectSyncRow>>('api/v2/sync/projects', { query: options });
  }

  /**
   * Follows the projects feed until it has no more rows ready, yielding each page whole. Store the last page's
   * `meta.next_cursor` to poll for changes later.
   * @example
   * ```ts
   * for await (const page of client.sync.iterateProjectPages({ cursor })) {
   *   for (const row of page.data) {
   *     if (row.removed) remove(row.id);
   *     else upsert(row);
   *   }
   *   cursor = page.meta.next_cursor;
   * }
   * ```
   */
  iterateProjectPages(
    options: SyncProjectsOptions = {},
    paginateOptions?: Pick<PaginateOptions, 'maxRateLimitRetries'>,
  ): AsyncGenerator<SyncResponse<ProjectSyncRow>, void, undefined> {
    const { cursor, ...rest } = options;
    return followCursor((next) => this.listProjects(this.#withCursor(rest, next)), cursor, paginateOptions);
  }

  /**
   * Returns one page of public written reviews that changed, in order. The feed has no tombstones: check stored
   * reviews against `listReviewIds`.
   */
  async listReviews(options?: SyncReviewsOptions): Promise<SyncResponse<Review>> {
    return this.core.requestJson<SyncResponse<Review>>('api/v2/sync/reviews', { query: options });
  }

  /** Follows the reviews feed until it has no more rows ready, yielding each page whole. */
  iterateReviewPages(
    options: SyncReviewsOptions = {},
    paginateOptions?: Pick<PaginateOptions, 'maxRateLimitRetries'>,
  ): AsyncGenerator<SyncResponse<Review>, void, undefined> {
    const { cursor, ...rest } = options;
    return followCursor((next) => this.listReviews(this.#withCursor(rest, next)), cursor, paginateOptions);
  }

  /** Returns the ID of every review the reviews feed would serve right now, ascending. Refreshed every 5 minutes. */
  async listReviewIds(): Promise<number[]> {
    const response = await this.core.requestJson<ModDexResponse<number[]>>('api/v2/sync/reviews/ids');
    return response.data;
  }

  // A cursor already encodes where the feed started, so `since` is only sent on the first page.
  #withCursor<T extends { since?: string }>(options: T, cursor: string | undefined): T & { cursor?: string } {
    return cursor === undefined ? options : { ...options, since: undefined, cursor };
  }
}
