import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiAuthed } from './api';
import { useAuthStore } from './auth-store';
import type { AuthUser } from './auth-store';
import type {
  ChapterConcept,
  ChapterHub,
  ChapterPractice,
  ChapterProgress,
  ChapterVideo,
  VideoSegment,
} from './chapter-hub';

export type {
  ChapterConcept,
  ChapterHub,
  ChapterPractice,
  ChapterProgress,
  ChapterVideo,
  VideoSegment,
};

export function useIsLoggedIn() {
  return useAuthStore((s) => !!s.token && !!s.user);
}

export function useCurrentUser() {
  return useAuthStore((s) => s.user);
}

export function useUserDisplayRole() {
  const user = useAuthStore((s) => s.user);
  if (!user) return '';
  const map: Record<string, string> = {
    SUPER_ADMIN: 'Admin',
    INSTITUTION_ADMIN: 'Principal',
    TEACHER: 'Teacher',
    STUDENT: 'Student',
    PARENT: 'Parent',
  };
  return map[user.role] ?? user.role;
}

// ─── Learning Home ───────────────────────────────────────
export interface Board {
  id: string;
  name: string;
  code: string;
  grades: GradeSummary[];
}
export interface GradeSummary {
  id: string;
  grade: string;
  subjects: SubjectSummary[];
}
export interface SubjectSummary {
  id: string;
  name: string;
  code: string;
  completedContent: number;
  totalContent: number;
  averageMastery: number;
}
export interface LearningHome {
  boards: Board[];
}

export function useLearningHome({ enabled = true }: { enabled?: boolean } = {}) {
  const token = useAuthStore((s) => s.token);
  return useQuery<LearningHome>({
    queryKey: ['learning', 'home'],
    queryFn: () => apiAuthed<LearningHome>('/learning/home'),
    enabled: !!token && enabled,
  });
}

// ─── Chapters ────────────────────────────────────────────
export interface ChapterItem {
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
export interface ChaptersResponse {
  subject: { id: string; name: string; code: string };
  grade: string;
  chapters: ChapterItem[];
}

export function useChapters(boardId: string, grade: string, subjectId: string) {
  return useQuery<ChaptersResponse>({
    queryKey: ['learning', 'chapters', boardId, grade, subjectId],
    queryFn: () =>
      apiAuthed<ChaptersResponse>(
        `/learning/boards/${boardId}/grades/${grade}/subjects/${subjectId}/chapters`,
      ),
    enabled: !!boardId && !!grade && !!subjectId,
  });
}

// ─── Chapter Detail ──────────────────────────────────────
/**
 * The chapter hub: one textbook chapter with its notes, concepts, videos
 * (split into chapter markers) and progress.
 */
export function useChapterHub(chapterId: string) {
  return useQuery<ChapterHub>({
    queryKey: ['learning', 'chapter', chapterId],
    queryFn: () => apiAuthed<ChapterHub>(`/learning/chapters/${chapterId}`),
    enabled: !!chapterId,
  });
}

/** Kept for callers that used the old name - the endpoint returns the hub payload. */
export function useChapterDetail(chapterId: string) {
  return useChapterHub(chapterId);
}

// ─── Concept Detail ──────────────────────────────────────
export interface ContentItem {
  id: string;
  title: string;
  type: string;
  description?: string;
  url?: string;
  videoId?: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  /** Chapter markers for a video lesson (start offsets into the video). */
  segments?: VideoSegment[] | null;
}
export interface ChapterContentItem {
  id: string;
  type: string;
  title: string;
  description?: string;
  url?: string;
  videoId?: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  order: number;
}
export interface ConceptDetail {
  id: string;
  name: string;
  description?: string;
  topic: { id: string; name: string };
  chapter: { id: string; name: string; grade: string };
  mastery: { level: string; score: number; attempts: number } | null;
  content: ContentItem[];
  practiceQuestions: Array<{ id: string; text: string; type: string; marks: number; difficulty?: string; options: Array<{ id: string; text: string; order: number }> }>;
}

export function useConceptDetail(conceptId: string) {
  return useQuery<ConceptDetail>({
    queryKey: ['learning', 'concept', conceptId],
    queryFn: () => apiAuthed<ConceptDetail>(`/learning/concepts/${conceptId}`),
    enabled: !!conceptId,
  });
}

// ─── Complete Content ────────────────────────────────────
export function useCompleteContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (contentId: string) =>
      apiAuthed(`/learning/content/${contentId}/complete`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['learning'] }),
  });
}

