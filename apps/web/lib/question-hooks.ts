'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

function useToken() {
  return useAuthStore((s) => s.token);
}

export interface QuestionOption {
  id: string;
  text: string;
  order: number;
  isCorrect?: boolean;
}

export interface Question {
  id: string;
  text: string;
  type: string;
  difficulty: string;
  marks: number | null;
  status: string;
  answer: string;
  explanation?: string | null;
  hint?: string | null;
  source: string;
  options: QuestionOption[];
  chapter?: { id?: string; name: string };
  subject?: { id?: string; name: string };
  concept?: { id?: string; name: string };
  createdAt: string;
}

export interface QuestionListResponse {
  data: Question[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
}

export interface QuestionListParams {
  boardId?: string;
  grade?: string;
  subjectId?: string;
  chapterId?: string;
  conceptId?: string;
  type?: string;
  difficulty?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export function useQuestionList(params: QuestionListParams) {
  const token = useToken();
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '' && v !== null) searchParams.set(k, String(v));
  });
  const qs = searchParams.toString();
  return useQuery<QuestionListResponse>({
    queryKey: ['questions', 'list', params],
    queryFn: () => api<QuestionListResponse>(`/questions${qs ? `?${qs}` : ''}`, { token }),
    enabled: !!token,
  });
}

export function useQuestionDetail(id: string | null) {
  const token = useToken();
  return useQuery<Question>({
    queryKey: ['questions', 'detail', id],
    queryFn: () => api<Question>(`/questions/${id}`, { token }),
    enabled: !!token && !!id,
  });
}

export function useCreateQuestion() {
  const queryClient = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api('/questions', { method: 'POST', token, body: data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['questions'] }),
  });
}

export function useDeleteQuestion() {
  const queryClient = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: (id: string) => api(`/questions/${id}`, { method: 'DELETE', token }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['questions'] }),
  });
}

export function useReviewQuestion() {
  const queryClient = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'APPROVE' | 'REJECT' | 'ARCHIVE' }) =>
      api(`/questions/${id}/review`, { method: 'POST', token, body: { action } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['questions'] }),
  });
}
