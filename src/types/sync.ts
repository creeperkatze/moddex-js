import type { MaskingOptions } from './base.js';
import type { ProjectListItem } from './projects.js';

/** Envelope of the cursor-paged sync feeds. The feeds only go forward. */
export interface SyncResponse<T> {
  data: T[];
  links: {
    /** This feed continued from `next_cursor`. `null` once `has_more` is `false`. */
    next: string | null;
    prev: null;
  };
  meta: {
    per_page: number;
    /** Always set. On the last page it points just past the last row: store it and poll with it later. */
    next_cursor: string;
    prev_cursor: null;
    /** `true` when more rows are ready now. */
    has_more: boolean;
  };
}

/** Where a sync feed starts. Pass `cursor` to continue, or `since` (or neither) to start over. */
export interface SyncOptions {
  /**
   * Only changes at or after this time: an ISO 8601 date (midnight UTC) or a date-time with a time zone.
   * Omit it to start from the oldest change.
   */
  since?: string;
  /** `meta.next_cursor` from the previous page, exactly as given. */
  cursor?: string;
  per_page?: number;
}

/** Query parameters for `sync.listProjects`. */
export interface SyncProjectsOptions extends SyncOptions {
  /**
   * Rows per page, 1 to 100.
   * @defaultValue 100
   */
  per_page?: number;
}

/** Query parameters for `sync.listReviews`. */
export interface SyncReviewsOptions extends SyncOptions, MaskingOptions {
  /**
   * Rows per page, 1 to 50.
   * @defaultValue 50
   */
  per_page?: number;
}

/** A project that no longer resolves. Delete it and its reviews if you store them. */
export type ProjectTombstone =
  | { id: number; removed: true; reason: 'deleted' }
  | {
      id: number;
      removed: true;
      reason: 'merged';
      /** The project this listing was merged into. It has its own row in the feed. */
      canonical_id: number;
    };

/** A row of the projects sync feed: a live project in the list shape, or a tombstone. Tell them apart by `removed`. */
export type ProjectSyncRow = (ProjectListItem & { removed?: undefined }) | ProjectTombstone;
