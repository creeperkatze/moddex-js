import { ModDexClient } from '../../src/client/moddex.js';
import type { ModDexClientOptions } from '../../src/types/index.js';
import { createMockFetch } from './http.js';

export function createTestClient(responses: Response[] = [], options: Partial<ModDexClientOptions> = {}) {
  const mockFetch = createMockFetch(responses);
  const client = new ModDexClient({
    baseUrl: 'https://moddex.gg',
    fetch: mockFetch as unknown as typeof fetch,
    ...options,
  });
  return { client, mockFetch };
}

/** Returns the query string of a recorded request exactly as sent, without the leading `?`. */
export function rawQuery(request: Request | undefined): string {
  return new URL(request!.url).search.slice(1);
}
