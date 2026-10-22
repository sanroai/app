'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import { useDiagnosisMy, useRemediationMy, useRemediationPlans } from '@/lib/api-hooks';
import { useAuthStore } from '@/lib/auth-store';
import { useRole } from '@/lib/role-theme';
import { api } from '@/lib/api';
import { Badge, Button, Card, ErrorBanner, Spinner } from '@/components/ui';
import { titleCase } from '@/lib/format';
import { toast } from 'sonner';
import { Check, Circle, Target, CheckCircle2, Loader2, ChevronRight, BookOpen } from 'lucide-react';
import { cn } from '@/lib/cn';

const LEVEL_STYLE: Record<string, string> = {
  MASTERED: 'bg-green-100 text-green-700',
  GOOD: 'bg-emerald-50 text-emerald-700',
  DEVELOPING: 'bg-amber-50 text-amber-700',
  WEAK: 'bg-orange-50 text-orange-700',
  NEEDS_INTERVENTION: 'bg-red-50 text-red-700',
  INSUFFICIENT_EVIDENCE: 'bg-surface-100 text-surface-600',
};

type PlanRow = {
  id: string;
  progress?: number;
  completedItems?: number;
  _count?: { items?: number };
  concept?: { id?: string; name: string };
  student?: { name?: string | null };
  items?: Array<{
    id: string;
    title?: string;
    type?: string;
    contentType?: string;
    contentId?: string | null;
    status?: string;
  }>;
};

function planStats(plan: PlanRow) {
  const items = plan.items ?? [];
  const done = plan.completedItems ?? items.filter((i) => i.status === 'COMPLETED').length;
  const total = plan._count?.items ?? items.length;
  const progress = plan.progress ?? (total > 0 ? Math.round((done / total) * 100) : 0);
  return { done, total, progress };
}