// ─── Practice ────────────────────────────────────────────
export interface PracticeQuestion {
  id: string;
  text: string;
  type: string;
  marks: number;
  options: Array<{ id: string; text: string; order: number }>;
}
export interface PracticeStartResponse {
  practiceId: string;
  questions: PracticeQuestion[];
}
export interface PracticeSubmitResponse {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  masteryUpdate: { level: string; score: number } | null;
}

export function useStartPractice() {
  return useMutation({
    // A practice set covers either ONE concept or ONE whole chapter.
    mutationFn: (data: { conceptId?: string; chapterId?: string; questionCount?: number }) =>
      apiAuthed<PracticeStartResponse>('/learning/practice/start', {
        method: 'POST',
        body: data,
      }),
  });
}

export function useSavePracticeAnswer() {
  return useMutation({
    mutationFn: (data: { practiceId: string; questionId: string; answer: string }) =>
      apiAuthed<{ correct: boolean | null; correctAnswer?: string }>(
        `/learning/practice/${data.practiceId}/answer`,
        { method: 'POST', body: { questionId: data.questionId, answer: data.answer } },
      ),
  });
}

export function useSubmitPractice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (practiceId: string) =>
      apiAuthed<PracticeSubmitResponse>(`/learning/practice/${practiceId}/submit`, {
        method: 'POST',
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['learning'] }),
  });
}

// ─── Gamification ────────────────────────────────────────
export interface GamificationProfile {
  xp: number;
  level: number;
  xpInLevel: number;
  xpForLevel: number;
  rank: number;
  streakDays: number;
  achievementCount: number;
  recentAchievements: Achievement[];
}

export function useGamificationProfile({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery<GamificationProfile>({
    queryKey: ['gamification', 'profile'],
    queryFn: () => apiAuthed<GamificationProfile>('/learning/gamification/profile'),
    enabled,
  });
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

export interface AchievementsResponse {
  earned: Achievement[];
  locked: Achievement[];
}

export function useAchievements({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery<AchievementsResponse>({
    queryKey: ['gamification', 'achievements'],
    queryFn: () => apiAuthed<AchievementsResponse>('/learning/gamification/achievements'),
    enabled,
  });
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  xp: number;
  rank: number;
}

export interface LeaderboardResponse {
  entries?: LeaderboardEntry[];
  leaderboard?: LeaderboardEntry[];
  rows?: LeaderboardEntry[];
  groups?: Array<{ id: string; name: string; grade?: string | null }>;
}

export function useLeaderboard(period: string, groupId?: string | null) {
  return useQuery<LeaderboardResponse>({
    queryKey: ['gamification', 'leaderboard', period, groupId ?? 'school'],
    queryFn: () =>
      apiAuthed<LeaderboardResponse>(
        `/learning/gamification/leaderboard?period=${period}${groupId ? `&groupId=${groupId}` : ''}`,
      ),
    enabled: !!period,
  });
}

// ─── Progress ────────────────────────────────────────────
export interface LearningProgress {
  student: { id: string; name: string; grade: string | null };
  contentProgress: { totalContent: number; completedContent: number; percentComplete: number };
  mastery: { averageScore: number; totalConcepts: number; byLevel: Record<string, number> };
  recentActivity: Array<{ id: string; title: string; type: string; completedAt: string }>;
}

export function useLearningProgress({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery<LearningProgress>({
    queryKey: ['learning', 'progress'],
    queryFn: () => apiAuthed<LearningProgress>('/learning/progress'),
    enabled,
  });
}

// ─── Learning Path ────────────────────────────────────────
export interface PathTrackStep {
  conceptId: string;
  conceptName: string;
  topicName: string;
  chapterId: string;
  chapterName: string;
  chapterOrder: number;
  subjectId: string;
  subjectName: string;
  subjectOrder: number;
  order: number;
  level: string;
  score: number | null;
  state: 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE';
}

export interface PathFocusStep {
  conceptId: string;
  conceptName: string;
  chapterId: string;
  chapterName: string;
  subjectName: string;
  level: string;
  score: number | null;
  practiceQuestionCount: number;
  plan: { id: string; status: string; totalSteps: number; completedSteps: number } | null;
  steps: Array<{ id: string; title: string; status: string; order: number }>;
}

export interface PathRetest {
  assessmentId: string;
  title: string;
  chapterName: string | null;
  dueAt: string | null;
  started: boolean;
}

export interface LearningPathResponse {
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
}

export function useLearningPath() {
  return useQuery<LearningPathResponse>({
    queryKey: ['learning', 'path'],
    queryFn: () => apiAuthed<LearningPathResponse>('/learning/path'),
  });
}

export function useRequestRetest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (conceptIds: string[]) =>
      apiAuthed<{ id: string; title: string }>('/remediation/retest', {
        method: 'POST',
        body: { conceptIds },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['learning', 'path'] });
      qc.invalidateQueries({ queryKey: ['assessments', 'my'] });
    },
  });
}

