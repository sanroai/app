import { ScrollView, View, Text, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMyAssessments, useStartAttempt } from '../../lib/hooks';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';
import { EmptyState } from '../../components/EmptyState';

export default function TestsScreen() {
  const router = useRouter();
  const { data, refetch, isFetching } = useMyAssessments();
  const startAttempt = useStartAttempt();
  const [refreshing, setRefreshing] = useState(false);
  const [starting, setStarting] = useState<string | null>(null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const assignments = data?.assignments ?? [];
  const pending = assignments.filter((a) => !a.attempts.some((at) => at.status === 'SUBMITTED' || at.status === 'AUTO_SUBMITTED'));
  const completed = assignments.filter((a) => a.attempts.some((at) => at.status === 'SUBMITTED' || at.status === 'AUTO_SUBMITTED'));

  const handleStart = async (assignmentId: string) => {
    setStarting(assignmentId);
    const assignment = data?.assignments?.find((a) => a.id === assignmentId);
    try {
      if (!assignment) throw new Error('Assignment not found');
      const res = (await startAttempt.mutateAsync(assignment.assessmentId)) as { attemptId?: string };
      router.push(`/attempt/${res.attemptId}`);
    } catch (err: unknown) {
      const e = err as { message?: string };
      if (e.message?.includes('already')) {
        const existing = assignment?.attempts.find((at) => at.status === 'IN_PROGRESS');
        if (existing) router.push(`/attempt/${existing.id}`);
      }
    } finally {
      setStarting(null);
    }
  };

  const formatDate = (iso?: string | null) => {
    if (!iso) return 'Not scheduled';
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tests</Text>
        <Text style={styles.headerSub}>Assessments assigned to you</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {pending.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Active / Upcoming</Text>
            {pending.map((a) => {
              const inProgress = a.attempts.some((at) => at.status === 'IN_PROGRESS');
              const inProgressAttempt = a.attempts.find((at) => at.status === 'IN_PROGRESS');
              return (
                <View key={a.id} style={styles.testCard}>
                  <View style={styles.testTop}>
                    <View style={styles.testIcon}>
                      <Ionicons name={inProgress ? 'play' : 'document-text'} size={20} color={Colors.primary} />
                    </View>
                    <View style={styles.testBody}>
                      <Text style={styles.testTitle}>{a.assessment.title}</Text>
                      <Text style={styles.testMeta}>
                        {a.assessment.subject?.name ?? 'Subject'} • {a.questionCount} Qs • {a.assessment.durationMinutes} min
                      </Text>
                      <Text style={styles.testDue}>Due {formatDate(a.dueAt)}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.startBtn, starting === a.id && styles.startBtnDisabled]}
                    disabled={starting === a.id}
                    onPress={() => (inProgress && inProgressAttempt ? router.push(`/attempt/${inProgressAttempt.id}`) : handleStart(a.id))}
                  >
                    <Text style={styles.startBtnText}>
                      {starting === a.id ? 'Starting…' : inProgress ? 'Resume attempt' : 'Start test'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </>
        )}

        {completed.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Completed</Text>
            {completed.map((a) => {
              const last = [...a.attempts].sort((x, y) => (y.attemptIndex ?? 0) - (x.attemptIndex ?? 0))[0];
              const submitted = [...a.attempts]
                .filter((at) => at.status === 'SUBMITTED' || at.status === 'AUTO_SUBMITTED')
                .sort((x, y) => (y.attemptIndex ?? 0) - (x.attemptIndex ?? 0))[0];
              const score = submitted?.score ?? null;
              const maxScore = submitted?.maxScore ?? a.assessment.totalMarks;
              const pct = score != null && maxScore ? Math.round((score / maxScore) * 100) : null;
              return (
                <View key={a.id} style={styles.testCard}>
                  <View style={styles.testTop}>
                    <View style={[styles.testIcon, { backgroundColor: pct != null && pct >= 60 ? Colors.success + '20' : Colors.warning + '20' }]}>
                      <Ionicons name="checkmark-circle" size={20} color={pct != null && pct >= 60 ? Colors.success : Colors.warning} />
                    </View>
                    <View style={styles.testBody}>
                      <Text style={styles.testTitle}>{a.assessment.title}</Text>
                      <Text style={styles.testMeta}>{a.assessment.subject?.name ?? 'Subject'}</Text>
                    </View>
                    {pct != null && (
                      <View style={styles.resultWrap}>
                        <Text style={[styles.resultPct, { color: pct >= 60 ? Colors.success : Colors.warning }]}>{pct}%</Text>
                        <Text style={styles.resultScore}>{score}/{maxScore}</Text>
                      </View>
                    )}
                  </View>
                  {last?.id ? (
                    <TouchableOpacity
                      style={styles.detailBtn}
                      onPress={() => router.push({ pathname: '/attempt/[attemptId]', params: { attemptId: last.id } })}
                    >
                      <Text style={styles.detailBtnText}>View result</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              );
            })}
          </>
        )}

        {pending.length === 0 && completed.length === 0 && !isFetching && (
          <EmptyState icon="document-text" title="No tests assigned" subtitle="Your teachers will assign assessments here." />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing.lg, borderBottomLeftRadius: BorderRadius.xxl, borderBottomRightRadius: BorderRadius.xxl },
  headerTitle: { color: Colors.white, fontSize: 26, fontWeight: '700' },
  headerSub: { color: Colors.primaryLight, fontSize: 13, marginTop: 2 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.text, marginTop: Spacing.lg, marginBottom: Spacing.md },
  testCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.md },
  testTop: { flexDirection: 'row', alignItems: 'center' },
  testIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: Colors.primary + '20', alignItems: 'center', justifyContent: 'center' },
  testBody: { flex: 1, marginLeft: Spacing.md },
  testTitle: { fontSize: 15, fontWeight: '600', color: Colors.text },
  testMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  testDue: { fontSize: 12, color: Colors.warning, marginTop: 2, fontWeight: '500' },
  startBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: 12, alignItems: 'center', marginTop: Spacing.md },
  startBtnDisabled: { opacity: 0.5 },
  startBtnText: { color: Colors.white, fontSize: 15, fontWeight: '600' },
  resultWrap: { alignItems: 'flex-end' },
  resultPct: { fontSize: 18, fontWeight: '700' },
  resultScore: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  detailBtn: { alignItems: 'center', borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.primary, paddingVertical: 9, marginTop: Spacing.md },
  detailBtnText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
});