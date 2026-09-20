'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

function useToken() {
  return useAuthStore((s) => s.token);
}

export interface IngestListItem {
  id: string;
  name: string;
  description: string | null;
  sourceType: string;
  sourceUrl: string | null;
  storageKey: string | null;
  ownerType: string;
  institutionId: string | null;
  creatorId: string | null;
  status: string;
  stage: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  _count: { chunks: number; jobs: number };
}

export interface IngestJob {
  id: string;
  knowledgeBaseId: string;
  status: string;
  stage: string | null;
  inputType: string;
  outputType: string | null;
  error: string | null;
  errorCode: string | null;
  metadata: Record<string, unknown> | null;
  attempts: number;
  maxAttempts: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface IngestDetail {
  id: string;
  name: string;
  sourceType: string;
  status: string;
  stage: string;
  chunks: number;
  jobs: IngestJob[];
}

export interface IngestCreateResult {
  id: string;
  name: string;
  status: string;
  stage: string;
}

export interface IngestCreateJson {
  sourceType: 'YOUTUBE';
  sourceUrl: string;
  title: string;
  description?: string;
  grade?: string;
  boardId?: string;
  subjectId?: string;
  chapterId?: string;
  topicId?: string;
  conceptId?: string;
  directSanroAvailable: boolean;
  autoApprove: boolean;
}

export interface CurriculumNode {
  id: string;
  name: string;
}

const TERMINAL_DETAIL_STAGES = ['REVIEW', 'COMPLETED', 'FAILED', 'PARTIAL'];

export function useContentIngests(status?: string) {
  const token = useToken();
  return useQuery<IngestListItem[]>({
    queryKey: ['content-ingest', status ?? 'ALL'],
    queryFn: () => api<IngestListItem[]>(`/content/ingest${status ? `?status=${status}` : ''}`, { token }),
    enabled: !!token,
    refetchInterval: (query) => {
      const rows = query.state.data ?? [];
      return rows.some((r) => r.status === 'PROCESSING') ? 5000 : false;
    },
  });
}

export function useContentIngest(id: string | null) {
  const token = useToken();
  return useQuery<IngestDetail>({
    queryKey: ['content-ingest', 'detail', id ?? ''],
    queryFn: () => api<IngestDetail>(`/content/ingest/${id}`, { token }),
    enabled: !!id && !!token,
    refetchInterval: (query) => {
      const detail = query.state.data;
      if (!detail) return false;
      return detail.status === 'PROCESSING' && !TERMINAL_DETAIL_STAGES.includes(detail.stage) ? 5000 : false;
    },
  });
}

export function useCreateContentIngest() {
  const queryClient = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: (payload: IngestCreateJson | FormData) =>
      api<IngestCreateResult>('/content/ingest', { method: 'POST', body: payload, token }),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['content-ingest'] });
      if (data?.id) void queryClient.invalidateQueries({ queryKey: ['content-ingest', 'detail', data.id] });
    },
  });
}

export function useApproveContentIngest(id: string) {
  const queryClient = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: () =>
      api<{ stage: string; contentItemId?: string }>(`/content/ingest/${id}/approve`, {
        method: 'POST',
        token,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['content-ingest'] });
    },
  });
}

export function useRejectContentIngest(id: string) {
  const queryClient = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: (reason: string) =>
      api<{ stage: string; rejectionReason: string }>(`/content/ingest/${id}/reject`, {
        method: 'POST',
        body: { reason },
        token,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['content-ingest'] });
    },
  });
}

export function useChapters(subjectId?: string) {
  const token = useToken();
  return useQuery<CurriculumNode[]>({
    queryKey: ['curriculum', 'chapters', subjectId ?? ''],
    queryFn: () => api<CurriculumNode[]>(`/curriculum/chapters?subjectId=${subjectId}`, { token }),
    enabled: !!subjectId && !!token,
  });
}

export function useTopics(chapterId?: string) {
  const token = useToken();
  return useQuery<CurriculumNode[]>({
    queryKey: ['curriculum', 'topics', chapterId ?? ''],
    queryFn: () => api<CurriculumNode[]>(`/curriculum/topics?chapterId=${chapterId}`, { token }),
    enabled: !!chapterId && !!token,
  });
}

export function useConcepts(topicId?: string) {
  const token = useToken();
  return useQuery<CurriculumNode[]>({
    queryKey: ['curriculum', 'concepts', topicId ?? ''],
    queryFn: () => api<CurriculumNode[]>(`/curriculum/concepts?topicId=${topicId}`, { token }),
    enabled: !!topicId && !!token,
  });
}