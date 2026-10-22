import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useConceptDetail, type ConceptDetail } from '../../lib/hooks';
import {
  useRateFlashcard,
  recalledPercent,
  type FlashcardRating,
  type RateFlashcardInput,
} from '../../lib/parity-hooks';
import { OfflineError } from '../../lib/api';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';

type RatingLabel = 'Again' | 'Hard' | 'Good' | 'Easy';

const RATINGS: Array<{
  label: RatingLabel;
  rating: FlashcardRating;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}> = [
  { label: 'Again', rating: 'AGAIN', icon: 'sad-outline', color: Colors.error },
  { label: 'Hard', rating: 'HARD', icon: 'thumbs-down-outline', color: Colors.warning },
  { label: 'Good', rating: 'GOOD', icon: 'sunny-outline', color: Colors.success },
  { label: 'Easy', rating: 'EASY', icon: 'flame', color: Colors.info },
];

type SaveStatus = 'idle' | 'saving' | 'saved' | 'queued' | 'failed';

interface SaveState {
  status: SaveStatus;
  failed: RateFlashcardInput[];
  pending: number;
}

const INITIAL_SAVE: SaveState = { status: 'idle', failed: [], pending: 0 };

export default function FlashcardsScreen() {
  const { conceptId = '' } = useLocalSearchParams<{ conceptId: string }>();
  const { data, isLoading } = useConceptDetail(conceptId);
  const rateFlashcard = useRateFlashcard();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [ratings, setRatings] = useState<FlashcardRating[]>([]);
  const [done, setDone] = useState(false);
  const [save, setSave] = useState<SaveState>(INITIAL_SAVE);

  useEffect(() => {
    if (save.status !== 'saved') return;
    const timer = setTimeout(() => {
      setSave((prev) => (prev.status === 'saved' ? { ...prev, status: 'idle' } : prev));
    }, 2000);
    return () => clearTimeout(timer);
  }, [save.status]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const cards = (data?.practiceQuestions ?? []).slice(0, 10);
  if (cards.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.none}>No flashcards available for this concept.</Text>
      </View>
    );
  }

  const getAnswer = (card: { type: string; options?: Array<{ isCorrect?: boolean; text: string }> }): string => {
    if (card.type === 'MCQ' || card.type === 'MULTI_SELECT') {
      const correct = card.options?.filter((o) => o.isCorrect);
      if (correct && correct.length > 0) return correct.map((o) => o.text).join(', ');
    }
    if (card.type === 'TRUE_FALSE') {
      return 'True or False — think about the statement carefully.';
    }
    return 'Think about the answer, then tap to reveal.';
  };

  /**
   * The rating is written server-side (the same call the web makes), so the
   * learner keeps the recall history between sessions. The card flips straight
   * away - the network never blocks the learner - and a failed save is kept
   * for an explicit retry instead of being dropped.
   */
  const postRating = async (input: RateFlashcardInput) => {
    setSave((prev) => ({ ...prev, status: 'saving', pending: prev.pending + 1 }));
    try {
      await rateFlashcard.mutateAsync(input);
      setSave((prev) => {
        const pending = Math.max(0, prev.pending - 1);
        const failed = prev.failed.filter((f) => f.questionId !== input.questionId);
        const status: SaveStatus = failed.length > 0 ? 'failed' : pending > 0 ? 'saving' : 'saved';
        return { pending, failed, status };
      });
    } catch (err: unknown) {
      if (err instanceof OfflineError) {
        // apiAuthed queued the rating - it syncs when the device is back online.
        setSave((prev) => ({
          ...prev,
          pending: Math.max(0, prev.pending - 1),
          status: prev.failed.length > 0 ? 'failed' : 'queued',
        }));
        return;
      }
      setSave((prev) => {
        const pending = Math.max(0, prev.pending - 1);
        const failed = prev.failed.some((f) => f.questionId === input.questionId)
          ? prev.failed
          : [...prev.failed, input];
        return { pending, failed, status: 'failed' };
      });
    }
  };

  const rate = (choice: (typeof RATINGS)[number]) => {
    const card = cards[index];
    if (!card) return;
    setRatings((prev) => [...prev, choice.rating]);
    void postRating({ questionId: card.id, rating: choice.rating });
    if (index >= cards.length - 1) {
      setDone(true);
    } else {
      setIndex(index + 1);
      setFlipped(false);
    }
  };

  const retryFailed = () => {
    const pending = save.failed;
    pending.forEach((input) => {
      void postRating(input);
    });
  };

  const saveBanner = (() => {
    if (save.status === 'idle') return null;
    if (save.status === 'saving') {
      return (
        <View style={styles.saveRow}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.saveText}>Saving rating…</Text>
        </View>
      );
    }
    if (save.status === 'saved') {
      return (
        <View style={styles.saveRow}>
          <Ionicons name="checkmark-circle" size={15} color={Colors.success} />
          <Text style={[styles.saveText, { color: Colors.success }]}>Saved</Text>
        </View>
      );
    }
    if (save.status === 'queued') {
      return (
        <View style={styles.saveRow}>
          <Ionicons name="cloud-offline-outline" size={15} color={Colors.warning} />
          <Text style={[styles.saveText, { color: Colors.warning }]}>
            Saved offline — will sync when you are back online
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.saveRow}>
        <Ionicons name="alert-circle" size={15} color={Colors.error} />
        <Text style={[styles.saveText, { color: Colors.error }]}>Rating not saved</Text>
        <TouchableOpacity
          onPress={retryFailed}
          accessibilityRole="button"
          accessibilityLabel="Retry saving the rating"
          style={styles.retryBtn}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  })();

  if (done) {
    const pct = recalledPercent(ratings);
    return (
      <View style={styles.resultWrap}>
        <View style={styles.resultIcon}>
          <Ionicons name="sync" size={44} color={Colors.pink} />
        </View>
        <Text style={styles.title}>Session complete</Text>
        <Text style={styles.sub}>You rated {ratings.length} cards</Text>
        <View style={styles.resultBox}>
          <Text style={styles.resultPct}>{pct}%</Text>
          <Text style={styles.resultLabel}>recalled well</Text>
        </View>
        {saveBanner}
        <TouchableOpacity
          style={styles.againBtn}
          onPress={() => {
            setIndex(0);
            setRatings([]);
            setDone(false);
            setFlipped(false);
            setSave(INITIAL_SAVE);
          }}
        >
          <Ionicons name="refresh" size={16} color={Colors.white} />
          <Text style={styles.againText}>Restart</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const card = cards[index];
  const detail = data as (ConceptDetail & { flashcardRatings?: Record<string, string> }) | undefined;
  const previousRating = detail?.flashcardRatings?.[card.id];

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.counter}>Card {index + 1} of {cards.length}</Text>
        <View style={styles.dots}>
          {cards.map((_, i) => (
            <View key={i} style={[styles.dot, i <= index && styles.dotDone]} />
          ))}
        </View>
      </View>

      <TouchableOpacity style={[styles.flashcard, flipped && styles.flashcardFlipped]} activeOpacity={0.95} onPress={() => setFlipped(!flipped)} accessibilityLabel={flipped ? 'Answer side. Tap to flip back to question.' : 'Question side. Tap to reveal answer.'} accessibilityRole="button">
        <View style={styles.cardBadge}>
          {previousRating ? (
            <Text style={styles.previousRating}>{previousRating}</Text>
          ) : null}
          <Text style={styles.cardBadgeText}>{flipped ? 'ANSWER' : 'QUESTION'}</Text>
        </View>
        {flipped ? (
          <Text style={styles.cardTextAnswer}>{getAnswer(card)}</Text>
        ) : (
          <Text style={styles.cardText}>{card.text}</Text>
        )}
        <Text style={styles.tapHint}>Tap to flip</Text>
      </TouchableOpacity>

      {flipped && (
        <View style={styles.ratings}>
          {RATINGS.map((r) => (
            <TouchableOpacity
              key={r.label}
              style={[styles.rateBtn, { backgroundColor: r.color + '18', borderColor: r.color + '55' }]}
              onPress={() => rate(r)}
              accessibilityLabel={`Rate as ${r.label}`}
              accessibilityRole="button"
            >
              <Ionicons name={r.icon} size={18} color={r.color} />
              <Text style={[styles.rateText, { color: r.color }]}>{r.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {saveBanner}

      {!flipped && (
        <View style={styles.navRow}>
          <TouchableOpacity
            style={[styles.navBtn, index === 0 && styles.navDisabled]}
            disabled={index === 0}
            onPress={() => { setIndex(Math.max(0, index - 1)); setFlipped(false); }}
          >
            <Ionicons name="chevron-back" size={18} color={index === 0 ? Colors.textMuted : Colors.primary} />
            <Text style={[styles.navText, { color: index === 0 ? Colors.textMuted : Colors.primary }]}>Previous</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  none: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', padding: Spacing.xl },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  counter: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  dots: { flexDirection: 'row', gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border },
  dotDone: { backgroundColor: Colors.pink },
  flashcard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.pink + '40',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flashcardFlipped: { borderColor: Colors.primary },
  cardBadge: { position: 'absolute', top: Spacing.lg, right: Spacing.lg, alignItems: 'flex-end' },
  previousRating: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: Colors.textSecondary,
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 4,
  },
  cardBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.textMuted, letterSpacing: 1 },
  cardText: { fontSize: 20, fontWeight: '600', color: Colors.text, textAlign: 'center', lineHeight: 28 },
  cardTextAnswer: { fontSize: 17, fontWeight: '500', color: Colors.text, textAlign: 'center', lineHeight: 26 },
  tapHint: { position: 'absolute', bottom: Spacing.lg, fontSize: 11, color: Colors.textMuted },
  ratings: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg },
  rateBtn: { flex: 1, borderRadius: BorderRadius.md, borderWidth: 1, paddingVertical: 12, alignItems: 'center', gap: 4 },
  rateText: { fontSize: 12, fontWeight: '700' },
  saveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.md,
  },
  saveText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  retryBtn: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  retryText: { color: Colors.error, fontSize: 12, fontWeight: '700' },
  navRow: { marginTop: Spacing.lg, alignItems: 'center' },
  navBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 8 },
  navDisabled: { opacity: 0.4 },
  navText: { fontSize: 14, fontWeight: '600' },
  resultWrap: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  resultIcon: { width: 84, height: 84, borderRadius: 42, backgroundColor: Colors.pink + '20', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: Colors.text, marginTop: Spacing.xl },
  sub: { fontSize: 14, color: Colors.textSecondary, marginTop: 6 },
  resultBox: { backgroundColor: Colors.pink + '15', borderRadius: BorderRadius.lg, padding: Spacing.lg, marginTop: Spacing.xl, alignItems: 'center', minWidth: 160 },
  resultPct: { fontSize: 28, fontWeight: '800', color: Colors.pink },
  resultLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  againBtn: { flexDirection: 'row', backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, paddingVertical: 13, paddingHorizontal: Spacing.xxl, marginTop: Spacing.xl, alignItems: 'center', gap: 6 },
  againText: { color: Colors.white, fontSize: 15, fontWeight: '600' },
});
