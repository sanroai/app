import { describe, it, expect, vi } from 'vitest';
import { ResponseCacheService } from './response-cache.service';

describe('ResponseCacheService', () => {
  it('builds once and serves the cached payload afterwards', async () => {
    const cache = new ResponseCacheService();
    const build = vi.fn(async () => ({ value: 42 }));

    const first = await cache.wrap('u-1|home', build);
    const second = await cache.wrap('u-1|home', build);

    expect(first).toEqual({ value: 42 });
    expect(second).toEqual({ value: 42 });
    expect(build).toHaveBeenCalledTimes(1);
  });

  it('keeps accounts apart', async () => {
    const cache = new ResponseCacheService();
    await cache.wrap('u-1|home', async () => 'one');
    const other = await cache.wrap('u-2|home', async () => 'two');

    expect(other).toBe('two');
    expect(cache.get<string>('u-1|home')).toBe('one');
  });

  it('rebuilds after the account is invalidated', async () => {
    const cache = new ResponseCacheService();
    const build = vi.fn(async () => 'fresh');

    await cache.wrap('u-1|home', build);
    cache.invalidateAccount('u-1');
    await cache.wrap('u-1|home', build);

    expect(build).toHaveBeenCalledTimes(2);
  });

  it('does not let one account invalidate another', async () => {
    const cache = new ResponseCacheService();
    const build = vi.fn(async () => 'value');

    await cache.wrap('u-1|home', build);
    cache.invalidateAccount('u-2');
    await cache.wrap('u-1|home', build);

    expect(build).toHaveBeenCalledTimes(1);
  });

  it('expires an entry when its TTL elapses', async () => {
    vi.useFakeTimers();
    try {
      const cache = new ResponseCacheService();
      const build = vi.fn(async () => 'value');

      await cache.wrap('u-1|home', build, 1000);
      vi.advanceTimersByTime(1001);
      await cache.wrap('u-1|home', build, 1000);

      expect(build).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('stays bounded', async () => {
    const cache = new ResponseCacheService();
    for (let i = 0; i < 700; i += 1) cache.set(`u-${i}|home`, i);

    expect(cache.size()).toBeLessThanOrEqual(600);
    // the newest entry is still there, the oldest were evicted
    expect(cache.get<number>('u-699|home')).toBe(699);
    expect(cache.get<number>('u-0|home')).toBeUndefined();
  });
});
