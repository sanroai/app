'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

function useToken() {
  return useAuthStore((s) => s.token);
}

export interface ArHotspot {
  id: string;
  label: string;
  position: [number, number, number];
  description: string;
}

export interface ArCard {
  id: string;
  title: string;
  description: string | null;
  learningObjective: string | null;
  instructions: string | null;
  difficulty: string;
  modelFormat: string | null;
  hasModel: boolean;
  previewUrl: string | null;
  hotspots: ArHotspot[] | null;
  validationStatus: string;
  source: string | null;
  license: string | null;
  attribution: string | null;
  version: number;
  conceptId: string | null;
  chapterId: string | null;
  subjectId: string | null;
  grade: string | null;
  publishedAt: string | null;
}

export interface ArAdminRecord extends ArCard {
  status: string;
  visibility: string;
  fileSizeBytes: number | null;
  polygonCount: number | null;
  validationReport: { checks?: Array<{ name: string; passed: boolean; detail?: string }>; warnings?: string[]; errors?: string[] } | null;
  institutionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ArQuickCheckQuestion {
  id: string;
  text: string;
  type: string;
  difficulty: string;
  marks: number | null;
  options: Array<{ id: string; text: string; order: number }>;
}

export interface ArQuickCheckResult {
  arContentId: string;
  score: number;
  total: number;
  results: Array<{ questionId: string; correct: boolean; correctAnswer: string | null; explanation: string | null }>;
}

export function useConceptAr(conceptId: string | undefined) {
  const token = useToken();
  return useQuery({
    queryKey: ['ar', 'concept', conceptId],
    queryFn: () => api<ArCard[]>(`/ar/concept/${conceptId}`, { token }),
    enabled: Boolean(conceptId && token),
    retry: 1,
  });
}

export function useArModelUrl(id: string | undefined, enabled = true) {
  const token = useToken();
  return useQuery({
    queryKey: ['ar', 'model-url', id],
    queryFn: () => api<{ url: string; format: string | null; expiresIn: number | null; source: 'storage' | 'external' }>(`/ar/${id}/model-url`, { token }),
    enabled: Boolean(id && token && enabled),
    staleTime: 20 * 60 * 1000,
    retry: 1,
  });
}

export function useArQuickCheck(id: string | undefined, enabled = true) {
  const token = useToken();
  return useQuery({
    queryKey: ['ar', 'quick-check', id],
    queryFn: () => api<{ arContentId: string; conceptId: string | null; questions: ArQuickCheckQuestion[] }>(`/ar/${id}/quick-check`, { token }),
    enabled: Boolean(id && token && enabled),
    retry: 1,
  });
}

export function useSubmitArQuickCheck(id: string) {
  const token = useToken();
  return useMutation({
    mutationFn: (answers: Array<{ questionId: string; optionId?: string; answer?: string }>) =>
      api<ArQuickCheckResult>(`/ar/${id}/quick-check`, { method: 'POST', body: { answers }, token }),
  });
}

export function useRecordArActivity() {
  const token = useToken();
  return useMutation({
    mutationFn: ({ id, type, sessionId, metadata }: { id: string; type: string; sessionId?: string; metadata?: Record<string, unknown> }) =>
      api<{ ok: boolean }>(`/ar/${id}/activity`, { method: 'POST', body: { type, sessionId, metadata }, token }),
  });
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export function useAdminArList(filters: { status?: string; search?: string; conceptId?: string } = {}) {
  const token = useToken();
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.search) params.set('search', filters.search);
  if (filters.conceptId) params.set('conceptId', filters.conceptId);
  const qs = params.toString();
  return useQuery({
    queryKey: ['ar', 'admin', filters],
    queryFn: () => api<ArAdminRecord[]>(`/ar/admin/list${qs ? `?${qs}` : ''}`, { token }),
    enabled: Boolean(token),
  });
}

export function useAdminArDetail(id: string | undefined) {
  const token = useToken();
  return useQuery({
    queryKey: ['ar', 'admin', 'detail', id],
    queryFn: () =>
      api<ArAdminRecord & { versions: Array<{ id: string; version: number; createdAt: string; snapshot: unknown }>; activity: Record<string, number> }>(
        `/ar/admin/${id}`,
        { token },
      ),
    enabled: Boolean(id && token),
  });
}

export function useCreateAr() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api<ArAdminRecord>('/ar/admin', { method: 'POST', body, token }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ar'] }),
  });
}

export function useUpdateAr(id: string) {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api<ArAdminRecord>(`/ar/admin/${id}`, { method: 'PATCH', body, token }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ar'] }),
  });
}

export function useUploadArModel(id: string) {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return api<ArAdminRecord>(`/ar/admin/${id}/model`, { method: 'POST', body: form, token });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ar'] }),
  });
}

export function useUploadArPreview(id: string) {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return api<ArAdminRecord>(`/ar/admin/${id}/preview`, { method: 'POST', body: form, token });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ar'] }),
  });
}

export function useTransitionAr(id: string) {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: string) => api<ArAdminRecord>(`/ar/admin/${id}/transition`, { method: 'POST', body: { status }, token }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ar'] }),
  });
}

export function useDeleteAr() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<{ ok: boolean; deleted: string }>(`/ar/admin/${id}`, { method: 'DELETE', token }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ar'] }),
  });
}

export function useArUsage() {
  const token = useToken();
  return useQuery({
    queryKey: ['ar', 'usage'],
    queryFn: () =>
      api<{
        total: number;
        byStatus: Record<string, number>;
        byDifficulty: Record<string, number>;
        activityByType: Record<string, number>;
        topConcepts: Array<{ conceptId: string | null; conceptName: string; count: number }>;
      }>('/ar/admin/usage', { token }),
    enabled: Boolean(token),
  });
}
