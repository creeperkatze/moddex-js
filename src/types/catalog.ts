import type { FilterMode, TaxonomyTerm } from './projects.js';

/** Value types of `projects.list` parameters. `boolean` takes `1`/`0`/`true`/`false`, `date` takes ISO 8601. */
export type CatalogParameterType =
  | 'string'
  | 'enum'
  | 'slug'
  | 'minecraft_version'
  | 'project_id'
  | 'boolean'
  | 'number'
  | 'integer'
  | 'date';

/** One `projects.list` parameter. */
export interface CatalogParameter {
  name: string;
  type: CatalogParameterType;
  /** Takes a comma-separated list. */
  list: boolean;
  /** List parameters: the most values one request may send. */
  max_values?: number;
  /** List parameters: the `_exclude` twin, if any. */
  exclude_parameter?: string | null;
  /** List parameters: the any/all companion, if any. */
  mode_parameter?: string | null;
  /** Scalar parameters. */
  min?: number | null;
  /** Scalar parameters. */
  max?: number | null;
  /** Every valid value. `null` when the vocabulary isn't listed here. */
  values: TaxonomyTerm[] | null;
  description: string;
}

/** Every `projects.list` parameter and sort, as returned by `catalog.getFilters`. */
export interface CatalogFilters {
  parameters: CatalogParameter[];
  /** Values the `*_mode` parameters take. */
  modes: FilterMode[];
  /** Version groups for `mc_exact: false`, newest first. */
  minecraft_version_groups: string[];
  sorts: { sort: string; default_direction: 'asc' | 'desc' }[];
  default_sort: string;
  default_sort_with_q: string;
  per_page: { default: number; max: number };
  /** `page × per_page` may not exceed this. */
  max_page_depth: number;
}

/** A Minecraft version the catalog knows. */
export interface MinecraftVersion {
  /** What filters and project responses use. */
  version: string;
  /** Release type, such as `release` or `snapshot`. */
  type: string;
  /** Release date (ISO 8601 date), when known. */
  released_at: string | null;
}

/** Query parameters for `catalog.listMinecraftVersions`. */
export interface ListMinecraftVersionsOptions {
  /** Only this release type, such as `release` or `snapshot`. */
  type?: string;
}

/** Tag categories. Loaders and Minecraft versions have their own lists. */
export type TagType = 'genre' | 'feature' | 'theme' | 'environment';

/** A taxonomy tag. */
export interface Tag {
  /** What the matching filter (`genres`, `features`, `themes`, `environment`) takes. */
  slug: string;
  name: string;
  type: TagType;
  /** Plain text. */
  description: string | null;
  /** The group a feature is listed under. `null` for other types. */
  category: string | null;
}

/** Query parameters for `catalog.listTags`. */
export interface ListTagsOptions {
  type?: TagType;
}
