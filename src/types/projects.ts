import type { ModDexPaginatedResponse, PaginationOptions, SortDirection } from './base.js';

/** Kind of project. */
export type ProjectType = 'mod' | 'modpack';

/** A platform ModDex lists projects from. */
export type Platform = 'curseforge' | 'modrinth';

/** A taxonomy value. The slug is what the matching `projects.list` filter takes. */
export interface TaxonomyTerm {
  /** What the matching filter takes. */
  slug: string;
  /** Display name. */
  name: string;
}

/** Aggregate rating of a project. */
export interface ProjectRating {
  /** Mean rating, 0.5 to 5 in steps of 0.5. `null` when nobody has rated the project. */
  average: number | null;
  /** Bayesian-adjusted rating, which the catalog ranks by. `null` when unrated. */
  bayesian: number | null;
  /** Quick ratings (stars only) plus written reviews. */
  count: number;
  /** Written reviews only. */
  written_count: number;
}

/** Links to a project on ModDex. */
export interface ProjectLinks {
  /** The project page. */
  web: string;
  /** The page's Reviews tab. */
  reviews: string;
  /** Opens the review form. */
  write_review: string;
  /** Rating badge (SVG), for a README. Always shows the current rating. */
  badge: string;
}

/** The smallest project shape, used in lookups, batch lookups, reviews and error candidates. */
export interface ProjectSummary {
  /** ModDex project ID. */
  id: number;
  /** Plain text: escape it before rendering. */
  name: string;
  /** ModDex slug. */
  slug: string;
  type: ProjectType;
  /** Absolute `https` URL. A ModDex placeholder when the project has no logo. */
  logo_url: string;
  /** `false` when the project is delisted on every platform it was on. Its ModDex page still exists. */
  available: boolean;
  rating: ProjectRating;
  links: ProjectLinks;
}

/** A listing of a project on CurseForge or Modrinth, in the list shape. */
export interface PlatformListingSummary<Id extends number | string> {
  id: Id;
  /** `null` when the listing URL carries no slug. */
  slug: string | null;
  /** `null` while the listing is delisted. */
  url: string | null;
}

/** Item counts of a project. */
export interface ProjectCounts {
  /**
   * Entries in the dependency lists of both platforms together. A dependency declared on each platform can count
   * twice, so `projects.listDependencies` usually reports a lower total.
   */
  dependencies: number;
  /** Projects that depend on this one on either platform, each counted once. */
  dependents: number;
  /** Modpacks that include the project. */
  modpack_dependents: number;
  /** With `include: ['counts']`. */
  followers?: number;
  /** With `include: ['counts']`. */
  stacks?: number;
  /** With `include: ['counts']`. */
  library_entries?: number;
}

/** A staff pick. */
export interface FeaturedInfo {
  /** Its slot on the ModDex homepage, lowest first (1 is the large card). */
  priority: number | null;
  /** Plain text. */
  blurb: string | null;
}

/** How a project installs, as Modrinth used to report it. Deprecated by Modrinth. */
export type SideSupport = 'required' | 'optional' | 'unsupported' | 'unknown';

/** A project in the list shape, as returned by `projects.list` and other project lists. */
export interface ProjectListItem extends ProjectSummary {
  /** Plain text. */
  summary: string | null;
  /** Downloads across both platforms. */
  downloads_count: number;
  /** Newest platform update. */
  last_updated_at: string | null;
  /** Earliest platform creation date. */
  published_at: string | null;
  /** `null` when the project isn't on CurseForge. */
  curseforge: PlatformListingSummary<number> | null;
  /** `null` when the project isn't on Modrinth. */
  modrinth: PlatformListingSummary<string> | null;
  /** Version strings, newest first. */
  minecraft_versions: string[];
  /** Mod loaders. */
  loaders: TaxonomyTerm[];
  genres: TaxonomyTerm[];
  features: TaxonomyTerm[];
  themes: TaxonomyTerm[];
  /** Where it installs: `client-only`, `server-only`, `client-and-server`, `either-side`, … */
  environment: TaxonomyTerm[];
  /** Deprecated by Modrinth. */
  client_side: SideSupport | null;
  /** Deprecated by Modrinth. */
  server_side: SideSupport | null;
  counts: ProjectCounts;
  /** `null` unless the project is a staff pick. */
  featured: FeaturedInfo | null;
}

