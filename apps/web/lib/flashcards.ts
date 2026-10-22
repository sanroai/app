/**
 * Flashcard rules shared by the web client.
 *
 * The mobile flashcard screen is the reference implementation: the answer side
 * of a card reveals the graded answer - which is the option TEXT, because that
 * is what Question.answer holds - and a session is scored by the share of
 * cards rated Good or Easy.
 */

export type FlashcardRating = 'AGAIN' | 'HARD' | 'GOOD' | 'EASY';

export const MAX_FLASH_CARDS = 10;

export type FlashcardOption = {
  text: string;
  isCorrect?: boolean;
};

export type FlashcardLike = {
  type: string;
  text?: string;
  answer?: string;
  explanation?: string;
  options?: FlashcardOption[];
};

/**
 * The answer shown on the back of a card.
 * - MCQ / MULTI_SELECT: the correct option text (the graded answer).
 * - TRUE_FALSE: the statement still has to be judged.
 * - anything else: the learner recalls it themselves.
 */
export function flashcardAnswer(card: FlashcardLike): string {
  if (card.type === 'MCQ' || card.type === 'MULTI_SELECT') {
    const correct = (card.options ?? []).filter((option) => option.isCorrect);
    if (correct.length > 0) return correct.map((option) => option.text).join(', ');
  }
  if (card.type === 'TRUE_FALSE') {
    return 'True or False — think about the statement carefully.';
  }
  return 'Think about the answer, then tap to reveal.';
}

/** The share of the session that was recalled well (Good or Easy). */
export function recalledPercent(ratings: FlashcardRating[]): number {
  if (ratings.length === 0) return 0;
  const recalled = ratings.filter((rating) => rating === 'GOOD' || rating === 'EASY').length;
  return Math.round((recalled / ratings.length) * 100);
}
