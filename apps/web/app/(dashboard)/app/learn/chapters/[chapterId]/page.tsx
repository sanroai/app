'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ErrorBanner } from '@/components/ui';
import { Markdown } from '@/components/markdown';
import { VideoWithSegments } from '@/components/video-segments';
import { useChapterHub, useChapterPdf, useStartChapterPractice } from '@/lib/chapter-hooks';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileDown,
  FileText,
  Loader2,
  MessageSquare,
  Play,
  Sparkles,
  Target,
  Video,
} from 'lucide-react';
import { cn } from '@/lib/cn';

const MASTERY_STYLE: Record<string, string> = {
  MASTERED: 'bg-green-100 text-green-700',
  GOOD: 'bg-emerald-50 text-emerald-700',
  DEVELOPING: 'bg-amber-50 text-amber-700',
  WEAK: 'bg-orange-50 text-orange-700',
  NEEDS_INTERVENTION: 'bg-red-50 text-red-700',
  INSUFFICIENT_EVIDENCE: 'bg-surface-100 text-surface-600',
};

const STATUS_LABEL: Record<string, string> = {
  NOT_STARTED: 'Not started',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
};

function masteryBadge(mastery: { score: number; level: string } | null) {
  if (!mastery) return { label: 'Not started', className: 'bg-surface-100 text-surface-600' };
  return {
    label: `${mastery.score}% ${mastery.level.replace(/_/g, ' ').toLowerCase()}`,
    className: MASTERY_STYLE[mastery.level] ?? 'bg-surface-100 text-surface-600',
  };
}

