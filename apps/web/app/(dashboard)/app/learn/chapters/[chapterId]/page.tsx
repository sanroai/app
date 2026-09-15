'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useChapterDetail } from '@/lib/learning-hooks';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner, ErrorBanner } from '@/components/ui';
import {
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Brain,
  FileText,
  Video,
  Play,
} from 'lucide-react';
import { cn } from '@/lib/cn';

const MASTERY_STYLE: Record<string, string> = {
  MASTERED: 'bg-green-100 text-green-700',
  GOOD: 'bg-emerald-50 text-emerald-700',
  DEVELOPING: 'bg-amber-50 text-amber-700',
  WEAK: 'bg-orange-50 text-orange-700',
  NEEDS_INTERVENTION: 'bg-red-50 text-red-700',
  INSUFFICIENT_EVIDENCE: 'bg-slate-100 text-slate-600',
};

function TopicSection({
  topic,
  onNavigate,
}: {
  topic: any;
  onNavigate: (conceptId: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const concepts = topic.concepts ?? [];

  return (
    <div className="rounded-2xl border border-surface-200 bg-white overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between gap-3 p-5 text-left hover:bg-surface-50 transition-colors"
      >
        <div className="min-w-0">
          <h3 className="font-bold text-surface-900">{topic.name}</h3>
          <p className="mt-0.5 text-xs text-surface-400">
            {concepts.length} concept{concepts.length !== 1 ? 's' : ''}
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-surface-400" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-surface-400" />
        )}
      </button>

      {expanded && concepts.length > 0 && (
        <div className="border-t border-surface-100">
          {concepts.map((concept: any) => (
            <button
              key={concept.id}
              onClick={() => onNavigate(concept.id)}
              className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-surface-50 transition-colors border-b border-surface-50 last:border-b-0"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50">
                <Brain className="h-5 w-5 text-brand-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-surface-900">{concept.name}</p>
                {concept.contentCount != null && (
                  <p className="text-xs text-surface-400">
                    {concept.contentCount} resource{concept.contentCount !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {concept.mastery?.level && (
                  <Badge className={cn('text-[10px]', MASTERY_STYLE[concept.mastery.level] ?? '')}>
                    {concept.mastery.level}
                  </Badge>
                )}
                <ChevronRight className="h-4 w-4 shrink-0 text-surface-300" />
              </div>
            </button>
          ))}
        </div>
      )}

      {expanded && concepts.length === 0 && (
        <div className="border-t border-surface-100 px-5 py-6 text-center">
          <p className="text-sm text-surface-400">No concepts in this topic yet</p>
        </div>
      )}
    </div>
  );
}

export default function ChapterDetailPage() {
  const params = useParams();
  const chapterId = params.chapterId as string;

  const { data: chapter, isLoading, error } = useChapterDetail(chapterId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-56 animate-pulse rounded-lg bg-surface-100" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-surface-100" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-surface-50" />
          ))}
        </div>
      </div>
    );
  }

  if (error) return <ErrorBanner message={(error as Error).message} />;

  if (!chapter) return null;

  const topics = chapter.topics ?? [];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-surface-500">
        <Link href="/app/learn" className="hover:text-brand-600 transition-colors">
          Learn
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-surface-400">Chapter</span>
      </nav>

      {/* Header */}
      <div className="flex items-start gap-3">
        <Link
          href="/app/learn"
          className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-surface-200 bg-white text-surface-600 hover:bg-surface-50 transition-all"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div>
          <Badge variant="secondary" className="mb-2 text-[10px]">
            {chapter.code}
          </Badge>
          <h1 className="text-2xl font-bold text-surface-900">{chapter.name}</h1>
          {chapter.description && (
            <p className="mt-1 text-sm text-surface-500">{chapter.description}</p>
          )}
          <p className="mt-1 text-xs text-surface-400">
            {topics.length} topic{topics.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Topics */}
      {topics.length === 0 ? (
        <Card className="py-16 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-surface-300" />
          <p className="mt-4 text-sm font-medium text-surface-500">
            No topics in this chapter yet
          </p>
          <p className="mt-1 text-xs text-surface-400">
            Content is being prepared
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {topics.map((topic: any) => (
            <TopicSection
              key={topic.id}
              topic={topic}
              onNavigate={(id) => {
                window.location.href = `/app/learn/concepts/${id}`;
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
