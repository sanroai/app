'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useConceptDetail, useCompleteContent, useStartPractice, useRateFlashcard, type ContentItem, type ConceptDetail } from '@/lib/learning-hooks';
import { useConceptAr } from '@/lib/ar-hooks';
import { ConceptArPanel } from '@/components/ar/ConceptArPanel';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Spinner, ErrorBanner } from '@/components/ui';
import {
  ChevronRight,
  ChevronLeft,
  Video,
  FileText,
  BookOpen,
  ExternalLink,
  CheckCircle2,
  Brain,
  Play,
  MessageSquare,
  RefreshCw,
  Clock,
  Loader2,
  Sparkles,
  Lightbulb,
  Target,
  Trophy,
  Zap,
  Eye,
  Gamepad2,
  RotateCcw,
  Star,
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

const TABS = [
  { id: 'learn', label: 'Learn', icon: BookOpen, color: 'text-blue-600' },
  { id: 'practice', label: 'Practice', icon: Target, color: 'text-purple-600' },
  { id: 'quiz', label: 'Quick Quiz', icon: Zap, color: 'text-amber-600' },
  { id: 'flashcards', label: 'Flashcards', icon: RotateCcw, color: 'text-pink-600' },
  { id: 'challenge', label: 'Challenge', icon: Gamepad2, color: 'text-red-600' },
  { id: 'ask', label: 'Ask Sanro AI', icon: Brain, color: 'text-brand-600' },
];

const AR_TAB = { id: 'ar', label: 'AR / 3D', icon: Boxes, color: 'text-indigo-600' };

export default function ConceptDetailPage() {
  const params = useParams();
  const router = useRouter();
  const conceptId = params.conceptId as string;
  const [activeTab, setActiveTab] = useState('learn');
  const [showAnswer, setShowAnswer] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState<{ correct: number; total: number } | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const { data: concept, isLoading, error } = useConceptDetail(conceptId);
  const completeContent = useCompleteContent();
  const startPractice = useStartPractice();
  const rateFlashcard = useRateFlashcard();
  const { data: arItems } = useConceptAr(conceptId);

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
          <Link href="/app/learn" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700">
            <ChevronLeft className="h-4 w-4" /> Back to Learn
          </Link>
        </div>
      </div>
    );
  }

  const mastery = concept.mastery;
  const masteryStyle = mastery?.level ? MASTERY_STYLE[mastery.level] : null;
  const contentItems = concept.content ?? [];
  const arContent = arItems ?? [];
  const tabs = arContent.length > 0 ? [...TABS.slice(0, 5), AR_TAB, ...TABS.slice(5)] : TABS;
  type PracticeQ = ConceptDetail['practiceQuestions'][number];
  const questions = concept.practiceQuestions ?? [];
  const weakMastery =
    mastery?.level === 'WEAK' ||
    mastery?.level === 'NEEDS_INTERVENTION' ||
    mastery?.level === 'INSUFFICIENT_EVIDENCE';

  const chapterName = concept.chapter?.name ?? '';
  const topicName = concept.topic?.name ?? '';
  const videos = contentItems.filter((c: ContentItem) => c.type === 'VIDEO');
  const notes = contentItems.filter((c: ContentItem) => c.type === 'NOTES' || c.type === 'ARTICLE');

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-surface-500">
        <Link href="/app/learn" className="hover:text-brand-600 transition-colors">Learn</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-surface-400">{chapterName}</span>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-surface-400">{topicName}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start gap-3">
        <Link
          href="/app/learn"
          className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-surface-200 bg-white text-surface-600 hover:bg-surface-50 transition-all"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-surface-900">{concept.name}</h1>
          <p className="mt-1 text-sm text-surface-500">{chapterName} &middot; {topicName}</p>
        </div>
        {mastery && (
          <div className={cn('rounded-2xl px-4 py-2 text-center', masteryStyle?.bg ?? 'bg-surface-50')}>
            <p className={cn('text-2xl font-bold', masteryStyle?.color ?? 'text-surface-900')}>{mastery.score}%</p>
            <p className="text-[10px] font-medium text-surface-400">MASTERY</p>
          </div>
        )}
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
          const idx = tabs.findIndex((t) => t.id === activeTab);
          if (e.key === 'ArrowRight') {
            e.preventDefault();
            const next = (idx + 1) % tabs.length;
            setActiveTab(tabs[next].id);
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            const prev = (idx - 1 + tabs.length) % tabs.length;
            setActiveTab(tabs[prev].id);
          }
        }}
      >
        {tabs.map((tab) => {
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
                  const isYouTube = item.url != null && (item.url.includes('youtube.com') || item.url.includes('youtu.be'));
                  const youtubeId = isYouTube ? (item.url!.match(/(?:v=|youtu\.be\/)([^&?/]+)/) || [])[1] : null;
                  return (
                    <Card key={item.id} className="overflow-hidden hover:shadow-md transition-all group">
                      {youtubeId ? (
                        <div className="relative aspect-video">
                          <iframe
                            src={`https://www.youtube.com/embed/${youtubeId}`}
                            className="absolute inset-0 w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title={item.title}
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <div className="relative aspect-video bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center cursor-pointer" onClick={() => item.url && window.open(item.url, '_blank')}>
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm group-hover:bg-white/30 transition-all">
                            <Play className="h-8 w-8 text-white ml-1" />
                          </div>
                          {item.durationSeconds && (
                            <div className="absolute bottom-2 right-2 rounded-lg bg-black/60 px-2 py-1 text-xs text-white">
                              {Math.ceil(item.durationSeconds / 60)} min
                            </div>
                          )}
                        </div>
                      )}
                      <CardContent className="p-4">
                        <p className="font-semibold text-surface-900 line-clamp-2">{item.title}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <Badge variant="secondary" className="text-[10px]">
                            <Video className="mr-1 h-3 w-3" /> VIDEO
                          </Badge>
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-green-600" onClick={() => completeContent.mutate(item.id)} disabled={completeContent.isPending}>
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Done
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
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
                {notes.map((item: ContentItem) => (
                  <div key={item.id} className="flex items-center gap-4 rounded-xl border border-surface-100 bg-surface-50 p-4 transition-all hover:bg-white hover:shadow-sm">
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
                      {item.url ? (
                        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => window.open(item.url, '_blank')}>
                          <ExternalLink className="h-3.5 w-3.5 mr-1" /> Read
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" className="h-8 text-xs" disabled>Read</Button>
                      )}
                      <Button variant="ghost" size="sm" className="h-8 text-xs text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => completeContent.mutate(item.id)} disabled={completeContent.isPending}>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
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
                  {concept.description && <p>{concept.description}</p>}
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
                  <p className="text-2xl font-bold text-purple-600">5</p>
                  <p className="text-xs text-surface-500">XP Each</p>
                </div>
              </div>
              <Button
                className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
                onClick={() => {
                  startPractice.mutate(
                    { conceptId, questionCount: Math.min(questions.length, 10) },
                    { onSuccess: (data) => router.push(`/app/learn/practice/${data.practiceId}`) }
                  );
                }}
                disabled={startPractice.isPending || questions.length === 0}
              >
                {startPractice.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                Start Practice
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
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

      {activeTab === 'quiz' && (
        <div role="tabpanel" id="panel-quiz" aria-labelledby="tab-quiz" className="space-y-4">
          <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="h-6 w-6 text-amber-600" />
                <div>
                  <h3 className="font-bold text-surface-900">Quick Quiz</h3>
                  <p className="text-sm text-surface-500">{Math.min(questions.length, 5)} questions &middot; ~2 minutes &middot; +25 XP</p>
                </div>
              </div>
              {questions.length === 0 ? (
                <p className="text-sm text-surface-500 text-center py-4">No questions available for this concept yet.</p>
              ) : quizScore ? (
                <div className="text-center py-4">
                  <div className={cn('text-5xl font-bold mb-2', quizScore.correct >= 4 ? 'text-green-600' : quizScore.correct >= 2 ? 'text-amber-600' : 'text-red-600')}>
                    {quizScore.correct}/{quizScore.total}
                  </div>
                  <p className="text-surface-500 mb-4">
                    {quizScore.correct >= 4 ? 'Excellent! You nailed it!' : quizScore.correct >= 2 ? 'Good effort! Keep practicing.' : 'Keep learning, you\'ll get there!'}
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button className="rounded-xl" onClick={() => { setQuizScore(null); setShowAnswer(null); }}>
                      <RotateCcw className="h-4 w-4 mr-2" /> Try Again
                    </Button>
                    {weakMastery && (
                      <Button variant="outline" className="rounded-xl" onClick={() => setActiveTab('practice')}>
                        <Target className="h-4 w-4 mr-2" /> Fix Weakness
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {questions.slice(0, 5).map((q: PracticeQ, i: number) => (
                    <div key={q.id ?? i} className="mb-4 rounded-xl bg-white p-4 border border-surface-100">
                      <p className="font-medium text-surface-900 mb-3">Q{i + 1}. {q.text}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(q.options ?? []).map((opt, oi) => (
                          <button
                            key={oi}
                            onClick={() => {
                              setSelectedAnswers((prev) => ({ ...prev, [i]: oi }));
                              setShowAnswer(i);
                            }}
                            className={cn(
                              'rounded-lg border p-2 text-sm text-left transition-all',
                              showAnswer === i && opt.isCorrect
                                ? 'border-green-300 bg-green-50 text-green-700'
                                : showAnswer === i
                                  ? 'border-red-300 bg-red-50 text-red-700'
                                  : 'border-surface-200 hover:bg-surface-50'
                            )}
                          >
                            {String.fromCharCode(65 + oi)}. {opt.text}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {(() => {
                    const quizCount = Math.min(questions.length, 5);
                    const allAnswered = Array.from({ length: quizCount }, (_, i) => i).every((i) => selectedAnswers[i] != null);
                    return !allAnswered ? (
                      <p className="text-center text-sm text-red-600 mt-2">Please answer all questions</p>
                    ) : null;
                  })()}
                  <Button
                    className="w-full rounded-xl bg-amber-500 hover:bg-amber-600 text-white"
                    onClick={() => {
                      const quizQuestions = questions.slice(0, 5);
                      const allAnswered = quizQuestions.every((_, i) => selectedAnswers[i] != null);
                      if (!allAnswered) return;
                      let correct = 0;
                      quizQuestions.forEach((q: PracticeQ, i: number) => {
                        const opts = q.options ?? [];
                        const selectedIdx = selectedAnswers[i];
                        if (selectedIdx != null) {
                          const selectedOpt = opts[selectedIdx];
                          if (selectedOpt?.isCorrect) {
                            correct++;
                          }
                        }
                      });
                      setQuizScore({ correct, total: quizQuestions.length });
                    }}
                  >
                    Submit Quiz <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'flashcards' && (
        <div role="tabpanel" id="panel-flashcards" aria-labelledby="tab-flashcards" className="space-y-4">
          <Card className="border-pink-200 bg-gradient-to-r from-pink-50 to-rose-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <RotateCcw className="h-6 w-6 text-pink-600" />
                <div>
                  <h3 className="font-bold text-surface-900">Flashcards</h3>
                  <p className="text-sm text-surface-500">{questions.length > 0 ? `Card ${flashcardIndex + 1} of ${Math.min(questions.length, 10)}` : 'No cards available'}</p>
                </div>
              </div>
              {questions.length === 0 ? (
                <p className="text-sm text-surface-500 text-center py-4">No flashcards available for this concept yet.</p>
              ) : (
                <>
                  <div
                    className="relative min-h-[200px] rounded-2xl bg-white border-2 border-pink-200 p-6 cursor-pointer transition-all hover:shadow-lg"
                    onClick={() => setFlipped(!flipped)}
                  >
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      {concept.flashcardRatings?.[questions[flashcardIndex]?.id] && (
                        <Badge variant="secondary" className="text-[10px]">
                          {concept.flashcardRatings[questions[flashcardIndex].id]}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-[10px]">{flipped ? 'ANSWER' : 'QUESTION'}</Badge>
                    </div>
                    <p className="text-lg font-medium text-surface-900 mt-4">
                      {flipped
                        ? (questions[flashcardIndex]?.explanation ?? questions[flashcardIndex]?.answer ?? 'Answer will appear here')
                        : questions[flashcardIndex]?.text ?? 'Question'
                      }
                    </p>
                    <p className="text-xs text-surface-400 mt-4">Tap to flip</p>
                  </div>
                  {flipped && (
                    <div className="mt-4 flex gap-2">
                      {[
                        { label: 'Again', rating: 'AGAIN', color: 'bg-red-100 text-red-700 hover:bg-red-200' },
                        { label: 'Hard', rating: 'HARD', color: 'bg-amber-100 text-amber-700 hover:bg-amber-200' },
                        { label: 'Good', rating: 'GOOD', color: 'bg-green-100 text-green-700 hover:bg-green-200' },
                        { label: 'Easy', rating: 'EASY', color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
                      ].map((btn) => (
                        <Button
                          key={btn.label}
                          variant="ghost"
                          className={cn('flex-1 rounded-xl px-3 py-2 text-sm font-medium transition-all', btn.color)}
                          onClick={() => {
                            const current = questions[flashcardIndex];
                            if (current) rateFlashcard.mutate({ questionId: current.id, rating: btn.rating });
                            setFlashcardIndex(Math.min(questions.length - 1, flashcardIndex + 1));
                            setFlipped(false);
                          }}
                        >
                          {btn.label}
                        </Button>
                      ))}
                    </div>
                  )}
                  {flashcardIndex >= questions.length - 1 ? (
                    <div className="mt-4 rounded-xl bg-green-50 border border-green-200 p-4 text-center">
                      <CheckCircle2 className="mx-auto h-8 w-8 text-green-600 mb-2" />
                      <p className="font-semibold text-green-800">Deck complete!</p>
                      <p className="text-sm text-green-600 mt-1">You&apos;ve reviewed all flashcards for this concept.</p>
                      <Button
                        variant="outline"
                        className="mt-3 rounded-xl"
                        onClick={() => { setFlashcardIndex(0); setFlipped(false); }}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" /> Start Over
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" className="flex-1 rounded-xl" aria-label="Previous card" onClick={() => { setFlashcardIndex(Math.max(0, flashcardIndex - 1)); setFlipped(false); }} disabled={flashcardIndex === 0}>
                        <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                      </Button>
                      <Button variant="outline" className="flex-1 rounded-xl" aria-label="Next card" onClick={() => { setFlashcardIndex(Math.min(questions.length - 1, flashcardIndex + 1)); setFlipped(false); }} disabled={flashcardIndex >= questions.length - 1}>
                        Next <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'challenge' && (
        <div role="tabpanel" id="panel-challenge" aria-labelledby="tab-challenge" className="space-y-4">
          <Card className="border-red-200 bg-gradient-to-r from-red-50 to-orange-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Gamepad2 className="h-6 w-6 text-red-600" />
                <div>
                  <h3 className="font-bold text-surface-900">Timed Challenge</h3>
                  <p className="text-sm text-surface-500">Race against time! Complete as many as you can in 60 seconds.</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="rounded-xl bg-red-100 p-4 text-center">
                  <p className="text-2xl font-bold text-red-600">60s</p>
                  <p className="text-xs text-surface-500">Time Limit</p>
                </div>
                <div className="rounded-xl bg-orange-100 p-4 text-center">
                  <p className="text-2xl font-bold text-orange-600">10</p>
                  <p className="text-xs text-surface-500">Questions</p>
                </div>
                <div className="rounded-xl bg-yellow-100 p-4 text-center">
                  <p className="text-2xl font-bold text-yellow-600">50</p>
                  <p className="text-xs text-surface-500">Max XP</p>
                </div>
              </div>
              <Button
                className="w-full rounded-xl bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg"
                onClick={() => {
                  startPractice.mutate(
                    { conceptId, questionCount: 10 },
                    { onSuccess: (data) => router.push(`/app/learn/practice/${data.practiceId}`) }
                  );
                }}
                disabled={startPractice.isPending || questions.length === 0}
              >
                <Gamepad2 className="h-4 w-4 mr-2" /> Start Challenge
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Trophy className="h-5 w-5 text-amber-500" />
                <p className="text-sm text-surface-600">Top scorers get bonus XP and a spot on the leaderboard!</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'ask' && (
        <div role="tabpanel" id="panel-ask" aria-labelledby="tab-ask" className="space-y-4">
          <Card className="border-brand-200 bg-gradient-to-r from-brand-50 to-purple-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Brain className="h-6 w-6 text-brand-600" />
                <div>
                  <h3 className="font-bold text-surface-900">Ask Sanro AI</h3>
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

      {activeTab === 'ar' && arContent.length > 0 && (
        <div role="tabpanel" id="panel-ar" aria-labelledby="tab-ar">
          <ConceptArPanel conceptId={conceptId} items={arContent} />
        </div>
      )}
    </div>
  );
}
