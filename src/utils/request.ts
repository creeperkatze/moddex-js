import type { QueryValue } from '../types/base.js';
import type { ModDexErrorBody } from '../types/errors.js';

/** Strips trailing slashes from a base URL. */
export function normalizeBaseUrl(baseUrl: string): string {
  if (!baseUrl || typeof baseUrl !== 'string') {
    throw new TypeError('baseUrl must be a non-empty string');
  }

  return baseUrl.replace(/\/+$/, '');
}

/**
 * Appends query parameters to a URL, skipping null and undefined values.
 * Booleans are sent as `1` / `0`, which Laravel's `boolean` validation rule accepts (it rejects `"true"`).
 */
export function appendQuery(url: URL, query?: object): URL {
  if (!query) return url;

  for (const [key, value] of Object.entries(query as Record<string, QueryValue>)) {
    if (value == null) continue;
    url.searchParams.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value));
  }

  return url;
}

/** Constructs the full API URL for a given path and optional query parameters. */
export function buildApiUrl(baseUrl: string, path: string, query?: object): string {
  const trimmedPath = path.replace(/^\/+/, '');
  const url = new URL(`${normalizeBaseUrl(baseUrl)}/${trimmedPath}`);
  return appendQuery(url, query).toString();
}

/** Narrows an unknown response body to the Laravel error shape, dropping fields of the wrong type. */
export function toErrorBody(body: unknown): ModDexErrorBody {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return {};

  const record = body as Record<string, unknown>;
  const result: ModDexErrorBody = {};

  if (typeof record['message'] === 'string') result.message = record['message'];
  if (typeof record['error'] === 'string') result.error = record['error'];
  if (typeof record['hint'] === 'string') result.hint = record['hint'];

  const errors = record['errors'];
  if (errors && typeof errors === 'object' && !Array.isArray(errors)) {
    result.errors = {};
    for (const [field, messages] of Object.entries(errors as Record<string, unknown>)) {
      if (Array.isArray(messages)) {
        result.errors[field] = messages.filter((message): message is string => typeof message === 'string');
      } else if (typeof messages === 'string') {
        result.errors[field] = [messages];
      }
    }
  }

  return result;
}

/** Extracts a human-readable message from an API error response body. */
export function extractErrorMessage(body: unknown, status: number): string {
  const { message } = toErrorBody(body);
  if (message) return message;
  if (typeof body === 'string' && body.length > 0 && body.length <= 200) return body;
  return `HTTP ${status}`;
}

/** Attempts to parse the error response body as JSON, falling back to text. */
export async function parseErrorBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return response.json().catch(() => null);
  }
  return response.text().catch(() => null);
}

/**
 * Parses a `Retry-After` header into seconds. Supports both delta-seconds and HTTP-date values.
 * Returns `null` if the header is missing or unreadable.
 */
export function parseRetryAfter(value: string | null, now: number = Date.now()): number | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (trimmed === '') return null;

  if (/^\d+$/.test(trimmed)) return Number(trimmed);

  const date = Date.parse(trimmed);
  if (Number.isNaN(date)) return null;
  return Math.max(0, Math.ceil((date - now) / 1000));
}
