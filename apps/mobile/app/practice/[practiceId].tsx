import { View, ScrollView, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Keyboard } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { apiAuthed } from '../../lib/api';
import { useSavePracticeAnswer, useSubmitPractice } from '../../lib/hooks';
import { QuizQuestionCard, QuizQuestion } from '../../components/QuizQuestion';
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
  const [result, setResult] = useState<{ score: number; totalQuestions: number; correctAnswers: number; masteryUpdate: any } | null>(null);

  const { data, isLoading } = useQuery<PracticeData>({
    queryKey: ['learning', 'practice', practiceId],
    queryFn: () => apiAuthed<PracticeData>(`/learning/practice/${practiceId}`),
    enabled: !!practiceId,
  });

  const questions = data?.questions ?? [];

  const select = (qid: string, optId: string) => {
    Keyboard.dismiss();
    setAnswers((prev) => ({ ...prev, [qid]: optId }));
    saveAnswer.mutate({ practiceId, questionId: qid, answer: optId });
  };

  const handleSubmit = () => {
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

  const doSubmit = () => {
    (async () => {
      try {
        const res = (await submit.mutateAsync(practiceId)) as { score: number; totalQuestions: number; correctAnswers: number; masteryUpdate: any };
        setResult(res);
      } catch (err: unknown) {
        const e = err as { message?: string };
        Alert.alert('Submit failed', e.message || 'Could not submit practice.');
      }
    })();
  };

  if (isLoading && !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (result) {
    const pct = result.totalQuestions > 0 ? Math.round((result.correctAnswers / result.totalQuestions) * 100) : 0;
    const passed = pct >= 80;
    return (
      <View style={styles.resultWrap}>
        <View style={[styles.resultCircle, { borderColor: passed ? Colors.success : Colors.error }]}>
          <Text style={[styles.resultNum, { color: passed ? Colors.success : Colors.error }]}>
            {result.correctAnswers}/{result.totalQuestions}
          </Text>
        </View>
        <Text style={styles.resultTitle}>{passed ? 'Excellent!' : 'Keep practising!'}</Text>
        <Text style={styles.resultSub}>Score: {result.score} • Accuracy {pct}%</Text>
        {result.masteryUpdate ? (
          <View style={styles.masteryBox}>
            <Text style={styles.masteryTitle}>Mastery updated</Text>
            <Text style={styles.masteryText}>
              {result.masteryUpdate.level.replace(/_/g, ' ')} — {result.masteryUpdate.score}%
            </Text>
          </View>
        ) : null}
        <TouchableOpacity style={styles.doneBtn} onPress={() => router.replace('/(tabs)/practice')}>
          <Text style={styles.doneBtnText}>Back to Practice</Text>
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
          <QuizQuestionCard
            key={q.id}
            question={q}
            index={i}
            total={questions.length}
            selected={answers[q.id] ?? null}
            onSelect={(optId) => select(q.id, optId)}
          />
        ))}

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Ionicons name="checkmark-done" size={18} color={Colors.white} />
          <Text style={styles.submitText}>Submit Practice</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  progressText: { fontSize: 13, fontWeight: '600', color: Colors.text },
  progressPct: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  progressTrack: { height: 6, backgroundColor: Colors.surfaceSecondary, marginHorizontal: Spacing.lg, borderRadius: 3, marginTop: 6, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: Colors.primary, borderRadius: 3 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  submitBtn: { flexDirection: 'row', backgroundColor: Colors.success, borderRadius: BorderRadius.lg, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: Spacing.md },
  submitText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
  resultWrap: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  resultCircle: { width: 140, height: 140, borderRadius: 70, borderWidth: 8, alignItems: 'center', justifyContent: 'center' },
  resultNum: { fontSize: 26, fontWeight: '800' },
  resultTitle: { fontSize: 22, fontWeight: '700', color: Colors.text, marginTop: Spacing.xl },
  resultSub: { fontSize: 14, color: Colors.textSecondary, marginTop: 6 },
  masteryBox: { backgroundColor: Colors.primary + '15', borderRadius: BorderRadius.lg, padding: Spacing.lg, marginTop: Spacing.xl, alignItems: 'center', width: '100%' },
  masteryTitle: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  masteryText: { fontSize: 15, fontWeight: '700', color: Colors.primary, marginTop: 4 },
  doneBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, paddingVertical: 14, paddingHorizontal: Spacing.xxl, marginTop: Spacing.xl },
  doneBtnText: { color: Colors.white, fontSize: 15, fontWeight: '600' },
});