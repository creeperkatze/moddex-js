import type { PaginationOptions } from './base.js';

/** Tag categories. Mod loaders and Minecraft versions are not tags, they are fields on projects. */
export type TagType = 'genre' | 'feature' | 'theme' | 'dev_environment';

/** Query parameters for `GET /api/v1/tags`. */
export interface ListTagsOptions extends PaginationOptions {
  /** Filter by tag type. */
  type?: TagType;
  /**
   * Results per page (max 100).
   * @defaultValue 50
   */
  per_page?: number;
}

/** A taxonomy tag used to categorize projects. */
export interface Tag {
  id: number;
  name: string;
  slug: string;
  type: TagType;
  description: string;
}
