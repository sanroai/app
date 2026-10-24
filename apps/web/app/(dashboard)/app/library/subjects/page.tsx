'use client';

import Image from 'next/image';
import { useLearningHome } from '@/lib/learning-hooks';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Spinner, ErrorBanner } from '@/components/ui';
import { subjectArt } from '@/lib/subject-art';
import { BookOpen, GraduationCap, ChevronRight, Search } from 'lucide-react';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/lib/auth-store';
import { PrefetchLink } from '@/components/prefetch-link';
import { prefetchChapters } from '@/lib/prefetch';

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
          {totalClasses} classes · {totalSubjects} subjects available — select a subject to start learning
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
                      const art = subjectArt(subject.name, subject.code);
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
                        >
                        <Card className="group cursor-pointer overflow-hidden border-surface-200 hover:border-brand-300 hover:shadow-lg transition-all">
                          <CardContent className="p-0">
                            {/* Subject banner: the cover art plus the subject's own 3D
                                icon, so a student recognises the subject before
                                reading the name. */}
                            <div className="relative h-28 w-full overflow-hidden bg-surface-900">
                              <Image
                                src={art.banner}
                                alt=""
                                fill
                                sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 320px"
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                              <div
                                className="absolute inset-0 mix-blend-soft-light"
                                style={{ background: `linear-gradient(135deg, ${art.accent}, ${art.accent2})` }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                              <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 p-4">
                                <div className="min-w-0">
                                  <h4 className="truncate font-bold text-white drop-shadow">
                                    {subject.name}
                                  </h4>
                                  <p className="truncate text-[11px] font-medium text-white/75">
                                    {subject.code}
                                  </p>
                                </div>
                              </div>
                              <ChevronRight className="absolute right-3 top-3 h-4 w-4 text-white/80 transition-transform group-hover:translate-x-0.5" />
                            </div>

                            <div className="px-4 py-4">
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
