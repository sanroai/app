import { ScrollView, View, Text, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  useMyAssessments,
  useStartAttempt,
  useLearningPath,
  useStartPractice,
  useRequestRetest,
} from '../../lib/hooks';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';
import { EmptyState } from '../../components/EmptyState';

type Segment = 'path' | 'tests';

const LEVEL_COLOR: Record<string, string> = {
  NEEDS_INTERVENTION: Colors.error,
  WEAK: '#f97316',
  DEVELOPING: '#f59e0b',
  GOOD: Colors.success,
  MASTERED: Colors.success,
  INSUFFICIENT_EVIDENCE: Colors.textMuted,
};

const STATE_ICON: Record<string, string> = {
  DONE: 'checkmark-circle',
  IN_PROGRESS: 'ellipse',
  NOT_STARTED: 'ellipse-outline',
};

export default function AssessmentsScreen() {
  const router = useRouter();
  const [segment, setSegment] = useState<Segment>('path');
  const { refetch: refetchPath } = useLearningPath();
  const { refetch, isFetching, data } = useMyAssessments();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchPath(), refetch()]);
    setRefreshing(false);
  }, [refetchPath, refetch]);

  return (
    <View style={styles.container}>
      <View style={styles.headerWrap}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Assessments</Text>
          <Text style={styles.headerSub}>Your path and tests</Text>
        </View>

        <View style={styles.segment}>
          {(['path', 'tests'] as Segment[]).map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.segmentBtn, segment === s && styles.segmentBtnActive]}
              onPress={() => setSegment(s)}
              accessibilityRole="tab"
              accessibilityState={{ selected: segment === s }}
            >
              <Text style={[styles.segmentText, segment === s && styles.segmentTextActive]}>
                {s === 'path' ? 'Path' : 'Tests'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {segment === 'path' ? (
          <PathView router={router} setSegment={setSegment} />
        ) : (
          <TestsView router={router} data={data} isFetching={isFetching} />
        )}
      </ScrollView>
    </View>
  );
}