/** A screenshot from a platform listing. */
export interface Screenshot {
  url: string;
  /** Plain text. */
  title: string | null;
  /** Plain text. */
  description: string | null;
}

/** A project's CurseForge listing, in the full shape. */
export interface CurseForgeListing extends PlatformListingSummary<number> {
  downloads_count: number | null;
  created_at: string | null;
  updated_at: string | null;
  /** When CurseForge stopped listing it. */
  delisted_at: string | null;
  screenshots: Screenshot[];
  /** With `include: ['description']`. Sanitized HTML. */
  description_html?: string;
}

/** The Modrinth organization that owns a project. */
export interface ModrinthOrganization {
  id: string;
  slug: string | null;
  name: string;
  url: string | null;
  icon_url: string | null;
}

/** A project's Modrinth listing, in the full shape. */
export interface ModrinthListing extends PlatformListingSummary<string> {
  downloads_count: number | null;
  created_at: string | null;
  updated_at: string | null;
  /** When Modrinth stopped listing it. */
  delisted_at: string | null;
  screenshots: Screenshot[];
  organization: ModrinthOrganization | null;
  /**
   * With `include: ['description']`. Markdown source that allows inline HTML: never render it with a permissive
   * renderer, use `description_html` instead.
   */
  description?: string | null;
  /** With `include: ['description']`. Sanitized HTML. */
  description_html?: string | null;
}

/** License categories. */
export type LicenseCategory =
  | 'permissive'
  | 'copyleft'
  | 'public_domain'
  | 'attribution'
  | 'restrictive'
  | 'other'
  | 'none';

/** A project's license. */
export interface ProjectLicense {
  /** As listed. Comma-separated when there are several. */
  name: string | null;
  /** `true` only when every listed license is open source. */
  open_source: boolean;
  categories: LicenseCategory[];
}

/** Release channel of a file. */
export type ReleaseType = 'release' | 'beta' | 'alpha';

/** The newest release on one platform. */
export interface LatestRelease {
  version_number: string | null;
  released_at: string | null;
  /** As the platform lists them. */
  minecraft_versions: string[];
  /** As the platform lists them. */
  loaders: string[];
  release_type: ReleaseType;
  /** The release on its platform. */
  url: string | null;
}

/** A credit on a project page. */
export interface ProjectAuthor {
  name: string;
  role: string | null;
  is_owner: boolean;
  is_organization: boolean;
  curseforge_url: string | null;
  modrinth_url: string | null;
  /** CurseForge username. What the `curseforge_authors` filter matches. */
  curseforge_handle: string | null;
  /** Modrinth username. What the `modrinth_authors` filter matches. */
  modrinth_handle: string | null;
}

/** External links of a project. Each is an `https` URL or `null`. */
export interface ProjectPlatformUrls {
  source: string | null;
  issues: string | null;
  wiki: string | null;
  discord: string | null;
}

/** A listing a project is downloaded from, including merged loader-specific listings. */
export interface ProjectSource {
  /** The listing's ModDex ID. What the `source` option of `projects.listDependencies` takes. */
  project_id: number;
  platform: Platform;
  platform_id: string;
  label: string;
  loaders: TaxonomyTerm[];
  /** `null` while the listing is delisted. */
  url: string | null;
  latest_file_url: string | null;
  downloads_count: number;
  available: boolean;
  /** `true` for the project's own row, `false` for a merged loader-specific listing. */
  is_canonical: boolean;
  last_updated_at: string | null;
}

