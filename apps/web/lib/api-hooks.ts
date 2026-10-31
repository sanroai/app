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
  student?: { id: string; name: string; rollNumber: string | null } | null;
  weakConcepts?: Array<{ id: string; name: string }>;
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
    maxMarks?: number;
    gradedByTeacher?: boolean;
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

export type SubscriptionSummary = {
  plan: {
    key: string;
    name: string;
    priceMonthly: number | null;
    priceYearly: number | null;
    perSeat: number;
  } | null;
  status: string | null;
  scope: 'USER' | 'INSTITUTION' | null;
  startedAt: string | null;
  endsAt: string | null;
  daysRemaining: number | null;
  seatLimit: number | null;
  institution: { id: string; name: string } | null;
  access: boolean;
  blockState: string | null;
  message: string | null;
};

export type AssessmentPaper = {
  id: string;
  title: string;
  subject: { id: string; name: string; code: string } | null;
  chapter: { id: string; name: string; grade: string } | null;
  totalMarks: number;
  durationMinutes: number;
  status: string;
  mode: string;
  startsAt: string | null;
  dueAt: string | null;
  attemptsAllowed: number;
  attemptsUsed: number;
  attemptsLeft: number;
  isOpen: boolean;
  questionCount: number;
  questions: Array<{
    id: string;
    text: string;
    type: string;
    marks: number;
    order: number;
    options: Array<{ text: string; order: number }>;
  }>;
};

/** The question paper a student is about to attempt (no answers). */
export function useAssessmentPaper(id?: string) {
  return useAuthedQuery<AssessmentPaper>(['assessment-paper', id], `/assessments/${id}/paper`, !!id);
}

export type AssessmentAttemptRow = {
  id: string;
  attemptIndex: number;
  status: string;
  score: number | null;
  maxScore: number | null;
  submittedAt: string | null;
  student?: { id: string; name: string; rollNumber: string | null } | null;
};

/** Staff: the attempts submitted for one assessment. */
export function useAssessmentAttempts(id?: string) {
  return useAuthedQuery<AssessmentAttemptRow[]>(['assessment-attempts', id], `/assessments/${id}/attempts`, !!id);
}

/** One attempt with its answers (staff may read any attempt in the institution). */
export function useAttemptDetail(attemptId?: string) {
  return useAuthedQuery<AttemptDetail>(['attempt', attemptId], `/assessments/attempts/${attemptId}`, !!attemptId);
}

export type ExamLibraryItem = {
  key: string;
  title: string;
  blueprint: string;
  blueprintLabel: string;
  grade: string;
  subject: { id: string; name: string; code: string };
  questionCount: number;
  totalMarks: number;
  durationMinutes: number;
};

/** Ready-made term / class-test papers generated from the question bank. */
export function useExamLibrary() {
  return useAuthedQuery<{ exams: ExamLibraryItem[] }>(['exam-library'], '/learning/exams');
}

/** The plan that governs this account (own plan, else the institution's). */
export function useSubscription() {
  return useAuthedQuery<SubscriptionSummary>(['subscription'], '/auth/subscription');
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

export function useRemediationMy(enabled = true) {
  return useAuthedQuery<any>(['remediation', 'my'], '/remediation/my', enabled);
}

export function useDiagnosisMy(enabled = true) {
  return useAuthedQuery<any>(['diagnosis', 'my'], '/diagnosis/my', enabled);
}

export function useRemediationPlans(enabled = true) {
  return useAuthedQuery<any>(['remediation', 'plans'], '/remediation/plans', enabled);
}