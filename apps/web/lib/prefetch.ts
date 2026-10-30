'use client';

import type { QueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { learningKeys, type ConceptDetail } from '@/lib/learning-hooks';
import { chapterKeys, normalizeChapterHub } from '@/lib/chapter-hooks';
import { libraryKeys, libraryQueryString } from '@/lib/library-hooks';

/**
 * Data prefetching for the library drill-down.
 *
 * The problem this solves
 * -----------------------
 * Every screen in `Library -> Subject -> Chapter -> Concept` is a client
 * component that fetches its own payload on mount, so a click used to cost
 * *route module + chunk* and then *a fresh API round-trip* before anything but a
 * skeleton could paint. Measured on the dev server that was 7-9 s per step; on a
 * phone against a remote API it is a visible stall even in production.
 *
 * YouTube/Instagram solve it the same way: start the work when the user shows
 * intent (hover, focus, touch-down) instead of when the click lands. By the time
 * the route renders, the payload is already in the React Query cache, so the
 * page paints with data on the first frame.
 *
 * Rules that keep this safe
 * -------------------------
 * - Never prefetch without a token (the API would 401 and the request would be
 *   wasted - and the retry would burn the auth limiter).
 * - Skip on metered/slow connections (`Save-Data`, `2g`), where prefetching
 *   would compete with the request the user actually needs.
 * - Prefetches are deduped by React Query and honour `staleTime`, so sweeping a
 *   grid of cards cannot stampede the API.
 * - Nothing here changes what a screen *is allowed* to see: the same endpoints,
 *   the same scoping middleware, just earlier.
 */

export const PREFETCH_STALE_MS = 60_000;

/** True when speculative networking is a good idea on this connection. */
export function canPrefetch(): boolean {
  if (typeof navigator === 'undefined') return true;
  if (navigator.onLine === false) return false;
  const connection = (navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  }).connection;
  if (connection?.saveData) return false;
  if (connection?.effectiveType && /(^|-)2g$/.test(connection.effectiveType)) return false;
  return true;
}

function warm(client: QueryClient, chapterId: string, token: string) {
  return client.prefetchQuery({
    queryKey: chapterKeys.hub(chapterId),
    queryFn: () => api<unknown>(`/learning/chapters/${chapterId}`, { token }).then(normalizeChapterHub),
    staleTime: PREFETCH_STALE_MS,
  });
}

/** Prefetch one chapter hub (the screen behind a chapter card). */
export function prefetchChapterHub(client: QueryClient, chapterId: string, token: string | null) {
  if (!token || !chapterId || !canPrefetch()) return;
  void warm(client, chapterId, token);
}

/** Prefetch one concept page payload (the screen behind a concept row). */
export function prefetchConcept(client: QueryClient, conceptId: string, token: string | null) {
  if (!token || !conceptId || !canPrefetch()) return;
  void client.prefetchQuery({
    queryKey: learningKeys.concept(conceptId),
    queryFn: () => api<ConceptDetail>(`/learning/concepts/${conceptId}`, { token }),
    staleTime: PREFETCH_STALE_MS,
  });
}

/** Prefetch the chapter list of one subject (the screen behind a subject card). */
export function prefetchChapters(
  client: QueryClient,
  ids: { boardId: string; grade: string; subjectId: string },
  token: string | null,
) {
  if (!token || !ids.boardId || !ids.grade || !ids.subjectId || !canPrefetch()) return;
  void client.prefetchQuery({
    queryKey: learningKeys.chapters(ids.boardId, ids.grade, ids.subjectId),
    queryFn: () =>
      api<unknown>(
        `/learning/boards/${ids.boardId}/grades/${ids.grade}/subjects/${ids.subjectId}/chapters`,
        { token },
      ),
    staleTime: PREFETCH_STALE_MS,
  });
}

/** Prefetch the subject grid (the screen behind the Library nav item). */
export function prefetchLearningHome(client: QueryClient, token: string | null) {
  if (!token || !canPrefetch()) return;
  void client.prefetchQuery({
    queryKey: learningKeys.home,
    queryFn: () => api<unknown>('/learning/home', { token }),
    staleTime: PREFETCH_STALE_MS,
  });
}

/**
 * Prefetch the browse list exactly as `/app/library` will ask for it (same
 * filter order, same key), so opening Library from the nav paints the list
 * instead of a skeleton.
 */
export function prefetchLibraryBrowse(client: QueryClient, token: string | null) {
  if (!token || !canPrefetch()) return;
  const qs = libraryQueryString({ sort: 'default', page: 1, pageSize: 24 });
  void client.prefetchQuery({
    queryKey: libraryKeys.list(qs),
    queryFn: () => api<unknown>(`/content/browse?${qs}`, { token }),
    staleTime: PREFETCH_STALE_MS,
  });
}

/** Prefetch a single library item (lesson) page. */
export function prefetchLibraryItem(client: QueryClient, itemId: string, token: string | null) {
  if (!token || !itemId || !canPrefetch()) return;
  void client.prefetchQuery({
    queryKey: libraryKeys.item(itemId),
    queryFn: () => api<unknown>(`/content/${itemId}`, { token }),
    staleTime: PREFETCH_STALE_MS,
  });
}

/** Prefetch the assessments tab (the ordered learning path). */
export function prefetchLearningPath(client: QueryClient, token: string | null) {
  if (!token || !canPrefetch()) return;
  void client.prefetchQuery({
    queryKey: ['learning', 'path'],
    queryFn: () => api<unknown>('/learning/path', { token }),
    staleTime: PREFETCH_STALE_MS,
  });
}
