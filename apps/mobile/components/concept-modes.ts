/**
 * The concept page has three modes, each backed by different server data:
 *   learn    - the content (video lessons, notes, revision, the 3D model)
 *   practice - the study surface, with two formats: a graded quiz (records mastery)
 *               and self-rated flashcards
 *   ask      - the contextual AI tutor
 *
 * "Quick Quiz" and "Challenge" were cut: both replayed the same question pool as
 * Practice (Challenge even routed to the same screen), and their XP promises were
 * never actually awarded. AR / 3D moved into Learn, where it belongs - it is lesson
 * content, not a peer activity. Flashcards moved inside Practice: a student does not
 * think of a quiz and a flashcard deck as different activities.
 */
export type ConceptModeId = 'learn' | 'practice' | 'ask';

export interface ConceptMode {
  id: ConceptModeId;
  label: string;
  icon: 'play-circle' | 'flash' | 'fitness';
  color: string;
}

export const CONCEPT_MODES: ConceptMode[] = [
  { id: 'learn', label: 'Learn', icon: 'play-circle', color: '#0ea5e9' },
  { id: 'practice', label: 'Practice', icon: 'flash', color: '#7c3aed' },
  { id: 'ask', label: 'Ask Sanro AI', icon: 'fitness', color: '#7c3aed' },
];

/** The two formats the Practice mode offers. */
export type PracticeFormat = 'quiz' | 'cards';

export const PRACTICE_FORMATS: Array<{ id: PracticeFormat; label: string }> = [
  { id: 'quiz', label: 'Quiz' },
  { id: 'cards', label: 'Flashcards' },
];

export function conceptModeIds(): ConceptModeId[] {
  return CONCEPT_MODES.map((m) => m.id);
}
