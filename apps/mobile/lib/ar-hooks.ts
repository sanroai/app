import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiAuthed } from './api';

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

export function useConceptAr(conceptId: string) {
  return useQuery<ArCard[]>({
    queryKey: ['ar', 'concept', conceptId],
    queryFn: () => apiAuthed<ArCard[]>(`/ar/concept/${conceptId}`),
    enabled: !!conceptId,
    retry: 1,
  });
}

export function useArModelUrl(id: string, enabled = true) {
  return useQuery<{ url: string; format: string | null; expiresIn: number | null; source: 'storage' | 'external' }>({
    queryKey: ['ar', 'model-url', id],
    queryFn: () => apiAuthed(`/ar/${id}/model-url`),
    enabled: !!id && enabled,
    staleTime: 20 * 60 * 1000,
    retry: 1,
  });
}

export function useArQuickCheck(id: string, enabled = true) {
  return useQuery<{ arContentId: string; conceptId: string | null; questions: ArQuickCheckQuestion[] }>({
    queryKey: ['ar', 'quick-check', id],
    queryFn: () => apiAuthed(`/ar/${id}/quick-check`),
    enabled: !!id && enabled,
    retry: 1,
  });
}

export function useSubmitArQuickCheck(id: string) {
  return useMutation<
    ArQuickCheckResult,
    unknown,
    Array<{ questionId: string; optionId?: string; answer?: string }>
  >({
    mutationFn: (answers) => apiAuthed(`/ar/${id}/quick-check`, { method: 'POST', body: { answers } }),
  });
}

export function useRecordArActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, type, sessionId, metadata }: { id: string; type: string; sessionId?: string; metadata?: Record<string, unknown> }) =>
      apiAuthed(`/ar/${id}/activity`, { method: 'POST', body: { type, sessionId, metadata } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ar'] }),
  });
}
