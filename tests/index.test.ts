import { describe, it, expect } from 'vitest';
import ModDexClient, * as moddex from '../src/index.js';

describe('package entry', () => {
  it('default-exports the client', () => {
    expect(ModDexClient).toBe(moddex.ModDexClient);
  });

  it('exports every error class and the paginate helper', () => {
    for (const name of [
      'ModDexError',
      'ModDexTimeoutError',
      'ModDexNetworkError',
      'ModDexAuthenticationError',
      'ModDexForbiddenError',
      'ModDexNotFoundError',
      'ModDexValidationError',
      'ModDexRateLimitError',
      'paginate',
    ] as const) {
      expect(typeof moddex[name]).toBe('function');
    }
  });
});
