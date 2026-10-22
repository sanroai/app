import {
  CONCEPT_MODES,
  PRACTICE_FORMATS,
  conceptModeIds,
  type ConceptModeId,
  type PracticeFormat,
} from './concept-modes';

describe('concept modes (mobile concept page)', () => {
  it('offers exactly three modes', () => {
    expect(CONCEPT_MODES).toHaveLength(3);
  });

  it('keeps the modes that serve the learning loop', () => {
    expect(conceptModeIds()).toEqual<ConceptModeId[]>(['learn', 'practice', 'ask']);
  });

  it('cuts the duplicates of the practice question pool', () => {
    const ids = conceptModeIds();
    expect(ids).not.toContain('quiz');
    expect(ids).not.toContain('challenge');
    expect(ids).not.toContain('flashcards');
  });

  it('keeps AR / 3D out of the mode bar - it belongs inside Learn', () => {
    expect(conceptModeIds()).not.toContain('ar');
  });

  it('offers the two practice formats inside one mode', () => {
    expect(PRACTICE_FORMATS.map((f) => f.id)).toEqual<PracticeFormat[]>(['quiz', 'cards']);
    expect(PRACTICE_FORMATS.map((f) => f.label)).toEqual(['Quiz', 'Flashcards']);
  });

  it('gives every mode a label and an icon', () => {
    for (const mode of CONCEPT_MODES) {
      expect(mode.label.length).toBeGreaterThan(0);
      expect(mode.icon.length).toBeGreaterThan(0);
    }
  });
});
