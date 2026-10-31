'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useExamLibrary } from '@/lib/api-hooks';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ErrorBanner, Spinner } from '@/components/ui';
import { toast } from 'sonner';
import { ArrowLeft, BookOpenCheck, Clock, FileText, Play } from 'lucide-react';

/**
 * Ready-made exams: Term 1, Term 2 and a class test for every class+subject the
 * student can open, generated from the approved question bank. Starting one opens
 * the paper (preview), not the timer - the student reads the paper first.
 */
export default function ExamLibraryPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const { data, isLoading, error } = useExamLibrary();
  const [starting, setStarting] = useState<string | null>(null);

  const start = async (key: string) => {
    setStarting(key);
    try {
      const res = await api<{ assessmentId: string }>(`/learning/exams/${key}/start`, {
        method: 'POST',
        token,
      });
      router.push(`/app/assessments/${res.assessmentId}/paper`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not open this exam');
    } finally {
      setStarting(null);
    }
  };

  const exams = data?.exams ?? [];
  const byGrade = exams.reduce<Record<string, typeof exams>>((groups, exam) => {
    (groups[exam.grade] ??= []).push(exam);
    return groups;
  }, {});

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link
        href="/app/assessments?tab=tests"
        className="inline-flex items-center gap-1 text-sm font-medium text-surface-500 hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" /> Assessments
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-surface-900">Exam library</h1>
        <p className="mt-1 text-sm text-surface-600">
          Term-wise and class-test papers for your classes. Read the paper first, then start when you are ready.
        </p>
      </div>

      {isLoading ? <Spinner /> : error ? <ErrorBanner message={(error as Error).message} /> : null}

      {!isLoading && exams.length === 0 ? (
        <Card>
          <CardContent className="flex items-center gap-3 p-6 text-sm text-surface-500">
            <BookOpenCheck className="h-5 w-5 text-surface-300" />
            No exams are available for your classes yet.
          </CardContent>
        </Card>
      ) : null}

      {Object.entries(byGrade)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([grade, gradeExams]) => (
          <section key={grade} className="space-y-3">
            <h2 className="flex items-center gap-2 text-base font-bold text-surface-800">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-sm font-bold text-brand-700">
                {grade}
              </span>
              Class {grade}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {gradeExams.map((exam) => (
                <Card key={exam.key}>
                  <CardContent className="flex h-full flex-col justify-between gap-3 p-4">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-surface-900">{exam.title}</p>
                        <Badge variant="secondary" className="shrink-0">
                          {exam.blueprintLabel}
                        </Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-surface-500">
                        <span className="inline-flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5" /> {exam.questionCount} questions
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <BookOpenCheck className="h-3.5 w-3.5" /> {exam.totalMarks} marks
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" /> {exam.durationMinutes} min
                        </span>
                      </div>
                    </div>
                    <Button onClick={() => start(exam.key)} disabled={starting === exam.key} className="rounded-xl">
                      <Play className="h-4 w-4" />
                      {starting === exam.key ? 'Opening…' : 'Open paper'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}
    </div>
  );
}
