import type { ModDexErrorCode } from './types/errors.js';
import type { ProjectSummary } from './types/projects.js';

/** Options accepted by {@link ModDexError} and its subclasses. */
export interface ModDexErrorOptions {
  status?: number;
  response?: Response;
  body?: unknown;
  code?: string | null;
  hint?: string | null;
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
  /** The stable `code` field of the response, e.g. `not_found`. `null` if the API did not send one. */
  code: ModDexErrorCode | (string & {}) | null;
  /** The `hint` field of the response, saying what to change. `null` if the API did not send one. */
  hint: string | null;

  constructor(message: string, options: ModDexErrorOptions = {}) {
    super(message, options.cause !== undefined ? { cause: options.cause } : undefined);
    this.status = options.status ?? 0;
    this.response = options.response;
    this.body = options.body;
    this.code = options.code ?? null;
    this.hint = options.hint ?? null;
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

/** Thrown on `401 Unauthorized`: the token is invalid (`unauthenticated`) or expired (`token_expired`). */
export class ModDexAuthenticationError extends ModDexError {
  override name = 'ModDexAuthenticationError';
}

/** Thrown on `403 Forbidden`: the client is blocked, or the token can't be used. */
export class ModDexForbiddenError extends ModDexError {
  override name = 'ModDexForbiddenError';
}

/** Thrown on `404 Not Found`: no such project, review or route. A lookup that finds nothing throws this too. */
export class ModDexNotFoundError extends ModDexError {
  override name = 'ModDexNotFoundError';
}

/** Thrown on `409 Conflict` when the identifiers of an explicit lookup match different projects. */
export class ModDexConflictError extends ModDexError {
  override name = 'ModDexConflictError';
  /** The project ID each lookup parameter matched, keyed by parameter name. */
  matches: Record<string, number>;

  constructor(message: string, options: ModDexErrorOptions & { matches?: Record<string, number> } = {}) {
    super(message, options);
    this.matches = options.matches ?? {};
  }
}

/**
 * Thrown on `422 Unprocessable Content`: a parameter is invalid (`validation_failed`), the page is too deep
 * (`page_depth_exceeded`), or a sync cursor was edited (`invalid_cursor`).
 */
export class ModDexValidationError extends ModDexError {
  override name = 'ModDexValidationError';
  /** Validation messages keyed by parameter name, e.g. `{ per_page: ['...'] }`. Empty for other codes. */
  errors: Record<string, string[]>;

  constructor(message: string, options: ModDexErrorOptions & { errors?: Record<string, string[]> } = {}) {
    super(message, options);
    this.errors = options.errors ?? {};
  }
}

/** Thrown on `422` with code `ambiguous`: a slug belongs to a mod and a modpack. Pass `type` to pick one. */
export class ModDexAmbiguousError extends ModDexValidationError {
  override name = 'ModDexAmbiguousError';
  /** Every project the value could mean. */
  candidates: ProjectSummary[];

  constructor(message: string, options: ModDexErrorOptions & { candidates?: ProjectSummary[] } = {}) {
    super(message, options);
    this.candidates = options.candidates ?? [];
  }
}

/** Options accepted by the errors that carry a `Retry-After`. */
export interface RetryableErrorOptions extends ModDexErrorOptions {
  retryAfter?: number | null;
}

/** Thrown on `429 Too Many Requests`. Wait `retryAfter` seconds before retrying. */
export class ModDexRateLimitError extends ModDexError {
  override name = 'ModDexRateLimitError';
  /** Seconds to wait before retrying, from the `Retry-After` header. `null` if the header was missing or unreadable. */
  retryAfter: number | null;

  constructor(message: string, options: RetryableErrorOptions = {}) {
    super(message, options);
    this.retryAfter = options.retryAfter ?? null;
  }
}

/**
 * Thrown on `503 Service Unavailable`: the API is busy, timed out, or down for maintenance, or search is unavailable.
 * Expensive requests can get this whatever your own rate limit. Wait `retryAfter` seconds before retrying.
 */
export class ModDexServiceUnavailableError extends ModDexError {
  override name = 'ModDexServiceUnavailableError';
  /** Seconds to wait before retrying, from the `Retry-After` header. `null` if the header was missing or unreadable. */
  retryAfter: number | null;

  constructor(message: string, options: RetryableErrorOptions = {}) {
    super(message, options);
    this.retryAfter = options.retryAfter ?? null;
  }
}
