/**
 * The concept page has three modes, each backed by different server data:
 *   learn    - the content (video lessons, notes, revision, the 3D model)
 *   practice - one graded quiz session (records mastery evidence and XP)
 *   ask      - the contextual AI tutor
 *
 * "Quick Quiz" and "Challenge" were cut: both replayed the same question pool as
 * Practice (Challenge even routed to the same screen), and their XP promises were
 * never actually awarded. AR / 3D moved into Learn, where it belongs - it is lesson
 * content, not a peer activity.
 *
 * Flashcards were cut too: the deck replayed the same questions as the quiz, wrote
 * no mastery evidence and awarded no XP, so it could not move the student along
 * ASSESS -> DIAGNOSE -> FIX -> RETEST. Practice is now a single action.
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

export function conceptModeIds(): ConceptModeId[] {
  return CONCEPT_MODES.map((m) => m.id);
}
