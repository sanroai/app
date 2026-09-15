'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useChapters } from '@/lib/learning-hooks';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Spinner, ErrorBanner } from '@/components/ui';
import {
  ChevronRight,
  ChevronLeft,
  BookOpen,
  CheckCircle2,
  GraduationCap,
} from 'lucide-react';
import { cn } from '@/lib/cn';

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-card">
      <div className="h-5 w-40 animate-pulse rounded-lg bg-surface-100" />
      <div className="mt-3 h-3 w-24 animate-pulse rounded bg-surface-100" />
      <div className="mt-4 h-2 w-full animate-pulse rounded-full bg-surface-100" />
    </div>
  );
}

export default function ChaptersPage() {
  const params = useParams();
  const boardId = params.boardId as string;
  const grade = params.grade as string;
  const subjectId = params.subjectId as string;

  const { data: chapterData, isLoading, error } = useChapters(boardId, grade, subjectId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-48 animate-pulse rounded-lg bg-surface-100" />
          <div className="mt-2 h-4 w-64 animate-pulse rounded bg-surface-100" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) return <ErrorBanner message={(error as Error).message} />;

  const items = chapterData?.chapters ?? [];
  const subjectName = chapterData?.subject?.name ?? 'Subject';

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-surface-500">
        <Link href="/app/learn" className="hover:text-brand-600 transition-colors">
          Learn
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-surface-400">Class {grade}</span>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-surface-400">{subjectName}</span>
      </nav>

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/app/learn"
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-surface-200 bg-white text-surface-600 hover:bg-surface-50 transition-all"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Chapters</h1>
          <p className="text-sm text-surface-500">
            Class {grade} &middot; {items.length} chapters available
          </p>
        </div>
      </div>

      {/* Chapter cards */}
      {items.length === 0 ? (
        <Card className="py-16 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-surface-300" />
          <p className="mt-4 text-sm font-medium text-surface-500">
            No chapters available yet
          </p>
          <p className="mt-1 text-xs text-surface-400">
            Content is being prepared for this subject
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((chapter) => {
            const pct =
              chapter.totalContent > 0
                ? Math.round((chapter.completedContent / chapter.totalContent) * 100)
                : 0;

            return (
              <Link
                key={chapter.id}
                href={`/app/learn/chapters/${chapter.id}`}
              >
                <Card className="group cursor-pointer">
                  <CardContent className="p-0">
                    <div className="flex items-start justify-between gap-3 p-6 pb-3">
                      <div className="min-w-0">
                        <Badge variant="secondary" className="mb-2 text-[10px]">
                          {chapter.code}
                        </Badge>
                        <h3 className="font-bold text-surface-900 group-hover:text-brand-700 transition-colors">
                          {chapter.name}
                        </h3>
                      </div>
                      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-surface-300 group-hover:text-brand-600 transition-colors" />
                    </div>

                    <div className="px-6 pb-6">
                      <Progress value={pct} className="h-2" />
                      <div className="mt-2 flex items-center justify-between text-xs text-surface-500">
                        <span>
                          {chapter.totalContent > 0
                            ? `${chapter.completedContent}/${chapter.totalContent} lessons`
                            : 'Coming soon'}
                        </span>
                        {chapter.totalContent > 0 && (
                          <span className="font-medium text-surface-700">{pct}%</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-surface-100 px-6 py-3">
                      <div className="flex items-center gap-1.5 text-xs text-surface-500">
                        <GraduationCap className="h-3.5 w-3.5" />
                        <span>Mastery: {chapter.averageMastery}%</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs font-semibold text-brand-600 hover:text-brand-700 hover:bg-brand-50"
                      >
                        {pct > 0 ? 'Continue' : 'Start'}
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
