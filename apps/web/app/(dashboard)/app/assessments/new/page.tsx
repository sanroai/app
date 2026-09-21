'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { usePaper } from '@/lib/api-hooks';
import { useAuthStore } from '@/lib/auth-store';
import { api, ApiError } from '@/lib/api';
import { Button, Card, ErrorBanner, Input, Label } from '@/components/ui';
import { ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  durationMinutes: z.coerce.number().int().min(1, 'Duration must be at least 1 minute'),
  attemptsAllowed: z.coerce.number().int().min(1, 'At least 1 attempt required'),
  startsAt: z.string().optional(),
  dueAt: z.string().optional(),
}).refine(
  (data) => {
    if (data.startsAt && data.dueAt) {
      return new Date(data.startsAt) < new Date(data.dueAt);
    }
    return true;
  },
  { message: 'Start date must be before due date', path: ['dueAt'] },
);

type FormData = z.infer<typeof schema>;

export default function NewAssessmentPage() {
  const router = useRouter();
  const params = useSearchParams();
  const paperId = params.get('paper');
  const token = useAuthStore((s) => s.token);
  const { data: paper } = usePaper(paperId ?? undefined);

  const defaultTitle = paper ? `Assessment from ${paper.title}` : '';

  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', durationMinutes: 40, attemptsAllowed: 2 },
  });

  async function onSubmit(data: FormData) {
    try {
      const body: Record<string, unknown> = {
        title: data.title || defaultTitle,
        subjectId: paper?.subjectId,
        totalMarks: paper?.totalMarks ?? 25,
        durationMinutes: data.durationMinutes,
        attemptsAllowed: data.attemptsAllowed,
        autoSubmitOnExpiry: true,
      };
      if (paperId) body.sourcePaperId = paperId;
      if (data.dueAt) body.dueAt = new Date(data.dueAt).toISOString();
      if (data.startsAt) body.startsAt = new Date(data.startsAt).toISOString();

      const res = await api<{ assessment: { id: string } }>('/assessments', {
        method: 'POST',
        token,
        body,
      });
      router.push(`/app/assessments/${res.assessment.id}/manage`);
    } catch (e) {
      setError('root', { message: e instanceof ApiError ? e.message : 'Creation failed' });
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <button type="button" onClick={() => router.push('/app/assessments')} className="mb-3 inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-800">
          <ArrowLeft className="h-4 w-4" />
          Back to Assessments
        </button>
        <h1 className="text-2xl font-bold">Create assessment</h1>
        {paperId ? <p className="mt-1 text-sm text-surface-500">Source paper: <span className="font-medium text-surface-700">{paper?.title ?? '…'}</span></p> : null}
      </div>
      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <Label htmlFor="title">Assessment title</Label>
            <Input id="title" {...register('title')} placeholder={defaultTitle || 'Unit Test 1'} aria-invalid={!!errors.title} />
            {errors.title && <p className="mt-1 text-xs text-red-600" role="alert">{errors.title.message}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="durationMinutes">Duration (min)</Label>
              <Input id="durationMinutes" type="number" {...register('durationMinutes')} aria-invalid={!!errors.durationMinutes} />
              {errors.durationMinutes && <p className="mt-1 text-xs text-red-600" role="alert">{errors.durationMinutes.message}</p>}
            </div>
            <div>
              <Label htmlFor="attemptsAllowed">Attempts allowed</Label>
              <Input id="attemptsAllowed" type="number" {...register('attemptsAllowed')} aria-invalid={!!errors.attemptsAllowed} />
              {errors.attemptsAllowed && <p className="mt-1 text-xs text-red-600" role="alert">{errors.attemptsAllowed.message}</p>}
            </div>
            <div>
              <Label htmlFor="marks">Total marks</Label>
              <Input id="marks" value={paper?.totalMarks ?? 25} disabled />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="startsAt">Starts at (optional)</Label>
              <Input id="startsAt" type="datetime-local" {...register('startsAt')} />
            </div>
            <div>
              <Label htmlFor="dueAt">Due at (optional)</Label>
              <Input id="dueAt" type="datetime-local" {...register('dueAt')} aria-invalid={!!errors.dueAt} />
              {errors.dueAt && <p className="mt-1 text-xs text-red-600" role="alert">{errors.dueAt.message}</p>}
            </div>
          </div>
          <ErrorBanner message={errors.root?.message} />
          <Button type="submit" loading={isSubmitting} className="w-full">
            Create assessment
          </Button>
        </form>
      </Card>
    </div>
  );
}
