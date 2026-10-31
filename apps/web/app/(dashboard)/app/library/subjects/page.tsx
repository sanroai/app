'use client';

import { useLearningHome } from '@/lib/learning-hooks';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ErrorBanner } from '@/components/ui';
import { SubjectBanner } from '@/components/subject-banner';
import { BookOpen, GraduationCap, Search } from 'lucide-react';
import { useState } from 'react';
import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/lib/auth-store';
import { PrefetchLink } from '@/components/prefetch-link';
import { prefetchChapters } from '@/lib/prefetch';
import { useIdlePrefetch } from '@/lib/use-idle-prefetch';

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

export default function LibrarySubjectsPage() {
  const { data, isLoading, error } = useLearningHome();
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);

  // The student almost always opens the first card, so its chapters route is
  // warmed during idle time (the tap then lands on a ready page).
  const firstSubjectHref = useMemo(() => {
    for (const board of data?.boards ?? []) {
      for (const grade of board.grades) {
        const subject = grade.subjects[0];
        if (subject) return `/app/learn/${board.id}/${grade.grade}/${subject.id}/chapters`;
      }
    }
    return null;
  }, [data]);
  useIdlePrefetch(firstSubjectHref);

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
        <h1 className="text-2xl font-bold text-surface-900">Browse by subject</h1>
        <p className="mt-1 text-sm text-surface-500">
          {data?.allGrades ? 'All classes' : `${totalClasses} classes`} · {totalSubjects} subjects
          available — select a subject to start learning
        </p>
        <div className="relative mt-4 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
          <Input
            placeholder="Search subjects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            aria-label="Search subjects"
          />
        </div>
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
        <>
          {boards.map((board) => {
            const hasMatchingSubjects = search
              ? board.grades.some((grade) =>
                  grade.subjects.some((s) => s.name.toLowerCase().includes(search.toLowerCase())),
                )
              : true;
            if (search && !hasMatchingSubjects) return null;
            return (
            <section key={board.id}>
              <div className="mb-4 flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-brand-600" />
                <h2 className="text-lg font-bold text-surface-900">{board.name}</h2>
                <Badge variant="secondary">{board.code}</Badge>
              </div>

              {board.grades.filter((grade) => grade.subjects.length > 0).map((grade) => {
                const filteredSubjects = search
                  ? grade.subjects.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
                  : grade.subjects;
                if (filteredSubjects.length === 0) return null;
                return (
                <div key={grade.id} className="mb-8">
                  <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-surface-800">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-sm font-bold text-brand-700">
                      {grade.grade}
                    </span>
                    Class {grade.grade}
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredSubjects.map((subject) => {
                      const pct =
                        subject.totalContent > 0
                          ? Math.round((subject.completedContent / subject.totalContent) * 100)
                          : 0;

                      return (
                        <PrefetchLink
                          key={subject.id}
                          href={`/app/learn/${board.id}/${grade.grade}/${subject.id}/chapters`}
                          prefetchData={() =>
                            prefetchChapters(
                              queryClient,
                              { boardId: board.id, grade: grade.grade, subjectId: subject.id },
                              token,
                            )
                          }
                          className="block h-full"
                        >
                        <Card className="group flex h-full cursor-pointer flex-col overflow-hidden border-surface-200 transition-all hover:border-brand-300 hover:shadow-lg">
                          <CardContent className="flex flex-1 flex-col p-0">
                            {/* Subject banner: the first lesson frame of this
                                class+subject (a different picture in every
                                card), its accent wash, the monogram and the
                                class numeral. The name sits under the picture
                                because the frame already carries captions. */}
                            <SubjectBanner
                              name={subject.name}
                              code={subject.code}
                              grade={grade.grade}
                              subtitle={subject.code}
                              showName={false}
                              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 320px"
                            />

                            <div className="flex flex-1 flex-col px-4 py-4">
                              <div className="flex items-baseline justify-between gap-2">
                                <h4 className="truncate text-[15px] font-bold text-surface-900">{subject.name}</h4>
                                <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-surface-400">
                                  {subject.code}
                                </span>
                              </div>
                              <Progress value={pct} className="mt-3 h-2" />
                              <div className="mt-2 flex items-center justify-between text-xs text-surface-500">
                                <span>
                                  {subject.completedContent}/{subject.totalContent} lessons
                                </span>
                                <span className="font-medium text-surface-700">{pct}%</span>
                              </div>
                            </div>

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
                                        : subject.averageMastery > 0
                                          ? 'text-red-600'
                                          : 'text-surface-400',
                                  )}
                                >
                                  {subject.averageMastery > 0 ? `${subject.averageMastery}%` : 'Not started'}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </PrefetchLink>
                    );
                  })}
                </div>
                </div>
                );
              })}
            </section>
            );
          })}
          {search && boards.every((board) =>
            !board.grades.some((grade) =>
              grade.subjects.some((s) => s.name.toLowerCase().includes(search.toLowerCase())),
            ),
          ) && (
            <Card className="py-16 text-center">
              <Search className="mx-auto h-12 w-12 text-surface-300" />
              <p className="mt-4 text-sm font-medium text-surface-500">
                No subjects match &ldquo;{search}&rdquo;
              </p>
              <p className="mt-1 text-xs text-surface-400">
                Try a different search term
              </p>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
