import { View, ScrollView, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Keyboard } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OfflineError } from '../../lib/api';
import { useAttemptDetail, useSubmitAttempt, useSaveAnswers } from '../../lib/hooks';
import { QuizQuestionCard, QuizQuestion } from '../../components/QuizQuestion';
import { OfflineBanner } from '../../components/OfflineBanner';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';

const draftKey = (attemptId: string) => `sanro-attempt-draft:${attemptId}`;

/** How often the answers are pushed to the server while the attempt is open. */
const AUTOSAVE_INTERVAL_MS = 15000;
/** How long the screen waits after the last change before it saves. */
const AUTOSAVE_DEBOUNCE_MS = 800;

export default function AttemptScreen() {
  const { attemptId = '' } = useLocalSearchParams<{ attemptId: string }>();
  const router = useRouter();
  const { data, isLoading, refetch } = useAttemptDetail(attemptId);
  const submit = useSubmitAttempt();
  const save = useSaveAnswers();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const attempt = data?.attempt;
  const isSubmitted = attempt?.status === 'SUBMITTED' || attempt?.status === 'AUTO_SUBMITTED';

  // The autosave interval is created once, so the answers it sends have to be
  // read from a ref. A state dependency would tear the interval down (and
  // fire a save) on every keystroke - one save per keystroke.
  const answersRef = useRef<Record<string, string>>({});
  const isSubmittedRef = useRef(false);
  const mountedRef = useRef(true);
  const saveNowRef = useRef<() => Promise<boolean>>(async () => true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    isSubmittedRef.current = isSubmitted;
  }, [isSubmitted]);

  useEffect(() => {
    if (!attemptId) return;
    AsyncStorage.getItem(draftKey(attemptId))
      .then((raw) => {
        if (raw) setAnswers(JSON.parse(raw));
      })
      .catch(() => {});
  }, [attemptId]);

  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      AsyncStorage.setItem(draftKey(attemptId), JSON.stringify(answers)).catch(() => {});
    }
  }, [answers, attemptId]);

  useEffect(() => {
    if (isSubmitted) AsyncStorage.removeItem(draftKey(attemptId)).catch(() => {});
  }, [isSubmitted, attemptId]);

  const saveAnswersNow = useCallback(async (): Promise<boolean> => {
    const entries = Object.entries(answersRef.current);
    if (entries.length === 0 || isSubmittedRef.current) return true;
    if (mountedRef.current) setSaving(true);
    try {
      await save.mutateAsync({
        attemptId,
        answers: entries.map(([qid, answer]) => ({ snapshotQuestionId: qid, answer })),
      });
      return true;
    } catch {
      /* autosave is best-effort; draft is persisted locally */
      return false;
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  }, [attemptId, save.mutateAsync]);

  // the stable timers always call the latest save function
  useEffect(() => {
    saveNowRef.current = saveAnswersNow;
  });

  // debounced save: one request after the student stops changing answers
  useEffect(() => {
    if (Object.keys(answers).length === 0 || isSubmitted) return;
    const timer = setTimeout(() => {
      void saveNowRef.current();
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [answers, isSubmitted]);

  // stable interval: it is never re-created, so it never fires per keystroke
  useEffect(() => {
    const id = setInterval(() => {
      void saveNowRef.current();
    }, AUTOSAVE_INTERVAL_MS);
    return () => {
      clearInterval(id);
      // flush the final answers - the request is fired, not awaited
      void saveNowRef.current();
    };
  }, []);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.center}>
        <Text style={styles.none}>Could not load this assessment.</Text>
      </View>
    );
  }

  // Submitted: show the result detail / review.
  if (isSubmitted) {
    const score = attempt.score;
    const maxScore = attempt.maxScore ?? data.assessment.totalMarks;
    const pct = score != null && maxScore ? Math.round((score / maxScore) * 100) : null;
    return (
      <ScrollView contentContainerStyle={styles.resultContent}>
        <View style={styles.resultHeader}>
          <Text style={styles.resultTitle}>{data.assessment.title}</Text>
          <Text style={styles.resultSub}>{data.assessment.subject}</Text>
        </View>
        <View style={[styles.scoreCircle, { borderColor: pct != null && pct >= 60 ? Colors.success : Colors.warning }]}>
          <Text style={[styles.scoreNum, { color: pct != null && pct >= 60 ? Colors.success : Colors.warning }]}>
            {score != null ? score : '-'}/{maxScore}
          </Text>
          {pct != null && <Text style={styles.scorePct}>{pct}%</Text>}
        </View>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statVal}>{attempt.correctCount ?? 0}</Text>
            <Text style={styles.statLabel}>Correct</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statVal}>{attempt.wrongCount ?? 0}</Text>
            <Text style={styles.statLabel}>Wrong</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statVal}>{attempt.skippedCount ?? 0}</Text>
            <Text style={styles.statLabel}>Skipped</Text>
          </View>
        </View>
        <Text style={styles.reviewTitle}>Answer review</Text>
        {data.questions.map((q) => (
          <View key={q.id} style={styles.reviewCard}>
            <View style={styles.reviewTop}>
              <Text style={styles.reviewQ}>
                Q{q.order}. {q.text}
              </Text>
              {q.isCorrect != null && (
                <Ionicons
                  name={q.isCorrect ? 'checkmark-circle' : 'close-circle'}
                  size={20}
                  color={q.isCorrect ? Colors.success : Colors.error}
                />
              )}
            </View>
            {q.correctAnswer ? (
              <Text style={styles.correctAns}>Correct answer: {q.correctAnswer}</Text>
            ) : null}
          </View>
        ))}
        <TouchableOpacity style={styles.doneBtn} onPress={() => router.replace('/(tabs)/tests')}>
          <Text style={styles.doneText}>Back to Tests</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // The attempt API strips the option id (sanitizeOptions), so the options are
  // typed as { text, order } and keyed by their position in the list.
  const questions: QuizQuestion[] = data.questions.map((q) => ({
    id: q.id,
    text: q.text,
    type: q.type,
    marks: q.marks,
    options: (q.options ?? []).map((o, oi) => ({ text: o.text, order: o.order ?? oi })),
  }));

  const handleSubmit = () => {
    if (submit.isPending) return;
    Alert.alert('Submit assessment', 'Are you sure you want to submit? You can no longer change answers.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Submit',
        onPress: () => {
          (async () => {
            await saveAnswersNow();
            try {
              await submit.mutateAsync(attemptId);
              refetch();
            } catch (err: unknown) {
              const e = err as { message?: string };
              if (err instanceof OfflineError) {
                Alert.alert('Saved offline', e.message || 'Your answers are saved. Submission will sync automatically.');
              } else {
                Alert.alert('Submit failed', e.message || 'Could not submit.');
              }
            }
          })();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <OfflineBanner />
      <View style={styles.progressRow}>
        <Text style={styles.progressText}>
          {Object.keys(answers).length}/{questions.length} answered
        </Text>
        {saving && <Text style={styles.savingText}>Saving…</Text>}
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {questions.map((q, i) => (
          <QuizQuestionCard
            key={q.id}
            question={q}
            index={i}
            total={questions.length}
            selected={answers[q.id] ?? null}
            // the API grades the option text, so that is what is stored and submitted
            onSelect={(optionText) => {
              Keyboard.dismiss();
              setAnswers((prev) => ({ ...prev, [q.id]: optionText }));
            }}
            textAnswer={answers[q.id] ?? ''}
            onTextChange={(value) => setAnswers((prev) => ({ ...prev, [q.id]: value }))}
          />
        ))}
        <TouchableOpacity
          style={[styles.submitBtn, submit.isPending && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submit.isPending}
          accessibilityLabel="Submit assessment"
          accessibilityRole="button"
        >
          <Ionicons name="checkmark-done" size={18} color={Colors.white} />
          <Text style={styles.submitText}>{submit.isPending ? 'Submitting…' : 'Submit Assessment'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  none: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', padding: Spacing.xl },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  progressText: { fontSize: 13, fontWeight: '600', color: Colors.text },
  savingText: { fontSize: 12, color: Colors.textMuted },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  submitBtn: { flexDirection: 'row', backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: Spacing.md },
  submitBtnDisabled: { backgroundColor: Colors.textMuted },
  submitText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
  resultContent: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  resultHeader: { alignItems: 'center' },
  resultTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  resultSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  scoreCircle: { width: 150, height: 150, borderRadius: 75, borderWidth: 8, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: Spacing.xl },
  scoreNum: { fontSize: 26, fontWeight: '800' },
  scorePct: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xl },
  stat: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, paddingVertical: Spacing.md, alignItems: 'center' },
  statVal: { fontSize: 20, fontWeight: '700', color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  reviewTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginTop: Spacing.xl, marginBottom: Spacing.md },
  reviewCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm },
  reviewTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.sm },
  reviewQ: { flex: 1, fontSize: 14, color: Colors.text, lineHeight: 20 },
  correctAns: { fontSize: 13, color: Colors.success, marginTop: Spacing.sm, fontWeight: '500' },
  doneBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, paddingVertical: 14, alignItems: 'center', marginTop: Spacing.lg },
  doneText: { color: Colors.white, fontSize: 15, fontWeight: '600' },
});
