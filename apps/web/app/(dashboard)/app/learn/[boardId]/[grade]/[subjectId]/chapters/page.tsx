'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useChapters } from '@/lib/learning-hooks';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ErrorBanner } from '@/components/ui';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth-store';
import { PrefetchLink } from '@/components/prefetch-link';
import { subjectMonogram } from '@/components/subject-banner';
import { subjectArt, subjectBannerFor } from '@/lib/subject-art';
import { prefetchChapterHub } from '@/lib/prefetch';
import { useIdlePrefetch } from '@/lib/use-idle-prefetch';
import {
  ChevronRight,
  ChevronLeft,
  BookOpen,
  GraduationCap,
} from 'lucide-react';

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
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);

  // Warm the first chapter hub while the student scans the chapter list.
  useIdlePrefetch(chapterData?.chapters?.[0]?.id ? `/app/learn/chapters/${chapterData.chapters[0].id}` : null);

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
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-surface-500">
        <Link href="/app/library" className="hover:text-brand-600 transition-colors">
          Library
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-surface-400">Class {grade}</span>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-surface-400">{subjectName}</span>
      </nav>

      {/* Subject header: the same picture the library card showed for this
          class+subject, so the thumbnail is never missing after tapping in. */}
      <div className="flex items-center gap-3 rounded-2xl border border-surface-200 bg-white p-3 shadow-card">
        <Link
          href="/app/library"
          aria-label="Go back to Library"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-surface-200 bg-white text-surface-600 transition-all hover:bg-surface-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div className="relative h-[84px] w-[112px] shrink-0 overflow-hidden rounded-xl bg-surface-900">
          <Image
            src={subjectBannerFor(subjectArt(subjectName, chapterData?.subject?.code), grade)}
            alt=""
            fill
            sizes="112px"
            className="object-cover"
          />
          <span className="absolute left-1.5 top-1.5 inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-white/35 bg-white/20 px-1 text-[9px] font-extrabold tracking-[0.08em] text-white backdrop-blur-sm">
            {subjectMonogram(subjectName, chapterData?.subject?.code)}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-bold text-surface-900">{subjectName}</h1>
          <p className="text-sm text-surface-500">
            Class {grade} &middot; {items.length} {items.length === 1 ? 'chapter' : 'chapters'}
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
              <PrefetchLink
                key={chapter.id}
                href={`/app/learn/chapters/${chapter.id}`}
                prefetchData={() => prefetchChapterHub(queryClient, chapter.id, token)}
                className="block h-full"
              >
                <Card className="group flex h-full cursor-pointer flex-col overflow-hidden">
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-surface-100">
                    {chapter.thumbnailUrl ? (
                      <Image
                        src={chapter.thumbnailUrl}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <BookOpen className="h-8 w-8 text-surface-300" />
                      </div>
                    )}
                    <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold text-brand-700 shadow-sm">
                      Chapter {chapter.order}
                    </span>
                    {pct > 0 ? (
                      <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2 py-1 text-[10px] font-semibold text-white">
                        {pct}%
                      </span>
                    ) : null}
                  </div>

                  <CardContent className="flex flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="line-clamp-2 font-bold text-surface-900 transition-colors group-hover:text-brand-700">
                        {chapter.name}
                      </h3>
                      <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-surface-300 transition-colors group-hover:text-brand-600" />
                    </div>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-surface-400">
                      {chapter.code}
                    </p>

                    <div className="mt-auto pt-4">
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

                      <div className="mt-3 flex items-center justify-between border-t border-surface-100 pt-3 text-xs">
                        <div className="flex items-center gap-1.5 text-surface-500">
                          <GraduationCap className="h-3.5 w-3.5" />
                          <span>Mastery: {chapter.averageMastery}%</span>
                        </div>
                        <span className="inline-flex items-center gap-0.5 font-semibold text-brand-600">
                          {pct > 0 ? 'Continue' : 'Start'}
                          <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </PrefetchLink>
            );
          })}
        </div>
      )}
    </div>
  );
}
