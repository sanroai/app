'use client';

import Link from 'next/link';
import { useLearningHome } from '@/lib/learning-hooks';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Spinner, ErrorBanner } from '@/components/ui';
import { BookOpen, GraduationCap, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-card">
      <div className="h-5 w-32 animate-pulse rounded-lg bg-surface-100" />
      <div className="mt-3 h-3 w-20 animate-pulse rounded bg-surface-100" />
      <div className="mt-4 h-2 w-full animate-pulse rounded-full bg-surface-100" />
      <div className="mt-2 h-3 w-16 animate-pulse rounded bg-surface-100" />
    </div>
  );
}

export default function LearnPage() {
  const { data, isLoading, error } = useLearningHome();

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <div className="h-8 w-64 animate-pulse rounded-lg bg-surface-100" />
          <div className="mt-2 h-4 w-80 animate-pulse rounded bg-surface-100" />
        </div>
        <div className="space-y-6">
          {[1, 2].map((g) => (
            <div key={g}>
              <div className="mb-3 h-6 w-40 animate-pulse rounded bg-surface-100" />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((c) => (
                  <SkeletonCard key={c} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) return <ErrorBanner message={(error as Error).message} />;

  const boards = data?.boards ?? [];
  const totalClasses = boards.reduce((acc, b) => acc + b.grades.filter((g) => g.subjects.length > 0).length, 0);
  const totalSubjects = boards.reduce(
    (acc, b) => acc + b.grades.reduce((ga, g) => ga + g.subjects.length, 0),
    0,
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Choose your learning path</h1>
        <p className="mt-1 text-sm text-surface-500">
          {totalClasses} classes · {totalSubjects} subjects available — select a subject to start learning
        </p>
      </div>

      {boards.length === 0 ? (
        <Card className="py-16 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-surface-300" />
          <p className="mt-4 text-sm font-medium text-surface-500">
            No learning content available yet
          </p>
          <p className="mt-1 text-xs text-surface-400">
            Contact your administrator to set up curriculum content
          </p>
        </Card>
      ) : (
        boards.map((board) => (
          <section key={board.id}>
            <div className="mb-4 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-brand-600" />
              <h2 className="text-lg font-bold text-surface-900">{board.name}</h2>
              <Badge variant="secondary">{board.code}</Badge>
            </div>

            {board.grades.filter((grade) => grade.subjects.length > 0).map((grade) => (
              <div key={grade.id} className="mb-8">
                <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-surface-800">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-sm font-bold text-brand-700">
                    {grade.grade}
                  </span>
                  Class {grade.grade}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {grade.subjects.map((subject) => {
                    const pct =
                      subject.totalContent > 0
                        ? Math.round((subject.completedContent / subject.totalContent) * 100)
                        : 0;

                    return (
                      <Link
                        key={subject.id}
                        href={`/app/learn/${board.id}/${grade.grade}/${subject.id}/chapters`}
                      >
                      <Card className="group cursor-pointer border-surface-200 hover:border-brand-300 hover:shadow-md transition-all">
                        <CardContent className="p-0">
                          <div className="flex items-start justify-between gap-3 p-6 pb-3">
                            <div className="min-w-0">
                              <h4 className="font-bold text-surface-900 group-hover:text-brand-700 transition-colors">
                                {subject.name}
                              </h4>
                              <p className="mt-0.5 text-xs text-surface-400">{subject.code}</p>
                            </div>
                            <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-surface-300 group-hover:text-brand-600 transition-colors" />
                          </div>

                          <div className="px-6 pb-6">
                            <Progress value={pct} className="h-2" />
                            <div className="mt-2 flex items-center justify-between text-xs text-surface-500">
                              <span>
                                {subject.completedContent}/{subject.totalContent} lessons
                              </span>
                              <span className="font-medium text-surface-700">{pct}%</span>
                            </div>
                          </div>

                          {subject.averageMastery > 0 && (
                            <div className="border-t border-surface-100 bg-surface-50 px-6 py-3">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-surface-500">Mastery</span>
                                  <span
                                    className={cn(
                                      'font-semibold',
                                      subject.averageMastery >= 80
                                        ? 'text-green-600'
                                        : subject.averageMastery >= 50
                                          ? 'text-amber-600'
                                          : 'text-red-600',
                                    )}
                                  >
                                    {subject.averageMastery}%
                                  </span>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>
        ))
      )}
    </div>
  );
}
