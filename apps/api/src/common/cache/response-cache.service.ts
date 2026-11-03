import { Injectable } from '@nestjs/common';

/**
 * A tiny in-process cache for read-only learning responses.
 *
 * Why this exists: the API runs in a different region from its database, so
 * every Prisma query costs a network round trip. A screen like the chapter hub
 * runs a handful of queries, and the same payload is requested again on every
 * back-navigation - measured at 400-800 ms per request with a ~300 ms network
 * floor. Caching the assembled payload for a few seconds removes the query cost
 * entirely on the second look.
 *
 * Rules that keep it safe:
 *  - **keyed by the account** (`<user sub>|...`), so one student can never read
 *    another's payload, and role/grade differences are part of the key;
 *  - **short TTL** (30 s) - curriculum and mastery change slowly, and a stale
 *    mark for half a minute is invisible;
 *  - **explicit invalidation** whenever the account changes its own progress
 *    (practice submitted, lesson completed/undone), so the next read is fresh;
 *  - **bounded** (a few hundred payloads) with oldest-first eviction, so it can
 *    never become a memory leak.
 */
@Injectable()
export class ResponseCacheService {
  private readonly store = new Map<string, { value: unknown; expiresAt: number }>();

  /** The default lifetime of an entry. */
  static readonly DEFAULT_TTL_MS = 30_000;

  /** Hard cap on cached payloads; eviction is oldest-first (Map keeps order). */
  private readonly maxEntries = 600;

  get<T>(key: string): T | undefined {
    const hit = this.store.get(key);
    if (!hit) return undefined;
    if (hit.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    // Refresh insertion order so the eviction below is least-recently-used.
    this.store.delete(key);
    this.store.set(key, hit);
    return hit.value as T;
  }

  set(key: string, value: unknown, ttlMs: number = ResponseCacheService.DEFAULT_TTL_MS): void {
    if (this.store.size >= this.maxEntries) {
      const oldest = this.store.keys().next();
      if (!oldest.done) this.store.delete(oldest.value);
    }
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  /**
   * Read-through helper: return the cached payload, or build it once.
   *
   * `build` runs only on a miss, so a hit costs no database work at all.
   */
  async wrap<T>(
    key: string,
    build: () => Promise<T>,
    ttlMs: number = ResponseCacheService.DEFAULT_TTL_MS,
  ): Promise<T> {
    const hit = this.get<T>(key);
    if (hit !== undefined) return hit;
    const value = await build();
    this.set(key, value, ttlMs);
    return value;
  }

  /** Drop every entry belonging to one account (their progress changed). */
  invalidateAccount(userSub: string): void {
    const prefix = `${userSub}|`;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }

  /** Testing/support helper: how many payloads are held right now. */
  size(): number {
    return this.store.size;
  }
}
