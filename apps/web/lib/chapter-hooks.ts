'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api, apiUrl } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { normalizeSegments, type VideoSegment } from '@/lib/video-segments';

function useToken() {
  return useAuthStore((s) => s.token);
}

export interface ChapterConcept {
  id: string;
  name: string;
  mastery: { score: number; level: string } | null;
  hasVideo: boolean;
  status: string;
  topicName: string | null;
}

export interface ChapterVideo {
  contentId: string;
  title: string;
  url: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  segments: VideoSegment[];
}

export interface ChapterProgress {
  concepts: number;
  mastered: number;
  videos: number;
  percent: number;
}

export interface ChapterPractice {
  questionCount: number;
  available: boolean;
}

export interface ChapterHub {
  id: string;
  name: string;
  code: string;
  subject: string;
  grade: string;
  summary: string | null;
  pdfUrl: string | null;
  concepts: ChapterConcept[];
  videos: ChapterVideo[];
  progress: ChapterProgress;
  practice: ChapterPractice;
}

type RawRecord = Record<string, unknown>;

function record(value: unknown): RawRecord | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as RawRecord)
    : null;
}

function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function masteryOf(value: unknown): { score: number; level: string } | null {
  const rec = record(value);
  if (!rec) return null;
  const score = num(rec.score);
  if (score === null) return null;
  return { score, level: text(rec.level) ?? 'INSUFFICIENT_EVIDENCE' };
}

function normalizeConcepts(raw: unknown): ChapterConcept[] {
  const out: ChapterConcept[] = [];
  for (const entry of list(raw)) {
    const rec = record(entry);
    if (!rec) continue;
    const id = text(rec.id);
    const name = text(rec.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      mastery: masteryOf(rec.mastery),
      hasVideo: rec.hasVideo === true,
      status: text(rec.status) ?? 'NOT_STARTED',
      topicName: text(rec.topicName),
    });
  }
  return out;
}

function normalizeVideos(raw: unknown): ChapterVideo[] {
  const out: ChapterVideo[] = [];
  for (const entry of list(raw)) {
    const rec = record(entry);
    if (!rec) continue;
    const contentId = text(rec.contentId) ?? text(rec.id);
    const title = text(rec.title);
    if (!contentId || !title) continue;
    out.push({
      contentId,
      title,
      url: text(rec.url),
      thumbnailUrl: text(rec.thumbnailUrl),
      durationSeconds: num(rec.durationSeconds),
      segments: normalizeSegments(rec.segments),
    });
  }
  return out;
}

// Older chapter payloads nested the concepts under topics and the videos under
// chapterContent; both are flattened so the hub keeps working on them.
function conceptsFromTopics(raw: unknown): ChapterConcept[] {
  const out: ChapterConcept[] = [];
  for (const topic of list(raw)) {
    const topicRec = record(topic);
    if (!topicRec) continue;
    const topicName = text(topicRec.name);
    for (const concept of list(topicRec.concepts)) {
      const rec = record(concept);
      if (!rec) continue;
      const id = text(rec.id);
      const name = text(rec.name);
      if (!id || !name) continue;
      const total = num(rec.totalContent) ?? 0;
      const done = num(rec.completedContent) ?? 0;
      out.push({
        id,
        name,
        mastery: masteryOf(rec.mastery),
        hasVideo: false,
        status: total > 0 && done >= total ? 'COMPLETED' : 'NOT_STARTED',
        topicName,
      });
    }
  }
  return out;
}

function videosFromChapterContent(raw: unknown): ChapterVideo[] {
  const out: ChapterVideo[] = [];
  for (const entry of list(raw)) {
    const rec = record(entry);
    if (!rec) continue;
    if ((text(rec.type) ?? '').toUpperCase() !== 'VIDEO') continue;
    const contentId = text(rec.id);
    const title = text(rec.title);
    if (!contentId || !title) continue;
    out.push({
      contentId,
      title,
      url: text(rec.url),
      thumbnailUrl: text(rec.thumbnailUrl),
      durationSeconds: num(rec.durationSeconds),
      segments: normalizeSegments(rec.segments),
    });
  }
  return out;
}

