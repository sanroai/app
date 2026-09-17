'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Spinner, ErrorBanner } from '@/components/ui';
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Trophy,
  ArrowLeft,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import type {
  PracticeQuestion,
  PracticeStartResponse,
  PracticeSubmitResponse,
} from '@/lib/learning-hooks';

type AnswerMap = Record<string, string>;

export default function PracticePage() {
  const params = useParams();
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const practiceId = params.practiceId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [practiceData, setPracticeData] = useState<PracticeStartResponse | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [results, setResults] = useState<PracticeSubmitResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [savingQuestion, setSavingQuestion] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
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
  }, [practiceId, token]);

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

  const formatTime = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }, []);

  const handleAnswerChange = useCallback((questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }, []);

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
      const result = await api<PracticeSubmitResponse>(
        `/learning/practice/${practiceId}/submit`,
        { method: 'POST', token },
      );
      setResults(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit practice');
      setSubmitting(false);
    }
  }, [token, practiceId, submitting]);

  const goToConcept = useCallback(() => {
    if (practiceData?.conceptId) {
      router.push(`/app/learn/concepts/${practiceData.conceptId}`);
    } else {
      router.push('/app/learn');
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
          <Link href="/app/learn" className="hover:text-brand-600 transition-colors">
            Learn
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
          <Link href="/app/learn" className="hover:text-brand-600 transition-colors">
            Learn
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
                <p className="text-3xl font-bold text-surface-600">{results.totalQuestions}</p>
                <p className="mt-1 text-xs text-surface-500">Total</p>
              </div>
            </div>

            {results.masteryUpdate && (
              <div className="mt-6 rounded-2xl border border-brand-100 bg-brand-50/50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-surface-700">Mastery Updated</p>
                    <p className="text-xs text-surface-500">
                      Your concept mastery has been updated based on this practice.
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
                    {results.masteryUpdate.level} — {results.masteryUpdate.score}%
                  </Badge>
                </div>
              </div>
            )}

            <div className="mt-8 flex justify-center gap-3">
              <Button variant="outline" onClick={goToConcept}>
                <ArrowLeft className="h-4 w-4" />
                Back to Concept
              </Button>
              <Button onClick={() => window.location.reload()}>
                <RotateCcw className="h-4 w-4" />
                Practice Again
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
        <Link href="/app/learn" className="hover:text-brand-600 transition-colors">
          Learn
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-surface-400">Practice</span>
      </nav>

      <div className="flex items-center justify-between">
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

      <Progress value={progressPercent} className="h-2.5" />

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
                    onClick={() => handleAnswerChange(currentQuestion.id, opt.text)}
                    className={cn(
                      'w-full rounded-xl border-2 p-4 text-left transition-all',
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
                  const selectedList = (() => {
                    try {
                      return JSON.parse(answers[currentQuestion.id] ?? '[]') as string[];
                    } catch {
                      return [];
                    }
                  })();
                  const isSelected = selectedList.includes(opt.text);
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        const current = selectedList.filter((s) => s !== opt.text);
                        if (!isSelected) current.push(opt.text);
                        handleAnswerChange(currentQuestion.id, JSON.stringify(current));
                      }}
                      className={cn(
                        'w-full rounded-xl border-2 p-4 text-left transition-all',
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
              <textarea
                value={answers[currentQuestion.id] ?? ''}
                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                placeholder="Type your answer here..."
                rows={4}
                className="w-full rounded-xl border-2 border-surface-200 bg-white p-4 text-sm text-surface-800 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all resize-none"
              />
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
              onClick={() => setCurrentIndex(i)}
              className={cn(
                'h-2.5 w-2.5 rounded-full transition-all',
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
                <Clock className="h-4 w-4 animate-spin" />
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