function PathView({ router, setSegment }: { router: ReturnType<typeof useRouter>; setSegment: (s: Segment) => void }) {
  const { data, isLoading, error, isFetching } = useLearningPath();
  const startPractice = useStartPractice();
  const requestRetest = useRequestRetest();
  const [busy, setBusy] = useState<string | null>(null);

  if (isLoading && !data) return <EmptyState icon="navigate" title="Building your path…" />;
  if (error) return <EmptyState icon="alert-circle" title="Could not load your path" subtitle={(error as Error).message} />;
  if (!data) return null;

  const s = data.summary;
  const next = data.next;
  const upcoming = data.track.filter((t) => t.state !== 'DONE').slice(0, 10);

  const handlePractice = async (conceptId: string) => {
    setBusy(conceptId);
    try {
      const res = (await startPractice.mutateAsync({ conceptId, questionCount: 5 })) as { practiceId: string };
      router.push({ pathname: '/practice/[practiceId]', params: { practiceId: res.practiceId } });
    } catch {
      setBusy(null);
    }
  };

  const handleRetest = (conceptId: string) => {
    setBusy(conceptId);
    requestRetest.mutate([conceptId], { onSettled: () => setBusy(null) });
  };

  const handleNext = () => {
    if (!next) return;
    if (next.action === 'RETEST') {
      setSegment('tests');
      return;
    }
    if (next.conceptId) {
      router.push({ pathname: '/concept/[conceptId]', params: { conceptId: next.conceptId } });
    }
  };

  return (
    <>
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: Colors.success }]}>{s.masteryPercent}%</Text>
          <Text style={styles.summaryLabel}>Mastered</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: s.weakConcepts > 0 ? '#f97316' : Colors.text }]}>
            {s.weakConcepts}
          </Text>
          <Text style={styles.summaryLabel}>Weak</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{s.untestedConcepts}</Text>
          <Text style={styles.summaryLabel}>Not tested</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: Colors.primary }]}>{s.pendingRetests}</Text>
          <Text style={styles.summaryLabel}>Retests</Text>
        </View>
      </View>

      {next ? (
        <TouchableOpacity style={styles.nextCard} onPress={handleNext} activeOpacity={0.85}>
          <View style={styles.nextLabelRow}>
            <Ionicons
              name={next.action === 'FIX' ? 'construct' : next.action === 'RETEST' ? 'refresh' : 'navigate'}
              size={14}
              color={Colors.primary}
            />
            <Text style={styles.nextLabel}>YOUR NEXT STEP</Text>
          </View>
          <Text style={styles.nextTitle}>{next.conceptName}</Text>
          <Text style={styles.nextReason}>
            {next.chapterName ? `${next.chapterName} · ` : ''}
            {next.reason}
          </Text>
          <View style={styles.nextCta}>
            <Text style={styles.nextCtaText}>
              {next.action === 'FIX' ? 'Fix this concept' : next.action === 'RETEST' ? 'Take the retest' : 'Open concept'}
            </Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.white} />
          </View>
        </TouchableOpacity>
      ) : (
        <View style={styles.doneCard}>
          <Ionicons name="checkmark-circle" size={26} color={Colors.success} />
          <View style={{ flex: 1 }}>
            <Text style={styles.doneTitle}>Everything is done</Text>
            <Text style={styles.doneSub}>You have mastered every concept on your path.</Text>
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>Fix these first</Text>
      {data.focus.length === 0 ? (
        <EmptyState
          icon="checkmark-circle"
          title="No weak concepts"
          subtitle="Keep going through your path — take a test to generate fresh diagnosis."
        />
      ) : (
        data.focus.map((f) => {
          const color = LEVEL_COLOR[f.level] ?? Colors.accent;
          const pct = f.score ?? 0;
          const busyNow = busy === f.conceptId || startPractice.isPending || requestRetest.isPending;
          return (
            <View key={f.conceptId} style={styles.weakCard}>
              <View style={styles.weakTop}>
                <View style={[styles.levelDot, { backgroundColor: color }]} />
                <View style={styles.weakBody}>
                  <Text style={styles.weakTitle}>{f.conceptName}</Text>
                  <Text style={styles.weakMeta}>{f.chapterName}</Text>
                </View>
                <Text style={[styles.weakScore, { color }]}>{pct}%</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { backgroundColor: color, width: `${Math.max(pct, 3)}%` }]} />
              </View>
              {f.plan ? (
                <Text style={styles.planMeta}>
                  {f.plan.completedSteps}/{f.plan.totalSteps} study steps complete
                </Text>
              ) : null}
              {f.practiceQuestionCount === 0 ? (
                <Text style={styles.noQuestionsHint}>No practice questions yet — take a test to unlock practice.</Text>
              ) : null}
              <View style={styles.weakActions}>
                <TouchableOpacity
                  style={[styles.skillBtn, { flex: 1 }, (busyNow || f.practiceQuestionCount === 0) && styles.skillBtnDisabled]}
                  disabled={busyNow || f.practiceQuestionCount === 0}
                  onPress={() => handlePractice(f.conceptId)}
                >
                  <Ionicons name="flash" size={15} color={Colors.white} />
                  <Text style={styles.skillBtnText}>{busy === f.conceptId ? 'Starting…' : 'Practice'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.retestBtn, (busyNow || f.practiceQuestionCount === 0) && styles.retestBtnDisabled]}
                  disabled={busyNow || f.practiceQuestionCount === 0}
                  onPress={() => handleRetest(f.conceptId)}
                >
                  <Ionicons name="refresh" size={15} color={Colors.primary} />
                  <Text style={styles.retestBtnText}>Retest</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}

      {data.retests.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Retests waiting</Text>
          {data.retests.map((r) => (
            <View key={r.assessmentId} style={styles.retestRow}>
              <Ionicons name="refresh-circle" size={20} color={Colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.weakTitle}>{r.title}</Text>
                <Text style={styles.weakMeta}>{r.chapterName ?? 'Chapter not set'}</Text>
              </View>
              <TouchableOpacity style={styles.retestGo} onPress={() => setSegment('tests')}>
                <Text style={styles.retestGoText}>{r.started ? 'Resume' : 'Take'}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </>
      )}

      <Text style={styles.sectionTitle}>
        Your path · {s.done}/{s.totalConcepts} done
      </Text>
      {upcoming.map((t) => {
        const icon = STATE_ICON[t.state] ?? 'ellipse-outline';
        const isUp = next?.conceptId === t.conceptId;
        return (
          <TouchableOpacity
            key={t.conceptId}
            style={[styles.trackRow, isUp && styles.trackRowUp]}
            onPress={() => router.push({ pathname: '/concept/[conceptId]', params: { conceptId: t.conceptId } })}
          >
            <Ionicons
              name={icon as keyof typeof Ionicons.glyphMap}
              size={16}
              color={t.state === 'DONE' ? Colors.success : t.state === 'IN_PROGRESS' ? '#f59e0b' : Colors.textMuted}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.trackTitle}>{t.conceptName}</Text>
              <Text style={styles.trackMeta}>{t.chapterName}</Text>
            </View>
            {isUp ? (
              <View style={styles.upBadge}>
                <Text style={styles.upBadgeText}>Up next</Text>
              </View>
            ) : null}
            <Text style={[styles.trackScore, { color: LEVEL_COLOR[t.level] ?? Colors.textMuted }]}>
              {t.score !== null ? `${t.score}%` : '—'}
            </Text>
          </TouchableOpacity>
        );
      })}
      {isFetching && !data ? <EmptyState icon="navigate" title="Refreshing…" /> : null}
    </>
  );
}

function TestsView({
  router,
  data,
  isFetching,
}: {
  router: ReturnType<typeof useRouter>;
  data: ReturnType<typeof useMyAssessments>['data'];
  isFetching: boolean;
}) {
  const startAttempt = useStartAttempt();
  const [starting, setStarting] = useState<string | null>(null);

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

  if (pending.length === 0 && completed.length === 0 && !isFetching) {
    return <EmptyState icon="document-text" title="No tests assigned" subtitle="Your teachers will assign assessments here." />;
  }

  return (
    <>
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
            <View style={styles.testActions}>
              <TouchableOpacity
                style={styles.paperBtn}
                onPress={() => router.push({ pathname: '/paper/[assessmentId]', params: { assessmentId: a.assessmentId } })}
              >
                <Ionicons name="document-text-outline" size={15} color={Colors.primary} />
                <Text style={styles.paperBtnText}>View paper</Text>
              </TouchableOpacity>
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
          </View>
        );
      })}

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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerWrap: { backgroundColor: Colors.primary, borderBottomLeftRadius: BorderRadius.xxl, borderBottomRightRadius: BorderRadius.xxl, paddingBottom: Spacing.xs },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing.md },
  headerTitle: { color: Colors.white, fontSize: 26, fontWeight: '700' },
  headerSub: { color: Colors.primaryLight, fontSize: 13, marginTop: 2 },
  segment: { flexDirection: 'row', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, gap: Spacing.sm },
  segmentBtn: { flex: 1, paddingVertical: 9, borderRadius: BorderRadius.md, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)' },
  segmentBtnActive: { backgroundColor: Colors.white },
  segmentText: { color: Colors.white, fontSize: 14, fontWeight: '600' },
  segmentTextActive: { color: Colors.primary },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  summaryRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  summaryItem: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, paddingVertical: Spacing.md, alignItems: 'center' },
  summaryValue: { fontSize: 17, fontWeight: '700', color: Colors.text },
  summaryLabel: { fontSize: 10, color: Colors.textSecondary, fontWeight: '500', marginTop: 2 },
  nextCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.primary + '40' },
  nextLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  nextLabel: { fontSize: 10, fontWeight: '700', color: Colors.primary, letterSpacing: 1 },
  nextTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginTop: 6 },
  nextReason: { fontSize: 12, color: Colors.textSecondary, marginTop: 3 },
  nextCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: 11, marginTop: Spacing.md },
  nextCtaText: { color: Colors.white, fontSize: 14, fontWeight: '600' },
  doneCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.lg },
  doneTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  doneSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.text, marginTop: Spacing.lg, marginBottom: Spacing.md },
  weakCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md },
  weakTop: { flexDirection: 'row', alignItems: 'center' },
  levelDot: { width: 8, height: 8, borderRadius: 4, marginRight: Spacing.sm },
  weakBody: { flex: 1 },
  weakTitle: { fontSize: 15, fontWeight: '600', color: Colors.text },
  weakMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  weakScore: { fontSize: 15, fontWeight: '700' },
  progressTrack: { height: 6, backgroundColor: Colors.surfaceSecondary, borderRadius: 3, marginTop: Spacing.md, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  planMeta: { fontSize: 11, color: Colors.textMuted, marginTop: 6 },
  weakActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  skillBtn: { flexDirection: 'row', backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', gap: 6 },
  skillBtnDisabled: { opacity: 0.55, backgroundColor: '#a8a29e' },
  skillBtnText: { color: Colors.white, fontSize: 13, fontWeight: '600' },
  retestBtn: { flexDirection: 'row', borderWidth: 1.5, borderColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: 10, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', gap: 6 },
  retestBtnDisabled: { opacity: 0.55, borderColor: '#a8a29e' },
  retestBtnText: { color: Colors.primary, fontSize: 13, fontWeight: '600' },
  noQuestionsHint: { fontSize: 11, color: Colors.textMuted, marginTop: 6, fontStyle: 'italic' },
  retestRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm },
  retestGo: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingHorizontal: 14, paddingVertical: 8 },
  retestGoText: { color: Colors.white, fontSize: 13, fontWeight: '600' },
  trackRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: 6 },
  trackRowUp: { borderWidth: 1, borderColor: Colors.primary + '60' },
  trackTitle: { fontSize: 14, fontWeight: '500', color: Colors.text },
  trackMeta: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
  trackScore: { fontSize: 13, fontWeight: '700' },
  upBadge: { backgroundColor: Colors.primary + '18', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  upBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.primary },
  testCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.md },
  testTop: { flexDirection: 'row', alignItems: 'center' },
  testIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: Colors.primary + '20', alignItems: 'center', justifyContent: 'center' },
  testBody: { flex: 1, marginLeft: Spacing.md },
  testTitle: { fontSize: 15, fontWeight: '600', color: Colors.text },
  testMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  testDue: { fontSize: 12, color: Colors.warning, marginTop: 2, fontWeight: '500' },
  testActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  paperBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.primaryLight, paddingVertical: 12, paddingHorizontal: 14 },
  paperBtnText: { color: Colors.primary, fontSize: 13, fontWeight: '700' },
  startBtn: { flex: 1, backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: 12, alignItems: 'center' },
  startBtnDisabled: { opacity: 0.5 },
  startBtnText: { color: Colors.white, fontSize: 15, fontWeight: '600' },
  resultWrap: { alignItems: 'flex-end' },
  resultPct: { fontSize: 18, fontWeight: '700' },
  resultScore: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  detailBtn: { alignItems: 'center', borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.primary, paddingVertical: 9, marginTop: Spacing.md },
  detailBtnText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
});
