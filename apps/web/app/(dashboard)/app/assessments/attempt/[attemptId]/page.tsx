'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAttempt } from '@/lib/api-hooks';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api';
import { Badge, Button, Card, ErrorBanner, Spinner } from '@/components/ui';
import { formatScore } from '@/lib/format';
import {
  formatJoinedAnswer,
  formatMultiSelectAnswer,
  isAutoGradedType,
  parseJoinedAnswer,
  parseMultiSelectAnswer,
  toggleMultiSelectAnswer,
} from '@/lib/answer-format';
import { ArrowLeft, Check, Save, Send, Target, X } from 'lucide-react';
import { cn } from '@/lib/cn';

export default function AttemptPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const router = useRouter();
  const { data, isLoading, error } = useAttempt(attemptId);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const queryClient = useQueryClient();

  if (isLoading) return <Spinner label="Loading attempt…" />;
  if (error) return <ErrorBanner message={(error as Error).message} />;
  if (!data) return null;
  const attemptData = data;
  const submitted = attemptData.attempt.status.includes('SUBMITTED') || attemptData.attempt.status === 'AUTO_SUBMITTED';

  const initial = Object.fromEntries(attemptData.questions.map((q) => [q.id, q.yourAnswer ?? '']));
  if (Object.keys(answers).length === 0 && Object.keys(initial).length > 0) {
    setAnswers(initial);
  }

  /**
   * Stores the answers on the server. The attempt is graded from the answers the
   * server holds, so this has to run before the submit as well - a student who
   * never pressed "Save answers" would otherwise be graded on an empty attempt.
   */
  async function persistAnswers() {
    const payload = attemptData.questions
      .map((q) => ({ snapshotQuestionId: q.id, answer: answers[q.id] ?? '' }))
      .filter((a) => {
        if (a.answer.trim().length === 0) return false;
        const question = attemptData.questions.find((q) => q.id === a.snapshotQuestionId);
        // an empty multi-select is not an answer
        if (question?.type === 'MULTI_SELECT') return parseMultiSelectAnswer(a.answer).length > 0;
        return true;
      });
    await api(`/assessments/attempts/${attemptId}/answers`, {
      method: 'POST',
      token: useAuthStore.getState().token,
      body: { answers: payload },
    });
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      await persistAnswers();
      setMsg('Answers saved.');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function submit() {
    setSubmitting(true);
    setMsg(null);
    try {
      await persistAnswers();
      await api(`/assessments/attempts/${attemptId}/submit`, {
        method: 'POST',
        token: useAuthStore.getState().token,
      });
      await queryClient.invalidateQueries({ queryKey: ['attempt', attemptId] });
      await queryClient.invalidateQueries({ queryKey: ['assessments', 'my'] });
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Submit failed');
    } finally {
      setSubmitting(false);
      setConfirmSubmit(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <button onClick={() => router.push('/app/assessments')} className="mb-3 inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-800">
          <ArrowLeft className="h-4 w-4" />
          Back to Assessments
        </button>
        <h1 className="text-2xl font-bold text-surface-900">{data.assessment.title}</h1>
        <p className="mt-1 text-sm text-surface-500">
          {data.assessment.subject} · {data.assessment.totalMarks} marks
        </p>
        <div className="mt-3">{submitted ? <Badge>Submitted</Badge> : <Badge className="bg-amber-50 text-amber-700">In progress</Badge>}</div>
      </div>

      {msg ? <ErrorBanner message={msg} /> : null}

      {submitted ? <ResultBanner data={data} /> : null}

      <div className="space-y-4 mb-24">
        {data.questions.map((q, idx) => {
          const isMultiSelect = q.type === 'MULTI_SELECT';
          const isSingleChoice = q.type === 'MCQ' || q.type === 'TRUE_FALSE';
          const isChoice = isSingleChoice || isMultiSelect;
          const selectedOptions = isMultiSelect ? parseMultiSelectAnswer(answers[q.id]) : [];
          const correctOptions = isMultiSelect ? parseJoinedAnswer(q.correctAnswer) : [];
          const isAnswered = isMultiSelect
            ? selectedOptions.length > 0
            : !!(answers[q.id] && answers[q.id].length > 0);
          const yourAnswerText = isMultiSelect
            ? formatMultiSelectAnswer(q.yourAnswer)
            : (q.yourAnswer ?? '');
          const correctAnswerText = isMultiSelect
            ? formatJoinedAnswer(q.correctAnswer)
            : (q.correctAnswer ?? '');
          return (
          <Card key={q.id} className={cn('border-l-4', isAnswered ? 'border-l-green-500' : 'border-l-slate-300')}>
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium text-surface-900">
                <span className="mr-2 text-surface-400">{idx + 1}.</span>
                {q.text}
              </p>
              <Badge className="shrink-0 bg-surface-100 text-surface-600">{q.marks} mark{q.marks > 1 ? 's' : ''}</Badge>
            </div>

            {isMultiSelect ? (
              <div className="mt-3 grid gap-2">
                <p className="text-xs text-surface-500">Select all that apply</p>
                {(q.options ?? []).map((opt, oi) => {
                  const selected = selectedOptions.includes(opt.text);
                  const isAnswer = submitted && correctOptions.includes(opt.text);
                  const wrongPick = submitted && selected && !isAnswer;
                  return (
                    <button
                      key={oi}
                      type="button"
                      disabled={submitted}
                      aria-pressed={selected}
                      onClick={() =>
                        setAnswers((prev) => ({
                          ...prev,
                          [q.id]: toggleMultiSelectAnswer(prev[q.id], opt.text),
                        }))
                      }
                      className={cn(
                        'flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors',
                        selected ? 'border-brand-600 bg-brand-50 text-surface-900' : 'border-surface-200 bg-white hover:bg-surface-50',
                        isAnswer && 'border-green-500 bg-green-50 text-green-800',
                        wrongPick && 'border-red-400 bg-red-50 text-red-700',
                        submitted && 'cursor-default',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs font-medium',
                          selected ? 'border-brand-600 bg-brand-600 text-white' : 'border-surface-300 text-surface-500',
                        )}
                      >
                        {String.fromCharCode(65 + oi)}
                      </span>
                      <span>{opt.text}</span>
                    </button>
                  );
                })}
              </div>
            ) : isSingleChoice ? (
              <div className="mt-3 grid gap-2">
                {(q.options ?? []).map((opt, oi) => {
                  const selected = answers[q.id] === opt.text;
                  const isAnswer = submitted && q.correctAnswer === opt.text;
                  const wrongPick = submitted && selected && !isAnswer;
                  return (
                    <button
                      key={oi}
                      type="button"
                      disabled={submitted}
                      onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.text }))}
                      className={cn(
                        'flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors',
                        selected ? 'border-brand-600 bg-brand-50 text-surface-900' : 'border-surface-200 bg-white hover:bg-surface-50',
                        isAnswer && 'border-green-500 bg-green-50 text-green-800',
                        wrongPick && 'border-red-400 bg-red-50 text-red-700',
                        submitted && 'cursor-default',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-medium',
                          selected ? 'border-brand-600 bg-brand-600 text-white' : 'border-surface-300 text-surface-500',
                        )}
                      >
                        {String.fromCharCode(65 + oi)}
                      </span>
                      <span>{opt.text}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="mt-3">
                <textarea
                  className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 disabled:bg-surface-50"
                  rows={3}
                  disabled={submitted}
                  value={answers[q.id] ?? ''}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                  placeholder="Type your answer…"
                />
                <p className="mt-2 text-xs text-surface-400">
                  {isAutoGradedType(q.type)
                    ? 'This answer is checked automatically.'
                    : 'Written answers are not auto-graded - your teacher reviews them.'}
                </p>
              </div>
            )}

            {submitted && (yourAnswerText || correctAnswerText) ? (
              <div className="mt-3 space-y-1 text-sm">
                {yourAnswerText ? (
                  <p className="text-surface-600">
                    Your answer: <span className="font-medium">{yourAnswerText}</span>
                  </p>
                ) : null}
                {correctAnswerText ? (
                  <p className="text-surface-600">
                    Correct answer: <span className="font-medium text-green-700">{correctAnswerText}</span>
                  </p>
                ) : null}
                <p className={cn('font-medium', q.isCorrect === true ? 'text-green-700' : q.isCorrect === false ? 'text-red-600' : 'text-surface-500')}>
                  {q.isCorrect === true ? 'Correct' : q.isCorrect === false ? 'Incorrect' : q.isCorrect === null ? 'Unmarked' : ''}{' '}
                  {q.marksAwarded !== null ? `· awarded ${q.marksAwarded} mark${q.marksAwarded === 1 ? '' : 's'}` : null}
                </p>
              </div>
            ) : null}

            {!submitted && isChoice ? (
              <p className="mt-2 text-xs text-surface-400">{q.options?.length ?? 0} options</p>
            ) : null}
          </Card>
          );
        })}
      </div>

      {!submitted ? (
        <div className="sticky bottom-4 mt-6 flex justify-end gap-3 rounded-xl border border-surface-200 bg-white/95 p-3 shadow-sm backdrop-blur">
          <Button variant="outline" onClick={save} loading={saving}>
            <Save className="h-4 w-4" />
            Save answers
          </Button>
          {confirmSubmit ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-surface-600">Submit this attempt? You cannot change answers after submitting.</span>
              <Button variant="outline" onClick={() => setConfirmSubmit(false)}>Cancel</Button>
              <Button onClick={submit} loading={submitting}>
                <Send className="h-4 w-4" />
                Confirm submit
              </Button>
            </div>
          ) : (
            <Button onClick={() => setConfirmSubmit(true)}>
              <Send className="h-4 w-4" />
              Submit attempt
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}

function ResultBanner({ data }: { data: NonNullable<ReturnType<typeof useAttempt>['data']> }) {
  const a = data.attempt;
  return (
    <Card className="mb-6 border-brand-200 bg-brand-50">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <ResultStat label="Score" value={formatScore(a.score, a.maxScore)} />
        <ResultStat label="Correct" value={String(a.correctCount ?? 0)} icon={<Check className="h-4 w-4 text-green-600" />} />
        <ResultStat label="Incorrect" value={String(a.wrongCount ?? 0)} icon={<X className="h-4 w-4 text-red-500" />} />
        <ResultStat label="Skipped" value={String(a.skippedCount ?? 0)} />
        <ResultStat label="Accuracy" value={a.accuracy !== null && a.accuracy !== undefined ? `${a.accuracy}%` : '—'} />
        <ResultStat label="Time" value={a.timeSpentSeconds ? `${Math.round(a.timeSpentSeconds / 60)} min` : '—'} />
      </div>

      {/* The DIAGNOSE edge: the concepts behind the wrong answers, each one tap
          from practice. Without this the result screen was the end of the road. */}
      {data.weakConcepts && data.weakConcepts.length > 0 ? (
        <div className="mt-4 rounded-xl border border-brand-200 bg-white p-4">
          <p className="text-sm font-semibold text-surface-900">What to fix next</p>
          <p className="mt-0.5 text-xs text-surface-500">
            These concepts carried the answers you missed. Practise one now - the result updates your mastery.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {data.weakConcepts.map((concept) => (
              <Link
                key={concept.id}
                href={`/app/learn/concepts/${concept.id}?tab=practice`}
                className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-200"
              >
                <Target className="h-3.5 w-3.5" />
                {concept.name}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </Card>
  );
}

function ResultStat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-brand-600">{label}</p>
      <p className="mt-1 flex items-center gap-1.5 text-2xl font-bold text-surface-900">
        {icon}
        {value === '—' ? <span className="text-surface-400">—</span> : value}
      </p>
    </div>
  );
}