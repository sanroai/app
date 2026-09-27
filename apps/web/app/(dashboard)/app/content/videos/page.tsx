'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/auth-store';
import { useBoards, useGrades, useSubjects } from '@/lib/api-hooks';
import { useChapters, useTopics, useConcepts } from '@/lib/content-ingest-hooks';
import {
  useChapterVideos,
  useCreateChapterVideos,
  useRemoveChapterVideo,
} from '@/lib/video-hooks';
import { YouTubePlayer, parseYouTubeId } from '@/components/youtube-player';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/cn';
import { AlertCircle, Film, Loader2, Plus, Trash2, Youtube } from 'lucide-react';

const ALLOWED_ROLES = ['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'TEACHER'];
const ROLE_HOME: Record<string, string> = { STUDENT: '/app', PARENT: '/app' };

function CurriculumSelect({
  label,
  value,
  onValueChange,
  placeholder,
  disabled,
  isLoading,
  options,
}: {
  label: string;
  value?: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  isLoading?: boolean;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-surface-600">{label}</Label>
      <Select value={value || 'NONE'} onValueChange={(v) => onValueChange(v === 'NONE' ? '' : v)} disabled={disabled || isLoading}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="NONE">{isLoading ? 'Loading...' : placeholder}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface VideoRow {
  key: string;
  url: string;
  title: string;
  description: string;
}

let rowSeq = 0;
function emptyRow(): VideoRow {
  rowSeq += 1;
  return { key: `row-${rowSeq}`, url: '', title: '', description: '' };
}

export default function ChapterVideosPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const allowed = !!user && ALLOWED_ROLES.includes(user.role);

  const [boardId, setBoardId] = useState('');
  const [grade, setGrade] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [conceptId, setConceptId] = useState('');
  const [rows, setRows] = useState<VideoRow[]>([emptyRow()]);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!allowed) router.replace(user ? (ROLE_HOME[user.role] ?? '/app') : '/login');
  }, [hasHydrated, allowed, user, router]);

  const boardsQuery = useBoards();
  const gradesQuery = useGrades(boardId || undefined);
  const subjectsQuery = useSubjects(boardId || undefined, grade || undefined);
  const chaptersQuery = useChapters(subjectId || undefined);
  const topicsQuery = useTopics(chapterId || undefined);
  const conceptsQuery = useConcepts(topicId || undefined);

  const videosQuery = useChapterVideos(chapterId || undefined);
  const createVideos = useCreateChapterVideos(chapterId || undefined);
  const removeVideo = useRemoveChapterVideo(chapterId || undefined);

  function clearFrom(from: 'board' | 'grade' | 'subject' | 'chapter' | 'topic') {
    if (from === 'board') {
      setGrade('');
      setSubjectId('');
      setChapterId('');
      setTopicId('');
      setConceptId('');
    } else if (from === 'grade') {
      setSubjectId('');
      setChapterId('');
      setTopicId('');
      setConceptId('');
    } else if (from === 'subject') {
      setChapterId('');
      setTopicId('');
      setConceptId('');
    } else if (from === 'chapter') {
      setTopicId('');
      setConceptId('');
    } else {
      setConceptId('');
    }
  }

  function updateRow(key: string, patch: Partial<VideoRow>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(key: string) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.key !== key) : prev));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (!chapterId) {
      setFormError('Select a chapter first.');
      return;
    }

    const videos = rows
      .map((row) => {
        const url = row.url.trim();
        if (!url) return null;
        const videoId = parseYouTubeId(url);
        if (!videoId) return { error: url };
        return {
          url,
          title: row.title.trim() || videoId,
          description: row.description.trim() || undefined,
        };
      })
      .filter((v): v is { url: string; title: string; description?: string } => v !== null);

    if (videos.length === 0) {
      setFormError('Paste at least one YouTube URL.');
      return;
    }
    const invalid = videos.find((v) => !v.title);
    if (invalid) {
      setFormError(`Not a valid YouTube URL: ${invalid.url}`);
      return;
    }

    try {
      const result = await createVideos.mutateAsync({
        chapterId,
        topicId: topicId || undefined,
        conceptId: conceptId || undefined,
        videos,
      });
      const created = result.created.length;
      const skipped = result.duplicates.length;
      toast.success(
        skipped > 0
          ? `Added ${created} video${created === 1 ? '' : 's'}${skipped} already in this chapter.`
          : `Added ${created} video${created === 1 ? '' : 's'}.`,
      );
      setRows([emptyRow()]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not add videos.';
      setFormError(message);
      toast.error(message);
    }
  }

  async function handleDelete(id: string, title: string) {
    try {
      await removeVideo.mutateAsync(id);
      toast.success(`Removed "${title}"`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not remove video.');
    }
  }

  if (!hasHydrated) return null;
  if (!allowed) return null;

  const videos = videosQuery.data ?? [];
  const chapterName = (chaptersQuery.data ?? []).find((c) => c.id === chapterId)?.name;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Chapter Videos</h1>
        <p className="mt-1 text-sm text-surface-500">
          Attach YouTube lessons to a chapter. They appear on the chapter page, the concept page and the Library.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Film className="h-4 w-4" /> Choose chapter
          </CardTitle>
          <CardDescription>Pick the board, class, subject and chapter these videos belong to.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <CurriculumSelect
              label="Board"
              value={boardId}
              onValueChange={(v) => {
                setBoardId(v);
                clearFrom('board');
              }}
              placeholder="Select board"
              isLoading={boardsQuery.isLoading}
              options={(boardsQuery.data ?? []).map((b) => ({ value: b.id, label: b.name }))}
            />
            <CurriculumSelect
              label="Class"
              value={grade}
              onValueChange={(v) => {
                setGrade(v);
                clearFrom('grade');
              }}
              placeholder="Select class"
              disabled={!boardId}
              isLoading={gradesQuery.isLoading}
              options={(gradesQuery.data ?? []).map((g) => ({ value: g, label: `Class ${g}` }))}
            />
            <CurriculumSelect
              label="Subject"
              value={subjectId}
              onValueChange={(v) => {
                setSubjectId(v);
                clearFrom('subject');
              }}
              placeholder="Select subject"
              disabled={!boardId || !grade}
              isLoading={subjectsQuery.isLoading}
              options={(subjectsQuery.data ?? []).map((s) => ({ value: s.id, label: s.name }))}
            />
            <CurriculumSelect
              label="Chapter *"
              value={chapterId}
              onValueChange={(v) => {
                setChapterId(v);
                clearFrom('chapter');
              }}
              placeholder="Select chapter"
              disabled={!subjectId}
              isLoading={chaptersQuery.isLoading}
              options={(chaptersQuery.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
            />
            <CurriculumSelect
              label="Topic (optional)"
              value={topicId}
              onValueChange={(v) => {
                setTopicId(v);
                clearFrom('topic');
              }}
              placeholder="Select topic"
              disabled={!chapterId}
              isLoading={topicsQuery.isLoading}
              options={(topicsQuery.data ?? []).map((t) => ({ value: t.id, label: t.name }))}
            />
            <CurriculumSelect
              label="Concept (optional)"
              value={conceptId}
              onValueChange={setConceptId}
              placeholder="Select concept"
              disabled={!topicId}
              isLoading={conceptsQuery.isLoading}
              options={(conceptsQuery.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Youtube className="h-4 w-4 text-red-600" /> Add YouTube videos
          </CardTitle>
          <CardDescription>
            {chapterName ? `Adding to "${chapterName}".` : 'Select a chapter to enable adding videos.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {rows.map((row, index) => {
              const previewId = parseYouTubeId(row.url);
              return (
                <div key={row.key} className="rounded-xl border border-surface-200 bg-surface-50/60 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-surface-400">
                      Video {index + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-red-600 hover:text-red-700"
                      onClick={() => removeRow(row.key)}
                      disabled={rows.length === 1}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </Button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-surface-600">YouTube URL *</Label>
                      <Input
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={row.url}
                        onChange={(e) => updateRow(row.key, { url: e.target.value })}
                      />
                      {row.url.trim() && !previewId ? (
                        <p className="flex items-center gap-1 text-xs text-red-600">
                          <AlertCircle className="h-3 w-3" /> Not a valid YouTube URL
                        </p>
                      ) : null}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-surface-600">Title</Label>
                      <Input
                        placeholder={previewId ?? 'Lesson title'}
                        value={row.title}
                        onChange={(e) => updateRow(row.key, { title: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs font-medium text-surface-600">Description (optional)</Label>
                      <Textarea
                        rows={2}
                        placeholder="What does this video cover?"
                        value={row.description}
                        onChange={(e) => updateRow(row.key, { description: e.target.value })}
                      />
                    </div>
                  </div>

                  {previewId ? (
                    <div className="mt-3 max-w-sm">
                      <YouTubePlayer videoId={previewId} title={row.title || previewId} />
                    </div>
                  ) : null}
                </div>
              );
            })}

            {formError ? (
              <p className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 flex-none" /> {formError}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" variant="outline" onClick={addRow}>
                <Plus className="h-4 w-4" /> Add another
              </Button>
              <Button type="submit" disabled={!chapterId || createVideos.isPending}>
                {createVideos.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Youtube className="h-4 w-4" />}
                {createVideos.isPending ? 'Adding...' : 'Add videos'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Youtube className="h-4 w-4 text-red-600" /> Videos in this chapter
          </CardTitle>
          <CardDescription>
            {chapterName
              ? videosQuery.isLoading
                ? 'Loading...'
                : `${videos.length} video${videos.length === 1 ? '' : 's'}`
              : 'Select a chapter to see its videos.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!chapterId ? (
            <p className="text-sm text-surface-500">Choose a chapter above.</p>
          ) : videosQuery.isLoading ? (
            <p className="flex items-center gap-2 text-sm text-surface-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading videos...
            </p>
          ) : videosQuery.error ? (
            <p className="text-sm text-red-600">{(videosQuery.error as Error).message}</p>
          ) : videos.length === 0 ? (
            <p className="text-sm text-surface-500">No videos attached to this chapter yet.</p>
          ) : (
            <ul className="space-y-3">
              {videos.map((video) => (
                <li
                  key={video.id}
                  className="flex flex-col gap-3 rounded-xl border border-surface-200 bg-white p-3 sm:flex-row sm:items-center"
                >
                  <div className="w-full shrink-0 sm:w-48">
                    <YouTubePlayer
                      url={video.url}
                      videoId={video.videoId}
                      title={video.title}
                      thumbnailUrl={video.thumbnailUrl}
                      durationSeconds={video.durationSeconds}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-surface-900">{video.title}</p>
                    {video.description ? (
                      <p className="mt-0.5 line-clamp-2 text-sm text-surface-500">{video.description}</p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">
                        #{video.order + 1}
                      </Badge>
                      {video.concept ? (
                        <Badge variant="secondary" className="text-[10px]">
                          {video.concept.name}
                        </Badge>
                      ) : null}
                      <Badge
                        className={cn(
                          'text-[10px]',
                          video.status === 'APPROVED' || video.status === 'PUBLISHED'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-surface-100 text-surface-600',
                        )}
                      >
                        {video.status}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-red-600 hover:text-red-700"
                    onClick={() => void handleDelete(video.id, video.title)}
                    disabled={removeVideo.isPending}
                  >
                    <Trash2 className="h-4 w-4" /> Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
