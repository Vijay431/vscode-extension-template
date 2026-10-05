import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Cache, createCache, memoize } from '../../src/utils/cache';

describe('Cache', () => {
  let cache: Cache<string> | undefined;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cache?.dispose();
    cache = undefined;
    vi.useRealTimers();
  });

  it('should store and retrieve values', () => {
    cache = createCache<string>();
    cache.set('a', '1');
    expect(cache.get('a')).toBe('1');
    expect(cache.has('a')).toBe(true);
  });

  it('should expire entries after the TTL', () => {
    cache = new Cache<string>({ defaultTTL: 1000 });
    cache.set('a', '1');
    vi.advanceTimersByTime(999);
    expect(cache.get('a')).toBe('1');
    vi.advanceTimersByTime(2);
    expect(cache.get('a')).toBeUndefined();
    expect(cache.getStats().expired).toBeGreaterThanOrEqual(1);
  });

  it('should honor a per-entry TTL override', () => {
    cache = new Cache<string>({ defaultTTL: 1000 });
    cache.set('a', '1', 10);
    vi.advanceTimersByTime(20);
    expect(cache.has('a')).toBe(false);
  });

  it('should evict the least recently used entry at capacity', () => {
    cache = new Cache<string>({ maxSize: 2, defaultTTL: 0 });
    cache.set('a', '1');
    vi.advanceTimersByTime(10);
    cache.set('b', '2');
    vi.advanceTimersByTime(10);
    cache.get('a');
    vi.advanceTimersByTime(10);
    cache.set('c', '3');
    expect(cache.has('b')).toBe(false);
    expect(cache.has('a')).toBe(true);
    expect(cache.has('c')).toBe(true);
    expect(cache.getStats().evicted).toBe(1);
  });

  it('should not evict other entries when overwriting an existing key at capacity', () => {
    cache = new Cache<string>({ maxSize: 2, defaultTTL: 0 });
    cache.set('a', '1');
    cache.set('b', '2');
    cache.set('a', '3');
    expect(cache.get('a')).toBe('3');
    expect(cache.get('b')).toBe('2');
    expect(cache.getStats().evicted).toBe(0);
    expect(cache.getStats().size).toBe(2);
  });

  it('should report hit and miss statistics', () => {
    cache = new Cache<string>({ defaultTTL: 0 });
    cache.set('a', '1');
    cache.get('a');
    cache.get('missing');
    const stats = cache.getStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
    expect(stats.hitRate).toBe(0.5);
    expect(stats.size).toBe(1);
  });

  it('should remove expired entries during periodic cleanup', () => {
    cache = new Cache<string>({ defaultTTL: 1000 });
    cache.set('a', '1');
    vi.advanceTimersByTime(61000);
    expect(cache.keys()).toEqual([]);
  });

  it('should clear entries on dispose', () => {
    cache = new Cache<string>({ defaultTTL: 1000 });
    cache.set('a', '1');
    cache.dispose();
    expect(cache.keys()).toEqual([]);
  });
});

describe('memoize', () => {
  function build(keyGenerator?: (...args: unknown[]) => string) {
    const spy = vi.fn((x: number): number | undefined => (x < 0 ? undefined : x * 2));
    class Svc {
      public run(x: number): number | undefined {
        return spy(x);
      }
    }
    const descriptor = Object.getOwnPropertyDescriptor(Svc.prototype, 'run');
    if (!descriptor) {
      throw new Error('missing descriptor');
    }
    memoize(60000, keyGenerator)(Svc.prototype, 'run', descriptor);
    Object.defineProperty(Svc.prototype, 'run', descriptor);
    return { svc: new Svc(), spy };
  }

  it('should cache results by arguments', () => {
    const { svc, spy } = build();
    expect(svc.run(2)).toBe(4);
    expect(svc.run(2)).toBe(4);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should spread arguments into a custom key generator', () => {
    const keyGen = vi.fn((...args: unknown[]) => `k:${String(args[0])}`);
    const { svc, spy } = build(keyGen);
    svc.run(1);
    svc.run(1);
    expect(keyGen).toHaveBeenCalledWith(1);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should cache undefined results', () => {
    const { svc, spy } = build();
    expect(svc.run(-1)).toBeUndefined();
    expect(svc.run(-1)).toBeUndefined();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
