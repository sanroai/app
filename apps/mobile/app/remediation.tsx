import { useCallback, useMemo, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useDiagnosisMy,
  useRemediationMy,
  useRemediationWeak,
  useRemediationPracticeStart,
} from '../lib/remediation-hooks';
import { buildWeakConcepts } from '../lib/remediation-format';
import { Colors, Spacing, BorderRadius, Pastel } from '../constants/theme';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { Icon3D } from '../components/Icon3D';
import { RemediationWeakList } from '../components/RemediationList';
import { RemediationPlanCard } from '../components/RemediationPlan';
import { RemediationErrorState } from '../components/RemediationErrorState';

function messageOf(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim().length > 0) return message;
  }
  return fallback;
}

export default function RemediationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const diagnosis = useDiagnosisMy();
  const plans = useRemediationMy();
  const weak = useRemediationWeak();
  const startPractice = useRemediationPracticeStart();

  const [refreshing, setRefreshing] = useState(false);
  const [busyConceptId, setBusyConceptId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const { refetch: refetchDiagnosis } = diagnosis;
  const { refetch: refetchPlans } = plans;
  const { refetch: refetchWeak } = weak;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.allSettled([refetchDiagnosis(), refetchPlans(), refetchWeak()]);
    setRefreshing(false);
  }, [refetchDiagnosis, refetchPlans, refetchWeak]);

  const retryAll = useCallback(() => {
    void Promise.allSettled([refetchDiagnosis(), refetchPlans(), refetchWeak()]);
  }, [refetchDiagnosis, refetchPlans, refetchWeak]);

  const openConcept = useCallback(
    (conceptId: string) => {
      if (!conceptId) return;
      router.push({ pathname: '/concept/[conceptId]', params: { conceptId } });
    },
    [router],
  );

  const handleStartPractice = useCallback(
    async (conceptId: string) => {
      if (!conceptId || busyConceptId) return;
      setBusyConceptId(conceptId);
      setNotice(null);
      try {
        const result = await startPractice.mutateAsync({ conceptId, questionCount: 5 });
        router.push({ pathname: '/practice/[practiceId]', params: { practiceId: result.practiceId } });
      } catch (error: unknown) {
        setNotice(
          messageOf(
            error,
            'No practice questions are available for this concept yet - open the concept to study the lesson first.',
          ),
        );
      } finally {
        setBusyConceptId(null);
      }
    },
    [busyConceptId, router, startPractice],
  );

  const weakConcepts = useMemo(
    () => buildWeakConcepts(diagnosis.data?.concepts, weak.data),
    [diagnosis.data, weak.data],
  );

  const planList = useMemo(() => plans.data ?? [], [plans.data]);

  const planStats = useMemo(() => {
    const items = planList.flatMap((p) => p.items ?? []);
    const done = items.filter((i) => (i.status ?? '').toUpperCase() === 'COMPLETED').length;
    const active = planList.filter((p) => (p.status ?? '').toUpperCase() === 'ACTIVE').length;
    return { done, total: items.length, active };
  }, [planList]);

  const averageScore = diagnosis.data?.averageScore ?? 0;
  const conceptCount = diagnosis.data?.concepts?.length ?? 0;

  const isFirstLoad = diagnosis.isLoading && !diagnosis.data;
  const fatalError = diagnosis.isError && !diagnosis.data;
  const partialError = plans.isError && !plans.data;

  if (isFirstLoad) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Working out what to fix…</Text>
      </View>
    );
  }

  if (fatalError) {
    return (
      <View style={styles.container}>
        <Header insetsTop={insets.top} onBack={() => router.back()} />
        <RemediationErrorState
          message={messageOf(diagnosis.error, 'Could not reach the server.')}
          onRetry={retryAll}
          retrying={diagnosis.isFetching}
        />
      </View>
    );
  }

  const nothingToFix =
    weakConcepts.length === 0 && planList.length === 0 && !plans.isLoading && !weak.isLoading;

  return (
    <View style={styles.container}>
      <Header insetsTop={insets.top} onBack={() => router.back()} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {notice ? (
          <View style={styles.notice}>
            <Ionicons name="information-circle" size={18} color={Colors.warning} />
            <Text style={styles.noticeText}>{notice}</Text>
            <TouchableOpacity
              onPress={() => setNotice(null)}
              accessibilityRole="button"
              accessibilityLabel="Dismiss the message"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.summaryRow}>
          <SummaryTile
            icon="chart"
            value={`${Math.round(averageScore)}%`}
            label="Avg mastery"
            tint={Pastel.mint}
          />
          <SummaryTile
            icon="target"
            value={String(weakConcepts.length)}
            label="To fix"
            tint={Pastel.rose}
          />
          <SummaryTile
            icon="light-bulb"
            value={`${planStats.done}/${planStats.total}`}
            label="Steps done"
            tint={Pastel.violet}
          />
        </View>

        <Text style={styles.summaryHint}>
          {conceptCount > 0
            ? `Across ${conceptCount} ${conceptCount === 1 ? 'concept' : 'concepts'} you have been assessed on`
            : 'Take an assessment to build your mastery map'}
        </Text>

        {nothingToFix ? (
          <View style={styles.emptyWrap}>
            <EmptyState
              icon="trophy"
              title="Nothing to fix"
              subtitle="You are on top of it - no weak concepts and no open plans. Keep your streak going."
            />
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Focus first</Text>
            <Text style={styles.sectionSub}>Your weakest concepts, worst first</Text>

            {weakConcepts.length > 0 ? (
              <RemediationWeakList
                concepts={weakConcepts}
                onPractise={openConcept}
                onStartPractice={handleStartPractice}
                busyConceptId={busyConceptId}
              />
            ) : (
              !weak.isLoading && (
                <Card style={styles.emptyCard}>
                  <View style={styles.emptyIcon}>
                    <Icon3D name="medal-1st" size={30} />
                  </View>
                  <Text style={styles.emptyTitle}>No weak concepts</Text>
                  <Text style={styles.emptyText}>
                    Nothing is flagged as weak right now. Take a test to refresh your diagnosis.
                  </Text>
                </Card>
              )
            )}

            <Text style={styles.sectionTitle}>Your remediation plan</Text>
            <Text style={styles.sectionSub}>
              {planStats.active > 0
                ? `${planStats.active} active ${planStats.active === 1 ? 'plan' : 'plans'}`
                : 'Steps your teacher set for you'}
            </Text>

            {partialError ? (
              <RemediationErrorState
                inline
                message={messageOf(plans.error, 'Could not load your plan.')}
                onRetry={retryAll}
                retrying={plans.isFetching}
              />
            ) : null}

            {planList.length > 0 ? (
              planList.map((plan) => (
                <RemediationPlanCard
                  key={plan.id}
                  plan={plan}
                  onOpenConcept={openConcept}
                  onStartPractice={handleStartPractice}
                  busyConceptId={busyConceptId}
                />
              ))
            ) : (
              !partialError &&
              !plans.isLoading && (
                <Card style={styles.emptyCard}>
                  <View style={styles.emptyIcon}>
                    <Icon3D name="clipboard" size={30} />
                  </View>
                  <Text style={styles.emptyTitle}>No remediation plan yet</Text>
                  <Text style={styles.emptyText}>
                    Weak concepts will show up here with the steps to fix them after an assessment.
                  </Text>
                </Card>
              )
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Header({ insetsTop, onBack }: { insetsTop: number; onBack: () => void }) {
  return (
    <View style={[styles.header, { paddingTop: insetsTop + Spacing.sm }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.headerBody}>
          <Text style={styles.headerTitle}>Remediation</Text>
          <Text style={styles.headerSub}>What to fix next</Text>
        </View>
        <Icon3D name="target" size={34} />
      </View>
    </View>
  );
}

function SummaryTile({
  icon,
  value,
  label,
  tint,
}: {
  icon: string;
  value: string;
  label: string;
  tint: string;
}) {
  return (
    <View style={styles.tile}>
      <View style={[styles.tileIcon, { backgroundColor: tint }]}>
        <Icon3D name={icon} size={24} />
      </View>
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.xxl,
  },
  loadingText: { marginTop: Spacing.md, fontSize: 14, color: Colors.textSecondary },
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomLeftRadius: BorderRadius.xxl,
    borderBottomRightRadius: BorderRadius.xxl,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  headerBody: { flex: 1 },
  headerTitle: { color: Colors.white, fontSize: 24, fontWeight: '800' },
  headerSub: { color: Colors.primaryLight, fontSize: 13, marginTop: 2 },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Pastel.sand,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  noticeText: { flex: 1, fontSize: 12, color: Colors.text, lineHeight: 17 },
  summaryRow: { flexDirection: 'row', gap: Spacing.sm },
  tile: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    alignItems: 'center',
  },
  tileIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  tileValue: { fontSize: 17, fontWeight: '800', color: Colors.text },
  tileLabel: { fontSize: 10, fontWeight: '600', color: Colors.textSecondary, marginTop: 2 },
  summaryHint: { fontSize: 12, color: Colors.textMuted, marginTop: Spacing.sm },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: Colors.text, marginTop: Spacing.xl },
  sectionSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2, marginBottom: Spacing.md },
  emptyWrap: { minHeight: 260, justifyContent: 'center' },
  emptyCard: { alignItems: 'center', paddingVertical: Spacing.xl },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    backgroundColor: Pastel.lavender,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  emptyText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: Spacing.md,
    lineHeight: 18,
  },
});
