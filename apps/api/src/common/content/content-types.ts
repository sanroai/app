import { ContentType } from '@prisma/client';

/**
 * Canonical lesson taxonomy (product decision, researched against real K-12
 * platforms — see docs/ROADMAP.md). A ContentItem may only ever carry one of
 * these six types going forward.
 *
 * `OTHER` is the DB value for the governed catch-all (surfaced as "Resource"
 * in the UI). RESOURCE is deliberately NOT a Prisma enum value so no migration
 * is required; legacy types are folded into the canonical set at read time.
 */
export const CANONICAL_CONTENT_TYPES = [
  'VIDEO',
  'NOTES',
  'WORKSHEET',
  'INTERACTIVE',
  'EXAMPLE',
  'OTHER',
] as const;

export type CanonicalContentType = (typeof CANONICAL_CONTENT_TYPES)[number];

/**
 * Every legacy/duplicate ContentItem type folded into its canonical type.
 * KEY must always be a real Prisma ContentType value.
 */
const CANONICAL_BY_TYPE: Record<string, CanonicalContentType> = {
  VIDEO: 'VIDEO',
  NOTES: 'NOTES',
  ARTICLE: 'NOTES',
  READING: 'NOTES',
  PDF: 'NOTES',
  WORKSHEET: 'WORKSHEET',
  INTERACTIVE: 'INTERACTIVE',
  MODEL_3D: 'INTERACTIVE',
  GAME: 'INTERACTIVE',
  AR: 'INTERACTIVE',
  EXAMPLE: 'EXAMPLE',
  QUIZ: 'OTHER',
  PRACTICE_SET: 'OTHER',
  IMAGE: 'OTHER',
  REVISION: 'OTHER',
  FLASHCARDS: 'OTHER',
  OTHER: 'OTHER',
};

/** Fold any stored type into its canonical equivalent (unknown → OTHER). */
export function canonicalContentType(type: string): CanonicalContentType {
  return CANONICAL_BY_TYPE[type] ?? 'OTHER';
}

/**
 * All stored type values that fold into the given canonical type. Used to
 * expand a canonical filter back into the raw values present in old rows, so
 * legacy data stays reachable after the contract narrows to canonical types.
 */
export function canonicalTypeMembers(type: string): ContentType[] {
  const canonical = canonicalContentType(type);
  return (Object.keys(CANONICAL_BY_TYPE) as string[]).filter(
    (key) => CANONICAL_BY_TYPE[key] === canonical,
  ) as ContentType[];
}

/** Merge raw `groupBy(['type'])` counts into canonical buckets. */
export function mergeCanonicalCounts(entries: Array<[string, number]>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [type, count] of entries) {
    const key = canonicalContentType(type);
    out[key] = (out[key] ?? 0) + count;
  }
  return out;
}
