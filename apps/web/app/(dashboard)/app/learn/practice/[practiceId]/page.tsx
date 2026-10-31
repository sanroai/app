'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ErrorBanner } from '@/components/ui';
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Clock,
  Trophy,
  ArrowLeft,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import type {
  PracticeStartResponse,
  PracticeSubmitResponse,
} from '@/lib/learning-hooks';
import { useSavePracticeAnswer, useStartPractice } from '@/lib/learning-hooks';
import { isAutoGradedType, parseMultiSelectAnswer } from '@/lib/answer-format';

type AnswerMap = Record<string, string>;

/**
 * The submit response plus the optional counters a newer API may add. The web
 * falls back to what it can derive from the questions it already holds.
 */
type PracticeSubmitResult = PracticeSubmitResponse & {
  gradedCount?: number;
  gradedQuestions?: number;
  xpEarned?: number;
};

export default function PracticePage() {
  const params = useParams();
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const practiceId = params.practiceId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [practiceData, setPracticeData] = useState<PracticeStartResponse | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [results, setResults] = useState<PracticeSubmitResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const savePracticeAnswer = useSavePracticeAnswer();
  const startPractice = useStartPractice();
  // Every answer save that is still in flight. The API grades the answers it has
  // stored, so the submit has to wait for these - otherwise the last answer is
  // scored as if it had never been given.
  const pendingSaves = useRef<Promise<unknown>[]>([]);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token) {
      setLoading(false);
      setError('Please sign in to practise.');
      return;
    }
    const loadPractice = async () => {
      try {
        const data = await api<PracticeStartResponse & { status: string }>(
          `/learning/practice/${practiceId}`,
          { token },
        );
        if (data.status === 'COMPLETED') {
          setError('This practice session has already been submitted.');
        } else {
          setPracticeData(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load practice session');
      } finally {
        setLoading(false);
      }
    };
    loadPractice();
  }, [practiceId, token, hasHydrated]);

  useEffect(() => {
    if (!practiceData || results) return;
    const interval = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [practiceData, results]);

  const currentQuestion = practiceData?.questions[currentIndex];
  const totalQuestions = practiceData?.questions.length ?? 0;
  const answeredCount = Object.keys(answers).length;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  /**
   * The number of questions the API grades automatically. The rest are written
   * answers: they are not auto-graded, so they are excluded from the score and
   * reviewed by a teacher.
   */
  const autoGradedCount = useMemo(
    () => (practiceData?.questions ?? []).filter((q) => isAutoGradedType(q.type)).length,
    [practiceData],
  );

  // The API may report how many questions it graded; otherwise the web derives
  // it from the question types it already holds.
  const gradedCount = results?.gradedCount ?? results?.gradedQuestions ?? autoGradedCount;
  const writtenCount = Math.max(0, totalQuestions - autoGradedCount);

  const formatTime = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }, []);

  const handleAnswerChange = useCallback(
    (questionId: string, value: string) => {
      setAnswers((prev) => ({ ...prev, [questionId]: value }));
      setSaveError(null);
      // The server grades the answers it has stored, so every answer has to be
      // persisted - otherwise the submit scores an empty answer set. The save
      // promise is tracked so the submit can wait for it.
      const pending = savePracticeAnswer.mutateAsync({ practiceId, questionId, answer: value });
      pendingSaves.current.push(pending);
      pending
        .catch((err: unknown) => {
          setSaveError(
            err instanceof Error
              ? `We could not save your answer: ${err.message}. Your result may not include it.`
              : 'We could not save your answer. Your result may not include it.',
          );
        })
        .finally(() => {
          pendingSaves.current = pendingSaves.current.filter((p) => p !== pending);
        });
    },
    [savePracticeAnswer, practiceId],
  );

  const handleNext = useCallback(() => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, totalQuestions]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  }, [currentIndex]);

  const handleSubmit = useCallback(async () => {
    if (!token || submitting) return;
    setSubmitting(true);
    try {
      // Every answer has to be stored before the submit: the API scores the
      // answers it has, so a save that is still in flight would be scored wrong.
      for (let attempt = 0; attempt < 5 && pendingSaves.current.length > 0; attempt += 1) {
        await Promise.allSettled(pendingSaves.current);
      }
      const result = await api<PracticeSubmitResult>(
        `/learning/practice/${practiceId}/submit`,
        { method: 'POST', token },
      );
      setResults(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit practice');
      setSubmitting(false);
    }
  }, [token, practiceId, submitting]);

  /**
   * "Practice Again" starts a NEW practice session: the finished set cannot be
   * reopened (the API refuses to score a completed set), so re-pushing the same
   * id was a dead end.
   */
  const handlePracticeAgain = useCallback(async () => {
    if (!token || restarting) return;
    setRestarting(true);
    try {
      const conceptId = practiceData?.conceptId ?? null;
      if (conceptId) {
        const data = await startPractice.mutateAsync({
          conceptId,
          questionCount: Math.max(1, totalQuestions),
        });
        router.push(`/app/learn/practice/${data.practiceId}`);
        return;
      }
      // A chapter practice has no single concept: resolve the chapter from its
      // first question and restart the chapter set.
      const firstQuestionId = practiceData?.questions[0]?.id;
      if (firstQuestionId) {
        const detail = await api<{ chapterId?: string | null }>(`/questions/${firstQuestionId}`, {
          token,
        });
        if (detail.chapterId) {
          const data = await api<PracticeStartResponse>('/learning/practice/start', {
            method: 'POST',
            token,
            body: { chapterId: detail.chapterId },
          });
          router.push(`/app/learn/practice/${data.practiceId}`);
          return;
        }
      }
      router.push('/app/library');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start a new practice session');
      setRestarting(false);
    }
  }, [token, restarting, practiceData, totalQuestions, startPractice, router]);

  const goToConcept = useCallback(() => {
    if (practiceData?.conceptId) {
      router.push(`/app/learn/concepts/${practiceData.conceptId}`);
    } else {
      router.push('/app/library');
    }
  }, [practiceData, router]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-surface-100" />
        <div className="h-64 animate-pulse rounded-2xl bg-surface-50" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <nav className="flex items-center gap-2 text-sm text-surface-500">
          <Link href="/app/library" className="hover:text-brand-600 transition-colors">
            Library
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-surface-400">Practice</span>
        </nav>
        <ErrorBanner message={error} />
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  if (results) {
    return (
      <div className="space-y-6">
        <nav className="flex items-center gap-2 text-sm text-surface-500">
          <Link href="/app/library" className="hover:text-brand-600 transition-colors">
            Library
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-surface-400">Practice Results</span>
        </nav>

        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col items-center text-center">
              <div
                className={cn(
                  'flex h-20 w-20 items-center justify-center rounded-full mb-4',
                  results.score >= 80
                    ? 'bg-green-100'
                    : results.score >= 50
                    ? 'bg-amber-100'
                    : 'bg-red-100',
                )}
              >
                <Trophy
                  className={cn(
                    'h-10 w-10',
                    results.score >= 80
                      ? 'text-green-600'
                      : results.score >= 50
                      ? 'text-amber-600'
                      : 'text-red-600',
                  )}
                />
              </div>
              <h1 className="text-2xl font-bold text-surface-900">Practice Complete!</h1>
              <p className="mt-2 text-surface-500">
                Here's how you did on this practice set.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className="rounded-2xl bg-surface-50 p-4 text-center">
                <p
                  className={cn(
                    'text-3xl font-bold',
                    results.score >= 80
                      ? 'text-green-600'
                      : results.score >= 50
                      ? 'text-amber-600'
                      : 'text-red-600',
                  )}
                >
                  {results.score}%
                </p>
                <p className="mt-1 text-xs text-surface-500">Score</p>
              </div>
              <div className="rounded-2xl bg-surface-50 p-4 text-center">
                <p className="text-3xl font-bold text-green-600">{results.correctAnswers}</p>
                <p className="mt-1 text-xs text-surface-500">Correct</p>
              </div>
              <div className="rounded-2xl bg-surface-50 p-4 text-center">
                <p className="text-3xl font-bold text-surface-600">{gradedCount}</p>
                <p className="mt-1 text-xs text-surface-500">Graded</p>
              </div>
            </div>

            <p className="mt-3 text-center text-xs text-surface-500">
              {gradedCount} of {totalQuestions} question{totalQuestions === 1 ? '' : 's'} were auto-graded.
              {writtenCount > 0
                ? ` ${writtenCount} written answer${writtenCount === 1 ? ' is' : 's are'} not auto-graded - your teacher reviews them.`
                : ''}
            </p>

            {results.masteryUpdate && (
              <div className="mt-6 rounded-2xl border border-brand-100 bg-brand-50/50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-surface-700">Mastery Updated</p>
                    <p className="text-xs text-surface-500">
                      Your overall concept mastery after this practice.
                    </p>
                  </div>
                  <Badge
                    className={cn(
                      results.masteryUpdate.score >= 80
                        ? 'bg-green-100 text-green-700'
                        : results.masteryUpdate.score >= 50
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-700',
                    )}
                  >
                    {results.masteryUpdate.level} — {results.masteryUpdate.score}% overall
                  </Badge>
                </div>
              </div>
            )}

            <div className="mt-8 flex justify-center gap-3">
              <Button variant="outline" onClick={goToConcept}>
                <ArrowLeft className="h-4 w-4" />
                Back to Concept
              </Button>
              <Button onClick={handlePracticeAgain} disabled={restarting}>
                {restarting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Starting...
                  </span>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4" />
                    Practice Again
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!practiceData || !currentQuestion) {
    return (
      <div className="space-y-6">
        <ErrorBanner message="No practice questions available." />
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-2 text-sm text-surface-500">
        <Link href="/app/library" className="hover:text-brand-600 transition-colors">
          Library
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-surface-400">Practice</span>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Practice Mode</h1>
          <p className="mt-1 text-sm text-surface-500">
            Question {currentIndex + 1} of {totalQuestions}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-surface-500">
          <Clock className="h-4 w-4" />
          <span className="font-mono">{formatTime(elapsedSeconds)}</span>
        </div>
      </div>

      <Progress value={progressPercent} className="h-2" />

      {saveError ? <ErrorBanner message={saveError} /> : null}

      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <Badge variant="secondary">
              Q{currentIndex + 1}
            </Badge>
            <Badge variant="outline">
              {currentQuestion.marks} mark{currentQuestion.marks !== 1 ? 's' : ''}
            </Badge>
            <Badge variant="purple">{currentQuestion.type}</Badge>
          </div>

          <p className="text-lg font-medium text-surface-900">{currentQuestion.text}</p>

          <div className="mt-6 space-y-3">
            {currentQuestion.type === 'MCQ' || currentQuestion.type === 'TRUE_FALSE' ? (
              currentQuestion.options.map((opt) => {
                const isSelected = answers[currentQuestion.id] === opt.text;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={submitting}
                    onClick={() => handleAnswerChange(currentQuestion.id, opt.text)}
                    className={cn(
                      'w-full rounded-xl border-2 p-4 text-left transition-all disabled:cursor-not-allowed disabled:opacity-70',
                      isSelected
                        ? 'border-brand-500 bg-brand-50 shadow-sm'
                        : 'border-surface-200 bg-white hover:border-surface-300 hover:bg-surface-50',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2',
                          isSelected
                            ? 'border-brand-500 bg-brand-500'
                            : 'border-surface-300',
                        )}
                      >
                        {isSelected && <CheckCircle2 className="h-4 w-4 text-white" />}
                      </div>
                      <span className="text-sm font-medium text-surface-800">{opt.text}</span>
                    </div>
                  </button>
                );
              })
            ) : currentQuestion.type === 'MULTI_SELECT' ? (
              <div className="space-y-2">
                <p className="text-xs text-surface-500">Select all that apply</p>
                {currentQuestion.options.map((opt) => {
                  const selectedList = parseMultiSelectAnswer(answers[currentQuestion.id]);
                  const isSelected = selectedList.includes(opt.text);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={submitting}
                      onClick={() => {
                        const current = selectedList.filter((s) => s !== opt.text);
                        if (!isSelected) current.push(opt.text);
                        handleAnswerChange(currentQuestion.id, JSON.stringify(current));
                      }}
                      className={cn(
                        'w-full rounded-xl border-2 p-4 text-left transition-all disabled:cursor-not-allowed disabled:opacity-70',
                        isSelected
                          ? 'border-brand-500 bg-brand-50 shadow-sm'
                          : 'border-surface-200 bg-white hover:border-surface-300 hover:bg-surface-50',
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'flex h-5 w-5 shrink-0 items-center justify-center rounded border-2',
                            isSelected
                              ? 'border-brand-500 bg-brand-500'
                              : 'border-surface-300',
                          )}
                        >
                          {isSelected && <CheckCircle2 className="h-3 w-3 text-white" />}
                        </div>
                        <span className="text-sm font-medium text-surface-800">{opt.text}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                <textarea
                  value={answers[currentQuestion.id] ?? ''}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  placeholder="Type your answer here..."
                  rows={4}
                  disabled={submitting}
                  className="w-full rounded-xl border-2 border-surface-200 bg-white p-4 text-sm text-surface-800 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all resize-y"
                />
                {isAutoGradedType(currentQuestion.type) ? (
                  <p className="text-xs text-surface-500">
                    This answer is checked automatically.
                  </p>
                ) : (
                  <p className="text-xs text-surface-500">
                    Written answers are not auto-graded - your teacher reviews them.
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <div className="flex items-center gap-1.5">
          {practiceData.questions.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to question ${i + 1}`}
              onClick={() => setCurrentIndex(i)}
              className={cn(
                'h-2 w-2 rounded-full transition-all',
                i === currentIndex
                  ? 'bg-brand-600 w-6'
                  : answers[practiceData.questions[i].id]
                  ? 'bg-brand-300'
                  : 'bg-surface-200',
              )}
            />
          ))}
        </div>

        {currentIndex === totalQuestions - 1 ? (
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-xl"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </span>
            ) : (
              'Submit Practice'
            )}
          </Button>
        ) : (
          <Button onClick={handleNext}>
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {answeredCount < totalQuestions && (
        <p className="text-center text-xs text-surface-400">
          {totalQuestions - answeredCount} question{totalQuestions - answeredCount !== 1 ? 's' : ''} unanswered
        </p>
      )}
    </div>
  );
}
