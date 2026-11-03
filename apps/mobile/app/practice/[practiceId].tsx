import { View, ScrollView, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Keyboard } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { apiAuthed } from '../../lib/api';
import { useSavePracticeAnswer, useSubmitPractice } from '../../lib/hooks';
import type { PracticeAnswerResponse, PracticeSubmitResponse } from '../../lib/hooks';
import { QuizQuestionCard, QuizQuestion } from '../../components/QuizQuestion';
import { Markdown } from '../../components/Markdown';
import { OfflineBanner } from '../../components/OfflineBanner';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';

interface PracticeData {
  practiceId: string;
  questions: QuizQuestion[];
}

export default function PracticeScreen() {
  const { practiceId = '' } = useLocalSearchParams<{ practiceId: string }>();
  const router = useRouter();
  const submit = useSubmitPractice();
  const saveAnswer = useSavePracticeAnswer();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, PracticeAnswerResponse>>({});
  /**
   * Objective questions answered on this device. The choice is final as soon as it
   * is tapped: the feedback appears immediately with the correct answer, so letting
   * a second tap change it would let a student pick the right option after seeing
   * it. A failed save clears the lock so the answer can be given again.
   */
  const [locked, setLocked] = useState<Record<string, boolean>>({});
  const [result, setResult] = useState<PracticeSubmitResponse | null>(null);

  const { data, isFetching, isError, error, refetch } = useQuery<PracticeData>({
    queryKey: ['learning', 'practice', practiceId],
    queryFn: () => apiAuthed<PracticeData>(`/learning/practice/${practiceId}`),
    enabled: !!practiceId,
  });

  const questions = data?.questions ?? [];

  // The API grades the option TEXT, so that is what gets stored and sent.
  // A MULTI_SELECT answer is the JSON array of the selected option texts.
  // The server grades the answers it has *stored*, so every save is tracked and
  // the submit waits for the in-flight ones - otherwise the last answer can be
  // graded after the submit and counted as wrong.
  const pendingSaves = useRef<Promise<unknown>[]>([]);
  const trackSave = useCallback(
    (qid: string, answer: string) => {
      const promise = saveAnswer.mutateAsync({ practiceId, questionId: qid, answer });
      pendingSaves.current.push(promise);
      promise
        // The API returns the grade *and* the reason, so the "why" appears under
        // the question while the student is still thinking about it.
        .then((response) => {
          setFeedback((prev) => ({ ...prev, [qid]: response }));
        })
        .catch(() => {
          // Unlock so the answer can be given again.
          setLocked((prev) => {
            const next = { ...prev };
            delete next[qid];
            return next;
          });
        })
        .finally(() => {
          pendingSaves.current = pendingSaves.current.filter((p) => p !== promise);
        });
    },
    [saveAnswer, practiceId],
  );

  const select = (qid: string, optionText: string) => {
    if (locked[qid]) return;
    Keyboard.dismiss();
    setLocked((prev) => ({ ...prev, [qid]: true }));
    setAnswers((prev) => ({ ...prev, [qid]: optionText }));
    trackSave(qid, optionText);
  };

  // written answers are kept locally while typing and persisted when the field
  // loses focus (sending every keystroke would hammer the API)
  const typeAnswer = (qid: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
  };

  const persistAnswer = (qid: string, value: string) => {
    if (!value.trim()) return;
    trackSave(qid, value);
  };

  const handleSubmit = () => {
    if (submit.isPending) return;
    // make sure every typed answer reaches the server before grading
    for (const [qid, value] of Object.entries(answers)) {
      if (value.trim()) persistAnswer(qid, value);
    }
    const answered = Object.keys(answers).length;
    if (answered < questions.length) {
      Alert.alert('Practice', `You have answered ${answered} of ${questions.length} questions. Submit anyway?`, [
        { text: 'No', style: 'cancel' },
        { text: 'Submit', onPress: doSubmit },
      ]);
    } else {
      doSubmit();
    }
  };

  const doSubmit = async () => {
    if (submit.isPending) return;
    try {
      // let every answer save land before the server grades the session
      for (let round = 0; round < 5 && pendingSaves.current.length > 0; round += 1) {
        await Promise.allSettled([...pendingSaves.current]);
      }
      const res = (await submit.mutateAsync(practiceId)) as PracticeSubmitResponse;
      setResult(res);
    } catch (err: unknown) {
      const e = err as { message?: string };
      Alert.alert('Submit failed', e.message || 'Could not submit practice.');
    }
  };

  // the first load and a retry both show the spinner - a failed load must not
  // look like an empty practice set
  if (!data && isFetching) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // A failed load must not look like an empty practice set: the student gets
  // the reason and a retry instead of a "0 questions" screen.
  if (!data && isError) {
    const message = (error as { message?: string } | null)?.message;
    return (
      <View style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={44} color={Colors.error} />
        <Text style={styles.errorTitle}>Could not load this practice</Text>
        <Text style={styles.errorText}>{message || 'Check your connection and try again.'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => { void refetch(); }} accessibilityRole="button">
          <Ionicons name="refresh" size={16} color={Colors.white} />
          <Text style={styles.retryText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (result) {
    // the server scores the graded, answered questions - use its number so the
    // mobile and the web show the same thing
    const pct = result.score;
    const graded = result.gradedQuestions ?? result.totalQuestions;
    const pending = result.pendingGrading ?? Math.max(0, result.totalQuestions - graded);
    const passed = pct >= 80;
    return (
      <ScrollView style={styles.resultScroll} contentContainerStyle={styles.resultContent}>
        <View style={[styles.resultCircle, { borderColor: passed ? Colors.success : Colors.error }]}>
          <Text style={[styles.resultNum, { color: passed ? Colors.success : Colors.error }]}>
            {result.correctAnswers}/{graded}
          </Text>
        </View>
        <Text style={styles.resultTitle}>{passed ? 'Excellent!' : 'Keep practising!'}</Text>
        <Text style={styles.resultSub}>Score: {result.score} • Accuracy {pct}%</Text>
        {pending > 0 ? (
          <Text style={styles.resultNote}>
            {pending} written answer{pending === 1 ? '' : 's'} will be reviewed by your teacher.
          </Text>
        ) : null}
        {result.masteryUpdate ? (
          <View style={styles.masteryBox}>
            <Text style={styles.masteryTitle}>Mastery updated</Text>
            <Text style={styles.masteryText}>
              {result.masteryUpdate.level.replace(/_/g, ' ')} — {result.masteryUpdate.score}% overall
            </Text>
          </View>
        ) : null}

        {result.review && result.review.length > 0 ? (
          <View style={styles.reviewWrap}>
            <Text style={styles.reviewHeading}>Review your answers</Text>
            {result.review.map((entry, index) => (
              <View key={entry.questionId} style={styles.reviewCard}>
                <View style={styles.reviewTop}>
                  <View
                    style={[
                      styles.reviewBadge,
                      {
                        backgroundColor:
                          entry.correct === true
                            ? Colors.success + '22'
                            : entry.correct === false
                              ? Colors.error + '22'
                              : Colors.surfaceSecondary,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.reviewBadgeText,
                        {
                          color:
                            entry.correct === true
                              ? Colors.success
                              : entry.correct === false
                                ? Colors.error
                                : Colors.textSecondary,
                        },
                      ]}
                    >
                      {index + 1}
                    </Text>
                  </View>
                  <Text style={styles.reviewQuestion}>{entry.text}</Text>
                </View>

                {entry.graded ? (
                  <Text style={styles.reviewAnswer}>
                    Your answer:{' '}
                    <Text style={{ fontWeight: '700', color: entry.correct === true ? Colors.success : Colors.error }}>
                      {entry.yourAnswer?.trim() || 'not answered'}
                    </Text>
                  </Text>
                ) : (
                  <Text style={styles.reviewAnswer}>Written answer — your teacher reviews this one.</Text>
                )}

                {entry.correct === false ? (
                  <Text style={styles.reviewAnswer}>
                    Correct answer: <Text style={{ fontWeight: '700' }}>{entry.correctAnswer}</Text>
                  </Text>
                ) : null}

                {entry.explanation ? (
                  <View style={styles.reviewExplanation}>
                    <Markdown selectable>{entry.explanation}</Markdown>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}

        <TouchableOpacity style={styles.doneBtn} onPress={() => router.replace('/(tabs)/tests')}>
          <Text style={styles.doneBtnText}>Back to Assessments</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (questions.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="document-text-outline" size={44} color={Colors.textMuted} />
        <Text style={styles.errorTitle}>No questions in this practice</Text>
        <Text style={styles.errorText}>This practice set is empty. Go back and pick another concept.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => router.replace('/(tabs)/tests')} accessibilityRole="button">
          <Text style={styles.retryText}>Back to Assessments</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <OfflineBanner />
      <View style={styles.progressRow}>
        <Text style={styles.progressText}>{Object.keys(answers).length}/{questions.length} answered</Text>
        <Text style={styles.progressPct}>{questions.length ? Math.round((Object.keys(answers).length / questions.length) * 100) : 0}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${questions.length ? (Object.keys(answers).length / questions.length) * 100 : 0}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {questions.map((q, i) => (
          <View key={q.id}>
            <QuizQuestionCard
              question={q}
              index={i}
              total={questions.length}
              selected={answers[q.id] ?? null}
              onSelect={(optionText) => select(q.id, optionText)}
              textAnswer={answers[q.id] ?? ''}
              onTextChange={(value) => typeAnswer(q.id, value)}
              onTextBlur={(value) => persistAnswer(q.id, value)}
              feedback={feedback[q.id] ?? null}
              // A chosen answer is final: `reveal` disables the option buttons.
              reveal={locked[q.id] ? {} : null}
            />
            {locked[q.id] ? (
              <Text style={styles.lockedNote}>Your answer is final - it cannot be changed.</Text>
            ) : null}
          </View>
        ))}

        <TouchableOpacity
          style={[styles.submitBtn, submit.isPending && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submit.isPending}
          accessibilityRole="button"
          accessibilityLabel="Submit practice"
        >
          {submit.isPending ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Ionicons name="checkmark-done" size={18} color={Colors.white} />
          )}
          <Text style={styles.submitText}>{submit.isPending ? 'Submitting…' : 'Submit Practice'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background, padding: Spacing.xl },
  errorTitle: { fontSize: 17, fontWeight: '700', color: Colors.text, marginTop: Spacing.md, textAlign: 'center' },
  errorText: { fontSize: 13, color: Colors.textSecondary, marginTop: 6, textAlign: 'center' },
  retryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, paddingVertical: 12, paddingHorizontal: Spacing.xl, marginTop: Spacing.lg },
  retryText: { color: Colors.white, fontSize: 15, fontWeight: '600' },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  progressText: { fontSize: 13, fontWeight: '600', color: Colors.text },
  progressPct: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  progressTrack: { height: 6, backgroundColor: Colors.surfaceSecondary, marginHorizontal: Spacing.lg, borderRadius: 3, marginTop: 6, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: Colors.primary, borderRadius: 3 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  submitBtn: { flexDirection: 'row', backgroundColor: Colors.success, borderRadius: BorderRadius.lg, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: Spacing.md },
  submitBtnDisabled: { backgroundColor: Colors.textMuted },
  submitText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
  resultWrap: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  resultScroll: { flex: 1, backgroundColor: Colors.background },
  resultContent: { alignItems: 'center', padding: Spacing.xl, paddingBottom: Spacing.xxxl },
  resultNote: { fontSize: 12, color: Colors.textMuted, marginTop: Spacing.sm, textAlign: 'center' },
  lockedNote: { fontSize: 11, color: Colors.textMuted, marginTop: -Spacing.sm, marginBottom: Spacing.md, marginLeft: Spacing.xs },
  reviewWrap: { width: '100%', marginTop: Spacing.xl },
  reviewHeading: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },
  reviewCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm },
  reviewTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  reviewBadge: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  reviewBadgeText: { fontSize: 12, fontWeight: '700' },
  reviewQuestion: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.text, lineHeight: 20 },
  reviewAnswer: { fontSize: 13, color: Colors.textSecondary, marginTop: Spacing.sm },
  reviewExplanation: { marginTop: Spacing.sm, backgroundColor: Colors.background, borderRadius: BorderRadius.md, padding: Spacing.sm },  resultCircle: { width: 140, height: 140, borderRadius: 70, borderWidth: 8, alignItems: 'center', justifyContent: 'center' },
  resultNum: { fontSize: 26, fontWeight: '800' },
  resultTitle: { fontSize: 22, fontWeight: '700', color: Colors.text, marginTop: Spacing.xl },
  resultSub: { fontSize: 14, color: Colors.textSecondary, marginTop: 6 },
  masteryBox: { backgroundColor: Colors.primary + '15', borderRadius: BorderRadius.lg, padding: Spacing.lg, marginTop: Spacing.xl, alignItems: 'center', width: '100%' },
  masteryTitle: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  masteryText: { fontSize: 15, fontWeight: '700', color: Colors.primary, marginTop: 4 },
  doneBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, paddingVertical: 14, paddingHorizontal: Spacing.xxl, marginTop: Spacing.xl },
  doneBtnText: { color: Colors.white, fontSize: 15, fontWeight: '600' },
});
