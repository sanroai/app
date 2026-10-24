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
