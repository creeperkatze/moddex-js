import type { PaginationOptions, SortDirection } from './base.js';
import type { ProjectType } from './projects.js';

/** Sort fields accepted by the review list endpoints. */
export type ReviewSortField = 'created_at' | 'rating' | 'helpful_votes' | 'unhelpful_votes';

/** Query parameters for `GET /api/v1/mods/{slug}/reviews` and `GET /api/v1/modpacks/{slug}/reviews`. */
export interface ListReviewsOptions extends PaginationOptions {
  /**
   * Sort field.
   * @defaultValue "created_at"
   */
  sort?: ReviewSortField;
  /**
   * Sort direction.
   * @defaultValue "desc"
   */
  direction?: SortDirection;
  /**
   * Results per page (max 50).
   * @defaultValue 15
   */
  per_page?: number;
}

/** The author of a review. The API exposes only the id and display name. */
export interface ReviewAuthor {
  id: number;
  name: string;
}

/** The project a review belongs to. */
export interface ReviewProject {
  id: number;
  name: string;
  slug: string;
  type: ProjectType;
}

/** An approved review. */
export interface Review {
  id: number;
  is_quick_rating: boolean;
  title: string;
  content: string;
  rating: number;
  gameplay_rating: number;
  performance_rating: number;
  aesthetics_rating: number;
  /** Minecraft version the author played on. */
  minecraft_version: string;
  playtime_hours: number;
  /** Play status of the author, e.g. `completed`. */
  play_status: string;
  /** Modpack version the review refers to, `null` for mods. */
  pack_version: string | null;
  helpful_votes: number;
  unhelpful_votes: number;
  is_verified_developer: boolean;
  author: ReviewAuthor;
  project: ReviewProject;
  created_at: string;
  edited_at: string | null;
  public_moderator_note: string | null;
}
