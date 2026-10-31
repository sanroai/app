/**
 * Mobile mirror of `apps/web/lib/subject-art.ts`.
 *
 * The banner JPGs are produced once by `scripts/qa/build-brand-art.mjs` and copied
 * into both `apps/web/public/art` and `apps/mobile/assets/art`, so the same
 * chapter opens with the same artwork on both platforms (docs/PARITY_POLICY.md
 * applies to art as much as to features).
 *
 * `require` (not a URL) because Metro must bundle the asset.
 */
/* eslint-disable @typescript-eslint/no-require-imports */
import type { ImageSourcePropType } from 'react-native';

export const SUBJECT_ART = {
  science: [
    require('../assets/art/subject-science-1.jpg') as ImageSourcePropType,
    require('../assets/art/subject-science-2.jpg') as ImageSourcePropType,
    require('../assets/art/subject-science-3.jpg') as ImageSourcePropType,
    require('../assets/art/subject-science-4.jpg') as ImageSourcePropType,
    require('../assets/art/subject-science-5.jpg') as ImageSourcePropType,
    require('../assets/art/subject-science-6.jpg') as ImageSourcePropType,
    require('../assets/art/subject-science-7.jpg') as ImageSourcePropType,
    require('../assets/art/subject-science-8.jpg') as ImageSourcePropType,
    require('../assets/art/subject-science-9.jpg') as ImageSourcePropType,
    require('../assets/art/subject-science-10.jpg') as ImageSourcePropType,
  ],
  mathematics: [
    require('../assets/art/subject-mathematics-1.jpg') as ImageSourcePropType,
    require('../assets/art/subject-mathematics-2.jpg') as ImageSourcePropType,
    require('../assets/art/subject-mathematics-3.jpg') as ImageSourcePropType,
    require('../assets/art/subject-mathematics-4.jpg') as ImageSourcePropType,
    require('../assets/art/subject-mathematics-5.jpg') as ImageSourcePropType,
    require('../assets/art/subject-mathematics-6.jpg') as ImageSourcePropType,
    require('../assets/art/subject-mathematics-7.jpg') as ImageSourcePropType,
    require('../assets/art/subject-mathematics-8.jpg') as ImageSourcePropType,
    require('../assets/art/subject-mathematics-9.jpg') as ImageSourcePropType,
    require('../assets/art/subject-mathematics-10.jpg') as ImageSourcePropType,
  ],
  english: [
    require('../assets/art/subject-english-1.jpg') as ImageSourcePropType,
    require('../assets/art/subject-english-2.jpg') as ImageSourcePropType,
    require('../assets/art/subject-english-3.jpg') as ImageSourcePropType,
    require('../assets/art/subject-english-4.jpg') as ImageSourcePropType,
    require('../assets/art/subject-english-5.jpg') as ImageSourcePropType,
    require('../assets/art/subject-english-6.jpg') as ImageSourcePropType,
    require('../assets/art/subject-english-7.jpg') as ImageSourcePropType,
    require('../assets/art/subject-english-8.jpg') as ImageSourcePropType,
    require('../assets/art/subject-english-9.jpg') as ImageSourcePropType,
    require('../assets/art/subject-english-10.jpg') as ImageSourcePropType,
  ],
  chapter: require('../assets/art/chapter-banner.jpg') as ImageSourcePropType,
  dashboard: require('../assets/art/dashboard-hero.jpg') as ImageSourcePropType,
};

/**
 * Which framing of the subject photograph a class gets (1-10), mirroring
 * `classSubjectVariant` in `apps/web/lib/subject-art.ts`.
 *
 * One subject repeats in every class, so one photograph made every class look
 * like the same card. Every class now has its own generated picture - same
 * subject, different crop - deterministically, so the two platforms always agree.
 */
export function classSubjectVariant(grade?: string | number | null): number {
  const value = Number.parseInt(String(grade ?? ''), 10);
  if (!Number.isFinite(value)) return 1;
  return (((value - 1) % 10) + 10) % 10 + 1;
}

/** Pick the banner for a subject name (or its code, e.g. `SCI-10`) and class. */
export function subjectBanner(
  name?: string | null,
  code?: string | null,
  grade?: string | number | null,
): ImageSourcePropType {
  const haystack = `${name ?? ''} ${code ?? ''}`.toLowerCase();
  const index = classSubjectVariant(grade) - 1;
  if (/scien|physic|chemis|biolog|evs|environment/.test(haystack)) return SUBJECT_ART.science[index];
  if (/math|ganit/.test(haystack)) return SUBJECT_ART.mathematics[index];
  if (/english|literature|language/.test(haystack)) return SUBJECT_ART.english[index];
  return SUBJECT_ART.chapter;
}

/**
 * Three letters that stand for a subject ("SCI", "MAT", "ENG"), mirroring
 * `subjectMonogram` in `apps/web/components/subject-banner.tsx`.
 *
 * The card used to show a 3D PNG icon in a white square; next to a sentence-case
 * subject name that reads as an emoji sticker, so both platforms now set a
 * typographic monogram on the banner instead.
 */
export function subjectMonogram(name?: string | null, code?: string | null): string {
  const key = `${name ?? ''} ${code ?? ''}`.toLowerCase();
  if (/scien|physic|chemis|biolog/.test(key)) return 'SCI';
  if (/math|ganit/.test(key)) return 'MAT';
  if (/english|literature/.test(key)) return 'ENG';
  if (/hindi/.test(key)) return 'HIN';
  if (/sanskrit/.test(key)) return 'SAN';
  if (/social|history|geograph|civic/.test(key)) return 'SST';
  if (/art|craft/.test(key)) return 'ART';
  const letters = `${code || name || ''}`.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase();
  return letters || 'SUB';
}
