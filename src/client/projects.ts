import type { ModDexClientCore } from './core.js';
import type {
  CommunityTags,
  Dependency,
  DependencyListResponse,
  Dependent,
  DependentListMeta,
  FileListMeta,
  GetProjectOptions,
  ListDependenciesOptions,
  ListDependentsOptions,
  ListFilesOptions,
  ListProjectReviewsOptions,
  ListProjectsOptions,
  ListSimilarProjectsOptions,
  Project,
  ProjectFile,
  ProjectListItem,
  Review,
  SimilarProjectsResponse,
} from '../types/index.js';
import type { ModDexPaginatedResponse, ModDexResponse, PaginateOptions } from '../types/base.js';
import { paginate } from '../utils/paginate.js';
import { pathSegment } from '../utils/request.js';

/**
 * API namespace for projects, addressed by ModDex project ID. Use `client.lookup` to get the ID from a
 * CurseForge or Modrinth ID, slug or link.
 */
export class ProjectsApi {
  constructor(private readonly core: ModDexClientCore) {}

  /**
   * Returns one page of the catalog, as a guest sees it on the website, with every filter and sort the catalog
   * page has. A search (`q`) or any filter counts against a separate, lower rate limit.
   */
  async list(options?: ListProjectsOptions): Promise<ModDexPaginatedResponse<ProjectListItem>> {
    return this.core.requestJson<ModDexPaginatedResponse<ProjectListItem>>('api/v2/projects', { query: options });
  }

  /**
   * Iterates every project matching the filters, fetching pages as needed and waiting out rate limits.
   * At most 10,000 projects can be read (`page × per_page`).
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
  ): AsyncGenerator<ProjectListItem, void, undefined> {
    return paginate((page) => this.list({ ...options, page }), paginateOptions);
  }

  /** Returns the full project. Heavy blocks are left out unless asked for with `include`. */
  async get(id: number, options?: GetProjectOptions): Promise<Project> {
    const response = await this.core.requestJson<ModDexResponse<Project>>(this.#path(id), { query: options });
    return response.data;
  }

  /** Returns one page of approved written reviews. Quick ratings count toward the rating but aren't listed. */
  async listReviews(id: number, options?: ListProjectReviewsOptions): Promise<ModDexPaginatedResponse<Review>> {
    return this.core.requestJson<ModDexPaginatedResponse<Review>>(`${this.#path(id)}/reviews`, { query: options });
  }

  /** Iterates every approved written review, fetching pages as needed and waiting out rate limits. */
  iterateReviews(
    id: number,
    options?: Omit<ListProjectReviewsOptions, 'page'>,
    paginateOptions?: PaginateOptions,
  ): AsyncGenerator<Review, void, undefined> {
    return paginate((page) => this.listReviews(id, { ...options, page }), paginateOptions);
  }

  /** Returns one page of releases from one platform, including merged loader-specific listings. */
  async listFiles(
    id: number,
    options?: ListFilesOptions,
  ): Promise<ModDexPaginatedResponse<ProjectFile, FileListMeta>> {
    return this.core.requestJson<ModDexPaginatedResponse<ProjectFile, FileListMeta>>(`${this.#path(id)}/files`, {
      query: options,
    });
  }

  /** Iterates every release on one platform, fetching pages as needed and waiting out rate limits. */
  iterateFiles(
    id: number,
    options?: Omit<ListFilesOptions, 'page'>,
    paginateOptions?: PaginateOptions,
  ): AsyncGenerator<ProjectFile, void, undefined> {
    return paginate((page) => this.listFiles(id, { ...options, page }), paginateOptions);
  }

  /**
   * Returns one page of what the project's listing declares it requires, optionally uses, embeds or ships with,
   * read one platform at a time. Incompatible projects are in `incompatible`, not in `data`.
   */
  async listDependencies(id: number, options?: ListDependenciesOptions): Promise<DependencyListResponse> {
    return this.core.requestJson<DependencyListResponse>(`${this.#path(id)}/dependencies`, { query: options });
  }

  /** Iterates every dependency on one platform, fetching pages as needed and waiting out rate limits. */
  iterateDependencies(
    id: number,
    options?: Omit<ListDependenciesOptions, 'page'>,
    paginateOptions?: PaginateOptions,
  ): AsyncGenerator<Dependency, void, undefined> {
    return paginate((page) => this.listDependencies(id, { ...options, page }), paginateOptions);
  }

  /** Returns one page of projects whose own listing declares this one as a dependency, including delisted ones. */
  async listDependents(
    id: number,
    options?: ListDependentsOptions,
  ): Promise<ModDexPaginatedResponse<Dependent, DependentListMeta>> {
    return this.core.requestJson<ModDexPaginatedResponse<Dependent, DependentListMeta>>(
      `${this.#path(id)}/dependents`,
      { query: options },
    );
  }

  /** Iterates every dependent on one platform, fetching pages as needed and waiting out rate limits. */
  iterateDependents(
    id: number,
    options?: Omit<ListDependentsOptions, 'page'>,
    paginateOptions?: PaginateOptions,
  ): AsyncGenerator<Dependent, void, undefined> {
    return paginate((page) => this.listDependents(id, { ...options, page }), paginateOptions);
  }

  /**
   * Returns one page of the mods a modpack ships. Same list as `listDependencies`.
   * Throws {@link ModDexNotFoundError} for a mod: use `listDependents` with `type: 'modpack'` instead.
   */
  async listContents(id: number, options?: ListDependenciesOptions): Promise<DependencyListResponse> {
    return this.core.requestJson<DependencyListResponse>(`${this.#path(id)}/contents`, { query: options });
  }

  /** Iterates every mod a modpack ships, fetching pages as needed and waiting out rate limits. */
  iterateContents(
    id: number,
    options?: Omit<ListDependenciesOptions, 'page'>,
    paginateOptions?: PaginateOptions,
  ): AsyncGenerator<Dependency, void, undefined> {
    return paginate((page) => this.listContents(id, { ...options, page }), paginateOptions);
  }

  /**
   * Returns one page of up to 100 listed projects of the same type, most similar first. A new project has no list
   * yet: then `computed` is `false` and `data` is empty.
   */
  async listSimilar(id: number, options?: ListSimilarProjectsOptions): Promise<SimilarProjectsResponse> {
    return this.core.requestJson<SimilarProjectsResponse>(`${this.#path(id)}/similar`, { query: options });
  }

  /** Iterates every similar project, fetching pages as needed and waiting out rate limits. */
  iterateSimilar(
    id: number,
    options?: Omit<ListSimilarProjectsOptions, 'page'>,
    paginateOptions?: PaginateOptions,
  ): AsyncGenerator<ProjectListItem, void, undefined> {
    return paginate((page) => this.listSimilar(id, { ...options, page }), paginateOptions);
  }

  /** Returns the genre, theme and feature tags of the project's community tag panel. */
  async getCommunityTags(id: number): Promise<CommunityTags> {
    const response = await this.core.requestJson<ModDexResponse<CommunityTags>>(`${this.#path(id)}/community-tags`);
    return response.data;
  }

  #path(id: number): string {
    return `api/v2/projects/${pathSegment(id)}`;
  }
}
