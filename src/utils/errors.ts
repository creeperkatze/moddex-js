import {
  ModDexAmbiguousError,
  ModDexAuthenticationError,
  ModDexConflictError,
  ModDexError,
  ModDexForbiddenError,
  ModDexNotFoundError,
  ModDexRateLimitError,
  ModDexServiceUnavailableError,
  ModDexValidationError,
} from '../errors.js';
import { extractErrorMessage, parseRetryAfter, toErrorBody } from './request.js';

/** Maps a non-ok response to the matching typed error. */
export function createApiError(response: Response, body: unknown): ModDexError {
  const { status } = response;
  const message = extractErrorMessage(body, status);
  const payload = toErrorBody(body);
  const options = { status, response, body, code: payload.code, hint: payload.hint };
  const retryAfter = () => parseRetryAfter(response.headers.get('Retry-After'));

  switch (status) {
    case 401:
      return new ModDexAuthenticationError(message, options);
    case 403:
      return new ModDexForbiddenError(message, options);
    case 404:
      return new ModDexNotFoundError(message, options);
    case 409:
      return new ModDexConflictError(message, { ...options, matches: payload.matches });
    case 422:
      if (payload.code === 'ambiguous') {
        return new ModDexAmbiguousError(message, { ...options, candidates: payload.candidates });
      }
      return new ModDexValidationError(message, { ...options, errors: payload.errors });
    case 429:
      return new ModDexRateLimitError(message, { ...options, retryAfter: retryAfter() });
    case 503:
      return new ModDexServiceUnavailableError(message, { ...options, retryAfter: retryAfter() });
    default:
      return new ModDexError(message, options);
  }
}
