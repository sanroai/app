'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAssessmentPaper } from '@/lib/api-hooks';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ErrorBanner, Spinner } from '@/components/ui';
import { ArrowLeft, ArrowRight, Clock, FileText, ListChecks, Trophy } from 'lucide-react';

/**
 * The question paper, before the student commits to an attempt: what the exam
 * covers, how long it runs, how many questions and marks, and every question.
 * Answers are never in this payload - it is the paper, not the answer key.
 */
export default function AssessmentPaperPage() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = params.id as string;
  const { data: paper, isLoading, error } = useAssessmentPaper(assessmentId);
  const token = useAuthStore((s) => s.token);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }
  if (error) return <ErrorBanner message={(error as Error).message} />;
  if (!paper) return null;

  const objective = paper.questions.filter((q) => q.type === 'MCQ' || q.type === 'TRUE_FALSE');
  const written = paper.questions.filter((q) => q.type === 'SHORT_ANSWER' || q.type === 'LONG_ANSWER');

  const onStart = async () => {
    setStarting(true);
    setStartError(null);
    try {
      const res = await api<{ attemptId: string }>(`/assessments/${assessmentId}/start`, {
        method: 'POST',
        token,
      });
      router.push(`/app/assessments/attempt/${res.attemptId}`);
    } catch (err) {
      setStartError((err as Error).message);
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        href="/app/assessments"
        className="inline-flex items-center gap-1 text-sm font-medium text-surface-500 hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" /> Assessments
      </Link>

      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-brand-600 via-purple-600 to-indigo-600 p-6 text-white">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/70">Question paper</p>
          <h1 className="mt-1 font-display text-2xl font-extrabold sm:text-3xl">{paper.title}</h1>
          <p className="mt-1 text-sm text-white/80">
            {paper.subject?.name ?? 'General'}
            {paper.chapter ? ` · ${paper.chapter.name}` : ''}
            {paper.chapter?.grade ? ` · Class ${paper.chapter.grade}` : ''}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge className="bg-white/20 text-white">
              <FileText className="mr-1 h-3 w-3" /> {paper.questionCount} questions
            </Badge>
            <Badge className="bg-white/20 text-white">
              <Trophy className="mr-1 h-3 w-3" /> {paper.totalMarks} marks
            </Badge>
            <Badge className="bg-white/20 text-white">
              <Clock className="mr-1 h-3 w-3" /> {paper.durationMinutes} min
            </Badge>
            <Badge className="bg-white/20 text-white">
              <ListChecks className="mr-1 h-3 w-3" /> {paper.attemptsLeft} of {paper.attemptsAllowed} attempts left
            </Badge>
          </div>
        </div>

        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-surface-600">
              {objective.length > 0 ? `${objective.length} objective` : ''}
              {objective.length > 0 && written.length > 0 ? ' · ' : ''}
              {written.length > 0 ? `${written.length} written` : ''}
              {paper.isOpen ? '' : ' · not open right now'}
            </div>
            <Button onClick={onStart} disabled={!paper.isOpen || starting || paper.attemptsLeft === 0} className="rounded-xl">
              {starting ? 'Starting…' : 'Start test'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {startError ? <ErrorBanner message={startError} /> : null}

          <ol className="space-y-3">
            {paper.questions.map((question) => (
              <li key={question.id} className="rounded-xl border border-surface-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-surface-900">
                    <span className="mr-2 text-surface-400">{question.order}.</span>
                    {question.text}
                  </p>
                  <span className="shrink-0 text-xs font-semibold text-surface-400">
                    {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
                  </span>
                </div>
                {question.options.length > 0 ? (
                  <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                    {question.options.map((option, index) => (
                      <li key={`${question.id}-${index}`} className="rounded-lg bg-surface-50 px-3 py-1.5 text-sm text-surface-700">
                        {option.text}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-xs text-surface-400">Written answer</p>
                )}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
