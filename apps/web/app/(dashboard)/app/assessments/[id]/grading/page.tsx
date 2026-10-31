'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAssessmentAttempts, useAttemptDetail } from '@/lib/api-hooks';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ErrorBanner, Spinner } from '@/components/ui';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle2, ClipboardCheck, Eye } from 'lucide-react';

/**
 * Teacher grading queue for one assessment: every submitted attempt, its written
 * answers and a marks box. Auto-graded questions are already scored; this screen
 * exists so a subjective paper can leave "pending review".
 */
export default function AssessmentGradingPage() {
  const params = useParams();
  const assessmentId = params.id as string;
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();
  const { data: attempts, isLoading, error } = useAssessmentAttempts(assessmentId);
  const [selected, setSelected] = useState<string | null>(null);
  const { data: detail } = useAttemptDetail(selected ?? undefined);
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const save = async (answerId: string, maxMarks: number) => {
    if (!selected) return;
    const value = Number(marks[answerId]);
    if (!Number.isFinite(value) || value < 0 || value > maxMarks) {
      toast.error(`Enter marks between 0 and ${maxMarks}`);
      return;
    }
    setSaving(answerId);
    try {
      await api(`/assessments/attempts/${selected}/answers/${answerId}/grade`, {
        method: 'POST',
        token,
        body: { marksAwarded: value },
      });
      toast.success('Marks saved');
      await queryClient.invalidateQueries({ queryKey: ['attempt', selected] });
      await queryClient.invalidateQueries({ queryKey: ['assessment-attempts', assessmentId] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save the marks');
    } finally {
      setSaving(null);
    }
  };

  const submitted = (attempts ?? []).filter((a) => a.status !== 'IN_PROGRESS');
  const written = (detail?.questions ?? []).filter(
    (q) => q.type === 'SHORT_ANSWER' || q.type === 'LONG_ANSWER',
  );

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link
        href={`/app/assessments/${assessmentId}/manage`}
        className="inline-flex items-center gap-1 text-sm font-medium text-surface-500 hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" /> Manage assessment
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-surface-900">Grade attempts</h1>
        <p className="mt-1 text-sm text-surface-600">
          Objective answers are already scored. Add marks for the written answers - the score and mastery update
          as soon as you save.
        </p>
      </div>

      {isLoading ? <Spinner /> : error ? <ErrorBanner message={(error as Error).message} /> : null}

      <div className="space-y-3">
        {submitted.map((attempt) => (
          <Card key={attempt.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-semibold text-surface-900">
                  {attempt.student?.name ?? 'Student'}
                  {attempt.student?.rollNumber ? ` · ${attempt.student.rollNumber}` : ''}
                </p>
                <p className="text-xs text-surface-500">
                  Attempt {attempt.attemptIndex} · {attempt.status} · {attempt.score ?? 0}/{attempt.maxScore ?? 0}
                </p>
              </div>
              <Button variant="outline" onClick={() => setSelected(attempt.id)}>
                <Eye className="h-4 w-4" />
                {selected === attempt.id ? 'Viewing' : 'Grade'}
              </Button>
            </CardContent>
          </Card>
        ))}
        {submitted.length === 0 ? (
          <Card>
            <CardContent className="flex items-center gap-3 p-6 text-sm text-surface-500">
              <ClipboardCheck className="h-5 w-5 text-surface-300" />
              No submitted attempts yet.
            </CardContent>
          </Card>
        ) : null}
      </div>

      {detail ? (
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold text-surface-900">
                {detail.student?.name ?? 'Attempt'} · {detail.assessment.title}
              </h2>
              <Badge variant="secondary">
                {detail.attempt.score ?? 0}/{detail.attempt.maxScore ?? 0}
              </Badge>
            </div>

            {written.length === 0 ? (
              <p className="text-sm text-surface-500">This paper has no written answers to grade.</p>
            ) : (
              <ul className="space-y-3">
                {written.map((question) => (
                  <li key={question.id} className="rounded-xl border border-surface-200 p-4">
                    <p className="font-medium text-surface-900">
                      {question.order}. {question.text}
                    </p>
                    <p className="mt-2 rounded-lg bg-surface-50 px-3 py-2 text-sm text-surface-700">
                      {question.yourAnswer || 'No answer'}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        max={question.maxMarks ?? question.marks}
                        placeholder={`0-${question.maxMarks ?? question.marks}`}
                        value={marks[question.id] ?? (question.marksAwarded !== null ? String(question.marksAwarded) : '')}
                        onChange={(e) => setMarks((prev) => ({ ...prev, [question.id]: e.target.value }))}
                        className="w-24"
                      />
                      <span className="text-xs text-surface-400">of {question.maxMarks ?? question.marks}</span>
                      <Button size="sm" onClick={() => save(question.id, question.maxMarks ?? question.marks)} disabled={saving === question.id}>
                        {saving === question.id ? 'Saving…' : 'Save marks'}
                      </Button>
                      {question.gradedByTeacher ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600">
                          <CheckCircle2 className="h-3.5 w-3.5" /> graded
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-amber-600">pending</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
