/**
 * View helpers for the student Remediation screen.
 *
 * Pure functions only (no React, no network) so the wording, the ordering and
 * the step actions can be unit tested and reused by both the concept list and
 * the plan card.
 */
import { Colors, Ink, Pastel } from '../constants/theme';
import type { MasteryRow, WeakConceptRow } from './remediation-hooks';

export type MasteryLevel =
  | 'NEEDS_INTERVENTION'
  | 'WEAK'
  | 'DEVELOPING'
  | 'GOOD'
  | 'MASTERED'
  | 'INSUFFICIENT_EVIDENCE';

export interface LevelMeta {
  label: string;
  color: string;
  bg: string;
}

/** Same thresholds the API uses (`isWeakLevel` in `diagnosis/mastery.service.ts`). */
export const WEAK_LEVELS: MasteryLevel[] = ['NEEDS_INTERVENTION', 'WEAK'];

export const LEVEL_META: Record<MasteryLevel, LevelMeta> = {
  NEEDS_INTERVENTION: { label: 'Needs work', color: Ink.rose, bg: Pastel.rose },
  WEAK: { label: 'Weak', color: Ink.peach, bg: Pastel.peach },
  DEVELOPING: { label: 'Developing', color: Ink.sand, bg: Pastel.sand },
  GOOD: { label: 'Good', color: Ink.mint, bg: Pastel.mint },
  MASTERED: { label: 'Mastered', color: Ink.violet, bg: Pastel.violet },
  INSUFFICIENT_EVIDENCE: { label: 'Not tested', color: Ink.lavender, bg: Pastel.lavender },
};

export function isWeakLevel(level: string | null | undefined): boolean {
  return WEAK_LEVELS.includes((level ?? '').toUpperCase() as MasteryLevel);
}

export function levelMeta(level: string | null | undefined): LevelMeta {
  const key = (level ?? '').toUpperCase() as MasteryLevel;
  return LEVEL_META[key] ?? { label: 'Unknown', color: Colors.textSecondary, bg: Pastel.lavender };
}

/** The same colour rule the web dashboard uses for the mastery bar. */
export function scoreColor(score: number | null | undefined): string {
  if (score == null) return Colors.textMuted;
  if (score >= 80) return Colors.success;
  if (score >= 60) return Colors.warning;
  return Colors.error;
}

export function clampPercent(value: number | null | undefined): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

/** The short "why" under a weak concept. */
export function masteryReason(input: {
  level?: string | null;
  score?: number | null;
  attempts?: number | null;
  correct?: number | null;
}): string {
  const level = (input.level ?? '').toUpperCase();
  const score = Math.round(input.score ?? 0);
  const attempts = input.attempts ?? 0;
  const correct = input.correct ?? 0;
  const noun = attempts === 1 ? 'attempt' : 'attempts';

  if (level === 'NEEDS_INTERVENTION') {
    if (attempts === 0) return 'Needs intervention - no practice recorded yet';
    if (correct === 0) return `Needs intervention - 0 correct out of ${attempts} ${noun}`;
    return `Needs intervention - ${correct} correct out of ${attempts} ${noun}`;
  }
  if (level === 'WEAK') return `Weak - ${score}% mastery over ${attempts} ${noun}`;
  if (level === 'DEVELOPING') return `Developing - ${score}% mastery, nearly there`;
  if (level === 'GOOD') return `Good - ${score}% mastery, keep it up`;
  if (level === 'MASTERED') return `Mastered - ${score}% mastery`;
  if (level === 'INSUFFICIENT_EVIDENCE') {
    return `Not enough evidence yet - ${attempts} ${noun} so far`;
  }
  return `${score}% mastery`;
}

/** The "why" for a concept that only appears in `/remediation/weak` (no mastery row). */
export function weakRowReason(row: { level?: string | null; score?: number | null }): string {
  const level = (row.level ?? '').toUpperCase();
  const score = Math.round(row.score ?? 0);
  if (level === 'NEEDS_INTERVENTION') return `Needs intervention - ${score}% on your last assessment`;
  if (level === 'WEAK') return `Weak - ${score}% on your last assessment`;
  return `Latest assessment showed ${score}% mastery`;
}

/** One concept the student should work on. */
export interface WeakConceptView {
  conceptId: string;
  name: string;
  topicName: string;
  chapterName: string;
  score: number | null;
  level: string;
  reason: string;
  attempts: number;
  correct: number;
}

