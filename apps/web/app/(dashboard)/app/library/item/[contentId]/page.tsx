'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useLibraryItem } from '@/lib/library-hooks';
import { useCompleteContent } from '@/lib/learning-hooks';
import { YouTubePlayer, formatDuration, parseYouTubeId } from '@/components/youtube-player';
import { Markdown } from '@/components/markdown';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner, ErrorBanner } from '@/components/ui';
import { cn } from '@/lib/cn';
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Film,
  FileText,
  HelpCircle,
  Layers,
  Boxes,
  Zap,
  Brain,
  Gamepad2,
  ImageIcon,
  ClipboardList,
  RotateCcw,
  RefreshCw,
  ScrollText,
  BookOpen,
  Link as LinkIcon,
} from 'lucide-react';

const TYPE_LABEL: Record<string, string> = {
  VIDEO: 'Video',
  NOTES: 'Study Note',
  PDF: 'PDF',
  QUIZ: 'Quiz',
  MODEL_3D: '3D Model',
  AR: 'AR',
  GAME: 'Challenge',
  PRACTICE_SET: 'Practice Set',
  ARTICLE: 'Article',
  IMAGE: 'Figure',
  WORKSHEET: 'Worksheet',
  REVISION: 'Quick Revision',
  FLASHCARDS: 'Flashcards',
  INTERACTIVE: 'Interactive',
  EXAMPLE: 'Solved Example',
  READING: 'Reading',
  OTHER: 'Lesson',
};

const TYPE_ICON: Record<string, typeof Film> = {
  VIDEO: Film,
  NOTES: FileText,
  PDF: FileText,
  QUIZ: HelpCircle,
  MODEL_3D: Boxes,
  AR: Boxes,
  GAME: Gamepad2,
  PRACTICE_SET: Layers,
  ARTICLE: ScrollText,
  IMAGE: ImageIcon,
  WORKSHEET: ClipboardList,
  REVISION: RotateCcw,
  FLASHCARDS: RefreshCw,
  INTERACTIVE: Zap,
  EXAMPLE: Brain,
  READING: BookOpen,
  OTHER: Layers,
};

export default function LibraryItemPage() {
  const params = useParams<{ contentId: string }>();
  const contentId = params?.contentId ?? '';
  const { data: item, isLoading, error } = useLibraryItem(contentId || null);
  const complete = useCompleteContent();
  const [showAll, setShowAll] = useState(false);

  if (isLoading) return <Spinner label="Loading lesson..." />;
  if (error) return <ErrorBanner message={(error as Error).message} />;
  if (!item) return <ErrorBanner message="Lesson not found." />;

  const Icon = TYPE_ICON[item.type] ?? Layers;
  const youtubeId = item.type === 'VIDEO' ? parseYouTubeId(item.url) : null;
  const description = item.description ?? '';
  const isCompleted = item.progress?.some((p) => p.state === 'COMPLETED') ?? false;
  const duration = formatDuration(item.durationSeconds);

  const shouldTruncate = description.length > 1600 && !showAll;
  const shown = shouldTruncate ? `${description.slice(0, 1600)}…` : description;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/app/library"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-surface-500 hover:text-surface-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Library
        </Link>
        <div className="flex flex-wrap items-center gap-2 text-xs text-surface-400">
          {item.subject ? <Badge variant="secondary">{item.subject.name}</Badge> : null}
          {item.chapter ? <Badge variant="secondary">{item.chapter.name}</Badge> : null}
          {duration ? <Badge variant="secondary">{duration}</Badge> : null}
        </div>
      </div>

      <div>
        <div className="flex items-start gap-3">
          <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
              {TYPE_LABEL[item.type] ?? 'Lesson'}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-surface-900">{item.title}</h1>
            {item.concept ? (
              <Link
                href={`/app/learn/concepts/${item.concept.id}`}
                className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline"
              >
                Open concept: {item.concept.name} <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      {item.type === 'VIDEO' && (youtubeId || item.url) ? (
        youtubeId ? (
          <YouTubePlayer videoId={youtubeId} title={item.title} />
        ) : (
          <a href={item.url!} target="_blank" rel="noopener noreferrer" className="block">
            <div className="flex aspect-video items-center justify-center rounded-xl border border-surface-200 bg-surface-50 text-surface-500">
              <span className="inline-flex items-center gap-2">
                <LinkIcon className="h-4 w-4" /> Open video in a new tab
              </span>
            </div>
          </a>
        )
      ) : null}

      {item.type === 'IMAGE' && (item.thumbnailUrl || item.url) ? (
        <img src={item.thumbnailUrl ?? item.url!} alt={item.title} className="w-full rounded-xl border border-surface-200" />
      ) : null}

      {description ? (
        <div className="rounded-2xl border border-surface-200 bg-white p-6">
          <Markdown>{shown}</Markdown>
          {description.length > 1600 ? (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="mt-4 text-sm font-medium text-brand-600 hover:underline"
            >
              {showAll ? 'Show less' : 'Read more'}
            </button>
          ) : null}
        </div>
      ) : item.type === 'VIDEO' || item.type === 'QUIZ' || item.type === 'FLASHCARDS' || item.type === 'PRACTICE_SET' || item.type === 'GAME' ? (
        <div className="rounded-2xl border border-surface-200 bg-surface-50 p-6 text-sm text-surface-500">
          {item.concept
            ? 'This lesson sits on a concept. Open the concept page for practice, flashcards and quizzes.'
            : 'No additional notes for this item.'}
        </div>
      ) : null}

      {item.url && item.type !== 'VIDEO' ? (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm font-medium text-surface-700 hover:bg-surface-50"
        >
          <ExternalLink className="h-4 w-4" /> Open source
        </a>
      ) : null}

      <div className="flex flex-wrap gap-3 border-t border-surface-100 pt-6">
        <Button
          onClick={() => complete.mutate(item.id)}
          disabled={complete.isPending || isCompleted}
          className={cn(isCompleted && 'bg-emerald-600 hover:bg-emerald-700')}
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          {isCompleted ? 'Completed' : complete.isPending ? 'Marking...' : 'Mark as complete'}
        </Button>
        <Button variant="outline" asChild>
          <Link href="/app/library">Back to Library</Link>
        </Button>
      </div>
    </div>
  );
}
