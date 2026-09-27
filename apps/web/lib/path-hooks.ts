'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

function useToken() {
  return useAuthStore((s) => s.token);
}

export type PathLevel =
  | 'MASTERED'
  | 'GOOD'
  | 'DEVELOPING'
  | 'WEAK'
  | 'NEEDS_INTERVENTION'
  | 'INSUFFICIENT_EVIDENCE';

export type PathTrackStep = {
  index: number;
  conceptId: string;
  conceptName: string;
  topicId: string;
  topicName: string;
  topicOrder: number;
  chapterId: string;
  chapterName: string;
  chapterOrder: number;
  subjectId: string;
  subjectName: string;
  subjectOrder: number;
  grade: string;
  order: number;
  level: PathLevel;
  score: number | null;
  evidenceCount: number;
  state: 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE';
};

export type PathFocusStep = {
  conceptId: string;
  conceptName: string;
  chapterId: string;
  chapterName: string;
  subjectId: string;
  subjectName: string;
  grade: string;
  level: PathLevel;
  score: number | null;
  evidenceCount: number;
  practiceQuestionCount: number;
  plan: { id: string; status: string; totalSteps: number; completedSteps: number } | null;
  steps: Array<{
    id: string;
    title: string;
    contentType: string;
    contentId: string | null;
    status: 'PENDING' | 'COMPLETED' | 'SKIPPED';
    order: number;
  }>;
};

export type PathRetest = {
  assessmentId: string;
  title: string;
  chapterName: string | null;
  dueAt: string | null;
  started: boolean;
};

export type LearningPath = {
  student: { id: string; name: string; grade: string | null };
  summary: {
    totalConcepts: number;
    done: number;
    inProgress: number;
    notStarted: number;
    masteryPercent: number;
    weakConcepts: number;
    untestedConcepts: number;
    pendingRetests: number;
    byLevel: Record<string, number>;
  };
  next: {
    conceptId: string;
    conceptName: string;
    chapterName: string;
    action: 'FIX' | 'STUDY' | 'RETEST';
    reason: string;
  } | null;
  focus: PathFocusStep[];
  retests: PathRetest[];
  track: PathTrackStep[];
};

export function useLearningPath() {
  const token = useToken();
  return useQuery<LearningPath>({
    queryKey: ['learning', 'path'],
    queryFn: () => api<LearningPath>('/learning/path', { token }),
    enabled: !!token,
  });
}

export function useRequestRetest() {
  const queryClient = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: (data: { studentId?: string; conceptIds: string[] }) =>
      api<{ id: string; title: string }>('/remediation/retest', {
        method: 'POST',
        token,
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning', 'path'] });
      queryClient.invalidateQueries({ queryKey: ['assessments', 'my'] });
    },
  });
}
