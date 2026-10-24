'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

function useToken() {
  return useAuthStore((s) => s.token);
}

export interface LibraryItem {
  id: string;
  type: string;
  title: string;
  description?: string | null;
  durationSeconds?: number | null;
  thumbnailUrl?: string | null;
  url?: string | null;
  videoId?: string | null;
  order: number;
  status: string;
  language?: string;
  subjectId: string | null;
  chapterId: string | null;
  topicId: string | null;
  conceptId: string | null;
  concept: { id: string; name: string } | null;
  chapter: { id: string; name: string } | null;
  subject?: { id: string; name: string } | null;
}

export interface LibraryChapterFacet {
  chapterId: string;
  name: string;
  grade: string | null;
  order: number;
  subjectId: string | null;
  count: number;
}

export interface LibraryResponse {
  items: LibraryItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  facets: {
    byType: Record<string, number>;
    byChapter: LibraryChapterFacet[];
  };
}

export interface LibraryFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: string;
  subjectId?: string;
  chapterId?: string;
  conceptId?: string;
  grade?: string;
  sort?: string;
}

export function libraryQueryString(filters: LibraryFilters = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  }
  return params.toString();
}

/** The browse screen's first paint, so it can be prefetched by key. */
export const libraryKeys = {
  list: (qs: string) => ['library', qs] as const,
  item: (id: string) => ['library', 'item', id] as const,
};

export function useLibrary(filters: LibraryFilters = {}) {
  const token = useToken();
  const qs = libraryQueryString(filters);
  return useQuery<LibraryResponse>({
    queryKey: libraryKeys.list(qs),
    queryFn: () => api<LibraryResponse>(`/content/browse${qs ? `?${qs}` : ''}`, { token }),
    enabled: !!token,
    placeholderData: (prev) => prev,
  });
}

export interface LibraryItemDetail extends LibraryItem {
  subject?: { id: string; name: string } | null;
  progress?: Array<{ state: string; secondsWatched: number | null; completedAt: string | null }>;
}

export function useLibraryItem(id: string | null) {
  const token = useToken();
  return useQuery<LibraryItemDetail>({
    queryKey: libraryKeys.item(id ?? ''),
    queryFn: () => api<LibraryItemDetail>(`/content/${id}`, { token }),
    enabled: !!id && !!token,
  });
}
