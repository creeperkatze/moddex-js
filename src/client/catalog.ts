import type { ModDexClientCore } from './core.js';
import type {
  CatalogFilters,
  ListMinecraftVersionsOptions,
  ListTagsOptions,
  MinecraftVersion,
  Tag,
  TaxonomyTerm,
} from '../types/index.js';
import type { ModDexResponse } from '../types/base.js';

/** API namespace for the catalog vocabulary: every value the `projects.list` filters take. ModDex caches it for an hour. */
export class CatalogApi {
  constructor(private readonly core: ModDexClientCore) {}

  /** Returns every `projects.list` parameter with its type and valid values, every sort, and the paging limits. */
  async getFilters(): Promise<CatalogFilters> {
    return this.#data<CatalogFilters>('api/v2/catalog/filters');
  }

  /** Returns every Minecraft version the catalog knows, newest first. */
  async listMinecraftVersions(options?: ListMinecraftVersionsOptions): Promise<MinecraftVersion[]> {
    return this.#data<MinecraftVersion[]>('api/v2/minecraft-versions', options);
  }

  /** Returns every mod loader. */
  async listLoaders(): Promise<TaxonomyTerm[]> {
    return this.#data<TaxonomyTerm[]>('api/v2/loaders');
  }

  /** Returns every genre, feature, theme and environment, optionally of one type. */
  async listTags(options?: ListTagsOptions): Promise<Tag[]> {
    return this.#data<Tag[]>('api/v2/tags', options);
  }

  async #data<T>(path: string, query?: object): Promise<T> {
    const response = await this.core.requestJson<ModDexResponse<T>>(path, { query });
    return response.data;
  }
}
