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
import type { ImageSourcePropType } from 'react-native';

export const SUBJECT_ART = {
  science: require('../assets/art/subject-science.jpg') as ImageSourcePropType,
  mathematics: require('../assets/art/subject-mathematics.jpg') as ImageSourcePropType,
  english: require('../assets/art/subject-english.jpg') as ImageSourcePropType,
  chapter: require('../assets/art/chapter-banner.jpg') as ImageSourcePropType,
  dashboard: require('../assets/art/dashboard-hero.jpg') as ImageSourcePropType,
};

/** Pick the banner for a subject name (or its code, e.g. `SCI-10`). */
export function subjectBanner(name?: string | null, code?: string | null): ImageSourcePropType {
  const haystack = `${name ?? ''} ${code ?? ''}`.toLowerCase();
  if (/scien|physic|chemis|biolog|evs|environment/.test(haystack)) return SUBJECT_ART.science;
  if (/math|ganit/.test(haystack)) return SUBJECT_ART.mathematics;
  if (/english|literature|language/.test(haystack)) return SUBJECT_ART.english;
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
