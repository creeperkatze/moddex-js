import type { PaginationOptions, SortDirection } from './base.js';

/** Kind of project. */
export type ProjectType = 'mod' | 'modpack';

/**
 * Sort fields accepted by `GET /api/v1/projects`.
 * `total_ratings` and `total_reviews` both rank by total ratings (quick ratings plus written reviews).
 */
export type ProjectSortField =
  | 'name'
  | 'average_rating'
  | 'bayesian_rating'
  | 'total_ratings'
  | 'total_reviews'
  | 'downloads_count'
  | 'last_updated_at';

/** Query parameters for `GET /api/v1/projects`. */
export interface ListProjectsOptions extends PaginationOptions {
  /** Filter by project type. */
  type?: ProjectType;
  /**
   * Sort field.
   * @defaultValue "name"
   */
  sort?: ProjectSortField;
  /**
   * Sort direction.
   * @defaultValue "desc"
   */
  direction?: SortDirection;
  /** Return only featured projects. */
  featured?: boolean;
  /**
   * Results per page (max 50).
   * @defaultValue 15
   */
  per_page?: number;
}

/** A project as it appears in `GET /api/v1/projects`. */
export interface ProjectSummary {
  id: number;
  name: string;
  slug: string;
  summary: string;
  type: ProjectType;
  logo_url: string;
  average_rating: number;
  /**
   * Rating adjusted for review count. Projects with few reviews are pulled toward the site-wide average,
   * so a single 5-star review cannot outrank a project with hundreds of reviews.
   */
  bayesian_rating: number;
  /** Quick ratings plus written reviews. */
  total_ratings: number;
  total_reviews: number;
  written_reviews_count: number;
  downloads_count: number;
  minecraft_versions: string[];
  mod_loaders: string[];
  genres: string[];
  last_updated_at: string;
}

/** External links of a project. */
export interface ProjectPlatformUrls {
  curseforge: string;
  modrinth: string | null;
  source: string | null;
  issues: string | null;
  wiki: string | null;
  discord: string | null;
}

/** A project author as listed on CurseForge. */
export interface CurseForgeProjectAuthor {
  name: string;
  url: string | null;
}

/** CurseForge-specific data of a project. */
export interface CurseForgeProjectData {
  /** CurseForge project id. */
  id: number;
  /** Full HTML description. */
  description: string;
  authors: CurseForgeProjectAuthor[];
  /** The spec does not describe the shape of screenshot items. */
  screenshots: unknown[];
  downloads_count: number;
  updated_at: string;
  created_at: string;
  delisted_at: string | null;
}

/** Full details of a mod or modpack, as returned by `GET /api/v1/mods/{slug}` and `GET /api/v1/modpacks/{slug}`. */
export interface Project {
  id: number;
  name: string;
  slug: string;
  summary: string;
  type: ProjectType;
  logo_url: string;
  license: string;
  average_rating: number;
  gameplay_rating: number;
  performance_rating: number;
  aesthetics_rating: number;
  /** Quick ratings plus written reviews. */
  total_ratings: number;
  total_reviews: number;
  written_reviews_count: number;
  downloads_count: number;
  minecraft_versions: string[];
  mod_loaders: string[];
  genres: string[];
  features: string[];
  themes: string[];
  platform_urls: ProjectPlatformUrls;
  curseforge: CurseForgeProjectData;
  /** Typed as `string | null` because that is all spec.yaml documents for this field. */
  modrinth: string | null;
  last_updated_at: string;
  curseforge_created_at: string;
}