// ─── Assessments ─────────────────────────────────────────
export interface AttemptSummary {
  id: string;
  assessmentId: string;
  attemptIndex: number;
  status: string;
  score: number | null;
  maxScore: number | null;
  startedAt: string | null;
  submittedAt: string | null;
}

export interface AssignmentRow {
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
}

export interface MyAssessments {
  studentId: string;
  assignments: AssignmentRow[];
}

export function useMyAssessments({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery<MyAssessments>({
    queryKey: ['assessments', 'my'],
    queryFn: () => apiAuthed<MyAssessments>('/assessments/my'),
    enabled,
  });
}

export interface AttemptDetail {
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
}

export function useAttemptDetail(attemptId: string) {
  return useQuery<AttemptDetail>({
    queryKey: ['assessments', 'attempt', attemptId],
    queryFn: () => apiAuthed<AttemptDetail>(`/assessments/attempts/${attemptId}`),
    enabled: !!attemptId,
  });
}

// ─── Start / Submit Attempt ──────────────────────────────
export function useStartAttempt() {
  return useMutation({
    mutationFn: (assessmentId: string) =>
      apiAuthed<{ attemptId: string }>(`/assessments/${assessmentId}/start`, {
        method: 'POST',
      }),
  });
}

export function useSubmitAttempt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (attemptId: string) =>
      apiAuthed(`/assessments/attempts/${attemptId}/submit`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assessments'] }),
  });
}

export function useSaveAnswers() {
  return useMutation({
    mutationFn: (data: { attemptId: string; answers: Array<{ snapshotQuestionId: string; answer: string }> }) =>
      apiAuthed(`/assessments/attempts/${data.attemptId}/answers`, {
        method: 'POST',
        body: { answers: data.answers },
      }),
  });
}

export function useAskAI() {
  return useMutation({
    mutationFn: (data: { message: string; context?: { conceptId?: string; questionId?: string; assessmentId?: string } }) =>
      apiAuthed<{ answer?: string; explanation?: string; reply?: string }>('/ai/chat', {
        method: 'POST',
        body: data,
      }),
  });
}

export function useAiExplain() {
  return useMutation({
    mutationFn: (data: { conceptId?: string; chapterId?: string }) =>
      apiAuthed<{ explanation: string }>('/ai/explain', { method: 'POST', body: data }),
  });
}

// ─── Diagnosis ───────────────────────────────────────────
export interface WeakConcept {
  conceptId: string;
  conceptName: string;
  chapterName: string;
  subjectName: string;
  masteryLevel: string;
  masteryScore: number;
  attemptCount: number;
}

/** The real shape of `GET /diagnosis/my`. */
export interface DiagnosisMasteryRow {
  id: string;
  conceptId: string;
  score: number;
  attempts: number;
  correct: number;
  level: string;
  concept: {
    id: string;
    name: string;
    topic?: { name: string; chapter?: { id: string; name: string; grade?: string } } | null;
  } | null;
}

