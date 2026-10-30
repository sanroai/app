'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Warm the next screen in the flow while the current one is idle.
 *
 * Instagram/YouTube-style preloading: instead of waiting for a tap, the screen
 * the student is most likely to open next (the first card below, the "continue"
 * target) is requested during the first idle slot. In production Next fetches the
 * RSC payload for the route; in dev the same call compiles the route, so the tap
 * lands on an already-built page.
 *
 * `href` may change (e.g. the first subject depends on the payload), so the
 * effect re-runs when it does. Prefetch failures are non-fatal by design.
 */
export function useIdlePrefetch(href: string | null | undefined) {
  const router = useRouter();

  useEffect(() => {
    if (!href) return;
    let cancelled = false;

    const warm = () => {
      if (cancelled) return;
      try {
        router.prefetch(href);
      } catch {
        // prefetch is best-effort
      }
    };

    const hasIdle = typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function';
    const handle = hasIdle ? window.requestIdleCallback(warm, { timeout: 2500 }) : setTimeout(warm, 1200);

    return () => {
      cancelled = true;
      if (hasIdle) window.cancelIdleCallback(handle as number);
      else clearTimeout(handle as ReturnType<typeof setTimeout>);
    };
  }, [href, router]);
}
