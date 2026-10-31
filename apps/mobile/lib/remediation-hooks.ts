import { useMutation, useQuery } from '@tanstack/react-query';
import { apiAuthed } from './api';
import { useAuthStore } from './auth-store';

/**
 * Student Remediation data.
 *
 * The payload shapes below were verified against the running API (2026-10-22)
 * with the demo student account:
 *
 *   GET /diagnosis/my      -> { studentId, averageScore, concepts: MasteryRow[] }
 *   GET /remediation/my    -> RemediationPlan[] (each with items[] and a progress %)
 *   GET /remediation/weak  -> WeakConceptRow[]
 *   GET /remediation/plans -> 403 for a student (staff only - never call it here)
 *
 * `POST /remediation/items/:id/status` is staff only as well, so a student can
 * READ a plan but cannot tick a step off. The mobile plan therefore navigates
 * to the work instead of trying to mutate the plan (the web dashboard still
 * offers that button, and it always fails with a 403 for a student).
 */

export interface DiagnosisConceptRef {
  id: string;
  name: string;
  topicId?: string | null;
  description?: string | null;
  topic?: {
    id: string;
    name: string;
    chapter?: { id: string; name: string; code?: string | null; grade?: string | null } | null;
  } | null;
}

/** One row of `GET /diagnosis/my` - a concept plus the student's mastery on it. */
export interface MasteryRow {
  id: string;
  studentId: string;
  conceptId: string;
  score: number;
  attempts: number;
  correct: number;
  evidenceCount: number;
  level: string;
  lastUpdatedAt: string;
  concept?: DiagnosisConceptRef | null;
}

export interface DiagnosisMyResponse {
  studentId: string;
  averageScore: number;
  concepts: MasteryRow[];
}

/** One step of a remediation plan. */
export interface RemediationItem {
  id: string;
  planId: string;
  order: number;
  contentType: string;
  contentId: string | null;
  title: string;
  status: string;
  completedAt: string | null;
}

/** One plan of `GET /remediation/my`. */
export interface RemediationPlan {
  id: string;
  studentId: string;
  conceptId: string;
  status: string;
  createdAt: string;
  completedAt: string | null;
  concept?: { id: string; name: string; topicId?: string | null } | null;
  items: RemediationItem[];
  _count?: { items: number };
  progress: number;
  completedItems: number;
}

/** One row of `GET /remediation/weak` - the latest diagnostic result per concept. */
export interface WeakConceptRow {
  id: string;
  name: string;
  topicId?: string | null;
  score: number;
  level: string;
  weak: boolean;
}

export interface PracticeStartResult {
  practiceId: string;
  questions: Array<{
    id: string;
    text: string;
    type: string;
    marks: number;
    options: Array<{ id: string; text: string; order: number }>;
  }>;
}

/**
 * The student's concept mastery.
 *
 * The query key is `['diagnosis','my','mastery']` and NOT `['diagnosis','my']`:
 * `lib/hooks.ts` already owns that key for `useMyDiagnosis`, which types the
 * payload as `{ weakConcepts }` - a shape the API never returns. Sharing the
 * key would hand two different payload types to the same cache entry.
 */
export function useDiagnosisMy() {
  return useQuery<DiagnosisMyResponse>({
    queryKey: ['diagnosis', 'my', 'mastery'],
    queryFn: () => apiAuthed<DiagnosisMyResponse>('/diagnosis/my'),
  });
}

/** The student's remediation plans, with their steps. */
export function useRemediationMy() {
  return useQuery<RemediationPlan[]>({
    queryKey: ['remediation', 'my'],
    queryFn: () => apiAuthed<RemediationPlan[]>('/remediation/my'),
  });
}

/**
 * Weak concepts straight from the latest diagnostic result.
 *
 * Complements `/diagnosis/my`: a concept can be flagged weak here before a
 * mastery row exists for it.
 */
export function useRemediationWeak() {
  return useQuery<WeakConceptRow[]>({
    queryKey: ['remediation', 'weak'],
    queryFn: () => apiAuthed<WeakConceptRow[]>('/remediation/weak'),
  });
}

/**
 * Staff only (teacher / institution admin): every plan of the institution.
 *
 * A student gets a 403 from this endpoint, so the student screen deliberately
 * does not call it - it is exported for the staff screens.
 */
export function useRemediationPlans(studentId?: string) {
  const token = useAuthStore((s) => s.token);
  return useQuery<RemediationPlan[]>({
    queryKey: ['remediation', 'plans', studentId ?? 'all'],
    queryFn: () =>
      apiAuthed<RemediationPlan[]>(
        `/remediation/plans${studentId ? `?studentId=${studentId}` : ''}`,
      ),
    enabled: !!token,
  });
}

/** Starts a graded practice session for one concept. */
export function useRemediationPracticeStart() {
  return useMutation({
    mutationFn: (data: { conceptId: string; questionCount?: number }) =>
      apiAuthed<PracticeStartResult>('/learning/practice/start', {
        method: 'POST',
        body: data,
      }),
  });
}