export interface MyDiagnosisResponse {
  studentId: string;
  averageScore: number;
  concepts: DiagnosisMasteryRow[];
}

const WEAK_LEVELS = new Set(['WEAK', 'NEEDS_INTERVENTION']);

export function useMyDiagnosis({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery<{ weakConcepts: WeakConcept[]; averageScore: number }>({
    queryKey: ['diagnosis', 'my'],
    queryFn: async () => {
      const data = await apiAuthed<MyDiagnosisResponse>('/diagnosis/my');
      const rows = data?.concepts ?? [];
      const weakConcepts = rows
        .filter((row) => WEAK_LEVELS.has(row.level))
        .sort((a, b) => a.score - b.score)
        .map((row) => ({
          conceptId: row.conceptId,
          conceptName: row.concept?.name ?? 'Concept',
          chapterName: row.concept?.topic?.chapter?.name ?? '',
          subjectName: '',
          masteryLevel: row.level,
          masteryScore: row.score,
          attemptCount: row.attempts,
        }));
      return { weakConcepts, averageScore: data?.averageScore ?? 0 };
    },
    enabled,
  });
}

// ─── Boards / Curriculum ─────────────────────────────────
export interface BoardInfo {
  id: string;
  name: string;
  code: string;
}
export interface GradeInfo {
  id: string;
  name: string;
}
export interface SubjectInfo {
  id: string;
  name: string;
  code: string;
}

export function useBoards() {
  return useQuery<BoardInfo[]>({
    queryKey: ['curriculum', 'boards'],
    queryFn: () => apiAuthed<BoardInfo[]>('/curriculum/boards'),
  });
}

export function useGrades(boardId: string) {
  return useQuery<GradeInfo[]>({
    queryKey: ['curriculum', 'grades', boardId],
    queryFn: () => apiAuthed<GradeInfo[]>(`/curriculum/boards/${boardId}/grades`),
    enabled: !!boardId,
  });
}

export function useSubjects(boardId: string, grade: string) {
  return useQuery<SubjectInfo[]>({
    queryKey: ['curriculum', 'subjects', boardId, grade],
    queryFn: () => apiAuthed<SubjectInfo[]>(`/curriculum/boards/${boardId}/grades/${grade}/subjects`),
    enabled: !!boardId && !!grade,
  });
}

// ─── Teacher / Admin: Groups ──────────────────────────────
export interface GroupInfo {
  id: string;
  name: string;
  grade?: string;
  studentCount: number;
  institutionId: string;
}

export function useGroups() {
  return useQuery<GroupInfo[]>({
    queryKey: ['groups'],
    queryFn: () => apiAuthed<GroupInfo[]>('/academics/groups'),
  });
}

// ─── Teacher / Admin: Assessments ────────────────────────
export interface AssessmentSummary {
  id: string;
  title: string;
  type: string;
  status: string;
  dueAt?: string;
  paperTitle?: string;
  groupNames?: string[];
  assignedCount?: number;
}

export function useAssessmentsList() {
  return useQuery<AssessmentSummary[]>({
    queryKey: ['assessments', 'list'],
    queryFn: () => apiAuthed<AssessmentSummary[]>('/assessments'),
  });
}

// ─── Teacher / Admin: Students ───────────────────────────
export interface StudentSummary {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  grade?: string;
  status: string;
  groupName?: string;
  xp?: number;
  mastery?: number;
}

export function useStudentsList(params?: { search?: string; status?: string; page?: number }) {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.status) query.set('status', params.status);
  if (params?.page) query.set('page', String(params.page));
  const qs = query.toString();
  return useQuery<{ students: StudentSummary[]; total: number }>({
    queryKey: ['students', params],
    queryFn: () => apiAuthed(`/students${qs ? `?${qs}` : ''}`),
  });
}

// ─── Parent: Children ────────────────────────────────────
export interface ChildInfo {
  id: string;
  name: string;
  grade?: string;
  institutionName?: string;
  xp?: number;
  streak?: number;
  mastery?: number;
}

export function useChildren() {
  return useQuery<ChildInfo[]>({
    queryKey: ['children'],
    queryFn: () => apiAuthed<ChildInfo[]>('/parents/me/dashboard'),
  });
}