/** How many ratings landed on one star step. */
export interface RatingStep {
  /** 0.5 to 5. */
  rating: number;
  count: number;
}

/** Rating histograms and ranks, added with `include: ['ratings']`. */
export interface ProjectRatings {
  /** Ten steps, 0.5 to 5. */
  histogram: RatingStep[];
  categories: {
    gameplay: RatingStep[];
    performance: RatingStep[];
    aesthetics: RatingStep[];
  };
  /** `null` when unrated. */
  ranks: {
    global: number;
    /** Among projects of the same type. */
    by_type: number;
  } | null;
}

/** Full details of a project, as returned by `projects.get` and the lookups. */
export interface Project extends Omit<ProjectListItem, 'curseforge' | 'modrinth'> {
  /** `null` when the project isn't on CurseForge. */
  curseforge: CurseForgeListing | null;
  /** `null` when the project isn't on Modrinth. */
  modrinth: ModrinthListing | null;
  license: ProjectLicense;
  /** Newest release per platform. */
  latest_version: {
    curseforge: LatestRelease | null;
    modrinth: LatestRelease | null;
  };
  /** Credits, as the project page shows them. */
  authors: ProjectAuthor[];
  platform_urls: ProjectPlatformUrls;
  /** Every listing the project is downloaded from. */
  sources: ProjectSource[];
  /** Voted community tags plus the project's own genres, themes and features. */
  community_tags_count: number;
  /** With `include: ['ratings']`. */
  ratings?: ProjectRatings;
  /** With `include: ['completion']`. Modpacks only, `null` for mods and when nobody has reported it. */
  avg_completion_hours?: number | null;
}

/** Heavy blocks a project response leaves out unless asked for. */
export type ProjectInclude = 'description' | 'ratings' | 'counts' | 'completion';

/** Query parameters for `projects.get`. */
export interface GetProjectOptions {
  /** Heavy blocks to add. */
  include?: readonly ProjectInclude[];
}

/** How a list filter combines its values. */
export type FilterMode = 'any' | 'all';

/** Sort fields accepted by `projects.list`. */
export type ProjectSortField =
  | 'bayesian_rating'
  | 'relevance'
  | 'average_rating'
  | 'total_ratings'
  | 'downloads_count'
  | 'published_at'
  | 'last_updated_at'
  | 'dependencies_count'
  | 'dependents_count'
  | 'modpack_dependents_count'
  | 'name';

/** Modpack sizes by mod count. */
export type PackSize = 'small' | 'medium' | 'large' | 'xlarge';

/**
 * Query parameters for `projects.list`. `catalog.getFilters()` lists every parameter and its valid values.
 * A search (`q`) or any filter counts against a separate, lower rate limit.
 */
