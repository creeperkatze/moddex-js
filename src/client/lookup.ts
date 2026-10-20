import type { ModDexClientCore } from './core.js';
import type {
  BatchLookupOptions,
  BatchLookupResult,
  ExplicitLookupOptions,
  ExplicitLookupResponse,
  FileBatchLookupOptions,
  FileBatchLookupResult,
  FileLookupOptions,
  FileMatch,
  LookupOptions,
  LookupPlatform,
  LookupResponse,
  LookupReviewsOptions,
  LookupReviewsResponse,
  Review,
} from '../types/index.js';
import type { ModDexResponse, PaginateOptions } from '../types/base.js';
import { paginate } from '../utils/paginate.js';
import { pathSegment } from '../utils/request.js';

/**
 * API namespace for finding ModDex projects from ModDex, CurseForge or Modrinth IDs, slugs, links or files.
 * Lookup resolves every project with a page on ModDex, including delisted ones (`available: false`).
 * @example
 * ```ts
 * const { data: project } = await client.lookup.get('modrinth', 'sodium');
 * const { data: reviews, meta } = await client.lookup.listReviews('modrinth', 'AANobbMI');
 * ```
 */
export class LookupApi {
  constructor(private readonly core: ModDexClientCore) {}

  /**
   * Looks a project up by one value on a platform. The value is auto-detected: an all-digit `moddex` or
   * `curseforge` value, or an 8-character `modrinth` value, is tried as an ID first, then as a slug.
   * Throws {@link ModDexNotFoundError} when nothing matches and {@link ModDexAmbiguousError} when a slug is
   * shared by a mod and a modpack and no `type` is given.
   */
  async get(platform: LookupPlatform, value: string | number, options?: LookupOptions): Promise<LookupResponse> {
    return this.core.requestJson<LookupResponse>(this.#path(platform, value), { query: options });
  }

  /**
   * Looks a project up by any combination of the six keys and a link. Throws {@link ModDexConflictError} when the
   * keys match different projects, and {@link ModDexNotFoundError} when none match.
   * @example
   * ```ts
   * const { data: project } = await client.lookup.find({ url: 'https://modrinth.com/mod/sodium/versions' });
   * ```
   */
  async find(options: ExplicitLookupOptions): Promise<ExplicitLookupResponse> {
    return this.core.requestJson<ExplicitLookupResponse>('api/v2/lookup', { query: options });
  }

  /**
   * Returns one page of a project's reviews, with the project summary in `meta.project`. One request gets the
   * rating, the links and the reviews.
   */
  async listReviews(
    platform: LookupPlatform,
    value: string | number,
    options?: LookupReviewsOptions,
  ): Promise<LookupReviewsResponse> {
    return this.core.requestJson<LookupReviewsResponse>(`${this.#path(platform, value)}/reviews`, { query: options });
  }

  /** Iterates every review of a looked-up project, fetching pages as needed and waiting out rate limits. */
  iterateReviews(
    platform: LookupPlatform,
    value: string | number,
    options?: Omit<LookupReviewsOptions, 'page'>,
    paginateOptions?: PaginateOptions,
  ): AsyncGenerator<Review, void, undefined> {
    return paginate((page) => this.listReviews(platform, value, { ...options, page }), paginateOptions);
  }

  /**
   * Looks up to 100 values up in one request, which counts as one request against the rate limit. A bad value
   * doesn't fail the rest. Sort the values so identical batches share a cache entry.
   * @example
   * ```ts
   * const { urls } = await client.lookup.batch({ urls: links.sort() });
   * ```
   */
  async batch(options: BatchLookupOptions): Promise<BatchLookupResult> {
    const response = await this.core.requestJson<ModDexResponse<BatchLookupResult>>('api/v2/lookup/batch', {
      query: options,
    });
    return response.data;
  }

  /**
   * Maps a file to its project: a Modrinth file by SHA1, or a CurseForge file by file ID. CurseForge jars can't be
   * matched by content. Throws {@link ModDexNotFoundError} when the file is unknown.
   */
  async file(options: FileLookupOptions): Promise<FileMatch> {
    const response = await this.core.requestJson<ModDexResponse<FileMatch>>('api/v2/lookup/files', {
      query: options,
    });
    return response.data;
  }

  /** Maps up to 100 files to their projects in one request. Unknown files map to `null`. */
  async fileBatch(options: FileBatchLookupOptions): Promise<FileBatchLookupResult> {
    const response = await this.core.requestJson<ModDexResponse<FileBatchLookupResult>>(
      'api/v2/lookup/files/batch',
      { query: options },
    );
    return response.data;
  }

  #path(platform: LookupPlatform, value: string | number): string {
    return `api/v2/lookup/${pathSegment(platform)}/${pathSegment(value)}`;
  }
}
