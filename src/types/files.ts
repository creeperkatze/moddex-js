import type { ModDexPaginatedResponse, PaginationOptions, SortDirection } from './base.js';
import type { Platform, ProjectListItem, ReleaseType } from './projects.js';

/** A CurseForge modpack's server pack. */
export interface ServerPack {
  curseforge_file_id: string;
  file_name: string | null;
  file_size: number | null;
  download_url: string | null;
}

/** Another file of a Modrinth version. */
export interface SecondaryFile {
  sha1: string;
  file_name: string | null;
  file_size: number | null;
  download_url: string | null;
}

/**
 * One release. A CurseForge row is a file with its server pack attached. A Modrinth row is a version: its primary
 * file's fields at the top level and its other files in `secondary_files`.
 */
export interface ProjectFile {
  /** ModDex file ID. */
  id: number;
  platform: Platform;
  /** CurseForge rows only. */
  curseforge_file_id: string | null;
  /** Modrinth rows only. */
  modrinth_version_id: string | null;
  /** Modrinth rows only: the primary file's SHA1. */
  sha1: string | null;
  display_name: string;
  version_number: string | null;
  release_type: ReleaseType;
  /** As the platform lists them. */
  minecraft_versions: string[];
  /** As the platform lists them. */
  loaders: string[];
  file_name: string | null;
  /** Bytes. */
  file_size: number | null;
  /** The file's downloads, or the version's for Modrinth rows. */
  downloads_count: number;
  released_at: string | null;
  /** Modrinth's featured flag. */
  is_featured: boolean;
  /** The platform's download page. `null` while the publishing listing is delisted. */
  download_url: string | null;
  /** The release's page on its platform. `null` while the listing is delisted. */
  platform_url: string | null;
  /** CurseForge modpacks: the server pack. */
  server_pack: ServerPack | null;
  /** Modrinth: the version's other files. */
  secondary_files: SecondaryFile[];
  /** With `include: ['changelog']`. Sanitized HTML. */
  changelog_html?: string | null;
  /** With `include: ['changelog']`. `true` when the changelog was cut at 100 KB. The full text is on `platform_url`. */
  changelog_truncated?: boolean;
}

/** Sort fields accepted by `projects.listFiles`. */
export type FileSortField = 'released_at' | 'downloads_count' | 'version_number';

/** Query parameters for `projects.listFiles`. */
export interface ListFilesOptions extends PaginationOptions {
  /** Defaults to the platform the website opens on. */
  platform?: Platform;
  /** An exact version as the file lists it. */
  minecraft_version?: string;
  /** A loader as the file lists it, e.g. `fabric`. */
  loader?: string;
  release_type?: ReleaseType;
  /** @defaultValue "released_at" */
  sort?: FileSortField;
  /** @defaultValue "desc" */
  direction?: SortDirection;
  /** Adds each release's changelog and caps `per_page` at 10. */
  include?: readonly 'changelog'[];
  /**
   * Results per page, 1 to 50, or 1 to 10 with changelogs.
   * @defaultValue 20, or 10 with changelogs
   */
  per_page?: number;
}

/** Extra `meta` fields of `projects.listFiles`. */
export interface FileListMeta {
  /** The platform listed. */
  platform: Platform;
  /** Platforms with at least one file. */
  platforms: Platform[];
}

/** How one project depends on another. */
export type RelationType = 'required' | 'optional' | 'embedded' | 'tool' | 'include' | 'unknown';

/** A dependency as the project's listing declares it. */
export interface Dependency {
  /** `unknown` when the listing gave none, `incompatible` in the `incompatible` list only. */
  relation_type: RelationType | 'incompatible';
  /** The name the listing declared. */
  name: string;
  /** The CurseForge project ID the listing declared. */
  curseforge_id: number | null;
  /** The Modrinth project ID the listing declared. */
  modrinth_id: string | null;
  /** The dependency on ModDex, always its main page. `null` when ModDex doesn't have it. */
  project: ProjectListItem | null;
}

/** Sort fields accepted by the dependency and dependent lists. */
export type RelationSortField =
  | 'downloads_count'
  | 'name'
  | 'bayesian_rating'
  | 'average_rating'
  | 'total_ratings'
  | 'last_updated_at'
  | 'published_at';

/** Query parameters for `projects.listDependencies` and `projects.listContents`. */
export interface ListDependenciesOptions extends PaginationOptions {
  /** Which platform's list to read. Defaults to the website's. */
  platform?: Platform;
  /** A `sources[].project_id` of the project: read that merged loader-specific listing's own list. */
  source?: number;
  relation_type?: Exclude<RelationType, 'unknown'>;
  /** Dependencies ModDex doesn't have sort last. @defaultValue "downloads_count" */
  sort?: RelationSortField;
  /** Defaults to `asc` for `name`, `desc` otherwise. */
  direction?: SortDirection;
  /**
   * Results per page, 1 to 100.
   * @defaultValue 20
   */
  per_page?: number;
}

/** Extra `meta` fields of `projects.listDependencies` and `projects.listContents`. */
export interface DependencyListMeta {
  /** The platform read. `null` when the project's list doesn't differ by platform. */
  platform: Platform | null;
  /** The ModDex ID of the listing whose list was read. */
  source: number;
}

/** Response of `projects.listDependencies` and `projects.listContents`. */
export interface DependencyListResponse extends ModDexPaginatedResponse<Dependency, DependencyListMeta> {
  /** Incompatible projects, listed in full and not paginated. */
  incompatible: Dependency[];
}

/** A project that depends on another. */
export interface Dependent {
  /** How the dependent depends on the project. */
  relation_type: RelationType;
  project: ProjectListItem;
}

/** Query parameters for `projects.listDependents`. */
export interface ListDependentsOptions extends PaginationOptions {
  /** Read dependents listed on this platform. Defaults to the website's. */
  platform?: Platform;
  /** `modpack` lists the modpacks that include a mod. */
  type?: 'mod' | 'modpack';
  /** @defaultValue "downloads_count" */
  sort?: RelationSortField;
  /** Defaults to `asc` for `name`, `desc` otherwise. */
  direction?: SortDirection;
  /**
   * Results per page, 1 to 50.
   * @defaultValue 20
   */
  per_page?: number;
}

/** Extra `meta` fields of `projects.listDependents`. */
export interface DependentListMeta {
  /** The platform read. `null` when the list doesn't differ by platform. */
  platform: Platform | null;
}
