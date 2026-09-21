import { View, ScrollView, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Keyboard } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { apiAuthed } from '../../lib/api';
import { useSavePracticeAnswer, useSubmitPractice } from '../../lib/hooks';
import { QuizQuestionCard, QuizQuestion } from '../../components/QuizQuestion';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';

interface QuizStartData {
  practiceId: string;
  questions: QuizQuestion[];
}
interface QuizResult {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  masteryUpdate: { level: string; score: number } | null;
}

export default function QuickQuizScreen() {
  const { conceptId = '' } = useLocalSearchParams<{ conceptId: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const submit = useSubmitPractice();
  const saveAnswer = useSavePracticeAnswer();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizResult | null>(null);

  const { data, isLoading, isError } = useQuery<QuizStartData>({
    queryKey: ['learning', 'practice', 'quiz', conceptId],
    queryFn: () =>
      apiAuthed<QuizStartData>('/learning/practice/start', {
        method: 'POST',
        body: { conceptId, questionCount: 5 },
      }),
    enabled: !!conceptId,
    retry: false,
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={styles.center}>
        <Text style={styles.none}>No questions available for this concept.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>Back to concept</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { practiceId } = data;
  const questions = data.questions;
  const total = questions.length;

  if (total === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.none}>No questions available for this concept.</Text>
      </View>
    );
  }

  const select = (qid: string, optId: string) => {
    Keyboard.dismiss();
    setAnswers((prev) => ({ ...prev, [qid]: optId }));
    saveAnswer.mutate({ practiceId, questionId: qid, answer: optId });
  };

  const handleSubmit = () => {
    const answered = Object.keys(answers).length;
    if (answered < total) {
      Alert.alert('Quick Quiz', `You answered ${answered} of ${total} questions. Submit anyway?`, [
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
        await Promise.all(
          Object.entries(answers).map(([qid, answer]) =>
            apiAuthed(`/learning/practice/${practiceId}/answer`, {
              method: 'POST',
              body: { questionId: qid, answer },
            }),
          ),
        );
        const res = (await submit.mutateAsync(practiceId)) as unknown as QuizResult;
        setResult(res);
      } catch (err: unknown) {
        const e = err as { message?: string };
        Alert.alert('Submit failed', e.message || 'Could not submit the quiz.');
      }
    })();
  };

  if (result) {
    const good = result.totalQuestions > 0 && result.correctAnswers / result.totalQuestions >= 0.8;
    return (
      <View style={styles.resultWrap}>
        <View style={[styles.circle, { borderColor: good ? Colors.success : Colors.warning }]}>
          <Text style={[styles.num, { color: good ? Colors.success : Colors.warning }]}>
            {result.correctAnswers}/{result.totalQuestions}
          </Text>
        </View>
        <Text style={styles.title}>{good ? 'Nailed it!' : 'Good effort!'}</Text>
        <Text style={styles.sub}>
          {good ? 'You scored 80% or more.' : 'Keep practising to improve your score.'}
        </Text>
        <TouchableOpacity
          style={styles.againBtn}
          onPress={() => {
            setAnswers({});
            setResult(null);
            qc.invalidateQueries({ queryKey: ['learning', 'practice', 'quiz', conceptId] });
          }}
        >
          <Ionicons name="refresh" size={16} color={Colors.white} />
          <Text style={styles.againText}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>Back to concept</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.infoRow}>
        <Text style={styles.infoText}>5 questions • ~2 minutes</Text>
      </View>
      {questions.map((q, i) => (
        <QuizQuestionCard
          key={q.id}
          question={q}
          index={i}
          total={total}
          selected={answers[q.id] ?? null}
          onSelect={(optId) => select(q.id, optId)}
        />
      ))}
      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
        <Ionicons name="battery-charging" size={18} color={Colors.white} />
        <Text style={styles.submitText}>Submit Quiz</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  none: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', padding: Spacing.xl },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md },
  infoText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  submitBtn: { flexDirection: 'row', backgroundColor: Colors.warning, borderRadius: BorderRadius.lg, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: Spacing.md },
  submitText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
  resultWrap: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  circle: { width: 140, height: 140, borderRadius: 70, borderWidth: 8, alignItems: 'center', justifyContent: 'center' },
  num: { fontSize: 28, fontWeight: '800' },
  title: { fontSize: 22, fontWeight: '700', color: Colors.text, marginTop: Spacing.xl },
  sub: { fontSize: 14, color: Colors.textSecondary, marginTop: 6, textAlign: 'center' },
  againBtn: { flexDirection: 'row', backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, paddingVertical: 13, paddingHorizontal: Spacing.xxl, marginTop: Spacing.xl, alignItems: 'center', gap: 6 },
  againText: { color: Colors.white, fontSize: 15, fontWeight: '600' },
  backBtn: { marginTop: Spacing.md },
  backText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
});