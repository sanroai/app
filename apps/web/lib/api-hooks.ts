'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api';
import type { Role } from '@sanro/types';

export type Board = { id: string; name: string; code: string };
export type Subject = { id: string; name: string; code: string };
export type Group = { id: string; name: string; grade: string };

export type AttemptSummary = {
  id: string;
  assessmentId: string;
  attemptIndex: number;
  status: string;
  score: number | null;
  maxScore: number | null;
  startedAt: string | null;
  submittedAt: string | null;
};

export type AssignmentRow = {
  id: string;
  assessmentId: string;
  assignedAt: string;
  status?: string;
  dueAt?: string | null;
  questionCount: number;
  assessment: {
    id: string;
    title: string;
    status: string;
    totalMarks: number;
    durationMinutes: number;
    subject: { name: string } | null;
  };
  attempts: AttemptSummary[];
};

export type MyAssessments = { studentId: string; assignments: AssignmentRow[] };

export type AttemptDetail = {
  attempt: {
    id: string;
    status: string;
    score: number | null;
    maxScore: number | null;
    correctCount: number | null;
    wrongCount: number | null;
    skippedCount: number | null;
    accuracy: number | null;
    timeSpentSeconds: number | null;
    startedAt: string | null;
    submittedAt: string | null;
  };
  assessment: { title: string; subject: string; totalMarks: number };
  questions: Array<{
    id: string;
    text: string;
    type: string;
    marks: number;
    order: number;
    options: Array<{ text: string; order?: number }>;
    yourAnswer: string | null;
    correctAnswer: string | null;
    isCorrect: boolean | null;
    marksAwarded: number | null;
  }>;
};

export type QuestionRow = {
  id: string;
  text: string;
  type: string;
  marks: number;
  status: string;
  difficulty: string;
};

function useToken() {
  return useAuthStore((s) => s.token);
}

function useAuthedQuery<T>(key: unknown[], path: string, enabled: boolean = true) {
  const token = useToken();
  return useQuery<T>({
    queryKey: key,
    queryFn: () => api<T>(path, { token }),
    enabled: enabled && !!token,
  });
}

export function useBoards() {
  return useAuthedQuery<Board[]>(['boards'], '/curriculum/boards');
}

export function useGrades(boardId?: string) {
  return useAuthedQuery<string[]>(['grades', boardId], `/curriculum/grades?boardId=${boardId}`, !!boardId);
}

export function useSubjects(boardId?: string, grade?: string) {
  const q = new URLSearchParams();
  if (boardId) q.set('boardId', boardId);
  if (grade) q.set('grade', grade);
  return useAuthedQuery<Subject[]>(['subjects', boardId, grade], `/curriculum/subjects?${q.toString()}`, !!boardId);
}

export function useQuestions(subjectId?: string) {
  const q = new URLSearchParams({ status: 'APPROVED' });
  if (subjectId) q.set('subjectId', subjectId);
  return useAuthedQuery<QuestionRow[]>(['questions', subjectId], `/questions?${q.toString()}`, !!subjectId);
}

export function usePapers() {
  return useAuthedQuery<any[]>(['papers'], '/papers');
}

export function usePaper(id?: string) {
  const token = useToken();
  return useQuery<any>({
    queryKey: ['paper', id],
    queryFn: async () => {
      const res = await api<{ paper: any }>(`/papers/${id}`, { token });
      return res.paper;
    },
    enabled: !!id && !!token && id !== 'undefined',
  });
}

export function useMyAssessments() {
  return useAuthedQuery<MyAssessments>(['assessments', 'my'], '/assessments/my');
}

export function useAssessments(role: Role | null | undefined, institutionId?: string) {
  const isStaff = role === 'TEACHER' || role === 'INSTITUTION_ADMIN' || role === 'SUPER_ADMIN';
  const q = institutionId ? `?institutionId=${institutionId}` : '';
  return useAuthedQuery<any[]>(['assessments', institutionId ?? 'all'], `/assessments${q}`, !!isStaff);
}

export function useAssessment(id?: string) {
  return useAuthedQuery<any>(['assessment', id], `/assessments/${id}`, !!id);
}

export function useAttempt(id?: string) {
  return useAuthedQuery<AttemptDetail>(['attempt', id], `/assessments/attempts/${id}`, !!id);
}

export function useGroups() {
  return useAuthedQuery<Group[]>(['groups'], '/academics/groups');
}

export function useRemediationMy() {
  return useAuthedQuery<any>(['remediation', 'my'], '/remediation/my');
}

export function useDiagnosisMy() {
  return useAuthedQuery<any>(['diagnosis', 'my'], '/diagnosis/my');
}