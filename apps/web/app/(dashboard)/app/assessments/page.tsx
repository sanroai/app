'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth-store';
import { api, ApiError } from '@/lib/api';
import {
  useAssessments,
  useMyAssessments,
  type AssignmentRow,
  type AttemptSummary,
} from '@/lib/api-hooks';
import { Badge, Button, Card, ErrorBanner, Spinner } from '@/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDate, formatScore, titleCase } from '@/lib/format';
import { toast } from 'sonner';
import { Play, RotateCw, Eye, ClipboardList, FileText, Search, X } from 'lucide-react';

export default function AssessmentsPage() {
  const user = useAuthStore((s) => s.user);
  const staff = user?.role === 'TEACHER' || user?.role === 'INSTITUTION_ADMIN' || user?.role === 'SUPER_ADMIN';
  return staff ? <StaffAssessments /> : <StudentAssessments />;
}

function StaffAssessments() {
  const router = useRouter();
  const { data, isLoading, error } = useAssessments(useAuthStore((s) => s.user?.role));

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [modeFilter, setModeFilter] = useState('ALL');

  const hasFilters = search !== '' || statusFilter !== 'ALL' || modeFilter !== 'ALL';

  const filtered = useMemo(() => {
    const items = data ?? [];
    return items.filter((a: { title?: string; status?: string; mode?: string }) => {
      if (search && !a.title?.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
      if (modeFilter !== 'ALL' && a.mode !== modeFilter) return false;
      return true;
    });
  }, [data, search, statusFilter, modeFilter]);

  if (isLoading) return <Spinner label="Loading assessments…" />;
  if (error) return <ErrorBanner message={(error as Error).message} />;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Assessments</h1>
        <Button onClick={() => router.push('/app/assessments/new')}>New assessment</Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Search assessments…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-12 w-full rounded-xl border-2 border-surface-200 bg-white pl-10 pr-4 text-sm transition-all placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-surface-900 dark:border-surface-700 dark:text-surface-100"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="PUBLISHED">Published</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>

        <Select value={modeFilter} onValueChange={setModeFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Modes</SelectItem>
            <SelectItem value="DIGITAL">Digital</SelectItem>
            <SelectItem value="PRINT">Print</SelectItem>
            <SelectItem value="BOTH">Both</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="outline"
            onClick={() => { setSearch(''); setStatusFilter('ALL'); setModeFilter('ALL'); }}
          >
            <X className="mr-1 h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>

      <p className="mb-3 text-sm text-surface-500">
        Showing {filtered.length} of {(data ?? []).length} assessments
      </p>

      <div className="space-y-3">
        {filtered.map((a: { id: string; title: string; status?: string; startsAt?: string; dueAt?: string; subject?: { name: string }; totalMarks?: number; durationMinutes?: number; _count?: { assignments?: number; attempts?: number }; group?: { name: string } }) => (
          <Card key={a.id}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-6">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-surface-900">{a.title}</h2>
                  <Badge>{a.status}</Badge>
                </div>
                <p className="mt-1 text-sm text-surface-500">
                  {a.subject?.name ?? '—'} · {a.totalMarks} marks · {a.durationMinutes} min
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-surface-500 shrink-0">
                <span>{a._count?.assignments ?? 0} assigned</span>
                <span aria-hidden>·</span>
                <span>{a._count?.attempts ?? 0} attempts</span>
                <Button variant="outline" onClick={() => router.push(`/app/assessments/${a.id}/manage`)}>
                  Manage
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {data && data.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-200 bg-surface-50/50 py-12 text-center dark:border-surface-700 dark:bg-surface-900/50">
            <FileText className="h-10 w-10 text-surface-300 mb-3" />
            <p className="text-sm text-surface-500 max-w-sm">No assessments yet. Create one to get started.</p>
          </div>
        ) : null}
        {data && data.length > 0 && filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-200 bg-surface-50/50 py-12 text-center dark:border-surface-700 dark:bg-surface-900/50">
            <Search className="h-10 w-10 text-surface-300 mb-3" />
            <p className="text-sm text-surface-500 max-w-sm">No assessments match your filters. Try adjusting your search.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StudentAssessments() {
  const { data, isLoading, error } = useMyAssessments();
  const queryClient = useQueryClient();
  const router = useRouter();

  if (isLoading) return <Spinner label="Loading assessments…" />;
  if (error) return <ErrorBanner message={(error as Error).message} />;

  async function start(assessmentId: string) {
    try {
      const res = await api<{ attemptId: string }>(`/assessments/${assessmentId}/start`, {
        method: 'POST',
        token: useAuthStore.getState().token,
      });
      await queryClient.invalidateQueries({ queryKey: ['assessments', 'my'] });
      router.push(`/app/assessments/attempt/${res.attemptId}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not start the assessment');
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">My assessments</h1>
      <div className="space-y-4">
        {(data?.assignments ?? []).map((row: AssignmentRow) => {
          const activeAttempt = row.attempts.find((a) => a.status === 'IN_PROGRESS');
          const submitted = row.attempts.filter((a) => a.status !== 'IN_PROGRESS');
          return (
            <Card key={row.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-surface-900">{row.assessment.title}</h2>
                  <p className="mt-1 text-sm text-surface-500">
                    {row.assessment.subject?.name ?? '—'} · {row.assessment.totalMarks} marks ·{' '}
                    {formatDate(row.dueAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {activeAttempt ? (
                    <Button variant="outline" onClick={() => router.push(`/app/assessments/attempt/${activeAttempt.id}`)}>
                      <RotateCw className="h-4 w-4" />
                      Resume attempt
                    </Button>
                  ) : (
                    <Button onClick={() => start(row.assessmentId)}>
                      <Play className="h-4 w-4" />
                      Start
                    </Button>
                  )}
                </div>
              </div>
              {submitted.length > 0 ? (
                <ul className="mt-4 divide-y divide-slate-100">
                  {submitted.map((a: AttemptSummary) => (
                    <li key={a.id} className="flex items-center justify-between py-2 text-sm">
                      <span className="text-surface-600">
                        Attempt {a.attemptIndex} · {a.status === 'SUBMITTED' ? 'Submitted' : titleCase(a.status)} ·{' '}
                        {formatDate(a.submittedAt)}
                      </span>
                      <span className="flex items-center gap-2 font-medium text-surface-800">
                        {formatScore(a.score, a.maxScore)}
                        <Button variant="ghost" onClick={() => router.push(`/app/assessments/attempt/${a.id}`)}>
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </Card>
          );
        })}
        {data?.assignments?.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-200 bg-surface-50/50 py-12 text-center dark:border-surface-700 dark:bg-surface-900/50">
            <ClipboardList className="h-10 w-10 text-surface-300 mb-3" />
            <p className="text-sm text-surface-500 max-w-sm">No assessments assigned yet — check back soon or ask your teacher.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}