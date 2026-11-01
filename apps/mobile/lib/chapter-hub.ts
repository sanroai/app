/**
 * The chapter hub - everything a student needs about ONE textbook chapter.
 *
 * `GET /learning/chapters/:chapterId` returns the payload typed below. The pure
 * helpers (timestamp formatting, mastery tone, "continue where you left off")
 * live here instead of in the screen so they can be unit tested without
 * rendering anything.
 */

export interface VideoSegment {
  title: string;
  startSeconds: number;
  /** Derived from the chapter's concepts because the video has no creator chapters. */
  derived?: boolean;
}

export interface ConceptSection {
  contentId: string;
  startSeconds: number;
  endSeconds: number;
  durationSeconds: number;
  derived: boolean;
}

export interface ChapterConcept {
  id: string;
  name: string;
  order?: number;
  mastery: { score: number; level: string } | null;
  hasVideo: boolean;
  status: string;
  section?: ConceptSection | null;
}

export interface ChapterVideo {
  contentId: string;
  title: string;
  url: string;
  thumbnailUrl?: string | null;
  durationSeconds?: number | null;
  segments?: VideoSegment[] | null;
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
  /** Curriculum position of the chapter (1-based). */
  order?: number;
  summary?: string | null;
  pdfUrl?: string | null;
  /** The official NCERT PDF of the same chapter, when this deployment ships no book files. */
  externalPdfUrl?: string | null;
  /** First video lesson's poster - a real frame from this chapter's lesson. */
  thumbnailUrl?: string | null;
  concepts?: ChapterConcept[];
  videos?: ChapterVideo[];
  progress?: ChapterProgress;
  practice?: ChapterPractice;
}

export type MasteryTone = 'mastered' | 'weak' | 'developing' | 'unknown';

const MASTERED_LEVELS = new Set(['MASTERED', 'GOOD']);
const WEAK_LEVELS = new Set(['WEAK', 'NEEDS_INTERVENTION', 'INSUFFICIENT_EVIDENCE']);

/** `mm:ss` for anything under an hour, `h:mm:ss` beyond it. */
export function formatTimestamp(seconds?: number | null): string {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(secs)}` : `${pad(minutes)}:${pad(secs)}`;
}

/**
 * Drop the markers the API cannot trust (no title, negative or non-finite
 * offset) and order them by time - a marker strip that jumps backwards is a
 * bug, not a feature.
 */
export function normalizeSegments(segments?: VideoSegment[] | null): VideoSegment[] {
  if (!segments || !Array.isArray(segments)) return [];
  return segments
    .filter(
      (s): s is VideoSegment =>
        !!s && typeof s.startSeconds === 'number' && Number.isFinite(s.startSeconds) && s.startSeconds >= 0,
    )
    .map((s) => ({
      title: (s.title ?? '').trim() || 'Marker',
      startSeconds: Math.floor(s.startSeconds),
      ...(s.derived === true ? { derived: true } : {}),
    }))
    .sort((a, b) => a.startSeconds - b.startSeconds);
}

/** Marker titles and concept names match on words, not punctuation - same rule as the API. */
export function normalizeSectionTitle(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

/**
 * Where this concept starts inside a video lesson the chapter hub did not name.
 * A chapter can carry more than one chapter-wide video (the hub picks the one
 * the section times were computed for); when the concept screen shows a
 * different clip, its own markers decide - applying the other clip's offset
 * would drop the student in the middle of the previous concept.
 *
 * Returns 0 when nothing names the concept: start at the beginning rather than
 * pretending to know.
 */
export function sectionStartForConcept(segments: VideoSegment[] | null | undefined, conceptName: string): number {
  const key = normalizeSectionTitle(conceptName || '');
  if (!key) return 0;
  const hit = normalizeSegments(segments).find((segment) => normalizeSectionTitle(segment.title) === key);
  return hit ? hit.startSeconds : 0;
}

export function masteryTone(level?: string | null): MasteryTone {  if (!level) return 'unknown';
  if (MASTERED_LEVELS.has(level)) return 'mastered';
  if (WEAK_LEVELS.has(level)) return 'weak';
  if (level === 'DEVELOPING') return 'developing';
  return 'unknown';
}

export function masteryLabel(level?: string | null): string {
  const map: Record<string, string> = {
    NEEDS_INTERVENTION: 'Intervene',
    WEAK: 'Weak',
    DEVELOPING: 'Developing',
    GOOD: 'Good',
    MASTERED: 'Mastered',
    INSUFFICIENT_EVIDENCE: 'Unassessed',
  };
  if (!level) return 'Not started';
  return map[level] ?? level.replace(/_/g, ' ').toLowerCase();
}

export function isMasteredConcept(concept?: ChapterConcept | null): boolean {
  if (!concept) return false;
  if (concept.mastery && MASTERED_LEVELS.has(concept.mastery.level)) return true;
  return (concept.mastery?.score ?? 0) >= 80;
}

export function conceptStatusLabel(status?: string | null): string {
  const map: Record<string, string> = {
    NOT_STARTED: 'Not started',
    IN_PROGRESS: 'In progress',
    DONE: 'Completed',
    MASTERED: 'Mastered',
  };
  if (!status) return 'Not started';
  return map[status] ?? status.replace(/_/g, ' ').toLowerCase();
}

/**
 * "Continue where you left off": the concept to send the student back to.
 * A concept with evidence but a weak score wins over an untouched one - the
 * student has already started that one.
 */
export function pickContinueConcept(concepts?: ChapterConcept[] | null): ChapterConcept | null {
  const list = concepts ?? [];
  const pending = list.filter((c) => !isMasteredConcept(c));
  if (pending.length === 0) return null;
  const withEvidence = pending.filter((c) => (c.mastery?.score ?? 0) > 0);
  if (withEvidence.length === 0) return pending[0];
  return withEvidence.reduce((worst, current) =>
    (current.mastery?.score ?? 0) < (worst.mastery?.score ?? 0) ? current : worst,
  );
}

/** Clamp the server percentage into something a progress bar can render. */
export function progressPercent(percent?: number | null): number {
  if (percent === null || percent === undefined || !Number.isFinite(percent)) return 0;
  return Math.min(100, Math.max(0, Math.round(percent)));
}
