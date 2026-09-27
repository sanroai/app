'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

function useToken() {
  return useAuthStore((s) => s.token);
}

export interface ChapterVideo {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  videoId: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  order: number;
  status: string;
  grade: string | null;
  topicId: string | null;
  conceptId: string | null;
  concept: { id: string; name: string } | null;
  createdAt: string;
}

export interface VideoInput {
  url: string;
  title: string;
  description?: string;
  durationSeconds?: number;
  order?: number;
}

export interface CreateVideosPayload {
  chapterId: string;
  topicId?: string;
  conceptId?: string;
  videos: VideoInput[];
}

export interface CreateVideosResult {
  created: ChapterVideo[];
  duplicates: Array<{ videoId: string; url: string }>;
}

export function useChapterVideos(chapterId?: string) {
  const token = useToken();
  return useQuery<ChapterVideo[]>({
    queryKey: ['chapter-videos', chapterId ?? ''],
    queryFn: () => api<ChapterVideo[]>(`/content/videos?chapterId=${chapterId}`, { token }),
    enabled: !!chapterId && !!token,
  });
}

export function useCreateChapterVideos(chapterId?: string) {
  const queryClient = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: (payload: CreateVideosPayload) =>
      api<CreateVideosResult>('/content/videos', { method: 'POST', body: payload, token }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['chapter-videos', chapterId ?? ''] });
      void queryClient.invalidateQueries({ queryKey: ['chapter-videos'] });
      void queryClient.invalidateQueries({ queryKey: ['learning'] });
      void queryClient.invalidateQueries({ queryKey: ['content'] });
    },
  });
}

export function useRemoveChapterVideo(chapterId?: string) {
  const queryClient = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: (id: string) => api<{ ok: boolean }>(`/content/videos/${id}`, { method: 'DELETE', token }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['chapter-videos', chapterId ?? ''] });
      void queryClient.invalidateQueries({ queryKey: ['chapter-videos'] });
      void queryClient.invalidateQueries({ queryKey: ['learning'] });
      void queryClient.invalidateQueries({ queryKey: ['content'] });
    },
  });
}
