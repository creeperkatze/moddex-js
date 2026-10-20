import type { MaskingOptions, PaginationOptions } from './base.js';
import type { ProjectSummary, ProjectType } from './projects.js';

/** Sort orders accepted by the review lists. */
export type ReviewSort = 'newest' | 'oldest' | 'rating' | 'helpful';

/** How far a reviewer got with a project. */
export type PlayStatus = 'playing' | 'played' | 'completed' | 'plan_to_play' | 'on_hold' | 'dropped';

/** Staff badges a profile can show. */
export type UserRole = 'admin' | 'moderator' | 'tag_curator';

/** Reputation of a ModDex user. */
export interface Reputation {
  points: number;
  tier: string;
  tier_label: string;
}

/** A ModDex user who wrote a review or a developer response. */
export interface ReviewAuthor {
  /** `null` for a deleted account. */
  id: number | null;
  /** `"Deleted User"` for a deleted account. */
  name: string;
  username: string | null;
  avatar_url: string | null;
  profile_url: string | null;
  /** The staff badge the profile shows, if any. */
  roles: UserRole[];
  /** `null` for a deleted account. */
  reputation: Reputation | null;
}

/** Category ratings of a review. Each is 0.5 to 5, or `null` when not rated. */
export interface ReviewCategories {
  gameplay: number | null;
  performance: number | null;
  aesthetics: number | null;
}

/** An image attached to a review. */
export interface ReviewImage {
  url: string;
  /** Plain text. */
  caption: string | null;
}

/** A project developer's public reply to a review. */
export interface DeveloperResponse {
  /** Plain text: escape it before rendering. */
  content: string;
  responded_at: string | null;
  author: ReviewAuthor;
}

/** An approved review or quick rating. */
export interface Review {
  id: number;
  /** Stars only: no title or text. */
  is_quick_rating: boolean;
  /** Plain text. */
  title: string | null;
  /** The Markdown the author wrote, masked unless `unmasked` is set. Plain text: escape it before rendering. */
  content: string | null;
  /** Sanitized HTML of `content`. Spoilers are wrapped in `<span data-spoiler>`. */
  content_html: string | null;
  /** 0.5 to 5 in steps of 0.5. */
  rating: number;
  categories: ReviewCategories;
  /** As the reviewer entered it. May list several, comma-separated. */
  minecraft_version: string | null;
  playtime_hours: number | null;
  completion_hours: number | null;
  play_status: PlayStatus | null;
  /** The modpack version reviewed. */
  pack_version: string | null;
  helpful_votes: number;
  unhelpful_votes: number;
  /** Written by one of the project's verified developers. */
  is_verified_developer: boolean;
  /** Plain text. */
  public_moderator_note: string | null;
  images: ReviewImage[];
  /** The developer's reply, if any. */
  developer_response: DeveloperResponse | null;
  author: ReviewAuthor;
  project: ProjectSummary;
  /** The review's page on ModDex. */
  url: string | null;
  created_at: string | null;
  edited_at: string | null;
  updated_at: string | null;
}

/** Which reviews to keep by attached media. */
export type ReviewMediaFilter = 'all' | 'with_images' | 'text_only';

/** Filters shared by every review list. */
export interface ReviewFilterOptions extends PaginationOptions, MaskingOptions {
  /** @defaultValue "newest" */
  sort?: ReviewSort;
  /** From 0.5 to 5. */
  min_rating?: number;
  /** From 0.5 to 5. */
  max_rating?: number;
  /** Versions the reviewer played. `1.20` matches every 1.20.x. */
  minecraft_versions?: readonly string[];
  play_statuses?: readonly Exclude<PlayStatus, 'plan_to_play'>[];
  /** Minimum hours played. */
  playtime_min?: number;
  /** @defaultValue "all" */
  media?: ReviewMediaFilter;
  /** Only reviews by the project's verified developers. */
  verified_only?: boolean;
  /** Only reviews the developer answered. */
  has_developer_response?: boolean;
  /** Pack versions, matched exactly. */
  pack_version?: readonly string[];
  /**
   * Results per page, 1 to 50.
   * @defaultValue 20
   */
  per_page?: number;
}

/** Query parameters for `projects.listReviews`. Quick ratings count toward the rating but aren't listed. */
export type ListProjectReviewsOptions = ReviewFilterOptions;

/** Query parameters for `reviews.list`. */
export interface ListReviewsOptions extends ReviewFilterOptions {
  /** Up to 50 ModDex project IDs. A merged listing's ID means its project's reviews. */
  project_ids?: readonly number[];
  type?: ProjectType;
  /**
   * Written at or after: an ISO 8601 date (midnight UTC) or a date-time with a time zone. A review held for
   * moderation keeps its writing date when approved, so follow `sync.listReviews` to catch every new review.
   */
  since?: string;
  /**
   * `false` adds quick ratings (stars only).
   * @defaultValue true
   */
  written_only?: boolean;
}