export interface ListProjectsOptions extends PaginationOptions {
  /** Full-text search, 3 to 200 characters. Sorts by relevance unless `sort` is given. */
  q?: string;
  type?: ProjectType;
  /** Only staff picks. */
  featured?: boolean;
  /** Loader slugs. With `minecraft_versions`, one file must carry both. */
  loaders?: readonly string[];
  loaders_exclude?: readonly string[];
  /** Genre slugs. */
  genres?: readonly string[];
  genres_exclude?: readonly string[];
  /** @defaultValue "any" */
  genres_mode?: FilterMode;
  /** Feature slugs. */
  features?: readonly string[];
  features_exclude?: readonly string[];
  /** @defaultValue "any" */
  features_mode?: FilterMode;
  /** Theme slugs. */
  themes?: readonly string[];
  themes_exclude?: readonly string[];
  /** @defaultValue "any" */
  themes_mode?: FilterMode;
  /** Exact versions, or version groups such as `1.20` with `mc_exact: false`. */
  minecraft_versions?: readonly string[];
  minecraft_versions_exclude?: readonly string[];
  /** @defaultValue "any" */
  mc_mode?: FilterMode;
  /**
   * `false` matches `minecraft_versions` as version groups.
   * @defaultValue true
   */
  mc_exact?: boolean;
  /** Environment slugs such as `client-only`. */
  environment?: readonly string[];
  environment_exclude?: readonly string[];
  platforms?: readonly Platform[];
  platforms_exclude?: readonly Platform[];
  /** 0 to 5. */
  min_rating?: number;
  /** 0 to 5. */
  max_rating?: number;
  /** Minimum ratings, quick and written. */
  min_reviews?: number;
  max_reviews?: number;
  /** Compared against the download count rounded to 2 significant figures. */
  min_downloads?: number;
  /** Exclusive, compared against the rounded count. */
  max_downloads?: number;
  /** Modpacks by mod count. */
  pack_size?: readonly PackSize[];
  /** Minimum number of modpacks that include the project. */
  min_modpack_usage?: number;
  /** Up to 10 author names or handles on either platform, case-insensitive. */
  authors?: readonly string[];
  authors_exclude?: readonly string[];
  /** Up to 10 CurseForge usernames, case-insensitive. */
  curseforge_authors?: readonly string[];
  curseforge_authors_exclude?: readonly string[];
  /** Up to 10 Modrinth usernames or display names, case-insensitive. */
  modrinth_authors?: readonly string[];
  modrinth_authors_exclude?: readonly string[];
  /** Up to 10 ModDex mod IDs the project depends on. */
  uses_mods?: readonly number[];
  uses_mods_exclude?: readonly number[];
  /** @defaultValue "any" */
  uses_mods_mode?: FilterMode;
  /** SPDX IDs such as `MIT`, case-insensitive. */
  licenses?: readonly string[];
  licenses_exclude?: readonly string[];
  /** `true`: every license is open source. `false`: anything else, including no license. */
  open_source?: boolean;
  license_categories?: readonly LicenseCategory[];
  license_categories_exclude?: readonly LicenseCategory[];
  /** Only projects with a source code link. */
  has_source?: boolean;
  /** Only projects with a wiki link. */
  has_wiki?: boolean;
  /** Last updated at or after: an ISO 8601 date (midnight UTC) or a date-time with a time zone. */
  updated_since?: string;
  /** Last updated before (exclusive). */
  updated_before?: string;
  /** @defaultValue "bayesian_rating", or "relevance" with `q` */
  sort?: ProjectSortField;
  /** Defaults to `asc` for `name`, `desc` otherwise. Ignored by `relevance`. */
  direction?: SortDirection;
  /**
   * Results per page, 1 to 50.
   * @defaultValue 20
   */
  per_page?: number;
}

/** Response of `projects.listSimilar`. */
export interface SimilarProjectsResponse extends ModDexPaginatedResponse<ProjectListItem> {
  /**
   * `false` while a new project waits for its first computation. `data` is empty then, so try again after
   * `Retry-After` seconds. ModDex computes new projects every 15 minutes.
   */
  computed: boolean;
  /** When the list was computed. `null` while not computed, and for delisted projects. */
  computed_at: string | null;
}

/** Query parameters for `projects.listSimilar`. */
export interface ListSimilarProjectsOptions extends PaginationOptions {
  /**
   * Results per page, 1 to 50.
   * @defaultValue 12
   */
  per_page?: number;
}

/** A tag in a project's community tag panel. */
export interface CommunityTag {
  tag: {
    id: number;
    slug: string;
    name: string;
    type: 'genre' | 'theme' | 'feature';
  };
  /** A starting score plus reputation-weighted votes. `null` when the tag has no community record yet. */
  weighted_score: number | null;
  /** Distinct voters. `null` when `weighted_score` is. */
  unique_voter_count: number | null;
  /** Pinned by the developer or staff. */
  pinned: boolean;
}

/** A project's community tags, as returned by `projects.getCommunityTags`. */
export interface CommunityTags {
  /** Applied tags, pinned first, then by name. */
  active: CommunityTag[];
  /** Suggested but not yet applied, highest score first. */
  proposed: CommunityTag[];
}
