import type { QueryValue } from '../types/base.js';
import type { ModDexErrorBody } from '../types/errors.js';
import type { ProjectSummary } from '../types/projects.js';

/** Strips trailing slashes from a base URL. */
export function normalizeBaseUrl(baseUrl: string): string {
  if (!baseUrl || typeof baseUrl !== 'string') {
    throw new TypeError('baseUrl must be a non-empty string');
  }

  return baseUrl.replace(/\/+$/, '');
}

function encodeQueryValue(value: Exclude<QueryValue, null | undefined>): string {
  if (typeof value === 'boolean') return value ? '1' : '0';
  // ModDex splits lists on literal commas, so each item is encoded on its own and the commas are left as they are.
  if (Array.isArray(value)) return value.map((item) => encodeURIComponent(String(item))).join(',');
  return encodeURIComponent(String(value));
}

/**
 * Serializes query parameters, skipping null and undefined values and empty arrays.
 * Booleans are sent as `1` / `0`, arrays as comma-separated lists.
 */
export function buildQueryString(query?: object): string {
  if (!query) return '';

  const parts: string[] = [];
  for (const [key, value] of Object.entries(query as Record<string, QueryValue>)) {
    if (value == null || (Array.isArray(value) && value.length === 0)) continue;
    parts.push(`${encodeURIComponent(key)}=${encodeQueryValue(value)}`);
  }

  return parts.join('&');
}

/** Constructs the full API URL for a given path and optional query parameters. */
export function buildApiUrl(baseUrl: string, path: string, query?: object): string {
  const trimmedPath = path.replace(/^\/+/, '');
  const queryString = buildQueryString(query);
  return `${normalizeBaseUrl(baseUrl)}/${trimmedPath}${queryString ? `?${queryString}` : ''}`;
}

/** Encodes a value as a single URL path segment. */
export function pathSegment(value: string | number): string {
  return encodeURIComponent(String(value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

/** Narrows an unknown response body to the ModDex error shape, dropping fields of the wrong type. */
export function toErrorBody(body: unknown): ModDexErrorBody {
  if (!isRecord(body)) return {};

  const result: ModDexErrorBody = {};

  if (typeof body['message'] === 'string') result.message = body['message'];
  if (typeof body['hint'] === 'string') result.hint = body['hint'];
  // `/api/user` still answers in the v1 shape, which names the code `error`.
  if (typeof body['code'] === 'string') result.code = body['code'];
  else if (typeof body['error'] === 'string') result.code = body['error'];

  const errors = body['errors'];
  if (isRecord(errors)) {
    result.errors = {};
    for (const [field, messages] of Object.entries(errors)) {
      if (Array.isArray(messages)) {
        result.errors[field] = messages.filter((message): message is string => typeof message === 'string');
      } else if (typeof messages === 'string') {
        result.errors[field] = [messages];
      }
    }
  }

  if (Array.isArray(body['candidates'])) {
    result.candidates = body['candidates'].filter(isRecord) as unknown as ProjectSummary[];
  }

  const matches = body['matches'];
  if (isRecord(matches)) {
    result.matches = {};
    for (const [param, id] of Object.entries(matches)) {
      if (typeof id === 'number') result.matches[param] = id;
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
