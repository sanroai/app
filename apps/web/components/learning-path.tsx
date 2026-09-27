'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  useLearningPath,
  useRequestRetest,
  type LearningPath,
  type PathFocusStep,
  type PathLevel,
  type PathTrackStep,
} from '@/lib/path-hooks';
import { useStartPractice } from '@/lib/learning-hooks';
import { ErrorBanner, Spinner } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  CircleDot,
  ClipboardList,
  Flame,
  Play,
  RotateCw,
  Route,
  Target,
  Wrench,
} from 'lucide-react';

const LEVEL_META: Record<PathLevel, { label: string; className: string; dot: string }> = {
  MASTERED: { label: 'Mastered', className: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  GOOD: { label: 'Good', className: 'bg-green-50 text-green-700', dot: 'bg-green-500' },
  DEVELOPING: { label: 'Developing', className: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  WEAK: { label: 'Weak', className: 'bg-orange-50 text-orange-700', dot: 'bg-orange-500' },
  NEEDS_INTERVENTION: { label: 'Needs help', className: 'bg-red-50 text-red-700', dot: 'bg-red-500' },
  INSUFFICIENT_EVIDENCE: { label: 'Not tested', className: 'bg-surface-100 text-surface-500', dot: 'bg-surface-300' },
};

const STATE_ICON = {
  DONE: { Icon: CheckCircle2, className: 'text-emerald-500' },
  IN_PROGRESS: { Icon: CircleDot, className: 'text-amber-500' },
  NOT_STARTED: { Icon: Circle, className: 'text-surface-300' },
};

function levelMeta(level: string) {
  return LEVEL_META[level as PathLevel] ?? LEVEL_META.INSUFFICIENT_EVIDENCE;
}

function SummaryChip({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="flex-1 rounded-xl border border-surface-200 bg-white px-4 py-3">
      <p className={cn('text-xl font-bold', accent ?? 'text-surface-900')}>{value}</p>
      <p className="mt-0.5 text-xs text-surface-500">{label}</p>
    </div>
  );
}

function NextUp({ path }: { path: LearningPath }) {
  const router = useRouter();
  const next = path.next;
  if (!next) {
    return (
      <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white">
            <CheckCircle2 className="h-6 w-6" />
          </span>
          <div>
            <p className="text-lg font-bold text-surface-900">Everything is done</p>
            <p className="text-sm text-surface-600">You have mastered every concept on your path. Great work.</p>
          </div>
        </div>
      </Card>
    );
  }

  const cta =
    next.action === 'RETEST'
      ? { label: 'Take the retest', onClick: () => router.push('/app/assessments?tab=tests') }
      : next.conceptId
        ? { label: next.action === 'FIX' ? 'Fix this concept' : 'Open concept', onClick: () => router.push(`/app/learn/concepts/${next.conceptId}`) }
        : null;

  const Icon = next.action === 'FIX' ? Wrench : next.action === 'RETEST' ? RotateCw : Route;

  return (
    <Card className="overflow-hidden border-0 bg-gradient-to-r from-brand-600 via-violet-600 to-purple-600 text-white">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/70">
            <Icon className="h-3.5 w-3.5" /> Your next step
          </p>
          <p className="mt-1 truncate text-xl font-bold">{next.conceptName}</p>
          <p className="mt-1 text-sm text-white/80">
            {next.chapterName ? `${next.chapterName} · ` : ''}
            {next.reason}
          </p>
        </div>
        {cta ? (
          <Button onClick={cta.onClick} className="shrink-0 bg-white text-brand-700 hover:bg-white/90">
            {cta.label} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </Card>
  );
}

function FocusCard({
  step,
  onPractice,
  onRetest,
  busy,
}: {
  step: PathFocusStep;
  onPractice: (conceptId: string) => void;
  onRetest: (conceptId: string) => void;
  busy: boolean;
}) {
  const meta = levelMeta(step.level);
  const pct = step.score ?? 0;
  const done = step.plan ? step.plan.completedSteps : 0;
  const total = step.plan ? step.plan.totalSteps : 0;

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('h-2.5 w-2.5 rounded-full', meta.dot)} />
            <h3 className="font-semibold text-surface-900">{step.conceptName}</h3>
            <Badge variant="secondary" className={cn('text-[10px]', meta.className)}>
              {meta.label}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-surface-500">
            {step.chapterName} · {step.subjectName}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-surface-900">{pct}%</p>
          <p className="text-[11px] text-surface-400">mastery</p>
        </div>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-100">
        <div
          className={cn('h-full rounded-full', meta.dot)}
          style={{ width: `${Math.max(pct, 3)}%` }}
        />
      </div>

      {step.steps.length > 0 ? (
        <ul className="mt-4 space-y-2 border-t border-surface-100 pt-3">
          {step.steps.map((s, i) => (
            <li key={s.id} className="flex items-center gap-2 text-sm">
              <span
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                  s.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-surface-100 text-surface-500',
                )}
              >
                {i + 1}
              </span>
              <span className={s.status === 'COMPLETED' ? 'text-surface-400 line-through' : 'text-surface-700'}>
                {s.title}
              </span>
              {s.status === 'COMPLETED' ? <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-500" /> : null}
            </li>
          ))}
          {total > 0 ? (
            <li className="pt-1 text-xs text-surface-400">
              {done}/{total} steps complete
            </li>
          ) : null}
        </ul>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2 border-t border-surface-100 pt-4">
        <Button size="sm" onClick={() => onPractice(step.conceptId)} disabled={step.practiceQuestionCount === 0 || busy}>
          <Target className="mr-2 h-4 w-4" />
          Practice {step.practiceQuestionCount > 0 ? `(${step.practiceQuestionCount})` : ''}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onRetest(step.conceptId)}
          disabled={step.practiceQuestionCount === 0 || busy}
        >
          <RotateCw className="mr-2 h-4 w-4" />
          Request retest
        </Button>
        <Button size="sm" variant="ghost" asChild>
          <Link href={`/app/learn/concepts/${step.conceptId}`}>Study notes</Link>
        </Button>
      </div>
    </Card>
  );
}

function TrackList({ track, path }: { track: PathTrackStep[]; path: LearningPath }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const upNextId = path.next?.action === 'FIX' ? path.next.conceptId : null;

  const groups = useMemo(() => {
    const map = new Map<
      string,
      { chapterId: string; chapterName: string; subjectName: string; steps: PathTrackStep[] }
    >();
    for (const step of track) {
      const existing = map.get(step.chapterId);
      if (existing) existing.steps.push(step);
      else map.set(step.chapterId, { chapterId: step.chapterId, chapterName: step.chapterName, subjectName: step.subjectName, steps: [step] });
    }
    return [...map.values()];
  }, [track]);

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const done = group.steps.filter((s) => s.state === 'DONE').length;
        const isOpen = open[group.chapterId] ?? group.steps.some((s) => s.state !== 'DONE');
        return (
          <Card key={group.chapterId} className="p-0 overflow-hidden">
            <button
              type="button"
              onClick={() => setOpen((o) => ({ ...o, [group.chapterId]: !isOpen }))}
              className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-surface-50"
              aria-expanded={isOpen}
            >
              <span className="min-w-0">
                <span className="block truncate font-semibold text-surface-900">{group.chapterName}</span>
                <span className="block text-xs text-surface-400">{group.subjectName}</span>
              </span>
              <span className="shrink-0 text-right text-xs text-surface-500">
                <span className="block font-semibold text-surface-800">
                  {done}/{group.steps.length}
                </span>
                concepts
              </span>
            </button>
            {isOpen ? (
              <ul className="divide-y divide-surface-100 border-t border-surface-100">
                {group.steps.map((step) => {
                  const { Icon, className } = STATE_ICON[step.state];
                  const meta = levelMeta(step.level);
                  const isUpNext = step.conceptId === upNextId;
                  return (
                    <li key={step.conceptId}>
                      <Link
                        href={`/app/learn/concepts/${step.conceptId}`}
                        className={cn(
                          'flex items-center gap-3 px-5 py-2.5 hover:bg-surface-50',
                          isUpNext && 'bg-brand-50/60',
                        )}
                      >
                        <Icon className={cn('h-4 w-4 shrink-0', className)} />
                        <span className="min-w-0 flex-1 truncate text-sm text-surface-700">{step.conceptName}</span>
                        {isUpNext ? (
                          <Badge className="shrink-0 bg-brand-600 text-[10px] text-white">Up next</Badge>
                        ) : null}
                        <Badge variant="secondary" className={cn('shrink-0 text-[10px]', meta.className)}>
                          {step.score !== null ? `${step.score}%` : meta.label}
                        </Badge>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}

export function LearningPath() {
  const router = useRouter();
  const { data, isLoading, error } = useLearningPath();
  const startPractice = useStartPractice();
  const requestRetest = useRequestRetest();
  const [busyConcept, setBusyConcept] = useState<string | null>(null);

  if (isLoading) return <Spinner label="Building your path…" />;
  if (error) return <ErrorBanner message={(error as Error).message} />;
  if (!data) return null;

  async function handlePractice(conceptId: string) {
    setBusyConcept(conceptId);
    try {
      const res = await startPractice.mutateAsync({ conceptId, questionCount: 5 });
      router.push(`/app/learn/practice/${res.practiceId}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not start practice');
    } finally {
      setBusyConcept(null);
    }
  }

  function handleRetest(conceptId: string) {
    setBusyConcept(conceptId);
    requestRetest.mutate(
      { conceptIds: [conceptId] },
      {
        onSuccess: () => toast.success('Retest created — find it in the Tests tab'),
        onError: (e) => toast.error(e instanceof Error ? e.message : 'Could not create the retest'),
        onSettled: () => setBusyConcept(null),
      },
    );
  }

  const s = data.summary;

  return (
    <div className="space-y-6">
      <NextUp path={data} />

      <div className="flex flex-wrap gap-3">
        <SummaryChip label="Concepts mastered" value={`${s.masteryPercent}%`} accent="text-emerald-600" />
        <SummaryChip label="Weak concepts" value={s.weakConcepts} accent="text-orange-600" />
        <SummaryChip label="Not tested yet" value={s.untestedConcepts} accent="text-surface-700" />
        <SummaryChip label="Pending retests" value={s.pendingRetests} accent="text-brand-600" />
        <SummaryChip label="In progress" value={s.inProgress} accent="text-amber-600" />
      </div>

      {data.focus.length > 0 ? (
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-bold text-surface-900">
            <Flame className="h-5 w-5 text-orange-500" />
            Fix these first
            <span className="text-sm font-normal text-surface-400">— diagnosed from your attempts</span>
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {data.focus.map((step) => (
              <FocusCard
                key={step.conceptId}
                step={step}
                onPractice={handlePractice}
                onRetest={handleRetest}
                busy={busyConcept === step.conceptId || startPractice.isPending || requestRetest.isPending}
              />
            ))}
          </div>
        </section>
      ) : (
        <Card className="flex items-center gap-4 border-emerald-100 bg-emerald-50/50">
          <Target className="h-8 w-8 shrink-0 text-emerald-500" />
          <div>
            <p className="font-semibold text-surface-900">No weak concepts right now</p>
            <p className="text-sm text-surface-500">
              Keep going through your path — take a test to generate fresh diagnosis.
            </p>
          </div>
        </Card>
      )}

      {data.retests.length > 0 ? (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-bold text-surface-900">
            <RotateCw className="h-5 w-5 text-brand-600" />
            Retests waiting for you
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {data.retests.map((r) => (
              <Card key={r.assessmentId} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-surface-900">{r.title}</p>
                  <p className="text-xs text-surface-400">{r.chapterName ?? 'Chapter not set'}</p>
                </div>
                <Button size="sm" onClick={() => router.push('/app/assessments?tab=tests')}>
                  <Play /> {r.started ? 'Resume' : 'Take it'}
                </Button>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-surface-900">
            <ClipboardList className="h-5 w-5 text-brand-600" />
            Your path
          </h2>
          <span className="text-sm text-surface-400">
            {s.done}/{s.totalConcepts} concepts done
          </span>
        </div>
        <TrackList track={data.track} path={data} />
      </section>
    </div>
  );
}
