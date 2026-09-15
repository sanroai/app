'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAttempt } from '@/lib/api-hooks';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api';
import { Badge, Button, Card, ErrorBanner, Spinner } from '@/components/ui';
import { formatScore, titleCase } from '@/lib/format';
import { Check, Save, Send, X } from 'lucide-react';
import { cn } from '@/lib/cn';

export default function AttemptPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const { data, isLoading, error } = useAttempt(attemptId);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
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

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const payload = attemptData.questions
        .map((q) => ({ snapshotQuestionId: q.id, answer: answers[q.id] ?? '' }))
        .filter((a) => a.answer.length > 0);
      await api(`/assessments/attempts/${attemptId}/answers`, {
        method: 'POST',
        token: useAuthStore.getState().token,
        body: { answers: payload },
      });
      setMsg('Answers saved.');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function submit() {
    if (!window.confirm('Submit this attempt? You cannot change answers after submitting.')) return;
    setSubmitting(true);
    setMsg(null);
    try {
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
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{data.assessment.title}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {data.assessment.subject} · {data.assessment.totalMarks} marks
        </p>
        <div className="mt-3">{submitted ? <Badge>Submitted</Badge> : <Badge className="bg-amber-50 text-amber-700">In progress</Badge>}</div>
      </div>

      {msg ? <ErrorBanner message={msg} /> : null}

      {submitted ? <ResultBanner data={data} /> : null}

      <div className="space-y-4">
        {data.questions.map((q, idx) => (
          <Card key={q.id}>
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium text-slate-900">
                <span className="mr-2 text-slate-400">{idx + 1}.</span>
                {q.text}
              </p>
              <Badge className="shrink-0 bg-slate-100 text-slate-600">{q.marks} mark{q.marks > 1 ? 's' : ''}</Badge>
            </div>

            {q.type === 'MCQ' ? (
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
                        selected ? 'border-brand-600 bg-brand-50 text-slate-900' : 'border-slate-200 bg-white hover:bg-slate-50',
                        isAnswer && 'border-green-500 bg-green-50 text-green-800',
                        wrongPick && 'border-red-400 bg-red-50 text-red-700',
                        submitted && 'cursor-default',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-medium',
                          selected ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 text-slate-500',
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
              <textarea
                className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 disabled:bg-slate-50"
                rows={3}
                disabled={submitted}
                value={answers[q.id] ?? ''}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                placeholder="Type your answer…"
              />
            )}

            {submitted && (q.yourAnswer || q.correctAnswer) ? (
              <div className="mt-3 space-y-1 text-sm">
                {q.yourAnswer ? (
                  <p className="text-slate-600">
                    Your answer: <span className="font-medium">{q.yourAnswer}</span>
                  </p>
                ) : null}
                {q.correctAnswer ? (
                  <p className="text-slate-600">
                    Correct answer: <span className="font-medium text-green-700">{q.correctAnswer}</span>
                  </p>
                ) : null}
                <p className={cn('font-medium', q.isCorrect === true ? 'text-green-700' : q.isCorrect === false ? 'text-red-600' : 'text-slate-500')}>
                  {q.isCorrect === true ? 'Correct' : q.isCorrect === false ? 'Incorrect' : q.isCorrect === null ? 'Unmarked' : ''}{' '}
                  {q.marksAwarded !== null ? `· awarded ${q.marksAwarded} mark${q.marksAwarded === 1 ? '' : 's'}` : null}
                </p>
              </div>
            ) : null}

            {!submitted && q.type === 'MCQ' ? (
              <p className="mt-2 text-xs text-slate-400">{q.options?.length ?? 0} options</p>
            ) : null}
          </Card>
        ))}
      </div>

      {!submitted ? (
        <div className="sticky bottom-4 mt-6 flex justify-end gap-3 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur">
          <Button variant="outline" onClick={save} loading={saving}>
            <Save className="h-4 w-4" />
            Save answers
          </Button>
          <Button onClick={submit} loading={submitting}>
            <Send className="h-4 w-4" />
            Submit attempt
          </Button>
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
    </Card>
  );
}

function ResultStat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-brand-600">{label}</p>
      <p className="mt-1 flex items-center gap-1.5 text-2xl font-bold text-slate-900">
        {icon}
        {value === '—' ? <span className="text-slate-400">—</span> : value}
      </p>
    </div>
  );
}