import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from './Card';
import { Icon3D } from './Icon3D';
import { Colors, Spacing, BorderRadius, Pastel } from '../constants/theme';
import {
  clampPercent,
  levelMeta,
  scoreColor,
  type WeakConceptView,
} from '../lib/remediation-format';

/** The mastery bar - the same colour rule the web dashboard uses. */
export function RemediationMasteryBar({ percent, color }: { percent: number; color: string }) {
  return (
    <View style={styles.barTrack}>
      <View style={[styles.barFill, { width: `${clampPercent(percent)}%`, backgroundColor: color }]} />
    </View>
  );
}

/** The mastery level badge (Needs work / Weak / ...). */
export function RemediationLevelChip({ level, score }: { level: string; score: number | null }) {
  const meta = levelMeta(level);
  return (
    <View style={[styles.levelChip, { backgroundColor: meta.bg }]}>
      <Text style={[styles.levelChipText, { color: meta.color }]}>{meta.label}</Text>
      <Text style={[styles.levelChipScore, { color: meta.color }]}>
        {score == null ? '—' : `${score}%`}
      </Text>
    </View>
  );
}

interface CardProps {
  concept: WeakConceptView;
  onPractise: (conceptId: string) => void;
  onStartPractice: (conceptId: string) => void;
  practiceBusy?: boolean;
}

/** One weak concept: the score, the reason and what to do about it. */
export function RemediationConceptCard({
  concept,
  onPractise,
  onStartPractice,
  practiceBusy,
}: CardProps) {
  const color = scoreColor(concept.score);
  const where = [concept.chapterName, concept.topicName].filter(Boolean).join(' · ');

  return (
    <Card style={styles.conceptCard} accent>
      <View style={styles.conceptTop}>
        <View style={styles.conceptIcon}>
          <Icon3D name="brain" size={26} />
        </View>
        <View style={styles.conceptBody}>
          <Text style={styles.conceptName} numberOfLines={2}>
            {concept.name}
          </Text>
          {where ? (
            <Text style={styles.conceptMeta} numberOfLines={1}>
              {where}
            </Text>
          ) : null}
        </View>
        <RemediationLevelChip level={concept.level} score={concept.score} />
      </View>

      <View style={styles.barWrap}>
        <RemediationMasteryBar percent={concept.score ?? 0} color={color} />
      </View>

      <Text style={styles.reason}>{concept.reason}</Text>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.primaryBtn, practiceBusy && styles.btnDisabled]}
          onPress={() => onPractise(concept.conceptId)}
          disabled={practiceBusy}
          accessibilityRole="button"
          accessibilityLabel={`Practise ${concept.name}`}
        >
          <Ionicons name="book" size={16} color={Colors.white} />
          <Text style={styles.primaryBtnText}>Practise this concept</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.secondaryBtn, practiceBusy && styles.btnDisabled]}
          onPress={() => onStartPractice(concept.conceptId)}
          disabled={practiceBusy}
          accessibilityRole="button"
          accessibilityLabel={`Start practice for ${concept.name}`}
        >
          <Ionicons name="flash" size={16} color={Colors.primary} />
          <Text style={styles.secondaryBtnText}>{practiceBusy ? 'Starting…' : 'Start practice'}</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
}

interface ListProps {
  concepts: WeakConceptView[];
  onPractise: (conceptId: string) => void;
  onStartPractice: (conceptId: string) => void;
  busyConceptId?: string | null;
}

/** The "focus first" list: the weak concepts, worst first. */
export function RemediationWeakList({ concepts, onPractise, onStartPractice, busyConceptId }: ListProps) {
  return (
    <View>
      {concepts.map((c) => (
        <RemediationConceptCard
          key={c.conceptId}
          concept={c}
          onPractise={onPractise}
          onStartPractice={onStartPractice}
          practiceBusy={busyConceptId === c.conceptId}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  conceptCard: { marginBottom: Spacing.md },
  conceptTop: { flexDirection: 'row', alignItems: 'center' },
  conceptIcon: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.md,
    backgroundColor: Pastel.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conceptBody: { flex: 1, marginHorizontal: Spacing.md },
  conceptName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  conceptMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  levelChip: {
    alignItems: 'flex-end',
    borderRadius: BorderRadius.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  levelChipText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  levelChipScore: { fontSize: 14, fontWeight: '800', marginTop: 1 },
  barWrap: { marginTop: Spacing.md },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: Colors.surfaceSecondary, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
  reason: { fontSize: 12, color: Colors.textSecondary, marginTop: Spacing.sm, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: 11,
  },
  primaryBtnText: { color: Colors.white, fontSize: 13, fontWeight: '700' },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  secondaryBtnText: { color: Colors.primary, fontSize: 13, fontWeight: '700' },
  btnDisabled: { opacity: 0.55 },
});
