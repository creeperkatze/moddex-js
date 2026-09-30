import { ModDexClient } from '../../src/client/moddex.js';
import type { ModDexClientOptions } from '../../src/types/index.js';
import { createMockFetch } from './http.js';

export function createTestClient(responses: Response[] = [], options: Partial<ModDexClientOptions> = {}) {
  const mockFetch = createMockFetch(responses);
  const client = new ModDexClient({
    baseUrl: 'https://moddex.gg',
    token: 'test-token',
    fetch: mockFetch as unknown as typeof fetch,
    ...options,
  });
  return { client, mockFetch };
}
