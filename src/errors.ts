import type { TokenErrorCode } from './types/errors.js';

/** Options accepted by {@link ModDexError} and its subclasses. */
export interface ModDexErrorOptions {
  status?: number;
  response?: Response;
  body?: unknown;
  cause?: unknown;
}

/** Base class for every error thrown by the client. Catch this to handle all failures at once. */
export class ModDexError extends Error {
  override name: string = 'ModDexError';
  /** HTTP status code, or `0` if the request never got a response. */
  status: number;
  /** The raw fetch `Response`, if one was received. */
  response: Response | undefined;
  /** The parsed response body, if one was received. */
  body: unknown;

  constructor(message: string, options: ModDexErrorOptions = {}) {
    super(message, options.cause !== undefined ? { cause: options.cause } : undefined);
    this.status = options.status ?? 0;
    this.response = options.response;
    this.body = options.body;
  }
}

/** Thrown when the request did not complete within `timeoutMs`. */
export class ModDexTimeoutError extends ModDexError {
  override name = 'ModDexTimeoutError';
}

/** Thrown when the request failed before a response was received, e.g. DNS, connection or CORS failures. */
export class ModDexNetworkError extends ModDexError {
  override name = 'ModDexNetworkError';
}

/** Thrown on `401 Unauthorized`: the token is missing, invalid, or expired. */
export class ModDexAuthenticationError extends ModDexError {
  override name = 'ModDexAuthenticationError';
  /** The `error` field of the response, e.g. `token_expired`. `null` if the API did not send one. */
  code: TokenErrorCode | (string & {}) | null;
  /** The `hint` field of the response. `null` if the API did not send one. */
  hint: string | null;

  constructor(
    message: string,
    options: ModDexErrorOptions & { code?: string | null; hint?: string | null } = {},
  ) {
    super(message, options);
    this.code = options.code ?? null;
    this.hint = options.hint ?? null;
  }
}

/** Thrown on `403 Forbidden`, e.g. the token lacks the read ability or the account email is not verified. */
export class ModDexForbiddenError extends ModDexError {
  override name = 'ModDexForbiddenError';
}

/** Thrown on `404 Not Found`, e.g. an unknown slug or a review that is not approved. */
export class ModDexNotFoundError extends ModDexError {
  override name = 'ModDexNotFoundError';
}

/** Thrown on `422 Unprocessable Content` when query parameters fail validation. */
export class ModDexValidationError extends ModDexError {
  override name = 'ModDexValidationError';
  /** Validation messages keyed by field name, e.g. `{ per_page: ['...'] }`. */
  errors: Record<string, string[]>;

  constructor(message: string, options: ModDexErrorOptions & { errors?: Record<string, string[]> } = {}) {
    super(message, options);
    this.errors = options.errors ?? {};
  }
}

/** Thrown on `429 Too Many Requests`. The API allows 60 requests per minute per user. */
export class ModDexRateLimitError extends ModDexError {
  override name = 'ModDexRateLimitError';
  /** Seconds to wait before retrying, from the `Retry-After` header. `null` if the header was missing or unreadable. */
  retryAfter: number | null;

  constructor(message: string, options: ModDexErrorOptions & { retryAfter?: number | null } = {}) {
    super(message, options);
    this.retryAfter = options.retryAfter ?? null;
  }
}
