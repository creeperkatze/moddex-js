import type { ProjectSummary } from './projects.js';

/** Stable machine-readable error code sent in the `code` field of every v2 error. */
export type ModDexErrorCode =
  | 'not_found'
  | 'validation_failed'
  | 'ambiguous'
  | 'conflict'
  | 'page_depth_exceeded'
  | 'invalid_cursor'
  | 'unauthenticated'
  | 'token_expired'
  | 'forbidden'
  | 'rate_limited'
  | 'service_unavailable'
  | 'method_not_allowed'
  | 'bad_request'
  | 'server_error'
  | 'api_version_retired'
  // Sent only by `user.get()`, which still answers in the v1 shape.
  | 'token_missing'
  | 'token_invalid';

/** Error body returned by the ModDex API. */
export interface ModDexErrorBody {
  message?: string;
  /** Stable error code. Branch on this rather than on `message`. */
  code?: string;
  /** Field-level validation messages, keyed by parameter name. Sent with `validation_failed`. */
  errors?: Record<string, string[]>;
  /** What to change to fix the request, when the API has a suggestion. */
  hint?: string;
  /** Every project a lookup value could mean. Sent with `ambiguous`. */
  candidates?: ProjectSummary[];
  /** The project ID each lookup parameter matched, keyed by parameter name. Sent with `conflict`. */
  matches?: Record<string, number>;
}