/**
 * Merges the mastery rows and the weak-concept rows into one list, worst
 * first. A concept with no mastery score sorts last (it is "unknown", not
 * "0%").
 */
export function buildWeakConcepts(
  mastery: MasteryRow[] | null | undefined,
  weakRows: WeakConceptRow[] | null | undefined,
): WeakConceptView[] {
  const out: WeakConceptView[] = [];
  const seen = new Set<string>();

  for (const m of mastery ?? []) {
    const conceptId = m?.conceptId ?? m?.concept?.id;
    if (!conceptId || seen.has(conceptId)) continue;
    if (!isWeakLevel(m?.level)) continue;
    seen.add(conceptId);
    out.push({
      conceptId,
      name: m.concept?.name ?? 'Concept',
      topicName: m.concept?.topic?.name ?? '',
      chapterName: m.concept?.topic?.chapter?.name ?? '',
      score: typeof m.score === 'number' ? m.score : null,
      level: (m.level ?? '').toUpperCase(),
      reason: masteryReason(m),
      attempts: m.attempts ?? 0,
      correct: m.correct ?? 0,
    });
  }

  for (const w of weakRows ?? []) {
    if (!w?.id || seen.has(w.id)) continue;
    seen.add(w.id);
    out.push({
      conceptId: w.id,
      name: w.name ?? 'Concept',
      topicName: '',
      chapterName: '',
      score: typeof w.score === 'number' ? w.score : null,
      level: (w.level ?? '').toUpperCase(),
      reason: weakRowReason(w),
      attempts: 0,
      correct: 0,
    });
  }

  return out.sort((a, b) => {
    const as = a.score ?? Number.POSITIVE_INFINITY;
    const bs = b.score ?? Number.POSITIVE_INFINITY;
    if (as !== bs) return as - bs;
    return a.name.localeCompare(b.name);
  });
}

export type StepStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';

export interface StepStatusMeta {
  label: string;
  color: string;
  bg: string;
  done: boolean;
}

export function stepStatusMeta(status: string | null | undefined): StepStatusMeta {
  switch ((status ?? '').toUpperCase()) {
    case 'COMPLETED':
      return { label: 'Done', color: Ink.mint, bg: Pastel.mint, done: true };
    case 'IN_PROGRESS':
      return { label: 'In progress', color: Ink.sand, bg: Pastel.sand, done: false };
    case 'SKIPPED':
      return { label: 'Skipped', color: Colors.textSecondary, bg: Pastel.lavender, done: true };
    default:
      return { label: 'To do', color: Colors.textSecondary, bg: Pastel.lavender, done: false };
  }
}

/**
 * What a step asks the student to do.
 *
 * A quiz / practice step opens the practice flow, every other step (video,
 * notes, worksheet, ...) opens the concept page, where that lesson lives.
 */
export type StepAction = 'practice' | 'concept';

export function stepAction(contentType: string | null | undefined): StepAction {
  const type = (contentType ?? '').toUpperCase();
  if (type === 'QUIZ' || type === 'PRACTICE_SET' || type === 'FLASHCARDS') return 'practice';
  return 'concept';
}

export function stepActionLabel(action: StepAction): string {
  return action === 'practice' ? 'Start practice' : 'Practise this concept';
}

export interface PlanProgress {
  done: number;
  total: number;
  percent: number;
}

export function planProgress(plan: {
  progress?: number | null;
  completedItems?: number | null;
  items?: Array<{ status?: string | null }> | null;
  _count?: { items?: number | null } | null;
}): PlanProgress {
  const items = plan.items ?? [];
  const done =
    plan.completedItems ?? items.filter((i) => (i.status ?? '').toUpperCase() === 'COMPLETED').length;
  const total = plan._count?.items ?? items.length;
  const percent =
    plan.progress ?? (total > 0 ? Math.round((done / total) * 100) : 0);
  return { done, total, percent: clampPercent(percent) };
}

/** The next step a student should do in a plan (the first one that is not done). */
export function nextStep<T extends { status?: string | null }>(items: T[] | null | undefined): T | null {
  for (const item of items ?? []) {
    const status = (item.status ?? '').toUpperCase();
    if (status !== 'COMPLETED' && status !== 'SKIPPED') return item;
  }
  return null;
}