export function normalizeChapterHub(raw: unknown): ChapterHub {
  const rec = record(raw) ?? {};
  const concepts = normalizeConcepts(rec.concepts);
  const videos = normalizeVideos(rec.videos);
  const fallbackConcepts = concepts.length ? concepts : conceptsFromTopics(rec.topics);
  const fallbackVideos = videos.length ? videos : videosFromChapterContent(rec.chapterContent);

  const progressRec = record(rec.progress);
  const conceptCount = num(progressRec?.concepts) ?? fallbackConcepts.length;
  const mastered =
    num(progressRec?.mastered) ??
    fallbackConcepts.filter((c) => c.mastery?.level === 'MASTERED').length;
  const videoCount = num(progressRec?.videos) ?? fallbackVideos.length;
  const percent =
    num(progressRec?.percent) ??
    (conceptCount > 0 ? Math.round((mastered / conceptCount) * 100) : 0);

  const practiceRec = record(rec.practice);
  const questionCount = num(practiceRec?.questionCount) ?? 0;
  const available =
    typeof practiceRec?.available === 'boolean' ? practiceRec.available : questionCount > 0;

  const subjectRec = record(rec.subject);

  return {
    id: text(rec.id) ?? '',
    name: text(rec.name) ?? 'Chapter',
    code: text(rec.code) ?? '',
    subject: text(rec.subject) ?? text(subjectRec?.name) ?? 'Subject',
    grade: text(rec.grade) ?? '',
    summary: text(rec.summary) ?? text(rec.description),
    pdfUrl: text(rec.pdfUrl),
    concepts: fallbackConcepts,
    videos: fallbackVideos,
    progress: {
      concepts: conceptCount,
      mastered,
      videos: videoCount,
      percent: Math.max(0, Math.min(100, Math.round(percent))),
    },
    practice: { questionCount, available },
  };
}

export function useChapterHub(
  chapterId: string | null | undefined,
  options?: { enabled?: boolean },
) {
  const token = useToken();
  return useQuery<ChapterHub>({
    queryKey: ['learning', 'chapter-hub', chapterId ?? ''],
    queryFn: () =>
      api<unknown>(`/learning/chapters/${chapterId}`, { token }).then(normalizeChapterHub),
    enabled: !!token && !!chapterId && (options?.enabled ?? true),
    staleTime: 60_000,
  });
}

export function useStartChapterPractice() {
  const token = useToken();
  return useMutation({
    mutationFn: (chapterId: string) =>
      api<{ practiceId: string }>('/learning/practice/start', {
        method: 'POST',
        token,
        body: { chapterId },
      }),
  });
}

export function resolveApiPath(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const base = apiUrl().replace(/\/+$/, '');
  const trimmed = path.startsWith('/') ? path : `/${path}`;
  if (trimmed.startsWith('/api/v1/')) return `${base.replace(/\/api\/v1$/, '')}${trimmed}`;
  return `${base}${trimmed}`;
}

export interface ChapterPdfState {
  isOpen: boolean;
  loading: boolean;
  error: string | null;
  url: string | null;
}

// The chapter PDF needs the JWT, which lives in localStorage and cannot be
// attached to an iframe request - so it is fetched with the token and shown as
// a blob URL instead.
export function useChapterPdf() {
  const token = useToken();
  const [state, setState] = useState<ChapterPdfState>({
    isOpen: false,
    loading: false,
    error: null,
    url: null,
  });
  const objectUrlRef = useRef<string | null>(null);

  const revoke = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const openPdf = useCallback(
    async (chapterId: string, pdfPath?: string | null) => {
      revoke();
      setState({ isOpen: true, loading: true, error: null, url: null });
      const target = pdfPath
        ? resolveApiPath(pdfPath)
        : `${apiUrl()}/learning/chapters/${chapterId}/pdf`;
      try {
        const res = await fetch(target, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          cache: 'no-store',
        });
        if (!res.ok) {
          setState({
            isOpen: true,
            loading: false,
            error:
              res.status === 404
                ? 'PDF not available for this chapter.'
                : `Could not load the chapter PDF (error ${res.status}).`,
            url: null,
          });
          return;
        }
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        objectUrlRef.current = objectUrl;
        setState({ isOpen: true, loading: false, error: null, url: objectUrl });
      } catch {
        setState({
          isOpen: true,
          loading: false,
          error: 'Could not load the chapter PDF. Please try again.',
          url: null,
        });
      }
    },
    [token, revoke],
  );

  const closePdf = useCallback(() => {
    revoke();
    setState({ isOpen: false, loading: false, error: null, url: null });
  }, [revoke]);

  useEffect(
    () => () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    },
    [],
  );

  return { ...state, openPdf, closePdf };
}
