'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

function useToken() {
  return useAuthStore((s) => s.token);
}

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
}

export interface LearningHome {
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
  flashcardRatings?: Record<string, string>;
}

export interface LearningProgress {
  totalContent: number;
  completedContent: number;
  totalConcepts: number;
  masteredConcepts: number;
  averageMastery: number;
  recentActivity: Array<{ id: string; title: string; type: string; completedAt: string }>;
}

export function useLearningHome() {
  const token = useToken();
  return useQuery<LearningHome>({
    queryKey: ['learning', 'home'],
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
    queryKey: ['learning', 'chapters', boardId, grade, subjectId],
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
    queryKey: ['learning', 'chapter', chapterId],
    queryFn: () => api<any>(`/learning/chapters/${chapterId}`, { token }),
    enabled: !!token && !!chapterId,
  });
}

export function useConceptDetail(conceptId: string) {
  const token = useToken();
  return useQuery<ConceptDetail>({
    queryKey: ['learning', 'concept', conceptId],
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

export function useRateFlashcard() {
  const queryClient = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: (data: { questionId: string; rating: string }) =>
      api(`/learning/flashcards/${data.questionId}/rate`, {
        method: 'POST',
        token,
        body: { rating: data.rating },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning', 'concept'] });
    },
  });
}

export function useLearningProgress() {
  const token = useToken();
  return useQuery<LearningProgress>({
    queryKey: ['learning', 'progress'],
    queryFn: () => api<LearningProgress>('/learning/progress', { token }),
    enabled: !!token,
  });
}

export function useGamificationProfile() {
  const token = useToken();
  return useQuery({
    queryKey: ['gamification', 'profile'],
    queryFn: () => api<any>('/learning/gamification/profile', { token }),
    enabled: !!token,
  });
}

export function useLeaderboard(period: string) {
  const token = useToken();
  return useQuery({
    queryKey: ['gamification', 'leaderboard', period],
    queryFn: () => api<any>(`/learning/gamification/leaderboard?period=${period}`, { token }),
    enabled: !!token,
  });
}

export function useAchievements() {
  const token = useToken();
  return useQuery({
    queryKey: ['gamification', 'achievements'],
    queryFn: () => api<any>('/learning/gamification/achievements', { token }),
    enabled: !!token,
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
