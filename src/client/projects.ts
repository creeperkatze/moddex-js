import type { ModDexClientCore } from './core.js';
import type { ListProjectsOptions, ProjectSummary } from '../types/index.js';
import type { ModDexPaginatedResponse, PaginateOptions } from '../types/base.js';
import { paginate } from '../utils/paginate.js';

/** API namespace for browsing mods and modpacks together. */
export class ProjectsApi {
  constructor(private readonly core: ModDexClientCore) {}

  /** Returns one page of active mods and modpacks with ratings, download counts, and tags. */
  async list(options?: ListProjectsOptions): Promise<ModDexPaginatedResponse<ProjectSummary>> {
    return this.core.requestJson<ModDexPaginatedResponse<ProjectSummary>>('api/v1/projects', { query: options });
  }

  /**
   * Iterates every project matching the filters, fetching pages as needed and waiting out rate limits.
   * @example
   * ```ts
   * for await (const project of client.projects.iterate({ type: 'modpack', per_page: 50 })) {
   *   console.log(project.name);
   * }
   * ```
   */
  iterate(
    options?: Omit<ListProjectsOptions, 'page'>,
    paginateOptions?: PaginateOptions,
  ): AsyncGenerator<ProjectSummary, void, undefined> {
    return paginate((page) => this.list({ ...options, page }), paginateOptions);
  }
}
