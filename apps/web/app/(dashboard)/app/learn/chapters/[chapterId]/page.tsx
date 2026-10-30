'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ErrorBanner } from '@/components/ui';
import { Markdown } from '@/components/markdown';
import { VideoWithSegments } from '@/components/video-segments';
import { formatTimestamp } from '@/lib/video-segments';
import { subjectMonogram } from '@/components/subject-banner';
import { PrefetchLink } from '@/components/prefetch-link';
import { prefetchConcept } from '@/lib/prefetch';
import { useIdlePrefetch } from '@/lib/use-idle-prefetch';
import { subjectArt, subjectBannerFor } from '@/lib/subject-art';
import {
  resolveApiPath,
  useChapterHub,
  useChapterPages,
  useChapterPdf,
  useStartChapterPractice,
} from '@/lib/chapter-hooks';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
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
  const textbook = useChapterPages(chapterId);
  const [readerOpen, setReaderOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);

  // The hub's job is to send the student into a concept, so that page is warmed
  // as soon as the hub is idle.
  const conceptToWarm = chapter?.concepts?.find((c) => c.mastery?.level !== 'MASTERED') ?? chapter?.concepts?.[0];
  useIdlePrefetch(conceptToWarm ? `/app/learn/concepts/${conceptToWarm.id}` : null);

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

  const art = subjectArt(chapter.subject, chapter.code);
  const bannerSrc = subjectBannerFor(art, chapter.grade);

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
        <span className="truncate font-medium text-surface-600">
          {chapter.order ? `Chapter ${chapter.order} · ${chapter.name}` : chapter.name}
        </span>
      </nav>

      {/* Header - the subject's own artwork, so opening a chapter feels like
          opening a book rather than reading a table row. */}
      <div className="relative overflow-hidden rounded-3xl shadow-card" style={{ backgroundColor: '#0b0614' }}>
        <Image
          src={bannerSrc}
          alt=""
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 1100px"
          className="object-cover opacity-80"
        />
        <div
          className="absolute inset-0 mix-blend-soft-light"
          style={{ background: `linear-gradient(120deg, ${art.accent}, ${art.accent2})` }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(11,6,20,0.94) 0%, rgba(11,6,20,0.74) 55%, rgba(11,6,20,0.3) 100%)',
          }}
        />
        <div className="relative flex items-start gap-3 p-5 sm:p-7">
          <Link
            href="/app/library"
            aria-label="Go back to Library"
            className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white backdrop-blur transition-all hover:bg-white/25"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          {/* Designed monogram instead of a glossy 3D icon: the subject is set
              as type on the banner, matching the subject cards. */}
          <span className="mt-0.5 hidden h-12 min-w-12 shrink-0 items-center justify-center rounded-2xl border border-white/35 bg-white/15 px-2 text-xs font-extrabold tracking-[0.12em] text-white backdrop-blur sm:flex">
            {subjectMonogram(chapter.subject, chapter.code)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {chapter.order ? (
                <span className="inline-flex rounded-full bg-white px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-brand-700">
                  CHAPTER {chapter.order}
                </span>
              ) : null}
              {chapter.code ? (
                <span className="inline-flex rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white/80 backdrop-blur">
                  {chapter.code}
                </span>
              ) : null}
            </div>
            <h1 className="text-xl font-bold text-white sm:text-2xl">{chapter.name}</h1>
            <p className="mt-1 text-sm text-white/70">
              {chapter.subject}
              {chapter.grade ? ` · Class ${chapter.grade}` : ''}
              {` · ${progress.concepts} concept${progress.concepts === 1 ? '' : 's'}`}
            </p>
          </div>
          <div className="hidden shrink-0 rounded-2xl bg-white/15 px-4 py-2 text-center backdrop-blur sm:block">
            <p className="text-2xl font-bold text-white">{progress.percent}%</p>
            <p className="text-[10px] font-medium text-white/70">MASTERED</p>
          </div>
        </div>
      </div>

      {/* Continue + chapter progress - one card, because "where do I start"
          and "how far have I got" are the same question at the top of a chapter. */}
      <Card className="overflow-hidden">
        <CardContent className="p-5">
          {nextConcept ? (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wide text-brand-600">
                  Continue where you left off
                </p>
                <p className="mt-1 truncate font-semibold text-surface-900">{nextConcept.name}</p>
                <p className="mt-0.5 text-xs text-surface-400">
                  The concept you have mastered least so far.
                </p>
              </div>
              <Button
                onMouseEnter={() => prefetchConcept(queryClient, nextConcept.id, token)}
                onFocus={() => prefetchConcept(queryClient, nextConcept.id, token)}
                onClick={() =>
                  router.push(
                    `/app/learn/concepts/${nextConcept.id}${
                      nextConcept.section
                        ? `?t=${nextConcept.section.startSeconds}&video=${nextConcept.section.contentId}`
                        : ''
                    }`,
                  )
                }
                className="rounded-xl bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-700 hover:to-purple-700"
              >
                <Play className="h-4 w-4" />
                Continue learning
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700">
              <CheckCircle2 className="h-4 w-4" /> Every concept in this chapter is mastered
            </span>
          )}

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-brand-600" />
                <span className="text-sm font-medium text-surface-700">
                  {progress.mastered} of {progress.concepts} concepts mastered
                </span>
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
          </div>
        </CardContent>
      </Card>

      {practiceError ? <ErrorBanner message={practiceError} /> : null}

      {/* Contents - the chapter's map, in the order it is taught. Every row
          carries the part of the video that teaches it, so a tap lands there. */}
      <section>
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-bold text-surface-900">
            <Brain className="h-5 w-5 text-brand-600" />
            Contents
          </h2>
          <span className="text-xs text-surface-400">
            {chapter.concepts.length} concept{chapter.concepts.length === 1 ? '' : 's'}
          </span>
        </div>
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
            {chapter.concepts.map((concept, index) => {
              const badge = masteryBadge(concept.mastery);
              const serial = concept.order || index + 1;
              const section = concept.section;
              const href = `/app/learn/concepts/${concept.id}${
                section ? `?t=${section.startSeconds}&video=${section.contentId}` : ''
              }`;
              return (
                <PrefetchLink
                  key={concept.id}
                  href={href}
                  prefetchData={() => prefetchConcept(queryClient, concept.id, token)}
                  className="block"
                >
                  <Card className="transition-all hover:shadow-md">
                    <CardContent className="flex items-center gap-3 p-4">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-xs font-bold text-brand-700">
                        {String(serial).padStart(2, '0')}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-surface-900">
                          {concept.name}
                        </span>
                        <span className="mt-0.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-surface-400">
                          <span className="inline-flex items-center gap-1.5">
                            {section ? (
                              <>
                                <Clock className="h-3 w-3" />
                                {formatTimestamp(section.durationSeconds)} video
                              </>
                            ) : concept.hasVideo ? (
                              <>
                                <Video className="h-3 w-3" /> Video lesson
                              </>
                            ) : (
                              'No video'
                            )}
                            <span>· {STATUS_LABEL[concept.status] ?? concept.status}</span>
                          </span>
                          {section ? (
                            <span className="font-semibold tabular-nums text-brand-600">
                              {formatTimestamp(section.startSeconds)} –{' '}
                              {formatTimestamp(section.endSeconds)}
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
                </PrefetchLink>
              );
            })}
          </div>
        )}
      </section>

      {/* Learn - the lesson first, the textbook right beneath it */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-surface-900">
          <Video className="h-5 w-5 text-blue-600" />
          Learn
        </h2>
        {chapter.videos.length === 0 ? (
          <Card className="py-10 text-center">
            <Video className="mx-auto h-10 w-10 text-surface-300" />
            <p className="mt-3 text-sm font-medium text-surface-500">
              No video lessons for this chapter yet
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {chapter.videos.map((video) => (
              <Card key={video.contentId} className="overflow-hidden transition-all hover:shadow-md">
                <CardContent className="p-4 pb-1">
                  <p className="font-semibold text-surface-900 line-clamp-2">{video.title}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-surface-400">
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
                      <span>
                        {video.segments.length} section{video.segments.length === 1 ? '' : 's'}
                      </span>
                    ) : null}
                  </div>
                </CardContent>
                <VideoWithSegments
                  url={video.url}
                  title={video.title}
                  thumbnailUrl={video.thumbnailUrl}
                  durationSeconds={video.durationSeconds}
                  segments={video.segments}
                  className="pb-2"
                  collapsible
                />
              </Card>
            ))}
          </div>
        )}

        <Card className="mt-4">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-surface-900">Read the textbook</p>
                <p className="text-xs text-surface-400">
                  {chapter.pdfUrl
                    ? 'The NCERT chapter, page by page in the app'
                    : 'No textbook available for this chapter yet'}
                </p>
              </div>
            </div>
            {chapter.pdfUrl ? (
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  if (textbook.data?.count) {
                    pdf.closePdf();
                    setReaderOpen(true);
                  } else {
                    void pdf.openPdf(chapterId, chapter.pdfUrl);
                  }
                }}
              >
                <BookOpen className="h-4 w-4" />
                {textbook.data?.count ? 'Open textbook' : 'View chapter PDF'}
              </Button>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <Button variant="outline" disabled className="rounded-xl">
                      <FileDown className="h-4 w-4" />
                      Not available
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>Textbook not available for this chapter</TooltipContent>
              </Tooltip>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Practise - one session over the whole chapter */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-surface-900">
          <Target className="h-5 w-5 text-purple-600" />
          Practise
        </h2>
        <Card className="border-brand-100 bg-gradient-to-r from-brand-50 to-purple-50">
          <CardContent className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-semibold text-surface-900">
                  Practise the whole chapter
                </p>
                <p className="mt-1 text-sm text-surface-500">
                  {practice.available
                    ? `${practice.questionCount} question${practice.questionCount === 1 ? '' : 's'} across every concept · 5 XP per correct answer plus 10 XP for finishing.`
                    : 'No practice questions for this chapter yet - sets are prepared as the question bank grows.'}
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

      {/* Ask - the tutor, scoped to this chapter */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-surface-900">
          <MessageSquare className="h-5 w-5 text-brand-600" />
          Ask
        </h2>
        <Card>
          <CardContent className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-semibold text-surface-900">Ask Sanro AI about this chapter</p>
                <p className="mt-1 text-sm text-surface-500">
                  Explanations, doubts and worked examples - the tutor already has this chapter&apos;s
                  concepts in front of it.
                </p>
              </div>
              <Button asChild className="rounded-xl">
                <Link href={`/app/chat?chapterId=${chapterId}`}>
                  <MessageSquare className="h-4 w-4" />
                  Start a chat
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Chapter notes - the revision sheet, collapsed by default because
          reading it should be a choice, not the first screenful. */}
      <section>
        <button
          type="button"
          onClick={() => setNotesOpen((open) => !open)}
          aria-expanded={notesOpen}
          className="mb-3 flex w-full items-center justify-between gap-3 text-left"
        >
          <h2 className="flex items-center gap-2 text-lg font-bold text-surface-900">
            <FileText className="h-5 w-5 text-emerald-600" />
            Chapter notes
          </h2>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600">
            {notesOpen ? 'Hide' : 'Show'}
            <ChevronRight
              className={cn('h-4 w-4 transition-transform', notesOpen && 'rotate-90')}
            />
          </span>
        </button>
        {notesOpen ? (
          <Card>
            <CardContent className="p-5">
              {chapter.summary ? (
                <Markdown>{chapter.summary}</Markdown>
              ) : (
                <p className="py-2 text-sm text-surface-400">
                  No chapter notes have been written yet. The concept pages and lessons above carry
                  the same content.
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <p className="text-xs text-surface-400">
            The full revision sheet for this chapter ·{' '}
            {chapter.summary ? 'open to revise the whole chapter' : 'coming soon'}
          </p>
        )}
      </section>

      {/* Textbook - rendered pages when the book is on disk, PDF otherwise */}
      <Dialog
        open={readerOpen || pdf.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            setReaderOpen(false);
            pdf.closePdf();
          }
        }}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Textbook</DialogTitle>
            <DialogDescription>
              {chapter.name} &middot; {chapter.subject}
              {chapter.grade ? ` · Class ${chapter.grade}` : ''}
            </DialogDescription>
          </DialogHeader>

          {textbook.data?.count ? (
            <div className="space-y-3">
              <div className="max-h-[70vh] overflow-y-auto rounded-xl border border-surface-200 bg-surface-100 p-3">
                <div className="space-y-3">
                  {textbook.data.pages.map((page) => (
                    <img
                      key={page.index}
                      src={resolveApiPath(page.path)}
                      alt={`${chapter.name} - page ${page.index}`}
                      loading="lazy"
                      className="mx-auto w-full rounded-lg bg-white shadow-sm"
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-surface-400">
                  {textbook.data.count} page{textbook.data.count === 1 ? '' : 's'} &middot; NCERT chapter
                </p>
                {chapter.pdfUrl ? (
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() =>
                      void pdf.downloadPdf(
                        chapterId,
                        `${chapter.name} (${chapter.code}).pdf`,
                        chapter.pdfUrl,
                      )
                    }
                  >
                    <Download className="h-4 w-4" />
                    Download PDF
                  </Button>
                ) : null}
              </div>
            </div>
          ) : pdf.loading ? (
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
            <div className="space-y-3">
              <iframe
                src={pdf.url}
                title={`${chapter.name} PDF`}
                className="h-[70vh] w-full rounded-xl border border-surface-200"
              />
              <div className="flex justify-end">
                <a
                  href={pdf.url}
                  download={`${chapter.name} (${chapter.code}).pdf`}
                  className="inline-flex items-center gap-2 rounded-xl border border-surface-200 px-4 py-2 text-sm font-medium text-surface-700 transition-colors hover:border-brand-300 hover:text-brand-700"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </a>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
