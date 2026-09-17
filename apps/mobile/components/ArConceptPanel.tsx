import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from './Card';
import { ArModelViewer } from './ArModelViewer';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { resolveAssetUrl } from '../lib/ar-assets';
import { detectArCapability } from '../lib/ar-capability';
import {
  useArModelUrl,
  useArQuickCheck,
  useSubmitArQuickCheck,
  useRecordArActivity,
  type ArCard,
} from '../lib/ar-hooks';

const DIFFICULTY_COLOR: Record<string, string> = {
  EASY: Colors.success,
  MEDIUM: '#f59e0b',
  HARD: Colors.error,
};

export function ArConceptPanel({ conceptId, items }: { conceptId: string; items: ArCard[] }) {
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? '');
  const selected = items.find((i) => i.id === selectedId) ?? items[0];
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const [showQuickCheck, setShowQuickCheck] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const openedRef = useRef<Set<string>>(new Set());
  const capability = useMemo(() => detectArCapability(), []);

  const recordActivity = useRecordArActivity();
  const model = useArModelUrl(selected?.id ?? '', Boolean(selected?.id));
  const quickCheck = useArQuickCheck(selected?.id ?? '', showQuickCheck);
  const submit = useSubmitArQuickCheck(selected?.id ?? '');

  useEffect(() => {
    if (selected?.id && !openedRef.current.has(selected.id)) {
      openedRef.current.add(selected.id);
      recordActivity.mutate({ id: selected.id, type: 'AR_OPENED', metadata: { conceptId } });
    }
    setActiveHotspot(null);
    setShowQuickCheck(false);
    setSubmitted(false);
    setAnswers({});
  }, [selected?.id, conceptId]);

  if (!selected) return null;

  const hotspots = selected.hotspots ?? [];
  const modelUrl = resolveAssetUrl(model.data?.url);
  const posterUrl = resolveAssetUrl(selected.previewUrl);

  const onHotspot = (id: string) => {
    setActiveHotspot((current) => (current === id ? null : id));
    recordActivity.mutate({ id: selected.id, type: 'AR_MODEL_INTERACTION', metadata: { hotspot: id } });
  };

  const onSubmit = () => {
    const payload = Object.entries(answers).map(([questionId, optionId]) => ({ questionId, optionId }));
    submit.mutate(payload, {
      onSuccess: () => setSubmitted(true),
      onError: () => Alert.alert('Could not submit', 'Please check your connection and try again.'),
    });
  };

  const questions = quickCheck.data?.questions ?? [];
  const resultByQuestion = useMemo(
    () => new Map((submit.data?.results ?? []).map((r) => [r.questionId, r])),
    [submit.data],
  );

  return (
    <View style={styles.wrap}>
      {items.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {items.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.chip, item.id === selected.id && styles.chipActive]}
              onPress={() => setSelectedId(item.id)}
            >
              <Text style={[styles.chipText, item.id === selected.id && styles.chipTextActive]}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <Card style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.iconBadge}>
              <Ionicons name="cube" size={20} color="#4f46e5" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{selected.title}</Text>
              {selected.grade ? <Text style={styles.sub}>Class {selected.grade}</Text> : null}
            </View>
          </View>
          <View style={[styles.difficulty, { backgroundColor: (DIFFICULTY_COLOR[selected.difficulty] ?? Colors.textMuted) + '20' }]}>
            <Text style={[styles.difficultyText, { color: DIFFICULTY_COLOR[selected.difficulty] ?? Colors.textMuted }]}>
              {selected.difficulty}
            </Text>
          </View>
        </View>

        {selected.learningObjective ? (
          <View style={styles.objective}>
            <Ionicons name="locate" size={15} color={Colors.primary} />
            <Text style={styles.objectiveText}>{selected.learningObjective}</Text>
          </View>
        ) : null}

        {model.isLoading ? (
          <View style={styles.viewerLoading}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.viewerLoadingText}>Preparing model...</Text>
          </View>
        ) : model.isError || !modelUrl ? (
          <View style={styles.viewerLoading}>
            <Ionicons name="cube-outline" size={28} color={Colors.textMuted} />
            <Text style={styles.viewerLoadingText}>3D model unavailable for this concept.</Text>
          </View>
        ) : (
          <ArModelViewer
            src={modelUrl}
            poster={posterUrl}
            title={selected.title}
            hotspots={hotspots.map((h) => ({ id: h.id, label: h.label, position: h.position }))}
            onFirstInteraction={() => recordActivity.mutate({ id: selected.id, type: 'AR_STARTED' })}
          />
        )}

        {!capability.available ? (
          <View style={styles.capability}>
            <Ionicons name="information-circle-outline" size={15} color={Colors.textSecondary} />
            <Text style={styles.capabilityText}>{capability.reason}</Text>
          </View>
        ) : null}

        {selected.description ? <Text style={styles.description}>{selected.description}</Text> : null}
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>How to use</Text>
        <Text style={styles.body}>
          {selected.instructions ?? 'Rotate the model to explore it from every angle.'}
        </Text>
      </Card>

      {hotspots.length > 0 && (
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Labelled parts</Text>
          <View style={styles.hotspotWrap}>
            {hotspots.map((hotspot) => (
              <TouchableOpacity
                key={hotspot.id}
                style={[styles.hotspotChip, activeHotspot === hotspot.id && styles.hotspotChipActive]}
                onPress={() => onHotspot(hotspot.id)}
              >
                <Text style={[styles.hotspotText, activeHotspot === hotspot.id && styles.hotspotTextActive]}>
                  {hotspot.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {activeHotspot ? (
            <Text style={styles.hotspotDescription}>
              {hotspots.find((h) => h.id === activeHotspot)?.description}
            </Text>
          ) : null}
        </Card>
      )}

      <Card style={styles.card}>
        <View style={styles.quickHeader}>
          <Text style={styles.sectionTitle}>Quick check</Text>
          {!showQuickCheck && (
            <TouchableOpacity
              style={styles.startBtn}
              onPress={() => {
                setShowQuickCheck(true);
                recordActivity.mutate({ id: selected.id, type: 'AR_QUICK_CHECK_STARTED' });
              }}
            >
              <Text style={styles.startBtnText}>Start</Text>
            </TouchableOpacity>
          )}
        </View>

        {showQuickCheck && quickCheck.isLoading && <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.md }} />}

        {showQuickCheck && quickCheck.isError && (
          <Text style={styles.mutedText}>Could not load questions. Please retry.</Text>
        )}

        {showQuickCheck && !quickCheck.isLoading && questions.length === 0 && (
          <Text style={styles.mutedText}>No quick-check questions are available for this concept yet.</Text>
        )}

        {showQuickCheck &&
          questions.map((question, index) => {
            const outcome = resultByQuestion.get(question.id);
            return (
              <View key={question.id} style={styles.question}>
                <Text style={styles.questionText}>
                  {index + 1}. {question.text}
                </Text>
                {question.options.map((option) => {
                  const chosen = answers[question.id] === option.id;
                  const isCorrect = outcome?.correct && chosen;
                  const isWrong = outcome && chosen && !outcome.correct;
                  return (
                    <TouchableOpacity
                      key={option.id}
                      disabled={submitted}
                      style={[
                        styles.option,
                        chosen && styles.optionChosen,
                        isCorrect && styles.optionCorrect,
                        isWrong && styles.optionWrong,
                      ]}
                      onPress={() => setAnswers((prev) => ({ ...prev, [question.id]: option.id }))}
                    >
                      <Text style={styles.optionText}>{option.text}</Text>
                    </TouchableOpacity>
                  );
                })}
                {submitted && outcome ? (
                  <View style={[styles.outcome, { backgroundColor: outcome.correct ? Colors.success + '15' : Colors.error + '15' }]}>
                    <Ionicons
                      name={outcome.correct ? 'checkmark-circle' : 'close-circle'}
                      size={16}
                      color={outcome.correct ? Colors.success : Colors.error}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.outcomeTitle}>
                        {outcome.correct ? 'Correct' : `Answer: ${outcome.correctAnswer ?? '-'}`}
                      </Text>
                      {outcome.explanation ? <Text style={styles.outcomeBody}>{outcome.explanation}</Text> : null}
                    </View>
                  </View>
                ) : null}
              </View>
            );
          })}

        {showQuickCheck && questions.length > 0 && !submitted && (
          <TouchableOpacity
            style={[styles.submitBtn, (submit.isPending || Object.keys(answers).length === 0) && styles.submitBtnDisabled]}
            disabled={submit.isPending || Object.keys(answers).length === 0}
            onPress={onSubmit}
          >
            {submit.isPending ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.submitBtnText}>Submit answers</Text>
            )}
          </TouchableOpacity>
        )}

        {submitted ? (
          <View style={styles.scoreBox}>
            <Text style={styles.scoreText}>
              Score: {submit.data?.score} / {submit.data?.total}
            </Text>
          </View>
        ) : null}
      </Card>

      {selected.attribution ? <Text style={styles.attribution}>{selected.attribution}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.md },
  chips: { gap: 6, paddingBottom: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceSecondary,
  },
  chipActive: { backgroundColor: Colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: Colors.white },
  card: { padding: Spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Spacing.sm },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 17, fontWeight: '700', color: Colors.text },
  sub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  difficulty: { borderRadius: BorderRadius.full, paddingHorizontal: 10, paddingVertical: 4 },
  difficultyText: { fontSize: 11, fontWeight: '700' },
  objective: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: Colors.primary + '10',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  objectiveText: { flex: 1, fontSize: 13, color: Colors.primaryDark },
  viewerLoading: {
    height: 320,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: Spacing.md,
  },
  viewerLoadingText: { fontSize: 12, color: Colors.textSecondary, paddingHorizontal: Spacing.lg, textAlign: 'center' },
  capability: { flexDirection: 'row', gap: 6, marginTop: Spacing.sm, alignItems: 'flex-start' },
  capabilityText: { flex: 1, fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
  description: { fontSize: 14, color: Colors.textSecondary, marginTop: Spacing.md, lineHeight: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  body: { fontSize: 13, color: Colors.textSecondary, marginTop: Spacing.sm, lineHeight: 20 },
  hotspotWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: Spacing.md },
  hotspotChip: {
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  hotspotChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  hotspotText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  hotspotTextActive: { color: Colors.white },
  hotspotDescription: { fontSize: 13, color: Colors.textSecondary, marginTop: Spacing.md, lineHeight: 19 },
  quickHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  startBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  startBtnText: { color: Colors.white, fontSize: 13, fontWeight: '600' },
  mutedText: { fontSize: 13, color: Colors.textSecondary, marginTop: Spacing.md, textAlign: 'center' },
  question: { marginTop: Spacing.lg },
  questionText: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: Spacing.sm },
  option: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    marginBottom: 6,
  },
  optionChosen: { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
  optionCorrect: { borderColor: Colors.success, backgroundColor: Colors.success + '15' },
  optionWrong: { borderColor: Colors.error, backgroundColor: Colors.error + '12' },
  optionText: { fontSize: 13, color: Colors.text },
  outcome: { flexDirection: 'row', gap: 6, borderRadius: BorderRadius.md, padding: Spacing.md, marginTop: 4 },
  outcomeTitle: { fontSize: 13, fontWeight: '700', color: Colors.text },
  outcomeBody: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: Colors.white, fontSize: 15, fontWeight: '600' },
  scoreBox: {
    backgroundColor: Colors.primary + '12',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  scoreText: { fontSize: 15, fontWeight: '700', color: Colors.primaryDark },
  attribution: { fontSize: 11, color: Colors.textMuted, textAlign: 'center' },
});
