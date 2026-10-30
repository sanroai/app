import { describe, expect, it } from 'vitest';
import { buildConceptSections, type SectionVideo } from './learning.service';

const CONCEPTS = [
  { id: 'c1', name: 'Electron Sharing' },
  { id: 'c2', name: 'Structures of Carbon' },
  { id: 'c3', name: 'Alcohols and Aldehydes' },
  { id: 'c4', name: 'Hydrocarbons' },
];

const derivedVideo = (): SectionVideo => ({
  contentId: 'derived',
  conceptId: null,
  durationSeconds: 2314,
  segments: [
    { title: 'Electron Sharing', startSeconds: 0, derived: true },
    { title: 'Structures of Carbon', startSeconds: 578, derived: true },
    { title: 'Alcohols and Aldehydes', startSeconds: 1156, derived: true },
    { title: 'Hydrocarbons', startSeconds: 1734, derived: true },
  ],
});

const compilation = (conceptId: string): SectionVideo => ({
  contentId: 'compilation',
  conceptId,
  durationSeconds: 16398,
  segments: [
    { title: 'Introduction', startSeconds: 0 },
    { title: 'Soaps and Detergents', startSeconds: 14742 },
  ],
});

describe('buildConceptSections', () => {
  it('maps a concept to its creator chapter by title, ending where the next one starts', () => {
    const sections = buildConceptSections(
      [
        {
          contentId: 'v1',
          conceptId: null,
          durationSeconds: 900,
          segments: [
            { title: 'Intro', startSeconds: 0 },
            { title: 'Light - reflection', startSeconds: 120 },
            { title: 'Refraction', startSeconds: 480 },
          ],
        },
      ],
      [{ id: 'c1', name: 'Light - Reflection' }],
    );

    expect(sections.get('c1')).toEqual({
      contentId: 'v1',
      startSeconds: 120,
      endSeconds: 480,
      durationSeconds: 360,
      derived: false,
    });
  });

  it('maps the derived split by position when the marker titles were shortened', () => {
    const sections = buildConceptSections(
      [
        {
          contentId: 'v1',
          conceptId: null,
          durationSeconds: 800,
          segments: [
            { title: 'Part 1', startSeconds: 0, derived: true },
            { title: 'Part 2', startSeconds: 400, derived: true },
          ],
        },
      ],
      [
        { id: 'a', name: 'Something else' },
        { id: 'b', name: 'Another thing' },
      ],
    );

    expect(sections.get('a')?.startSeconds).toBe(0);
    expect(sections.get('a')?.endSeconds).toBe(400);
    expect(sections.get('b')?.startSeconds).toBe(400);
    expect(sections.get('b')?.endSeconds).toBe(800);
    expect(sections.get('a')?.derived).toBe(true);
  });

  it('clamps the last section to the known runtime instead of running past it', () => {
    const sections = buildConceptSections(
      [
        {
          contentId: 'v1',
          conceptId: null,
          durationSeconds: 600,
          segments: [{ title: 'Whole chapter', startSeconds: 540 }],
        },
      ],
      [{ id: 'c1', name: 'Whole chapter' }],
    );

    expect(sections.get('c1')).toMatchObject({ startSeconds: 540, endSeconds: 600, durationSeconds: 60 });
  });

  it('prefers a marker over a concept-owned compilation, even when the compilation comes first', () => {
    const sections = buildConceptSections([compilation('c1'), derivedVideo()], CONCEPTS);

    // The 4.5-hour compilation owns concept 1, but the 38-minute lesson already
    // covers it at 00:00-09:38; a student should not be sent to the whole tape.
    expect(sections.get('c1')).toMatchObject({ contentId: 'derived', startSeconds: 0, endSeconds: 578 });
    expect(sections.get('c4')).toMatchObject({ contentId: 'derived', startSeconds: 1734, endSeconds: 2314 });
  });

  it('falls back to the whole concept-owned clip only when no marker names the concept', () => {
    const sections = buildConceptSections(
      [compilation('c1')],
      [{ id: 'c1', name: 'Electron Sharing' }, { id: 'c2', name: 'Structures of Carbon' }],
    );

    expect(sections.get('c1')).toMatchObject({
      contentId: 'compilation',
      startSeconds: 0,
      endSeconds: 16398,
      derived: false,
    });
    expect(sections.has('c2')).toBe(false);
  });

  it('returns null (no entry) rather than inventing a range', () => {
    const sections = buildConceptSections(
      [{ contentId: 'v1', conceptId: null, durationSeconds: 300, segments: [{ title: 'Intro', startSeconds: 0 }] }],
      [{ id: 'c1', name: 'Electron Sharing' }],
    );

    expect(sections.size).toBe(0);
  });
});
