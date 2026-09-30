/** Machine-readable reason sent in the `error` field of a `401` response. */
export type TokenErrorCode = 'token_missing' | 'token_invalid' | 'token_expired';

/** Laravel-style error body returned by the ModDex API. */
export interface ModDexErrorBody {
  message?: string;
  /** Field-level validation messages, keyed by field name. Sent with `422` responses. */
  errors?: Record<string, string[]>;
  /** Machine-readable token error. Sent with `401` responses. */
  error?: string;
  /** Human-readable hint on how to fix a token error. Sent with `401` responses. */
  hint?: string;
}
