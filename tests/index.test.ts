import { describe, it, expect } from 'vitest';
import ModDexClient, * as moddex from '../src/index.js';

describe('package entry', () => {
  it('default-exports the client', () => {
    expect(ModDexClient).toBe(moddex.ModDexClient);
  });

  it('exports every error class and the paging helpers', () => {
    for (const name of [
      'ModDexError',
      'ModDexTimeoutError',
      'ModDexNetworkError',
      'ModDexAuthenticationError',
      'ModDexForbiddenError',
      'ModDexNotFoundError',
      'ModDexConflictError',
      'ModDexValidationError',
      'ModDexAmbiguousError',
      'ModDexRateLimitError',
      'ModDexServiceUnavailableError',
      'paginate',
      'followCursor',
    ] as const) {
      expect(typeof moddex[name]).toBe('function');
    }
  });

  it('exposes every API namespace', () => {
    const client = new ModDexClient();
    for (const name of ['lookup', 'projects', 'reviews', 'catalog', 'sync', 'user'] as const) {
      expect(client[name]).toBeDefined();
    }
  });
});
