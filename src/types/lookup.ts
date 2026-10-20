import type { ModDexPaginatedResponse } from './base.js';
import type { ProjectFile } from './files.js';
import type { GetProjectOptions, Project, ProjectSummary, ProjectType } from './projects.js';
import type { ListProjectReviewsOptions, Review } from './reviews.js';

/** A platform a lookup value can come from. */
export type LookupPlatform = 'moddex' | 'curseforge' | 'modrinth';

/** An identifier a lookup can match on. */
export type LookupKey =
  | 'moddex_id'
  | 'moddex_slug'
  | 'curseforge_id'
  | 'curseforge_slug'
  | 'modrinth_id'
  | 'modrinth_slug';

/** How a lookup value matched its project. */
export interface LookupMatch {
  /** Which identifier matched. */
  key: LookupKey;
  /** The value as sent. */
  value: string;
  /** The identifier belongs to a loader-specific listing merged into this project. */
  via_facet: boolean;
  /** The ModDex slug is one this project used to have. */
  via_alias: boolean;
  /** Other project IDs that share the slug and type (stale listings). */
  alternatives: number[];
}

/** How one parameter of an explicit lookup matched. */
export interface ExplicitLookupMatch extends Omit<LookupMatch, 'key'> {
  /** Whether this parameter matched the project. */
  hit: boolean;
  /** The identifier tried. For `url`, the one the link mapped to. `null` for a link ModDex doesn't cover. */
  key: LookupKey | null;
}

/** Query parameters for `lookup.get`. */
export interface LookupOptions extends GetProjectOptions {
  /** Restrict to mods or modpacks. Needed when a slug is shared by a mod and a modpack. */
  type?: ProjectType;
}

/** Response of `lookup.get`. */
export interface LookupResponse {
  data: Project;
  matched: LookupMatch;
}

/**
 * Query parameters for `lookup.find`. Pass any combination of the six keys and `url`. Each is resolved on its own:
 * the response is a `200` when all hits are the same project, even if some keys miss, and a `409` conflict when
 * keys hit different projects.
 */
export interface ExplicitLookupOptions extends LookupOptions {
  moddex_id?: number;
  /** Old slugs resolve too. */
  moddex_slug?: string;
  curseforge_id?: number;
  curseforge_slug?: string;
  /** 8 characters, case-sensitive. */
  modrinth_id?: string;
  modrinth_slug?: string;
  /**
   * A ModDex, CurseForge or Modrinth project link, with or without the scheme, `www.`, a trailing slash, query
   * string or fragment. Sub-pages such as `/files` or `/versions` resolve to their project. The link's type wins
   * over `type`.
   */
  url?: string;
}

/** Response of `lookup.find`. */
export interface ExplicitLookupResponse {
  data: Project;
  /** One entry per lookup parameter sent, keyed by parameter name. */
  matched: Partial<Record<keyof Omit<ExplicitLookupOptions, keyof LookupOptions>, ExplicitLookupMatch>>;
}

/** Query parameters for `lookup.listReviews`. */
export interface LookupReviewsOptions extends ListProjectReviewsOptions {
  /** Restrict to mods or modpacks. */
  type?: ProjectType;
}

/** Extra `meta` fields of `lookup.listReviews`. */
export interface LookupReviewsMeta {
  /** The project, in the summary shape. */
  project: ProjectSummary;
  matched: LookupMatch;
}

/** Response of `lookup.listReviews`. */
export type LookupReviewsResponse = ModDexPaginatedResponse<Review, LookupReviewsMeta>;

/** Query parameters for `lookup.batch`. Up to 100 values in total. */
export interface BatchLookupOptions {
  /** Modrinth IDs or slugs. */
  modrinth?: readonly string[];
  /** CurseForge IDs or slugs. */
  curseforge?: readonly (string | number)[];
  /** ModDex IDs or slugs. */
  moddex?: readonly (string | number)[];
  /** ModDex, CurseForge or Modrinth links. They carry their type, so they are never ambiguous. */
  urls?: readonly string[];
  /** Applies to every value except a link, which carries its own type. */
  type?: ProjectType;
}

/** A batch value that could mean a mod or a modpack, sent without `type`. */
export interface AmbiguousLookup {
  ambiguous: true;
  /** Every project the value could mean. */
  candidates: ProjectSummary[];
}

/** One batch lookup value: its project, ambiguous candidates, or `null` when not on ModDex or not valid. */
export type BatchLookupEntry = ProjectSummary | AmbiguousLookup | null;

/** Result of `lookup.batch`, keyed by each value as sent (trimmed). */
export interface BatchLookupResult {
  modrinth: Record<string, BatchLookupEntry>;
  curseforge: Record<string, BatchLookupEntry>;
  moddex: Record<string, BatchLookupEntry>;
  urls: Record<string, BatchLookupEntry>;
}

/** Query parameters for `lookup.file`. Pass exactly one of `sha1` or `curseforge_file_id`. */
export type FileLookupOptions =
  | { /** A Modrinth file's SHA1, 40 hex characters, any case. */ sha1: string; curseforge_file_id?: never }
  | { sha1?: never; /** A CurseForge file ID. */ curseforge_file_id: number | string };

/** A file mapped to its project. */
export interface FileMatch {
  /** The release row. For Modrinth, the version's primary file. */
  file: ProjectFile;
  project: ProjectSummary;
  /** The looked-up SHA1 is one of the version's secondary files. */
  secondary: boolean;
}

/** Query parameters for `lookup.fileBatch`. Up to 100 values in total. */
export interface FileBatchLookupOptions {
  /** Modrinth file SHA1s. */
  sha1?: readonly string[];
  /** CurseForge file IDs. */
  curseforge_file_id?: readonly (string | number)[];
}

/** Result of `lookup.fileBatch`, keyed by each value as sent. `null` when unknown, hidden or malformed. */
export interface FileBatchLookupResult {
  sha1: Record<string, FileMatch | null>;
  curseforge_file_id: Record<string, FileMatch | null>;
}
