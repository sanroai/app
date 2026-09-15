import { View, ScrollView, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { apiAuthed } from '../../lib/api';
import { useSavePracticeAnswer, useSubmitPractice } from '../../lib/hooks';
import { QuizQuestion } from '../../components/QuizQuestion';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';

const TIME_LIMIT = 60;
const MAX_XP = 50;

interface ChallengeStartData {
  practiceId: string;
  questions: QuizQuestion[];
}

export default function ChallengeScreen() {
  const { conceptId = '' } = useLocalSearchParams<{ conceptId: string }>();
  const router = useRouter();
  const saveAnswer = useSavePracticeAnswer();
  const submit = useSubmitPractice();
  const [secondsLeft, setSecondsLeft] = useState(TIME_LIMIT);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState<{ xp: number; correct: number; total: number } | null>(null);
  const finishedRef = useRef(false);

  const { data } = useQuery<ChallengeStartData>({
    queryKey: ['learning', 'practice', 'challenge', conceptId],
    queryFn: () => apiAuthed<ChallengeStartData>('/learning/practice/start', { method: 'POST', body: { conceptId, questionCount: 10 } }),
  });

  const questions = data?.questions ?? [];
  const practiceId = data?.practiceId;

  useEffect(() => {
    if (!data || finished) return;
    const id = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          void finish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [data, finished]);

  const select = (qId: string, optId: string) => {
    setAnswers((prev) => {
      const next = { ...prev, [qId]: optId };
      if (practiceId) {
        saveAnswer.mutate({ practiceId, questionId: qId, answer: optId });
      }
      return next;
    });
  };

  const finish = async () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setFinished(true);
    if (!practiceId) {
      setScore({ xp: 0, correct: 0, total: questions.length });
      return;
    }
    try {
      await Promise.all(
        Object.entries(answers).map(([qid, answer]) =>
          apiAuthed(`/learning/practice/${practiceId}/answer`, {
            method: 'POST',
            body: { questionId: qid, answer },
          }),
        ),
      );
      const res = (await submit.mutateAsync(practiceId)) as { score: number; totalQuestions: number; correctAnswers: number };
      const correct = res.correctAnswers ?? 0;
      const total = res.totalQuestions || questions.length || 1;
      setScore({ xp: Math.round((correct / Math.max(total, 1)) * MAX_XP), correct, total });
    } catch {
      // Server grading unavailable — still submit locally tracked answers if possible.
      setScore({ xp: 0, correct: 0, total: questions.length });
    }
  };

  const replay = () => {
    finishedRef.current = false;
    setSecondsLeft(TIME_LIMIT);
    setAnswers({});
    setFinished(false);
    setScore(null);
  };

  if (isLoading(data)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (finished) {
    const correct = score?.correct ?? 0;
    const total = score?.total ?? questions.length;
    return (
      <View style={styles.resultWrap}>
        <View style={styles.resultIcon}>
          <Ionicons name="flash" size={44} color="#ef4444" />
        </View>
        <Text style={styles.title}>Time's up!</Text>
        <Text style={styles.estScore}>{score?.xp ?? 0} XP</Text>
        <Text style={styles.sub}>
          {correct} of {total} correct out of {Object.keys(answers).length} answered.
        </Text>
        <TouchableOpacity style={styles.againBtn} onPress={replay}>
          <Ionicons name="refresh" size={16} color={Colors.white} />
          <Text style={styles.againText}>Play Again</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>Back to concept</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.timerRow}>
        <View style={[styles.timerBox, { backgroundColor: secondsLeft <= 10 ? Colors.error + '20' : Colors.primary + '20' }]}>
          <Ionicons name="timer" size={18} color={secondsLeft <= 10 ? Colors.error : Colors.primary} />
          <Text style={[styles.timerText, { color: secondsLeft <= 10 ? Colors.error : Colors.primary }]}>{secondsLeft}s</Text>
        </View>
        <Text style={styles.answered}>{Object.keys(answers).length}/{questions.length} answered</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {questions.map((q, i) => {
          const chosen = answers[q.id] ?? null;
          return (
            <View key={q.id} style={styles.qCard}>
              <View style={styles.qTop}>
                <Text style={styles.qNum}>Q{i + 1}</Text>
              </View>
              <Text style={styles.qText}>{q.text}</Text>
              <View style={styles.opts}>
                {(q.options ?? []).map((opt) => {
                  const isSelected = chosen === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      style={[styles.opt, isSelected && styles.optSelected]}
                      onPress={() => select(q.id, opt.id)}
                    >
                      <Text style={[styles.optText, isSelected && { color: Colors.primary }]}>{opt.text}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}
        <TouchableOpacity style={styles.finishBtn} onPress={() => void finish()}>
          <Ionicons name="checkmark-done" size={18} color={Colors.white} />
          <Text style={styles.finishText}>Finish</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function isLoading(data: any) {
  return !data;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  timerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  timerBox: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: 6 },
  timerText: { fontSize: 16, fontWeight: '800' },
  answered: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  qCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md },
  qTop: { marginBottom: Spacing.sm },
  qNum: { fontSize: 12, fontWeight: '700', color: '#ef4444' },
  qText: { fontSize: 14, fontWeight: '500', color: Colors.text, lineHeight: 20 },
  opts: { marginTop: Spacing.sm, gap: 6 },
  opt: { borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: 10 },
  optSelected: { borderColor: '#ef4444', backgroundColor: '#ef4444' + '10' },
  optText: { fontSize: 13, color: Colors.text },
  finishBtn: { flexDirection: 'row', backgroundColor: '#ef4444', borderRadius: BorderRadius.lg, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: Spacing.md },
  finishText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
  resultWrap: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  resultIcon: { width: 84, height: 84, borderRadius: 42, backgroundColor: '#ef4444' + '20', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: Colors.text, marginTop: Spacing.xl },
  estScore: { fontSize: 34, fontWeight: '800', color: '#ef4444', marginTop: Spacing.md },
  sub: { fontSize: 14, color: Colors.textSecondary, marginTop: 6, textAlign: 'center' },
  againBtn: { flexDirection: 'row', backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, paddingVertical: 13, paddingHorizontal: Spacing.xxl, marginTop: Spacing.xl, alignItems: 'center', gap: 6 },
  againText: { color: Colors.white, fontSize: 15, fontWeight: '600' },
  backBtn: { marginTop: Spacing.md },
  backText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
});