import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAssessmentPaper } from '../../lib/hooks';
import { apiAuthed } from '../../lib/api';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';

/**
 * The question paper before the student commits to an attempt: what the test
 * covers, how long it runs, how many questions and marks, and every question.
 * Answers are never in this payload.
 */
export default function AssessmentPaperScreen() {
  const { assessmentId = '' } = useLocalSearchParams<{ assessmentId: string }>();
  const router = useRouter();
  const { data: paper, isLoading, error } = useAssessmentPaper(assessmentId);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const start = async () => {
    if (!paper || !paper.isOpen || paper.attemptsLeft === 0 || starting) return;
    setStarting(true);
    setStartError(null);
    try {
      const res = await apiAuthed<{ attemptId: string }>(`/assessments/${paper.id}/start`, { method: 'POST' });
      router.replace({ pathname: '/attempt/[attemptId]', params: { attemptId: res.attemptId } });
    } catch (err) {
      setStartError((err as { message?: string }).message ?? 'Could not start the test');
    } finally {
      setStarting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }
  if (error || !paper) {
    return (
      <View style={styles.center}>
        <EmptyState icon="document-text-outline" title="Could not load this paper" />
      </View>
    );
  }

  const objective = paper.questions.filter((q) => q.type === 'MCQ' || q.type === 'TRUE_FALSE');
  const written = paper.questions.filter((q) => q.type === 'SHORT_ANSWER' || q.type === 'LONG_ANSWER');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Question paper</Text>
        <Text style={styles.title}>{paper.title}</Text>
        <Text style={styles.subject}>
          {paper.subject?.name ?? 'General'}
          {paper.chapter ? ` · ${paper.chapter.name}` : ''}
          {paper.chapter?.grade ? ` · Class ${paper.chapter.grade}` : ''}
        </Text>
        <View style={styles.chips}>
          <View style={styles.chip}>
            <Ionicons name="list" size={12} color={Colors.white} />
            <Text style={styles.chipText}>{paper.questionCount} questions</Text>
          </View>
          <View style={styles.chip}>
            <Ionicons name="trophy" size={12} color={Colors.white} />
            <Text style={styles.chipText}>{paper.totalMarks} marks</Text>
          </View>
          <View style={styles.chip}>
            <Ionicons name="time" size={12} color={Colors.white} />
            <Text style={styles.chipText}>{paper.durationMinutes} min</Text>
          </View>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <Text style={styles.summaryText}>
          {objective.length} objective · {written.length} written · {paper.attemptsLeft} of {paper.attemptsAllowed}{' '}
          attempts left
        </Text>
        <TouchableOpacity
          style={[styles.startBtn, (!paper.isOpen || paper.attemptsLeft === 0) && styles.startBtnDisabled]}
          onPress={start}
          disabled={!paper.isOpen || paper.attemptsLeft === 0 || starting}
        >
          {starting ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Text style={styles.startText}>Start test</Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.white} />
            </>
          )}
        </TouchableOpacity>
      </View>
      {!paper.isOpen ? <Text style={styles.closed}>This paper is not open right now.</Text> : null}
      {startError ? <Text style={styles.error}>{startError}</Text> : null}

      {paper.questions.map((question) => (
        <Card key={question.id} style={styles.questionCard}>
          <View style={styles.questionTop}>
            <Text style={styles.questionText}>
              <Text style={styles.questionOrder}>{question.order}. </Text>
              {question.text}
            </Text>
            <Text style={styles.marks}>
              {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
            </Text>
          </View>
          {question.options.length > 0 ? (
            <View style={styles.options}>
              {question.options.map((option, index) => (
                <Text key={`${question.id}-${index}`} style={styles.option}>
                  {option.text}
                </Text>
              ))}
            </View>
          ) : (
            <Text style={styles.written}>Written answer</Text>
          )}
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  hero: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.lg,
  },
  eyebrow: { color: 'rgba(255,255,255,0.75)', fontSize: 10, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  title: { color: Colors.white, fontSize: 24, fontWeight: '800', marginTop: 4 },
  subject: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: Spacing.md },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: BorderRadius.full, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { color: Colors.white, fontSize: 11, fontWeight: '700' },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm, marginTop: Spacing.lg },
  summaryText: { flex: 1, fontSize: 12, color: Colors.textSecondary },
  startBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary, borderRadius: BorderRadius.full, paddingHorizontal: 16, paddingVertical: 10 },
  startBtnDisabled: { opacity: 0.5 },
  startText: { color: Colors.white, fontSize: 13, fontWeight: '800' },
  closed: { marginTop: Spacing.sm, fontSize: 12, fontWeight: '700', color: Colors.warning },
  error: { marginTop: Spacing.sm, fontSize: 12, fontWeight: '700', color: Colors.error },
  questionCard: { marginTop: Spacing.md, padding: Spacing.lg },
  questionTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  questionText: { flex: 1, fontSize: 14, color: Colors.text, lineHeight: 20 },
  questionOrder: { color: Colors.textMuted, fontWeight: '700' },
  marks: { fontSize: 11, fontWeight: '700', color: Colors.textMuted },
  options: { marginTop: Spacing.sm, gap: 6 },
  option: { backgroundColor: Colors.surfaceSecondary, borderRadius: BorderRadius.md, paddingHorizontal: 10, paddingVertical: 6, fontSize: 13, color: Colors.text },
  written: { marginTop: Spacing.sm, fontSize: 11, color: Colors.textMuted },
});
