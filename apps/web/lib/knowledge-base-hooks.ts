'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

function useToken() {
  return useAuthStore((s) => s.token);
}

export interface KnowledgeBaseStats {
  totalKnowledgeBases: number;
  totalChunks: number;
  byStatus: Record<string, number>;
  bySourceType: Record<string, number>;
}

export interface KnowledgeBase {
  id: string;
  name: string;
  description?: string | null;
  sourceType: string;
  status: string;
  createdAt: string;
  _count: { chunks: number; jobs: number };
}

export interface KnowledgeChunk {
  id: string;
  content: string;
  chapter?: string | null;
  topic?: string | null;
  concept?: string | null;
  grade?: string | null;
  subject?: string | null;
}

export interface KnowledgeBaseDetail extends KnowledgeBase {
  chunks: KnowledgeChunk[];
}

export interface ProcessingJob {
  id: string;
  type: string;
  status: string;
  createdAt?: string;
}

export interface JobsResponse {
  queue: ProcessingJob[];
  stats: Record<string, number>;
}

export function useKnowledgeBaseStats() {
  const token = useToken();
  return useQuery<KnowledgeBaseStats>({
    queryKey: ['knowledge-base', 'stats'],
    queryFn: () => api<KnowledgeBaseStats>('/knowledge-base/stats', { token }),
    enabled: !!token,
  });
}

export function useKnowledgeBases() {
  const token = useToken();
  return useQuery<KnowledgeBase[]>({
    queryKey: ['knowledge-base', 'list'],
    queryFn: () => api<KnowledgeBase[]>('/knowledge-base', { token }),
    enabled: !!token,
  });
}

export function useKnowledgeBase(id: string) {
  const token = useToken();
  return useQuery<KnowledgeBaseDetail>({
    queryKey: ['knowledge-base', 'detail', id],
    queryFn: () => api<KnowledgeBaseDetail>(`/knowledge-base/${id}`, { token }),
    enabled: !!token && !!id,
  });
}

export function useProcessingJobs() {
  const token = useToken();
  return useQuery<JobsResponse>({
    queryKey: ['knowledge-base', 'jobs'],
    queryFn: () => api<JobsResponse>('/knowledge-base/jobs', { token }),
    enabled: !!token,
  });
}

export function useCreateKnowledgeBase() {
  const queryClient = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: (data: { name: string; description?: string; sourceType: string; sourceUrl?: string }) =>
      api<KnowledgeBase>('/knowledge-base', { method: 'POST', token, body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-base'] });
    },
  });
}

export function useProcessKnowledgeBase() {
  const queryClient = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/knowledge-base/${id}/process`, { method: 'POST', token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-base'] });
    },
  });
}

export function useDeleteKnowledgeBase() {
  const queryClient = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/knowledge-base/${id}`, { method: 'DELETE', token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-base'] });
    },
  });
}
