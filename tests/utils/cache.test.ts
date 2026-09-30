import { describe, it, expect } from 'vitest';
import { ResponseCache } from '../../src/utils/cache.js';

describe('ResponseCache', () => {
  it('returns stored values until the TTL passes', () => {
    let now = 0;
    const cache = new ResponseCache({ ttlMs: 100 }, () => now);
    cache.set('a', { value: 1 });

    now = 99;
    expect(cache.get('a')).toEqual({ value: { value: 1 } });

    now = 100;
    expect(cache.get('a')).toBeUndefined();
    expect(cache.size).toBe(0);
  });

  it('evicts the oldest entry when maxEntries is reached', () => {
    const cache = new ResponseCache({ maxEntries: 2 });
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')?.value).toBe(2);
    expect(cache.get('c')?.value).toBe(3);
  });

  it('refreshes position and expiry when a key is set again', () => {
    let now = 0;
    const cache = new ResponseCache({ maxEntries: 2, ttlMs: 100 }, () => now);
    cache.set('a', 1);
    cache.set('b', 2);
    now = 50;
    cache.set('a', 10);
    cache.set('c', 3);
    expect(cache.get('b')).toBeUndefined();
    now = 120;
    expect(cache.get('a')?.value).toBe(10);
  });

  it('stores and returns clones', () => {
    const cache = new ResponseCache();
    const original = { list: [1] };
    cache.set('a', original);
    original.list.push(2);

    const read = cache.get('a')?.value as { list: number[] };
    expect(read.list).toEqual([1]);
    read.list.push(3);
    expect((cache.get('a')?.value as { list: number[] }).list).toEqual([1]);
  });

  it('caches falsy values', () => {
    const cache = new ResponseCache();
    cache.set('a', null);
    expect(cache.get('a')).toEqual({ value: null });
  });

  it('rejects invalid settings', () => {
    expect(() => new ResponseCache({ ttlMs: 0 })).toThrow(TypeError);
    expect(() => new ResponseCache({ maxEntries: -1 })).toThrow(TypeError);
  });

  it('clear() removes everything', () => {
    const cache = new ResponseCache();
    cache.set('a', 1);
    cache.clear();
    expect(cache.size).toBe(0);
  });
});
