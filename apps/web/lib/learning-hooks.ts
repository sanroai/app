'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

function useToken() {
  return useAuthStore((s) => s.token);
}

/**
 * Query keys live in one object so a route that *prefetches* a screen and the
 * screen that *reads* it can never drift apart. Prefetching is what makes the
 * library drill-down feel instant (see `lib/prefetch.ts`).
 */
export const learningKeys = {
  all: ['learning'] as const,
  home: ['learning', 'home'] as const,
  chapters: (boardId: string, grade: string, subjectId: string) =>
    ['learning', 'chapters', boardId, grade, subjectId] as const,
  chapter: (chapterId: string) => ['learning', 'chapter', chapterId] as const,
  concept: (conceptId: string) => ['learning', 'concept', conceptId] as const,
  progress: ['learning', 'progress'] as const,
};

export interface Board {
  id: string;
  name: string;
  code: string;
}

export interface Grade {
  id: string;
  grade: string;
  boardId: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  gradeId: string;
}

export interface Chapter {
  id: string;
  name: string;
  code: string;
  subjectId: string;
  description?: string;
}

export interface Topic {
  id: string;
  name: string;
  chapterId: string;
}

export interface Concept {
  id: string;
  name: string;
  topicId: string;
}

export interface ContentItem {
  id: string;
  title: string;
  type: string;
  description?: string;
  url?: string;
  videoId?: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  /** This student's own progress row for the item, when one exists. */
  progress?: { state: string; secondsWatched?: number | null; completedAt?: string | null } | null;
}

export interface LearningHome {
  /** Classes the server is showing (union of the student's enrolments). */
  studentGrades?: string[];
  /** True for the demo account that opens every class. */
  allGrades?: boolean;
  boards: Array<{
    id: string;
    name: string;
    code: string;
    grades: Array<{
      id: string;
      grade: string;
      subjects: Array<{
        id: string;
        name: string;
        code: string;
        completedContent: number;
        totalContent: number;
        averageMastery: number;
      }>;
    }>;
  }>;
}

export interface ChapterListItem {
  id: string;
  name: string;
  code: string;
  order: number;
  description?: string;
  topicCount: number;
  conceptCount: number;
  totalContent: number;
  completedContent: number;
  percentComplete: number;
  averageMastery: number;
  /** The first video lesson's poster - a real frame from this chapter. */
  thumbnailUrl?: string | null;
}

export interface ConceptDetail {
  id: string;
  name: string;
  description?: string;
  topic: { id: string; name: string };
  chapter: { id: string; name: string; grade: string };
  mastery: { level: string; score: number; attempts: number } | null;
  content: ContentItem[];
  practiceQuestions: Array<{
    id: string;
    text: string;
    type: string;
    marks: number;
    answer?: string;
    explanation?: string;
    options?: Array<{ id: string; text: string; order: number; isCorrect?: boolean }>;
  }>;
}

/**
 * GET /learning/progress - the shape the API actually returns (nested, not flat).
 * The mobile client renders the same three numbers: content completed, concepts
 * mastered and average mastery.
 */
export interface LearningProgress {
  student: { id: string; name: string; grade: string | null };
  contentProgress: { totalContent: number; completedContent: number; percentComplete: number };
  mastery: { averageScore: number; totalConcepts: number; byLevel: Record<string, number> };
  recentActivity: Array<{ contentId: string; title: string; type: string; completedAt: string }>;
}

export interface AchievementItem {
  id: string;
  name: string;
  description?: string;
  icon: string;
  key?: string;
  unlockedAt?: string | null;
}

export interface AchievementsResponse {
  earned: AchievementItem[];
  locked: AchievementItem[];
}

export interface GamificationProfile {
  xp: number;
  level: number;
  xpInLevel: number;
  xpForLevel: number;
  rank: number;
  streakDays: number;
  achievementCount: number;
  recentAchievements: AchievementItem[];
}

export function useLearningHome() {
  const token = useToken();
  return useQuery<LearningHome>({
    queryKey: learningKeys.home,
    queryFn: () => api<LearningHome>('/learning/home', { token }),
    enabled: !!token,
  });
}

interface ChaptersResponse {
  subject: { id: string; name: string; code: string };
  grade: string;
  chapters: ChapterListItem[];
}

