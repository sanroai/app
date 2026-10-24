'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useRef, type ComponentPropsWithoutRef, type FocusEvent, type MouseEvent, type TouchEvent } from 'react';
import { canPrefetch } from '@/lib/prefetch';

type LinkProps = ComponentPropsWithoutRef<typeof Link>;

/**
 * A `<Link>` that starts loading the next screen the moment the user shows
 * intent - hover, keyboard focus, or touch-down - instead of on click.
 *
 * Two things are warmed:
 *   1. the route itself (`router.prefetch`), which pulls the RSC payload and the
 *      route's client chunks. In `next dev` this is also what triggers the
 *      route's first compilation, so the click no longer pays for compilation.
 *   2. the screen's data, via `prefetchData` (see `lib/prefetch.ts`), so the
 *      destination renders with content on its first frame.
 *
 * `onIntent` fires once per mount. The whole thing degrades to a normal link:
 * if the user never hovers (keyboard users tab straight to Enter), Next's own
 * viewport prefetch still applies, and a failed prefetch is invisible because
 * the click performs the real request anyway.
 */
export function PrefetchLink({
  href,
  prefetchData,
  onMouseEnter,
  onFocus,
  onTouchStart,
  children,
  ...rest
}: LinkProps & {
  /** Data warm-up for the destination. Must be stable (wrap in useCallback). */
  prefetchData?: () => void;
}) {
  const router = useRouter();
  const warmed = useRef(false);

  const warm = useCallback(() => {
    if (warmed.current) return;
    warmed.current = true;
    const path = typeof href === 'string' ? href : href.pathname ?? '';
    if (!path || (typeof navigator !== 'undefined' && navigator.onLine === false)) return;
    try {
      router.prefetch(path);
    } catch {
      // Prefetching is an optimisation; a failure must never break navigation.
    }
    if (canPrefetch()) prefetchData?.();
  }, [href, prefetchData, router]);

  return (
    <Link
      href={href}
      onMouseEnter={(event: MouseEvent<HTMLAnchorElement>) => {
        onMouseEnter?.(event);
        warm();
      }}
      onFocus={(event: FocusEvent<HTMLAnchorElement>) => {
        onFocus?.(event);
        warm();
      }}
      onTouchStart={(event: TouchEvent<HTMLAnchorElement>) => {
        onTouchStart?.(event);
        warm();
      }}
      {...rest}
    >
      {children}
    </Link>
  );
}
