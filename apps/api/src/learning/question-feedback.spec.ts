import { describe, it, expect } from 'vitest';
import {
  LEGACY_EXPLANATION,
  resolveQuestionFeedback,
  type FeedbackContext,
  type FeedbackQuestion,
} from './question-feedback';

const question = (overrides: Partial<FeedbackQuestion> = {}): FeedbackQuestion => ({
  id: 'q-1',
  type: 'MCQ',
  text: 'Which of the following is an example of a combination reaction?',
  answer: 'CaO + CO2 -> CaCO3',
  explanation: null,
  conceptId: 'c-1',
  chapterId: 'ch-1',
  ...overrides,
});

const context = (notes: string[] = [], overrides: Partial<FeedbackContext> = {}): FeedbackContext => ({
  conceptName: 'Combination and Decomposition',
  chapterName: 'Chemical Reactions and Equations',
  notes,
  ...overrides,
});

describe('resolveQuestionFeedback', () => {
  it('uses an authored explanation when the question has one', () => {
    const result = resolveQuestionFeedback(
      question({ explanation: 'Two reactants join to form a single product, which is what a combination reaction is.' }),
      context(['Some unrelated note sentence that is definitely long enough to be a candidate.']),
    );
    expect(result.source).toBe('authored');
    expect(result.explanation).toContain('single product');
  });

  it('ignores the legacy template sentence and quotes the notes instead', () => {
    const result = resolveQuestionFeedback(
      question({ explanation: LEGACY_EXPLANATION }),
      context(['Two or more substances combine to form one product, so CaO and CO2 give CaCO3 in a combination reaction.']),
    );
    expect(result.source).toBe('notes');
    expect(result.explanation).toContain('combine to form one product');
  });

  it('treats a comment that is too short as missing', () => {
    const result = resolveQuestionFeedback(
      question({ explanation: 'See notes.' }),
      context(['Two or more substances combine to form one product, so CaO and CO2 give CaCO3 in a combination reaction.']),
    );
    expect(result.source).toBe('notes');
  });

  it('quotes the notes sentence that mentions the answer over a generic one', () => {
    const notes = [
      'Chemical equations must always be balanced before they are used in a calculation of any kind whatsoever.',
      'Calcium oxide reacts with carbon dioxide to give CaCO3, a single product, in a combination reaction.',
    ];
    const result = resolveQuestionFeedback(question(), context(notes));
    expect(result.source).toBe('notes');
    expect(result.explanation).toContain('Calcium oxide reacts with carbon dioxide');
  });

  it('restates the answer when nothing in the notes matches', () => {
    const result = resolveQuestionFeedback(
      question(),
      context(['Photosynthesis is the process by which green plants prepare their own food using sunlight.']),
    );
    expect(result.source).toBe('answer');
    expect(result.explanation).toContain('CaO + CO2 -> CaCO3');
    expect(result.explanation).toContain('Combination and Decomposition');
  });

  it('never returns an empty explanation', () => {
    const result = resolveQuestionFeedback(question({ explanation: null }), context([]));
    expect(result.explanation.trim().length).toBeGreaterThan(20);
  });
});
