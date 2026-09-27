'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';
import { useLibrary, type LibraryItem } from '@/lib/library-hooks';
import { formatDuration, parseYouTubeId } from '@/components/youtube-player';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Spinner, ErrorBanner } from '@/components/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/cn';
import {
  Search,
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
  ChevronLeft,
  ChevronRight,
  Play,
} from 'lucide-react';

const TYPE_META: Record<string, { label: string; icon: typeof Film; color: string; bg: string }> = {
  VIDEO: { label: 'Video', icon: Film, color: 'text-blue-600', bg: 'bg-blue-50' },
  NOTES: { label: 'Notes', icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ARTICLE: { label: 'Article', icon: ScrollText, color: 'text-teal-600', bg: 'bg-teal-50' },
  READING: { label: 'Reading', icon: BookOpen, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  PDF: { label: 'PDF', icon: FileText, color: 'text-rose-600', bg: 'bg-rose-50' },
  QUIZ: { label: 'Quiz', icon: HelpCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
  PRACTICE_SET: { label: 'Practice', icon: Layers, color: 'text-violet-600', bg: 'bg-violet-50' },
  FLASHCARDS: { label: 'Flashcards', icon: RefreshCw, color: 'text-fuchsia-600', bg: 'bg-fuchsia-50' },
  EXAMPLE: { label: 'Example', icon: Brain, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  WORKSHEET: { label: 'Worksheet', icon: ClipboardList, color: 'text-orange-600', bg: 'bg-orange-50' },
  IMAGE: { label: 'Figure', icon: ImageIcon, color: 'text-pink-600', bg: 'bg-pink-50' },
  INTERACTIVE: { label: 'Interactive', icon: Zap, color: 'text-lime-600', bg: 'bg-lime-50' },
  MODEL_3D: { label: '3D Model', icon: Boxes, color: 'text-sky-600', bg: 'bg-sky-50' },
  AR: { label: 'AR', icon: Boxes, color: 'text-sky-700', bg: 'bg-sky-50' },
  GAME: { label: 'Challenge', icon: Gamepad2, color: 'text-red-600', bg: 'bg-red-50' },
  REVISION: { label: 'Revision', icon: RotateCcw, color: 'text-purple-600', bg: 'bg-purple-50' },
  OTHER: { label: 'Other', icon: Layers, color: 'text-surface-500', bg: 'bg-surface-100' },
};

const SORT_OPTIONS = [
  { value: 'default', label: 'Curriculum order' },
  { value: 'newest', label: 'Newest' },
  { value: 'title', label: 'Title A–Z' },
];

function typeMeta(type: string) {
  return TYPE_META[type] ?? TYPE_META.OTHER;
}

function ItemCard({ item }: { item: LibraryItem }) {
  const meta = typeMeta(item.type);
  const Icon = meta.icon;
  const youtubeId = item.type === 'VIDEO' ? parseYouTubeId(item.url) : null;
  const thumbnail = item.thumbnailUrl ?? (youtubeId ? `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg` : null);
  const duration = formatDuration(item.durationSeconds);

  return (
    <Link
      href={`/app/library/item/${item.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-surface-200 bg-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className={cn('relative aspect-video w-full overflow-hidden', thumbnail ? 'bg-surface-100' : meta.bg)}>
        {thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnail}
            alt=""
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Icon className={cn('h-10 w-10', meta.color)} />
          </div>
        )}
        <span className={cn('absolute left-2 top-2 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide', meta.bg, meta.color)}>
          <Icon className="h-3 w-3" /> {meta.label}
        </span>
        {item.type === 'VIDEO' ? (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100">
              <Play className="ml-0.5 h-5 w-5" />
            </span>
          </span>
        ) : null}
        {duration ? (
          <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-2 py-0.5 text-[11px] font-medium text-white">
            {duration}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="line-clamp-2 font-semibold text-surface-900">{item.title}</p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-surface-400">
          {item.chapter ? <Badge variant="secondary" className="text-[10px]">{item.chapter.name}</Badge> : null}
          {item.concept ? <Badge variant="secondary" className="text-[10px]">{item.concept.name}</Badge> : null}
        </div>
      </div>
    </Link>
  );
}

function LibraryView() {
  const router = useRouter();
  const params = useSearchParams();
  const [searchDraft, setSearchDraft] = useState(params.get('search') ?? '');

  const type = params.get('type') ?? '';
  const chapterId = params.get('chapterId') ?? '';
  const subjectId = params.get('subjectId') ?? '';
  const conceptId = params.get('conceptId') ?? '';
  const search = params.get('search') ?? '';
  const sort = params.get('sort') ?? 'default';
  const page = Number(params.get('page') ?? '1') || 1;

  const { data, isLoading, error, isFetching } = useLibrary({
    type: type || undefined,
    chapterId: chapterId || undefined,
    subjectId: subjectId || undefined,
    conceptId: conceptId || undefined,
    search: search || undefined,
    sort,
    page,
    pageSize: 24,
  });

  function setParam(key: string, value?: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    router.replace(`/app/library${next.toString() ? `?${next.toString()}` : ''}`, { scroll: false });
  }

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    setParam('search', searchDraft.trim() || undefined);
  }

  const typeEntries = useMemo(() => Object.entries(data?.facets.byType ?? {}), [data]);
  const activeFilters = [type, chapterId, subjectId, conceptId, search].filter(Boolean).length;

  if (error) return <ErrorBanner message={(error as Error).message} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Library</h1>
          <p className="mt-1 text-sm text-surface-500">
            Browse every lesson — videos, notes, figures, exercises and more.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/app/library/subjects">
            <BookOpen className="mr-2 h-4 w-4" /> Browse by subject
          </Link>
        </Button>
      </div>

      <form onSubmit={submitSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
          <Input
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder="Search lessons..."
            className="pl-9"
            aria-label="Search lessons"
          />
        </div>
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setParam('type', undefined)}
          className={cn(
            'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
            !type ? 'border-brand-600 bg-brand-600 text-white' : 'border-surface-200 bg-white text-surface-600 hover:bg-surface-50',
          )}
        >
          All{data ? ` · ${data.total}` : ''}
        </button>
        {typeEntries.map(([key, count]) => {
          const meta = typeMeta(key);
          const Icon = meta.icon;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setParam('type', type === key ? undefined : key)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                type === key ? 'border-brand-600 bg-brand-600 text-white' : 'border-surface-200 bg-white text-surface-600 hover:bg-surface-50',
              )}
            >
              <Icon className="h-3.5 w-3.5" /> {meta.label} · {count}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-64">
          <Select value={chapterId || 'ALL'} onValueChange={(v) => setParam('chapterId', v === 'ALL' ? undefined : v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All chapters" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All chapters</SelectItem>
              {(data?.facets.byChapter ?? []).map((c) => (
                <SelectItem key={c.chapterId} value={c.chapterId}>
                  {c.name} ({c.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-48">
          <Select value={sort} onValueChange={(v) => setParam('sort', v)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {activeFilters > 0 ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.replace('/app/library', { scroll: false })}
          >
            Clear filters
          </Button>
        ) : null}
        {isFetching && !isLoading ? <RefreshCw className="h-4 w-4 animate-spin text-surface-400" /> : null}
      </div>

      {isLoading ? (
        <Spinner label="Loading library..." />
      ) : (data?.items.length ?? 0) === 0 ? (
        <div className="rounded-2xl border border-surface-200 bg-white p-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-surface-300" />
          <p className="mt-4 text-lg font-medium text-surface-700">Nothing here yet</p>
          <p className="mt-1 text-sm text-surface-400">
            {activeFilters > 0 ? 'Try clearing your filters.' : 'Lessons will appear once content is published.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {(data?.items ?? []).map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>

          {(data?.pageCount ?? 1) > 1 ? (
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setParam('page', String(page - 1))}
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <span className="text-sm text-surface-500">
                Page {data?.page ?? page} of {data?.pageCount ?? 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= (data?.pageCount ?? 1)}
                onClick={() => setParam('page', String(page + 1))}
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

export default function LibraryPage() {
  return (
    <Suspense fallback={<Spinner label="Loading library..." />}>
      <LibraryView />
    </Suspense>
  );
}
