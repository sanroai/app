'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Boxes, CheckCircle2, Info, Lightbulb, Loader2, Target, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner, ErrorBanner } from '@/components/ui';
import {
  useArModelUrl,
  useArQuickCheck,
  useSubmitArQuickCheck,
  useRecordArActivity,
  type ArCard,
  type ArHotspot,
} from '@/lib/ar-hooks';
import { cn } from '@/lib/cn';

const Model3DViewer = dynamic(
  () => import('@/components/ar/Model3DViewer').then((m) => m.Model3DViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[360px] items-center justify-center rounded-2xl border border-surface-200 bg-surface-50">
        <Spinner />
      </div>
    ),
  },
);

const DIFFICULTY_STYLE: Record<string, string> = {
  EASY: 'bg-green-100 text-green-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  HARD: 'bg-red-100 text-red-700',
};

export function ConceptArPanel({ conceptId, items }: { conceptId: string; items: ArCard[] }) {
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? '');
  const selected = items.find((i) => i.id === selectedId) ?? items[0];
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const [showQuickCheck, setShowQuickCheck] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const openedRef = useRef<Set<string>>(new Set());
  const startedRef = useRef<Set<string>>(new Set());

  const recordActivity = useRecordArActivity();
  const { data: model, isLoading: modelLoading, isError: modelError } = useArModelUrl(selected?.id, Boolean(selected?.id));
  const quickCheck = useArQuickCheck(selected?.id, showQuickCheck);
  const submit = useSubmitArQuickCheck(selected?.id ?? '');

  useEffect(() => {
    if (selected?.id && !openedRef.current.has(selected.id)) {
      openedRef.current.add(selected.id);
      recordActivity.mutate({ id: selected.id, type: 'AR_OPENED', metadata: { conceptId } });
    }
    setActiveHotspot(null);
    setShowQuickCheck(false);
    setSubmitted(false);
    setAnswers({});
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recordActivity is intentionally not a dependency: adding it re-arms this effect on every mutation and re-creates the activity request storm (BUG-L).
  }, [selected?.id, conceptId]);

  const hotspots = useMemo<ArHotspot[]>(() => selected?.hotspots ?? [], [selected]);

  if (!selected) return null;

  const onHotspotSelect = (hotspot: ArHotspot) => {
    setActiveHotspot(hotspot.id);
    recordActivity.mutate({ id: selected.id, type: 'AR_MODEL_INTERACTION', metadata: { hotspot: hotspot.id } });
  };

  const onOptionSelect = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const onSubmit = () => {
    const payload = Object.entries(answers).map(([questionId, optionId]) => ({ questionId, optionId }));
    submit.mutate(payload, { onSuccess: () => setSubmitted(true) });
  };

  const questions = quickCheck.data?.questions ?? [];
  const resultByQuestion = new Map((submit.data?.results ?? []).map((r) => [r.questionId, r]));

  return (
    <div className="space-y-6">
      {items.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedId(item.id)}
              className={cn(
                'rounded-full border px-4 py-1.5 text-sm font-medium transition',
                item.id === selected.id
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-surface-200 bg-white text-surface-600 hover:border-brand-300',
              )}
            >
              {item.title}
            </button>
          ))}
        </div>
      )}

      <Card className="rounded-3xl border-surface-200">
        <CardContent className="p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100">
                  <Boxes className="h-5 w-5 text-indigo-600" />
                </span>
                <div>
                  <h2 className="font-poppins text-lg font-bold text-surface-900">{selected.title}</h2>
                  {selected.grade && <p className="text-xs text-surface-500">Class {selected.grade}</p>}
                </div>
              </div>
            </div>
            <Badge className={cn('rounded-full', DIFFICULTY_STYLE[selected.difficulty] ?? 'bg-surface-100 text-surface-600')}>
              {selected.difficulty}
            </Badge>
          </div>

          {selected.learningObjective && (
            <div className="mb-4 flex gap-2 rounded-2xl bg-brand-50 p-3">
              <Target className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
              <p className="text-sm text-brand-900">{selected.learningObjective}</p>
            </div>
          )}

          {modelLoading ? (
            <div className="flex h-[360px] items-center justify-center rounded-2xl border border-surface-200 bg-surface-50">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
                <span className="text-xs text-surface-500">Preparing model...</span>
              </div>
            </div>
          ) : modelError ? (
            <ErrorBanner message="Could not load the 3D model. Please try again." />
          ) : (
            <Model3DViewer
              src={model?.url}
              poster={selected.previewUrl}
              alt={`${selected.title} 3D model`}
              hotspots={hotspots}
              activeHotspot={activeHotspot}
              onHotspotSelect={onHotspotSelect}
              onReady={() => {
                if (startedRef.current.has(selected.id)) return;
                startedRef.current.add(selected.id);
                recordActivity.mutate({ id: selected.id, type: 'AR_STARTED' });
              }}
            />
          )}

          {selected.description && <p className="mt-4 text-sm text-surface-600">{selected.description}</p>}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-3xl border-surface-200">
          <CardContent className="p-5">
            <h3 className="mb-3 flex items-center gap-2 font-poppins font-semibold text-surface-900">
              <Info className="h-4 w-4 text-brand-600" /> How to use
            </h3>
            <p className="whitespace-pre-line text-sm text-surface-600">
              {selected.instructions ?? 'Rotate the model to explore it from every angle.'}
            </p>
          </CardContent>
        </Card>

        {hotspots.length > 0 && (
          <Card className="rounded-3xl border-surface-200">
            <CardContent className="p-5">
              <h3 className="mb-3 flex items-center gap-2 font-poppins font-semibold text-surface-900">
                <Lightbulb className="h-4 w-4 text-amber-500" /> Labelled parts
              </h3>
              <div className="flex flex-wrap gap-2">
                {hotspots.map((hotspot) => (
                  <button
                    key={hotspot.id}
                    type="button"
                    onClick={() => onHotspotSelect(hotspot)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-medium transition',
                      activeHotspot === hotspot.id
                        ? 'border-brand-600 bg-brand-600 text-white'
                        : 'border-surface-200 bg-white text-surface-600 hover:border-brand-300',
                    )}
                  >
                    {hotspot.label}
                  </button>
                ))}
              </div>
              {activeHotspot && (
                <p className="mt-3 text-sm text-surface-600">
                  {hotspots.find((h) => h.id === activeHotspot)?.description}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="rounded-3xl border-surface-200">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 font-poppins font-semibold text-surface-900">
              <Target className="h-4 w-4 text-brand-600" /> Quick check
            </h3>
            {!showQuickCheck && (
              <Button
                className="rounded-xl"
                onClick={() => {
                  setShowQuickCheck(true);
                  recordActivity.mutate({ id: selected.id, type: 'AR_QUICK_CHECK_STARTED' });
                }}
              >
                Start quick check
              </Button>
            )}
          </div>

          {showQuickCheck && quickCheck.isLoading && (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          )}

          {showQuickCheck && quickCheck.isError && <ErrorBanner message="Could not load questions. Please retry." />}

          {showQuickCheck && !quickCheck.isLoading && questions.length === 0 && (
            <p className="py-6 text-center text-sm text-surface-500">
              No quick-check questions are available for this concept yet.
            </p>
          )}

          {showQuickCheck && questions.length > 0 && (
            <div className="mt-4 space-y-4">
              {questions.map((question, index) => {
                const outcome = resultByQuestion.get(question.id);
                return (
                  <div key={question.id} className="rounded-2xl border border-surface-200 p-4">
                    <p className="mb-3 text-sm font-medium text-surface-900">
                      {index + 1}. {question.text}
                    </p>
                    {question.options.length > 0 ? (
                      <div className="space-y-2">
                        {question.options.map((option) => {
                          const chosen = answers[question.id] === option.id;
                          const isCorrect = outcome?.correct && chosen;
                          const isWrong = outcome && chosen && !outcome.correct;
                          return (
                            <button
                              key={option.id}
                              type="button"
                              disabled={submitted}
                              onClick={() => onOptionSelect(question.id, option.id)}
                              className={cn(
                                'flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition',
                                isCorrect
                                  ? 'border-green-500 bg-green-50 text-green-800'
                                  : isWrong
                                    ? 'border-red-400 bg-red-50 text-red-700'
                                    : chosen
                                      ? 'border-brand-500 bg-brand-50 text-brand-800'
                                      : 'border-surface-200 bg-white text-surface-700 hover:border-brand-300',
                              )}
                            >
                              <span className="flex h-5 w-5 items-center justify-center rounded-full border text-[11px]">
                                {String.fromCharCode(65 + option.order)}
                              </span>
                              {option.text}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <input
                        value={answers[question.id] ?? ''}
                        disabled={submitted}
                        onChange={(e) => setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))}
                        placeholder="Type your answer"
                        className="w-full rounded-xl border border-surface-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
                      />
                    )}
                    {submitted && outcome && (
                      <div
                        className={cn(
                          'mt-3 flex gap-2 rounded-xl p-3 text-xs',
                          outcome.correct ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700',
                        )}
                      >
                        {outcome.correct ? (
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                        ) : (
                          <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        )}
                        <div>
                          <p className="font-semibold">{outcome.correct ? 'Correct' : `Answer: ${outcome.correctAnswer}`}</p>
                          {outcome.explanation && <p className="mt-1 text-surface-600">{outcome.explanation}</p>}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {!submitted ? (
                <Button
                  className="w-full rounded-xl"
                  disabled={submit.isPending || Object.keys(answers).length === 0}
                  onClick={onSubmit}
                >
                  {submit.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Submit answers
                </Button>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-brand-50 p-4">
                  <p className="text-sm font-semibold text-brand-900">
                    Score: {submit.data?.score} / {submit.data?.total}
                  </p>
                  <div className="flex gap-2">
                    <Link href={`/app/learn/practice?conceptId=${conceptId}`}>
                      <Button size="sm" variant="outline" className="rounded-xl bg-white">
                        Practice this concept
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {selected.attribution && (
        <p className="text-center text-[11px] text-surface-400">
          {selected.attribution}
          {selected.license ? ` - ${selected.license}` : ''}
        </p>
      )}
    </div>
  );
}
