'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
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
import { formatDate, formatScore, titleCase } from '@/lib/format';
import { Play, RotateCw, Eye } from 'lucide-react';

export default function AssessmentsPage() {
  const user = useAuthStore((s) => s.user);
  const staff = user?.role === 'TEACHER' || user?.role === 'INSTITUTION_ADMIN' || user?.role === 'SUPER_ADMIN';
  return staff ? <StaffAssessments /> : <StudentAssessments />;
}

function StaffAssessments() {
  const router = useRouter();
  const { data, isLoading, error } = useAssessments(useAuthStore((s) => s.user?.role));

  if (isLoading) return <Spinner label="Loading assessments…" />;
  if (error) return <ErrorBanner message={(error as Error).message} />;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Assessments</h1>
        <Button onClick={() => router.push('/app/assessments/new')}>New assessment</Button>
      </div>
      <div className="space-y-3">
        {(data ?? []).map((a: any) => (
          <Card key={a.id} className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-slate-900">{a.title}</h2>
                <Badge>{a.status}</Badge>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {a.subject?.name ?? '—'} · {a.totalMarks} marks · {a.durationMinutes} min
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>{a._count?.assignments ?? 0} assigned</span>
              <span aria-hidden>·</span>
              <span>{a._count?.attempts ?? 0} attempts</span>
              <Button variant="outline" onClick={() => router.push(`/app/assessments/${a.id}/manage`)}>
                Manage
              </Button>
            </div>
          </Card>
        ))}
        {data && data.length === 0 ? <p className="text-sm text-slate-400">No assessments yet.</p> : null}
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
      alert(e instanceof Error ? e.message : 'Could not start the assessment');
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
                  <h2 className="font-semibold text-slate-900">{row.assessment.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">
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
                      <span className="text-slate-600">
                        Attempt {a.attemptIndex} · {a.status === 'SUBMITTED' ? 'Submitted' : titleCase(a.status)} ·{' '}
                        {formatDate(a.submittedAt)}
                      </span>
                      <span className="flex items-center gap-2 font-medium text-slate-800">
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
        {data?.assignments?.length === 0 ? <p className="text-sm text-slate-400">No assessments assigned yet.</p> : null}
      </div>
    </div>
  );
}