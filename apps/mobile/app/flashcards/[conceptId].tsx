import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useConceptDetail } from '../../lib/hooks';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';

const RATINGS = [
  { label: 'Again', icon: 'sad-outline', color: '#ef4444' },
  { label: 'Hard', icon: 'happy-outline', color: '#f59e0b' },
  { label: 'Good', icon: 'sunny-outline', color: '#10b981' },
  { label: 'Easy', icon: 'flame', color: '#3b82f6' },
];

export default function FlashcardsScreen() {
  const { conceptId = '' } = useLocalSearchParams<{ conceptId: string }>();
  const { data, isLoading } = useConceptDetail(conceptId);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [ratings, setRatings] = useState<Array<'Again' | 'Hard' | 'Good' | 'Easy'>>([]);
  const [done, setDone] = useState(false);

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

  const rate = (r: 'Again' | 'Hard' | 'Good' | 'Easy') => {
    const next = [...ratings, r];
    setRatings(next);
    if (index >= cards.length - 1) {
      setDone(true);
    } else {
      setIndex(index + 1);
      setFlipped(false);
    }
  };

  if (done) {
    const good = ratings.filter((r) => r === 'Good' || r === 'Easy').length;
    const pct = Math.round((good / ratings.length) * 100);
    return (
      <View style={styles.resultWrap}>
        <View style={styles.resultIcon}>
          <Ionicons name="sync" size={44} color="#ec4899" />
        </View>
        <Text style={styles.title}>Session complete</Text>
        <Text style={styles.sub}>You rated {ratings.length} cards</Text>
        <View style={styles.resultBox}>
          <Text style={styles.resultPct}>{pct}%</Text>
          <Text style={styles.resultLabel}>recalled well</Text>
        </View>
        <TouchableOpacity style={styles.againBtn} onPress={() => { setIndex(0); setRatings([]); setDone(false); setFlipped(false); }}>
          <Ionicons name="refresh" size={16} color={Colors.white} />
          <Text style={styles.againText}>Restart</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const card = cards[index];

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

      <TouchableOpacity style={[styles.flashcard, flipped && styles.flashcardFlipped]} activeOpacity={0.95} onPress={() => setFlipped(!flipped)}>
        <View style={styles.cardBadge}>
          <Text style={styles.cardBadgeText}>{flipped ? 'ANSWER' : 'QUESTION'}</Text>
        </View>
        {flipped ? (
          <Text style={styles.cardTextAnswer}>{card.text}</Text>
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
              onPress={() => rate(r.label as any)}
            >
              <Ionicons name={r.icon as any} size={18} color={r.color} />
              <Text style={[styles.rateText, { color: r.color }]}>{r.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

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
  dotDone: { backgroundColor: '#ec4899' },
  flashcard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: '#f9a8d4',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flashcardFlipped: { borderColor: Colors.primary },
  cardBadge: { position: 'absolute', top: Spacing.lg, right: Spacing.lg },
  cardBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.textMuted, letterSpacing: 1 },
  cardText: { fontSize: 20, fontWeight: '600', color: Colors.text, textAlign: 'center', lineHeight: 28 },
  cardTextAnswer: { fontSize: 17, fontWeight: '500', color: Colors.text, textAlign: 'center', lineHeight: 26 },
  tapHint: { position: 'absolute', bottom: Spacing.lg, fontSize: 11, color: Colors.textMuted },
  ratings: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg },
  rateBtn: { flex: 1, borderRadius: BorderRadius.md, borderWidth: 1, paddingVertical: 12, alignItems: 'center', gap: 4 },
  rateText: { fontSize: 12, fontWeight: '700' },
  navRow: { marginTop: Spacing.lg, alignItems: 'center' },
  navBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 8 },
  navDisabled: { opacity: 0.4 },
  navText: { fontSize: 14, fontWeight: '600' },
  resultWrap: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  resultIcon: { width: 84, height: 84, borderRadius: 42, backgroundColor: '#ec4899' + '20', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: Colors.text, marginTop: Spacing.xl },
  sub: { fontSize: 14, color: Colors.textSecondary, marginTop: 6 },
  resultBox: { backgroundColor: '#ec4899' + '15', borderRadius: BorderRadius.lg, padding: Spacing.lg, marginTop: Spacing.xl, alignItems: 'center', minWidth: 160 },
  resultPct: { fontSize: 28, fontWeight: '800', color: '#ec4899' },
  resultLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  againBtn: { flexDirection: 'row', backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, paddingVertical: 13, paddingHorizontal: Spacing.xxl, marginTop: Spacing.xl, alignItems: 'center', gap: 6 },
  againText: { color: Colors.white, fontSize: 15, fontWeight: '600' },
});