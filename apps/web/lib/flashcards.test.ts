import { describe, expect, it } from 'vitest';
import { flashcardAnswer, recalledPercent } from './flashcards';

describe('flashcardAnswer', () => {
  it('reveals the correct option text for a multiple choice card', () => {
    expect(
      flashcardAnswer({
        type: 'MCQ',
        options: [
          { text: 'Oxygen', isCorrect: false },
          { text: 'Nitrogen', isCorrect: true },
        ],
      }),
    ).toBe('Nitrogen');
  });

  it('joins every correct option of a multi select card', () => {
    expect(
      flashcardAnswer({
        type: 'MULTI_SELECT',
        options: [
          { text: 'A', isCorrect: true },
          { text: 'B', isCorrect: false },
          { text: 'C', isCorrect: true },
        ],
      }),
    ).toBe('A, C');
  });

  it('asks the learner to judge a true/false statement', () => {
    expect(flashcardAnswer({ type: 'TRUE_FALSE' })).toContain('True or False');
  });

  it('falls back to self recall for a written answer', () => {
    expect(flashcardAnswer({ type: 'SHORT_ANSWER', answer: '42' })).toBe(
      'Think about the answer, then tap to reveal.',
    );
  });
});

describe('recalledPercent', () => {
  it('counts only Good and Easy as recalled', () => {
    expect(recalledPercent(['GOOD', 'AGAIN', 'EASY', 'HARD'])).toBe(50);
  });

  it('is zero for an empty session', () => {
    expect(recalledPercent([])).toBe(0);
  });

  it('is a hundred for a perfect session', () => {
    expect(recalledPercent(['EASY', 'GOOD'])).toBe(100);
  });
});
