'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useConceptDetail, useCompleteContent, useUncompleteContent, useStartPractice, type ContentItem, type ConceptDetail } from '@/lib/learning-hooks';
import { useConceptAr } from '@/lib/ar-hooks';
import { ConceptArPanel } from '@/components/ar/ConceptArPanel';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Spinner, ErrorBanner } from '@/components/ui';
import { VideoWithSegments } from '@/components/video-segments';
import { Markdown } from '@/components/markdown';
import { useChapterHub } from '@/lib/chapter-hooks';
import { normalizeSegments, formatTimestamp, sectionStartForConcept, type VideoSegment } from '@/lib/video-segments';
import { subjectArt, subjectBannerFor } from '@/lib/subject-art';
import {
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Video,
  FileText,
  BookOpen,
  ExternalLink,
  CheckCircle2,
  Circle,
  Brain,
  Play,
  MessageSquare,
  RefreshCw,
  Clock,
  Loader2,
  Sparkles,
  Lightbulb,
  Target,
  Check,
  X,
  ArrowRight,
  GraduationCap,
  Boxes,
} from 'lucide-react';
import { cn } from '@/lib/cn';

const MASTERY_STYLE: Record<string, { badge: string; color: string; bg: string }> = {
  MASTERED: { badge: 'bg-green-100 text-green-700', color: 'text-green-600', bg: 'bg-green-50' },
  GOOD: { badge: 'bg-emerald-50 text-emerald-700', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  DEVELOPING: { badge: 'bg-amber-50 text-amber-700', color: 'text-amber-600', bg: 'bg-amber-50' },
  WEAK: { badge: 'bg-orange-50 text-orange-700', color: 'text-orange-600', bg: 'bg-orange-50' },
  NEEDS_INTERVENTION: { badge: 'bg-red-50 text-red-700', color: 'text-red-600', bg: 'bg-red-50' },
  INSUFFICIENT_EVIDENCE: { badge: 'bg-surface-100 text-surface-600', color: 'text-surface-600', bg: 'bg-surface-50' },
};

// The concept page has three modes, each backed by different server data:
//   learn    - the content (video lessons, notes, revision, the 3D model)
//   practice - one graded quiz session (records mastery evidence and XP)
//   ask      - the contextual AI tutor
//
// "Quick Quiz" and "Challenge" were cut: both replayed the same question pool as
// Practice (Challenge even routed to the same screen), and their XP promises were
// never actually awarded. AR / 3D moved into Learn, where it belongs - it is lesson
// content, not a peer activity. Flashcards were cut as well: the deck replayed the
// same questions, wrote no mastery evidence and awarded no XP, so it could not move
// a student along ASSESS -> DIAGNOSE -> FIX -> RETEST.
const TABS = [
  { id: 'learn', label: 'Learn', icon: BookOpen, color: 'text-blue-600' },
  { id: 'practice', label: 'Practice', icon: Target, color: 'text-purple-600' },
  { id: 'ask', label: 'Ask Sanro AI', icon: Brain, color: 'text-brand-600' },
];

export default function ConceptDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const conceptId = params.conceptId as string;
  // The chapter hub links a concept to the exact slice of the lesson that
  // teaches it (?t=<seconds>&video=<contentId>); without those params the
  // lesson opens normally at 0:00.
  const requestedStart = Number.parseInt(searchParams.get('t') ?? '', 10);
  const startAt = Number.isFinite(requestedStart) && requestedStart > 0 ? requestedStart : 0;
  const videoParam = searchParams.get('video');
  const [fromStart, setFromStart] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') === 'practice' ? 'practice' : 'learn');
  const [openNotes, setOpenNotes] = useState<string[]>([]);
  const [arOpen, setArOpen] = useState(false);

  const { data: concept, isLoading, error } = useConceptDetail(conceptId);
  const completeContent = useCompleteContent();
  const uncompleteContent = useUncompleteContent();
  const startPractice = useStartPractice();
  const { data: arItems } = useConceptAr(conceptId);

  const conceptContent = concept?.content ?? [];
  const conceptVideos = conceptContent.filter((c: ContentItem) => c.type === 'VIDEO');
  // The chapter hub carries the per-video chapter markers, so the strip under
  // each video lesson is resolved from the chapter the concept belongs to.
  const { data: chapterHub } = useChapterHub(concept?.chapter?.id, {
    enabled: conceptVideos.length > 0,
  });

  const segmentsByContentId = new Map<string, VideoSegment[]>();
  for (const video of chapterHub?.videos ?? []) {
    segmentsByContentId.set(video.contentId, video.segments);
  }

  const segmentsForVideo = (item: ContentItem): VideoSegment[] => {
    const own = normalizeSegments((item as { segments?: unknown }).segments);
    if (own.length) return own;
    return segmentsByContentId.get(item.id) ?? [];
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-48 animate-pulse rounded-lg bg-surface-100" />
          <div className="mt-2 h-4 w-64 animate-pulse rounded bg-surface-100" />
        </div>
        <div className="h-32 animate-pulse rounded-2xl bg-surface-50" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-50" />
          ))}
        </div>
      </div>
    );
  }

  if (error) return <ErrorBanner message={(error as Error).message} />;
  if (!concept) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-surface-200 bg-white p-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-surface-300" />
          <p className="mt-4 text-lg font-medium text-surface-700">Concept not found</p>
          <p className="mt-1 text-sm text-surface-400">The concept you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <Link href="/app/library" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700">
            <ChevronLeft className="h-4 w-4" /> Back to Library
          </Link>
        </div>
      </div>
    );
  }

  const mastery = concept.mastery;
  const masteryStyle = mastery?.level ? MASTERY_STYLE[mastery.level] : null;
  const contentItems = concept.content ?? [];
  const arContent = arItems ?? [];
  type PracticeQ = ConceptDetail['practiceQuestions'][number];
  const questions = concept.practiceQuestions ?? [];
  const weakMastery =
    mastery?.level === 'WEAK' ||
    mastery?.level === 'NEEDS_INTERVENTION' ||
    mastery?.level === 'INSUFFICIENT_EVIDENCE';

  const chapterName = concept.chapter?.name ?? '';
  const topicName = concept.topic?.name ?? '';
  const videos = conceptVideos;
  // The hub names the exact clip + second that teaches this concept, and that is
  // what starts playing. A chapter can carry more than one chapter-wide video,
  // so when the named clip is not one of this concept's own lessons the lesson's
  // own marker for this concept decides - applying the other clip's offset would
  // drop the student in the middle of the previous concept.
  const requestedVideo = startAt > 0 ? (videos.find((v) => v.id === videoParam) ?? null) : null;
  const fallbackVideo = startAt > 0 && !requestedVideo ? (videos[0] ?? null) : null;
  const targetVideoId = requestedVideo?.id ?? fallbackVideo?.id ?? null;
  const targetStart = requestedVideo
    ? startAt
    : fallbackVideo
      ? sectionStartForConcept(segmentsForVideo(fallbackVideo), concept.name ?? '')
      : 0;
  const notes = contentItems.filter((c: ContentItem) => c.type === 'NOTES' || c.type === 'ARTICLE');
  const toggleNote = (id: string) =>
    setOpenNotes((prev) => (prev.includes(id) ? prev.filter((n) => n !== id) : [...prev, id]));

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-surface-500">
        <Link href="/app/library" className="hover:text-brand-600 transition-colors">Library</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        {concept.chapter?.id ? (
          <Link
            href={`/app/learn/chapters/${concept.chapter.id}`}
            className="hover:text-brand-600 transition-colors"
          >
            {chapterName}
          </Link>
        ) : (
          <span className="text-surface-400">{chapterName}</span>
        )}
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-surface-400">{topicName}</span>
      </nav>

      {/* Hero: the class+subject artwork behind the concept name, so the concept
          page opens like the chapter hub instead of a flat purple block. */}
      <div className="relative overflow-hidden rounded-3xl border border-surface-200 shadow-card">
        <div className="relative aspect-[16/9] w-full sm:aspect-[21/7]">
          <Image
            src={subjectBannerFor(subjectArt(concept.chapter.subject?.name, concept.chapter.subject?.code), concept.chapter.grade)}
            alt=""
            fill
            sizes="(max-width: 1280px) 100vw, 960px"
            className="object-cover"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10" />
        <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-3 p-4 sm:p-6">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/70">
              {concept.chapter.subject?.name ?? 'Subject'} · Class {concept.chapter.grade}
            </p>
            <h1 className="mt-1 font-display text-2xl font-extrabold leading-tight text-white drop-shadow sm:text-4xl">
              {concept.name}
            </h1>
            <p className="mt-1 text-sm font-medium text-white/80">
              {chapterName} &middot; {topicName}
            </p>
          </div>
          {mastery && (
            <div className="rounded-2xl bg-white/15 px-4 py-2 text-center backdrop-blur-sm">
              <p className="text-2xl font-extrabold text-white">{mastery.score}%</p>
              <p className="text-[10px] font-bold tracking-wide text-white/70">MASTERY</p>
            </div>
          )}
        </div>
        <Link
          href="/app/library"
          aria-label="Go back to Library"
          className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/30 bg-black/30 text-white backdrop-blur-sm transition-all hover:bg-black/45"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
      </div>

      {/* Mastery Progress */}
      {mastery && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-brand-600" />
                <span className="text-sm font-medium text-surface-700">Your Progress</span>
              </div>
              <Badge className={masteryStyle?.badge}>{mastery.level?.replace(/_/g, ' ')}</Badge>
            </div>
            <Progress value={mastery.score} className="h-2" />
            <p className="mt-1 text-xs text-surface-400">{mastery.attempts} attempt{mastery.attempts !== 1 ? 's' : ''} &middot; {contentItems.length} resources &middot; {questions.length} questions</p>
          </CardContent>
        </Card>
      )}

      {/* Fix Weakness CTA */}
      {weakMastery && (
        <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-red-50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100">
                  <Lightbulb className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="font-bold text-surface-900">Needs Improvement</p>
                  <p className="text-sm text-surface-500">
                    {mastery?.score ?? 0}% mastery &middot; Let&apos;s fix this together
                  </p>
                </div>
              </div>
              <Button
                className="rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg"
                onClick={() => setActiveTab('practice')}
              >
                <Target className="h-4 w-4 mr-2" /> Fix This
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab Navigation */}
      <div
        role="tablist"
        className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1"
        onKeyDown={(e) => {
          const idx = TABS.findIndex((t) => t.id === activeTab);
          if (e.key === 'ArrowRight') {
            e.preventDefault();
            const next = (idx + 1) % TABS.length;
            setActiveTab(TABS[next].id);
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            const prev = (idx - 1 + TABS.length) % TABS.length;
            setActiveTab(TABS[prev].id);
          }
        }}
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              id={`tab-${tab.id}`}
              aria-controls={`panel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all',
                isActive
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/25'
                  : 'bg-white text-surface-600 hover:bg-surface-50 border border-surface-100'
              )}
            >
              <Icon className={cn('h-4 w-4', isActive ? 'text-white' : tab.color)} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'learn' && (
        <div role="tabpanel" id="panel-learn" aria-labelledby="tab-learn" className="space-y-6">
          {/* Video Lessons */}
          {videos.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-surface-900">
                <Video className="h-5 w-5 text-blue-600" />
                Video Lessons
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {videos.map((item: ContentItem) => {
                  const isTarget = item.id === targetVideoId;
                  const effectiveStart = isTarget ? (fromStart ? 0 : targetStart) : 0;
                  return (
                  <Card key={item.id} className="overflow-hidden hover:shadow-md transition-all group">
                    <div className="px-4 pb-3 pt-4">
                      <p className="font-semibold text-surface-900 line-clamp-2">{item.title}</p>
                      {isTarget && targetStart > 0 ? (
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700">
                            <Play className="h-3 w-3" />
                            Starting at {formatTimestamp(effectiveStart)}
                          </span>
                          {!fromStart ? (
                            <button
                              type="button"
                              onClick={() => setFromStart(true)}
                              className="text-[11px] font-semibold text-brand-600 underline underline-offset-2 hover:text-brand-700"
                            >
                              Play from the start
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                    <VideoWithSegments
                      key={`${item.id}-${effectiveStart}`}
                      url={item.url}
                      videoId={item.videoId}
                      title={item.title}
                      thumbnailUrl={item.thumbnailUrl}
                      durationSeconds={item.durationSeconds}
                      startSeconds={effectiveStart}
                      autoPlay={isTarget && targetStart > 0}
                      segments={segmentsForVideo(item)}
                    />
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-[10px]">
                          <Video className="mr-1 h-3 w-3" /> VIDEO
                        </Badge>
                        {item.progress?.state === 'COMPLETED' ? (
                          <div className="flex items-center gap-1">
                            <span className="flex items-center text-xs font-semibold text-green-600">
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Completed
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                              onClick={() => uncompleteContent.mutate(item.id)}
                              disabled={uncompleteContent.isPending}
                            >
                              Undo
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-surface-500 hover:text-green-700 hover:bg-green-50"
                            onClick={() => completeContent.mutate(item.id)}
                            disabled={completeContent.isPending}
                          >
                            <Circle className="h-3.5 w-3.5 mr-1" /> Mark as done
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  );
                })}
              </div>
            </section>
          )}

          {/* Interactive 3D model - it is lesson content, so it lives in Learn */}
          {arContent.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-surface-900">
                <Boxes className="h-5 w-5 text-indigo-600" />
                Interactive 3D Model
              </h2>
              <Card className="overflow-hidden transition-all hover:shadow-md">
                <button
                  type="button"
                  onClick={() => setArOpen(true)}
                  className="flex w-full items-center gap-4 p-4 text-left"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50">
                    <Boxes className="h-6 w-6 text-indigo-600" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-surface-900">Open the 3D viewer</span>
                    <span className="block text-sm text-surface-500">
                      {arContent.length} interactive model{arContent.length === 1 ? '' : 's'} &middot; rotate, tap the labels,
                      then try the quick check
                    </span>
                  </span>
                  <ArrowRight className="h-5 w-5 shrink-0 text-surface-400" />
                </button>
              </Card>
            </section>
          )}

          {/* Study Notes */}
          {notes.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-surface-900">
                <FileText className="h-5 w-5 text-emerald-600" />
                Study Notes
              </h2>
              <div className="space-y-2">
                {notes.map((item: ContentItem) => {
                  const open = openNotes.includes(item.id);
                  return (
                    <div key={item.id} className="overflow-hidden rounded-xl border border-surface-100 bg-surface-50 transition-all hover:bg-white hover:shadow-sm">
                      <div className="flex items-center gap-4 p-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                          <FileText className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-surface-900">{item.title}</p>
                          <div className="mt-0.5 flex items-center gap-2 text-xs text-surface-400">
                            <Badge variant="secondary" className="text-[10px]">{item.type}</Badge>
                            {(item.durationSeconds ?? 0) > 0 && (
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{Math.ceil((item.durationSeconds ?? 0) / 60)} min</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {item.description ? (
                            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => toggleNote(item.id)} aria-expanded={open}>
                              {open ? 'Hide' : 'Read'}
                              {open ? <ChevronUp className="h-3.5 w-3.5 ml-1" /> : <ChevronDown className="h-3.5 w-3.5 ml-1" />}
                            </Button>
                          ) : item.url ? (
                            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => window.open(item.url, '_blank')}>
                              <ExternalLink className="h-3.5 w-3.5 mr-1" /> Read
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" className="h-8 text-xs" disabled>Read</Button>
                          )}
                          {item.progress?.state === 'COMPLETED' ? (
                            <>
                              <span className="flex items-center text-xs font-semibold text-green-600" title="Completed">
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Completed
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                onClick={() => uncompleteContent.mutate(item.id)}
                                disabled={uncompleteContent.isPending}
                                title="Mark as unread"
                                aria-label="Mark as unread"
                              >
                                Undo
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs text-surface-500 hover:text-green-700 hover:bg-green-50"
                              onClick={() => completeContent.mutate(item.id)}
                              disabled={completeContent.isPending}
                              title="Mark as read"
                              aria-label="Mark as read"
                            >
                              <Circle className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                      {open && item.description ? (
                        <div className="border-t border-surface-100 bg-white px-4 py-4">
                          <Markdown>{item.description}</Markdown>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Revision Summary */}
          <section>
            <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Lightbulb className="h-6 w-6 text-amber-600" />
                  <h3 className="font-bold text-surface-900">Quick Revision</h3>
                </div>
                <div className="space-y-2 text-sm text-surface-700">
                  {concept.description ? <Markdown>{concept.description}</Markdown> : null}
                  <p>Revise these notes before your next test, then test yourself in Practice.</p>
                  {notes.length > 0 ? (
                    <ul className="mt-3 space-y-1.5">
                      {notes.slice(0, 4).map((item: ContentItem) => (
                        <li key={item.id} className="flex items-center justify-between gap-3 rounded-lg bg-white/70 px-3 py-2">
                          <span className="flex items-center gap-2 font-medium text-surface-800">
                            <FileText className="h-3.5 w-3.5 text-emerald-600" />
                            {item.title}
                          </span>
                          {item.url ? (
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-emerald-700" onClick={() => window.open(item.url, '_blank')}>
                              <ExternalLink className="h-3 w-3 mr-1" /> Read
                            </Button>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {videos.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {videos.slice(0, 3).map((item: ContentItem) => (
                        <Badge
                          key={item.id}
                          variant="secondary"
                          className="cursor-pointer text-xs"
                          onClick={() => item.url && window.open(item.url, '_blank')}
                        >
                          <Play className="mr-1 h-3 w-3" /> {item.title.split(' - ')[0]}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      )}

      {activeTab === 'practice' && (
        <div role="tabpanel" id="panel-practice" aria-labelledby="tab-practice" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-surface-900">Practice Mode</h3>
                  <p className="text-sm text-surface-500">Test your understanding with {questions.length} questions</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="rounded-xl bg-blue-50 p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{questions.length}</p>
                  <p className="text-xs text-surface-500">Questions</p>
                </div>
                <div className="rounded-xl bg-green-50 p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{Math.ceil(questions.length * 0.8)}</p>
                  <p className="text-xs text-surface-500">To Pass</p>
                </div>
                <div className="rounded-xl bg-purple-50 p-4 text-center">
                  <p className="text-2xl font-bold text-purple-600">5 XP</p>
                  <p className="text-xs text-surface-500">Per Correct Answer</p>
                </div>
              </div>
              <Button
                className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
                onClick={() => {
                  // The API tops a thin concept up from its chapter, so the count
                  // is only a request - a concept with no questions of its own is
                  // still practisable.
                  startPractice.mutate(
                    { conceptId, questionCount: Math.min(Math.max(questions.length, 5), 10) },
                    { onSuccess: (data) => router.push(`/app/learn/practice/${data.practiceId}`) }
                  );
                }}
                disabled={startPractice.isPending}
              >
                {startPractice.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                Start Practice
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <p className="mt-3 text-center text-xs text-surface-400">
                Earn 5 XP per correct answer plus 10 XP for finishing. Your result updates your mastery and the
                leaderboard.
              </p>
            </CardContent>
          </Card>

          {weakMastery && (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="h-5 w-5 text-amber-600" />
                    <div>
                      <p className="font-semibold text-surface-900">Retest Recommended</p>
                      <p className="text-xs text-surface-500">Your mastery is low. Retest to improve.</p>
                    </div>
                  </div>
                  <Button variant="outline" className="rounded-xl border-amber-300" onClick={() => {
                    startPractice.mutate(
                      { conceptId, questionCount: 5 },
                      { onSuccess: (data) => router.push(`/app/learn/practice/${data.practiceId}`) }
                    );
                  }}>
                    <RefreshCw className="h-4 w-4 mr-1" /> Retest
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}


      {activeTab === 'ask' && (
        <div role="tabpanel" id="panel-ask" aria-labelledby="tab-ask" className="space-y-4">
          <Card className="border-brand-200 bg-gradient-to-r from-brand-50 to-purple-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Brain className="h-6 w-6 text-brand-600" />
                <div>
                  <h3 className="font-bold text-surface-900">Sanro AI tutor</h3>
                  <p className="text-sm text-surface-500">Get instant help with this concept</p>
                </div>
              </div>
              <div className="space-y-3">
                <Link href={`/app/chat?conceptId=${conceptId}`} className="block rounded-xl bg-white p-4 border border-surface-100 hover:shadow-md transition-all">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-brand-600" />
                    <div>
                      <p className="font-medium text-surface-900">Open AI Chat</p>
                      <p className="text-xs text-surface-500">Ask anything about {concept.name}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-surface-400 ml-auto" />
                  </div>
                </Link>
                {[
                  `Explain ${concept.name} in simple terms`,
                  `Give me practice problems on ${concept.name}`,
                  `What are the key formulas for ${concept.name}?`,
                ].map((q, i) => (
                  <Link key={i} href={`/app/chat?conceptId=${conceptId}&q=${encodeURIComponent(q)}`} className="block rounded-xl bg-white/60 p-3 border border-surface-100 hover:bg-white transition-all">
                    <p className="text-sm text-surface-700">{q}</p>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 3D viewer - opened from the Learn tab */}
      <Dialog open={arOpen} onOpenChange={setArOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Interactive 3D model</DialogTitle>
            <DialogDescription>Rotate the model, tap a label, then try the quick check.</DialogDescription>
          </DialogHeader>
          <ConceptArPanel conceptId={conceptId} items={arContent} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