export function useChapters(boardId: string, grade: string, subjectId: string) {
  const token = useToken();
  return useQuery<ChaptersResponse>({
    queryKey: learningKeys.chapters(boardId, grade, subjectId),
    queryFn: () =>
      api<ChaptersResponse>(
        `/learning/boards/${boardId}/grades/${grade}/subjects/${subjectId}/chapters`,
        { token },
      ),
    enabled: !!token && !!boardId && !!grade && !!subjectId,
  });
}

export function useChapterDetail(chapterId: string) {
  const token = useToken();
  return useQuery<any>({
    queryKey: learningKeys.chapter(chapterId),
    queryFn: () => api<any>(`/learning/chapters/${chapterId}`, { token }),
    enabled: !!token && !!chapterId,
  });
}

export function useConceptDetail(conceptId: string) {
  const token = useToken();
  return useQuery<ConceptDetail>({
    queryKey: learningKeys.concept(conceptId),
    queryFn: () => api<ConceptDetail>(`/learning/concepts/${conceptId}`, { token }),
    enabled: !!token && !!conceptId,
  });
}

export function useCompleteContent() {
  const queryClient = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: (contentId: string) =>
      api(`/learning/content/${contentId}/complete`, { method: 'POST', token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning'] });
    },
  });
}

export function useUncompleteContent() {
  const queryClient = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: (contentId: string) =>
      api(`/learning/content/${contentId}/complete`, { method: 'DELETE', token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning'] });
    },
  });
}

export function useLearningProgress(options?: { enabled?: boolean }) {
  const token = useToken();
  return useQuery<LearningProgress>({
    queryKey: learningKeys.progress,
    queryFn: () => api<LearningProgress>('/learning/progress', { token }),
    enabled: !!token && (options?.enabled ?? true),
  });
}

export function useGamificationProfile(options?: { enabled?: boolean }) {
  const token = useToken();
  return useQuery<GamificationProfile>({
    queryKey: ['gamification', 'profile'],
    queryFn: () => api<GamificationProfile>('/learning/gamification/profile', { token }),
    enabled: !!token && (options?.enabled ?? true),
  });
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  xp: number;
  totalXp: number;
  level: number;
  streakDays: number;
  rank: number;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  myRank: number;
  period: string;
  groupId: string | null;
  groups: Array<{ id: string; name: string; grade?: string | null }>;
}

export function useLeaderboard(period: string, groupId?: string | null) {
  const token = useToken();
  return useQuery<LeaderboardResponse>({
    queryKey: ['gamification', 'leaderboard', period, groupId ?? 'school'],
    queryFn: () =>
      api<LeaderboardResponse>(
        `/learning/gamification/leaderboard?period=${period}${groupId ? `&groupId=${groupId}` : ''}`,
        { token },
      ),
    enabled: !!token,
  });
}

export function useAchievements({ enabled = true }: { enabled?: boolean } = {}) {
  const token = useToken();
  return useQuery<AchievementsResponse>({
    queryKey: ['gamification', 'achievements'],
    queryFn: () => api<AchievementsResponse>('/learning/gamification/achievements', { token }),
    enabled: !!token && enabled,
  });
}

export interface PracticeQuestion {
  id: string;
  text: string;
  type: string;
  marks: number;
  options: Array<{ id: string; text: string; order: number }>;
}

export interface PracticeStartResponse {
  practiceId: string;
  conceptId?: string | null;
  questions: PracticeQuestion[];
}

export interface PracticeAnswerResponse {
  correct: boolean | null;
  correctAnswer?: string;
}

export interface PracticeSubmitResponse {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  masteryUpdate: { level: string; score: number } | null;
}

export function useStartPractice() {
  const queryClient = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: (data: { conceptId: string; questionCount?: number }) =>
      api<PracticeStartResponse>('/learning/practice/start', { method: 'POST', token, body: data }),
  });
}

export function useSavePracticeAnswer() {
  const token = useToken();
  return useMutation({
    mutationFn: (data: { practiceId: string; questionId: string; answer: string }) =>
      api<PracticeAnswerResponse>(`/learning/practice/${data.practiceId}/answer`, {
        method: 'POST',
        token,
        body: { questionId: data.questionId, answer: data.answer },
      }),
  });
}

export function useSubmitPractice() {
  const queryClient = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: (practiceId: string) =>
      api<PracticeSubmitResponse>(`/learning/practice/${practiceId}/submit`, { method: 'POST', token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning'] });
    },
  });
}
