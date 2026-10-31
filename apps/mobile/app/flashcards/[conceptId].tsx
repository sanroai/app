import { Redirect, useLocalSearchParams } from 'expo-router';

/**
 * Flashcards were removed: the deck replayed the same questions as the graded
 * quiz, wrote no mastery evidence and awarded no XP, so it could not move a
 * student along ASSESS -> DIAGNOSE -> FIX -> RETEST. Old links (a bookmark, a
 * previously installed bundle, a chat message) must not 404, so this route
 * forwards to the concept page with Practice selected.
 */
export default function FlashcardsRedirect() {
  const { conceptId = '' } = useLocalSearchParams<{ conceptId: string }>();
  return (
    <Redirect
      href={{
        pathname: '/concept/[conceptId]',
        params: { conceptId, tab: 'practice' },
      }}
    />
  );
}