export default function ChapterHubPage() {
  const params = useParams();
  const router = useRouter();
  const chapterId = params.chapterId as string;

  const { data: chapter, isLoading, error } = useChapterHub(chapterId);
  const startPractice = useStartChapterPractice();
  const pdf = useChapterPdf();

  const nextConcept = useMemo(() => {
    if (!chapter) return null;
    const pending = chapter.concepts.filter((c) => c.mastery?.level !== 'MASTERED');
    if (!pending.length) return null;
    return [...pending].sort((a, b) => (a.mastery?.score ?? 0) - (b.mastery?.score ?? 0))[0];
  }, [chapter]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-64 animate-pulse rounded-lg bg-surface-100" />
          <div className="mt-2 h-4 w-80 animate-pulse rounded bg-surface-100" />
        </div>
        <div className="h-24 animate-pulse rounded-2xl bg-surface-50" />
        <div className="h-48 animate-pulse rounded-2xl bg-surface-50" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-50" />
          ))}
        </div>
      </div>
    );
  }

  if (error) return <ErrorBanner message={(error as Error).message} />;

  if (!chapter) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-surface-200 bg-white p-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-surface-300" />
          <p className="mt-4 text-lg font-medium text-surface-700">Chapter not found</p>
          <p className="mt-1 text-sm text-surface-400">
            The chapter you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link
            href="/app/library"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            <ChevronLeft className="h-4 w-4" /> Back to Library
          </Link>
        </div>
      </div>
    );
  }

  const { progress, practice } = chapter;
  const practiceError = startPractice.error ? (startPractice.error as Error).message : null;

  const handlePractice = () => {
    startPractice.mutate(chapterId, {
      onSuccess: (data) => {
        if (data?.practiceId) router.push(`/app/learn/practice/${data.practiceId}`);
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-surface-500">
        <Link href="/app/library" className="hover:text-brand-600 transition-colors">
          Library
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        {chapter.grade ? <span className="text-surface-400">Class {chapter.grade}</span> : null}
        {chapter.grade ? <ChevronRight className="h-3.5 w-3.5" /> : null}
        <span className="text-surface-400">{chapter.subject}</span>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="truncate font-medium text-surface-600">{chapter.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start gap-3">
        <Link
          href="/app/library"
          aria-label="Go back to Library"
          className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-surface-200 bg-white text-surface-600 hover:bg-surface-50 transition-all"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0 flex-1">
          {chapter.code ? (
            <Badge variant="secondary" className="mb-2 text-[10px]">
              {chapter.code}
            </Badge>
          ) : null}
          <h1 className="text-2xl font-bold text-surface-900">{chapter.name}</h1>
          <p className="mt-1 text-sm text-surface-500">
            {chapter.subject}
            {chapter.grade ? ` · Class ${chapter.grade}` : ''}
            {` · ${progress.concepts} concept${progress.concepts === 1 ? '' : 's'}`}
          </p>
        </div>
        <div className="hidden rounded-2xl bg-brand-50 px-4 py-2 text-center sm:block">
          <p className="text-2xl font-bold text-brand-600">{progress.percent}%</p>
          <p className="text-[10px] font-medium text-surface-400">MASTERED</p>
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="p-5">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-brand-600" />
              <span className="text-sm font-medium text-surface-700">Chapter progress</span>
            </div>
            <span className="text-sm font-semibold text-surface-700">{progress.percent}%</span>
          </div>
          <Progress value={progress.percent} className="h-2" />
          <div className="mt-3 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-surface-50 px-2 py-2">
              <p className="text-lg font-bold text-surface-800">{progress.concepts}</p>
              <p className="text-[11px] text-surface-500">Concepts</p>
            </div>
            <div className="rounded-xl bg-surface-50 px-2 py-2">
              <p className="text-lg font-bold text-green-600">{progress.mastered}</p>
              <p className="text-[11px] text-surface-500">Mastered</p>
            </div>
            <div className="rounded-xl bg-surface-50 px-2 py-2">
              <p className="text-lg font-bold text-blue-600">{progress.videos}</p>
              <p className="text-[11px] text-surface-500">Videos</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        {nextConcept ? (
          <Button
            onClick={() => router.push(`/app/learn/concepts/${nextConcept.id}`)}
            className="rounded-xl bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-700 hover:to-purple-700"
          >
            <Play className="h-4 w-4" />
            Continue where you left off
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <span className="inline-flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700">
            <CheckCircle2 className="h-4 w-4" /> Every concept in this chapter is mastered
          </span>
        )}

        <Button asChild variant="ghost" className="rounded-xl">
          <Link href={`/app/chat?chapterId=${chapterId}`}>
            <MessageSquare className="h-4 w-4" />
            Ask SANRO AI about this chapter
          </Link>
        </Button>

        {chapter.pdfUrl ? (
          <Button
            variant="ghost"
            onClick={() => pdf.openPdf(chapterId, chapter.pdfUrl)}
            className="rounded-xl"
          >
            <FileDown className="h-4 w-4" />
            View chapter PDF
          </Button>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <Button variant="ghost" disabled className="rounded-xl">
                  <FileDown className="h-4 w-4" />
                  View chapter PDF
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>PDF not available for this chapter</TooltipContent>
          </Tooltip>
        )}
      </div>

      {nextConcept ? (
        <p className="text-xs text-surface-400">
          Pick up at <span className="font-medium text-surface-600">{nextConcept.name}</span> - it is
          the concept you have mastered least so far.
        </p>
      ) : null}

      {practiceError ? <ErrorBanner message={practiceError} /> : null}

      {/* Chapter notes */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-surface-900">
          <FileText className="h-5 w-5 text-emerald-600" />
          Chapter Notes
        </h2>
        <Card>
          <CardContent className="p-5">
            {chapter.summary ? (
              <Markdown>{chapter.summary}</Markdown>
            ) : (
              <p className="py-2 text-sm text-surface-400">
                No chapter notes have been written yet. The concept pages below carry the lesson
                content.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Practice */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-surface-900">
          <Target className="h-5 w-5 text-purple-600" />
          Practice the whole chapter
        </h2>
        <Card className="border-brand-100 bg-gradient-to-r from-brand-50 to-purple-50">
          <CardContent className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-semibold text-surface-900">
                  {practice.available
                    ? `${practice.questionCount} question${practice.questionCount === 1 ? '' : 's'} covering this chapter`
                    : 'No practice questions for this chapter yet'}
                </p>
                <p className="mt-1 text-sm text-surface-500">
                  {practice.available
                    ? 'One set, every concept - 5 XP per correct answer plus 10 XP for finishing.'
                    : 'Practice sets are prepared per chapter as the question bank grows.'}
                </p>
              </div>
              <Button
                onClick={handlePractice}
                disabled={!practice.available || startPractice.isPending}
                className="rounded-xl"
              >
                {startPractice.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Start chapter practice
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Concepts */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-surface-900">
          <Brain className="h-5 w-5 text-brand-600" />
          Concepts in this chapter
        </h2>
        {chapter.concepts.length === 0 ? (
          <Card className="py-12 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-surface-300" />
            <p className="mt-3 text-sm font-medium text-surface-500">
              No concepts in this chapter yet
            </p>
            <p className="mt-1 text-xs text-surface-400">Content is being prepared</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {chapter.concepts.map((concept) => {
              const badge = masteryBadge(concept.mastery);
              return (
                <Link
                  key={concept.id}
                  href={`/app/learn/concepts/${concept.id}`}
                  className="block"
                >
                  <Card className="transition-all hover:shadow-md">
                    <CardContent className="flex items-center gap-4 p-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50">
                        <Brain className="h-5 w-5 text-brand-600" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-surface-900">
                          {concept.name}
                        </span>
                        <span className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-surface-400">
                          {concept.topicName ? <span>{concept.topicName}</span> : null}
                          <span>{STATUS_LABEL[concept.status] ?? concept.status}</span>
                          {concept.hasVideo ? (
                            <span className="inline-flex items-center gap-1">
                              <Video className="h-3 w-3" /> Video lesson
                            </span>
                          ) : null}
                        </span>
                      </span>
                      <Badge className={cn('shrink-0 text-[10px]', badge.className)}>
                        {badge.label}
                      </Badge>
                      <ChevronRight className="h-4 w-4 shrink-0 text-surface-300" />
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Videos */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-surface-900">
          <Video className="h-5 w-5 text-blue-600" />
          Video Lessons
        </h2>
        {chapter.videos.length === 0 ? (
          <Card className="py-12 text-center">
            <Video className="mx-auto h-10 w-10 text-surface-300" />
            <p className="mt-3 text-sm font-medium text-surface-500">
              No video lessons for this chapter yet
            </p>
            <p className="mt-1 text-xs text-surface-400">
              Videos are added chapter by chapter - check back soon.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {chapter.videos.map((video) => (
              <Card key={video.contentId} className="overflow-hidden transition-all hover:shadow-md">
                <VideoWithSegments
                  url={video.url}
                  title={video.title}
                  thumbnailUrl={video.thumbnailUrl}
                  durationSeconds={video.durationSeconds}
                  segments={video.segments}
                  className="pt-0"
                />
                <CardContent className="p-4">
                  <p className="font-semibold text-surface-900 line-clamp-2">{video.title}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-surface-400">
                    <Badge variant="secondary" className="text-[10px]">
                      <Video className="mr-1 h-3 w-3" /> VIDEO
                    </Badge>
                    {video.durationSeconds ? (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {Math.ceil(video.durationSeconds / 60)} min
                      </span>
                    ) : null}
                    {video.segments.length ? (
                      <span className="inline-flex items-center gap-1">
                        {video.segments.length} marker{video.segments.length === 1 ? '' : 's'}
                      </span>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Chapter PDF */}
      <Dialog
        open={pdf.isOpen}
        onOpenChange={(open) => {
          if (!open) pdf.closePdf();
        }}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Chapter PDF</DialogTitle>
            <DialogDescription>
              {chapter.name} &middot; {chapter.subject}
              {chapter.grade ? ` · Class ${chapter.grade}` : ''}
            </DialogDescription>
          </DialogHeader>
          {pdf.loading ? (
            <div className="flex h-[70vh] items-center justify-center text-sm text-surface-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading the chapter PDF…
            </div>
          ) : pdf.error ? (
            <div className="flex h-[50vh] flex-col items-center justify-center px-6 text-center">
              <AlertCircle className="h-10 w-10 text-surface-300" />
              <p className="mt-3 text-sm font-medium text-surface-700">{pdf.error}</p>
              <p className="mt-1 text-xs text-surface-400">
                The chapter notes above cover the same content.
              </p>
            </div>
          ) : pdf.url ? (
            <iframe
              src={pdf.url}
              title={`${chapter.name} PDF`}
              className="h-[70vh] w-full rounded-xl border border-surface-200"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
