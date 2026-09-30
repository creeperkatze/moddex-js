import {
  ModDexAuthenticationError,
  ModDexError,
  ModDexForbiddenError,
  ModDexNotFoundError,
  ModDexRateLimitError,
  ModDexValidationError,
} from '../errors.js';
import { extractErrorMessage, parseRetryAfter, toErrorBody } from './request.js';

/** Maps a non-ok response to the matching typed error. */
export function createApiError(response: Response, body: unknown): ModDexError {
  const { status } = response;
  const message = extractErrorMessage(body, status);
  const payload = toErrorBody(body);
  const options = { status, response, body };

  switch (status) {
    case 401:
      return new ModDexAuthenticationError(message, { ...options, code: payload.error, hint: payload.hint });
    case 403:
      return new ModDexForbiddenError(message, options);
    case 404:
      return new ModDexNotFoundError(message, options);
    case 422:
      return new ModDexValidationError(message, { ...options, errors: payload.errors });
    case 429:
      return new ModDexRateLimitError(message, {
        ...options,
        retryAfter: parseRetryAfter(response.headers.get('Retry-After')),
      });
    default:
      return new ModDexError(message, options);
  }
}
