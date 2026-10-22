import { describe, expect, it } from 'vitest';
import { ContentType } from '@prisma/client';
import {
  CANONICAL_CONTENT_TYPES,
  canonicalContentType,
  canonicalTypeMembers,
  mergeCanonicalCounts,
} from './content-types';

describe('canonical lesson taxonomy', () => {
  it('exposes exactly six canonical types, all valid Prisma enum values', () => {
    expect(CANONICAL_CONTENT_TYPES).toHaveLength(6);
    const valid = new Set<string>(Object.values(ContentType));
    for (const type of CANONICAL_CONTENT_TYPES) {
      expect(valid.has(type)).toBe(true);
    }
  });

  it('folds every legacy ContentItem type into its canonical type', () => {
    const cases: Array<[string, string]> = [
      ['VIDEO', 'VIDEO'],
      ['NOTES', 'NOTES'],
      ['ARTICLE', 'NOTES'],
      ['READING', 'NOTES'],
      ['PDF', 'NOTES'],
      ['WORKSHEET', 'WORKSHEET'],
      ['INTERACTIVE', 'INTERACTIVE'],
      ['MODEL_3D', 'INTERACTIVE'],
      ['GAME', 'INTERACTIVE'],
      ['AR', 'INTERACTIVE'],
      ['EXAMPLE', 'EXAMPLE'],
      ['QUIZ', 'OTHER'],
      ['PRACTICE_SET', 'OTHER'],
      ['IMAGE', 'OTHER'],
      ['REVISION', 'OTHER'],
      ['FLASHCARDS', 'OTHER'],
      ['OTHER', 'OTHER'],
    ];

    for (const [input, expected] of cases) {
      expect(canonicalContentType(input)).toBe(expected);
    }

    // unknown / future values degrade to the governed catch-all
    expect(canonicalContentType('SOMETHING_NEW')).toBe('OTHER');
  });

  it('expands a canonical filter back to every stored member type', () => {
    expect(canonicalTypeMembers('VIDEO')).toEqual(['VIDEO']);
    expect(canonicalTypeMembers('NOTES')).toEqual(
      expect.arrayContaining(['NOTES', 'ARTICLE', 'READING', 'PDF']),
    );
    expect(canonicalTypeMembers('NOTES')).toHaveLength(4);
    expect(canonicalTypeMembers('OTHER')).toEqual(
      expect.arrayContaining(['OTHER', 'QUIZ', 'PRACTICE_SET', 'IMAGE', 'REVISION', 'FLASHCARDS']),
    );
    expect(canonicalTypeMembers('NOTES')).not.toContain('VIDEO');
  });

  it('merges raw groupBy counts into canonical buckets', () => {
    expect(
      mergeCanonicalCounts([
        ['NOTES', 67],
        ['ARTICLE', 7],
        ['READING', 3],
        ['VIDEO', 69],
      ]),
    ).toEqual({ NOTES: 77, VIDEO: 69 });
  });

  it('is a pure identity on already-canonical input', () => {
    expect(mergeCanonicalCounts([['VIDEO', 69]])).toEqual({ VIDEO: 69 });
    expect(canonicalContentType('WORKSHEET')).toBe('WORKSHEET');
  });
});