export default function RemediationPage() {
  const role = useRole();
  const isStudent = role === 'STUDENT';
  // `POST /remediation/items/:id/status` is staff-only, so a student must not be
  // offered the action - it would only ever return a 403.
  const canMarkComplete = role === 'TEACHER' || role === 'INSTITUTION_ADMIN';
  const canViewPlans = !isStudent && role !== 'SUPER_ADMIN';
  const diag = useDiagnosisMy(isStudent);
  const plans = useRemediationMy(isStudent);
  const staffPlans = useRemediationPlans(canViewPlans);
  const queryClient = useQueryClient();
  const [pendingItems, setPendingItems] = useState<Set<string>>(new Set());

  const loading = isStudent ? diag.isLoading || plans.isLoading : staffPlans.isLoading;
  const err = isStudent ? (diag.error ?? plans.error) : staffPlans.error;
  if (loading) return <Spinner label="Loading mastery…" />;
  if (err) return <ErrorBanner message={(err as Error).message} />;

  const diagnosis = isStudent ? diag.data : null;
  const planList = isStudent ? plans.data : canViewPlans ? staffPlans.data : [];

  async function setItemStatus(planId: string, itemId: string, status: 'COMPLETED' | 'SKIPPED') {
    setPendingItems((prev) => new Set(prev).add(itemId));
    try {
      await api(`/remediation/items/${itemId}/status`, {
        method: 'POST',
        token: useAuthStore.getState().token,
        body: { status },
      });
      await queryClient.invalidateQueries({ queryKey: ['remediation', 'my'] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setPendingItems((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Mastery &amp; remediation</h1>
        {diagnosis ? (
          <p className="mt-1 text-sm text-surface-500">
            Average mastery score: <span className="font-semibold text-surface-800">{diagnosis.averageScore ?? 0}%</span>{' '}
            across {diagnosis.concepts?.length ?? 0} concepts
          </p>
        ) : null}
      </div>

      {isStudent && (
      <section>
        <h2 className="mb-3 text-lg font-semibold">Concept mastery</h2>
        {diagnosis && Array.isArray(diagnosis.concepts) && diagnosis.concepts.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {diagnosis.concepts.map((m: { id: string; level: string; score: number; concept?: { id: string; name: string; topic?: { name: string; chapter?: { name: string } } }; conceptId?: string }) => (
              <Link key={m.id} href={`/app/learn/concepts/${m.concept?.id ?? m.conceptId ?? ''}`}>
                <Card className="group cursor-pointer hover:shadow-md transition-all">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-surface-900 group-hover:text-brand-700 transition-colors">{m.concept?.name ?? 'Concept'}</p>
                    <Badge className={LEVEL_STYLE[m.level] ?? 'bg-surface-100 text-surface-600'}>{titleCase(m.level ?? '')}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-surface-500">
                    {m.concept?.topic?.chapter?.name ?? m.concept?.topic?.name ?? ''}
                  </p>
                  <div className="mt-3 h-2 rounded-full bg-surface-100">
                    <div
                      className={cn(
                        'h-2 rounded-full',
                        m.score >= 80 ? 'bg-green-500' : m.score >= 60 ? 'bg-amber-500' : 'bg-red-500',
                      )}
                      style={{ width: `${Math.max(0, Math.min(100, m.score ?? 0))}%` }}
                    />
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-xs text-surface-500">{m.score ?? 0}%</p>
                    <ChevronRight className="h-4 w-4 text-surface-300 group-hover:text-brand-500 transition-colors" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-200 bg-surface-50/50 py-12 text-center dark:border-surface-700 dark:bg-surface-900/50">
            <Target className="h-10 w-10 text-surface-300 mb-3" />
            <p className="text-sm text-surface-500 max-w-sm">No mastery data yet — complete an assessment to build it.</p>
          </div>
        )}
      </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold">Remediation plans</h2>
        {isStudent ? (
          <p className="mb-3 text-sm text-surface-500">
            Open the work below to strengthen this concept - your teacher marks plan items as done.
          </p>
        ) : null}
        {!isStudent && !canViewPlans ? (
          <p className="mb-3 text-sm text-surface-500">
            Plans live inside each institution — sign in as an institution admin or teacher to review them.
          </p>
        ) : null}
        <div className="space-y-4">
          {(Array.isArray(planList) ? planList : []).map((plan: PlanRow) => {
            const { done, total, progress } = planStats(plan);
            return (
            <Card key={plan.id}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-surface-900">{plan.concept?.name ?? 'Plan'}</h3>
                  <p className="mt-1 text-xs text-surface-500">
                    {plan.student?.name ? `${plan.student.name} · ` : ''}
                    {done} of {total} items done
                  </p>
                </div>
                <Badge>{progress}%</Badge>
              </div>
              <div className="mt-3 h-2 rounded-full bg-surface-100">
                <div className="h-2 rounded-full bg-brand-600" style={{ width: `${progress}%` }} />
              </div>
              <ul className="mt-4 space-y-2">
                {(plan.items ?? []).map((item: {
                  id: string;
                  title?: string;
                  type?: string;
                  contentType?: string;
                  contentId?: string | null;
                  status?: string;
                }) => {
                  const openHref = item.contentId
                    ? `/app/library/item/${item.contentId}`
                    : plan.concept?.id
                      ? `/app/learn/concepts/${plan.concept.id}`
                      : null;
                  return (
                  <li key={item.id} className="flex items-center justify-between gap-3 rounded-lg bg-surface-50 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-surface-800">{item.title ?? item.type ?? 'Item'}</p>
                      <p className="text-xs text-surface-500">
                        {item.type ?? item.contentType ?? ''} · {item.status ?? ''}
                      </p>
                    </div>
                    {item.status === 'COMPLETED' ? (
                      <Badge className="bg-green-100 text-green-700">
                        <Check className="mr-1 h-3 w-3" />
                        Done
                      </Badge>
                    ) : canMarkComplete ? (
                      <Button
                        variant="outline"
                        onClick={() => setItemStatus(plan.id, item.id, 'COMPLETED')}
                        disabled={pendingItems.has(item.id)}
                        className="shrink-0"
                      >
                        {pendingItems.has(item.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Circle className="h-4 w-4" />
                        )}
                        Mark complete
                      </Button>
                    ) : openHref ? (
                      // A student cannot mark an item done (the endpoint is
                      // staff-only), so point at the work instead.
                      <Link
                        href={openHref}
                        className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-surface-300 bg-white px-4 py-2 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-50"
                      >
                        <BookOpen className="h-4 w-4" />
                        Open
                      </Link>
                    ) : (
                      <span className="shrink-0 text-xs text-surface-400">Your teacher marks this done</span>
                    )}
                  </li>
                  );
                })}
              </ul>
            </Card>
            );
          })}
          {Array.isArray(planList) && planList.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-200 bg-surface-50/50 py-12 text-center dark:border-surface-700 dark:bg-surface-900/50">
              <CheckCircle2 className="h-10 w-10 text-surface-300 mb-3" />
              <p className="text-sm text-surface-500 max-w-sm">
                {isStudent
                  ? 'No active remediation plans — weak concepts will appear here after assessments.'
                  : 'No active remediation plans for your institution yet.'}
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}