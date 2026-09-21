'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { usePaper } from '@/lib/api-hooks';
import { useAuthStore } from '@/lib/auth-store';
import { api, ApiError } from '@/lib/api';
import { Button, Card, ErrorBanner, Input, Label, Select } from '@/components/ui';
import { ArrowLeft } from 'lucide-react';

export default function NewAssessmentPage() {
  const router = useRouter();
  const params = useSearchParams();
  const paperId = params.get('paper');
  const token = useAuthStore((s) => s.token);
  const { data: paper } = usePaper(paperId ?? undefined);

  const [title, setTitle] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('40');
  const [attemptsAllowed, setAttemptsAllowed] = useState('2');
  const [dueAt, setDueAt] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const defaultTitle = paper ? `Assessment from ${paper.title}` : '';

  async function create() {
    setError(null);
    if (startsAt && dueAt && new Date(startsAt) >= new Date(dueAt)) {
      setError('Start date must be before due date.');
      return;
    }
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        title: title || defaultTitle,
        subjectId: paper?.subjectId,
        totalMarks: paper?.totalMarks ?? 25,
        durationMinutes: Number(durationMinutes),
        attemptsAllowed: Number(attemptsAllowed),
        autoSubmitOnExpiry: true,
      };
      if (paperId) body.sourcePaperId = paperId;
      if (dueAt) body.dueAt = new Date(dueAt).toISOString();
      if (startsAt) body.startsAt = new Date(startsAt).toISOString();

      const res = await api<{ assessment: { id: string } }>('/assessments', {
        method: 'POST',
        token,
        body,
      });
      router.push(`/app/assessments/${res.assessment.id}/manage`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Creation failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <button onClick={() => router.push('/app/assessments')} className="mb-3 inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-800">
          <ArrowLeft className="h-4 w-4" />
          Back to Assessments
        </button>
        <h1 className="text-2xl font-bold">Create assessment</h1>
        {paperId ? <p className="mt-1 text-sm text-surface-500">Source paper: <span className="font-medium text-surface-700">{paper?.title ?? '…'}</span></p> : null}
      </div>
      <Card>
        <form onSubmit={(e) => { e.preventDefault(); create(); }} className="space-y-5">
        <div>
          <Label htmlFor="title">Assessment title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={defaultTitle || 'Unit Test 1'} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="duration">Duration (min)</Label>
            <Input id="duration" type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="attempts">Attempts allowed</Label>
            <Input id="attempts" type="number" value={attemptsAllowed} onChange={(e) => setAttemptsAllowed(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="marks">Total marks</Label>
            <Input id="marks" value={paper?.totalMarks ?? 25} disabled />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="dueAt">Due at (optional)</Label>
            <Input id="dueAt" type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="startsAt">Starts at (optional)</Label>
            <Input id="startsAt" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
          </div>
        </div>
        <ErrorBanner message={error} />
        <Button type="submit" loading={submitting} className="w-full" disabled={!(title || defaultTitle)}>
          Create assessment
        </Button>
        </form>
      </Card>
    </div>
  );
}