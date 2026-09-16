import { ScrollView, View, Text, StyleSheet, TouchableOpacity, RefreshControl, FlatList } from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../lib/auth-store';
import { useUserDisplayRole } from '../../lib/hooks';
import { useLearningHome, useMyDiagnosis, useMyAssessments, useGamificationProfile } from '../../lib/hooks';
import { useRoleTheme } from '../../lib/role-theme';
import { Card } from '../../components/Card';
import { Colors, Spacing, BorderRadius, Shadow } from '../../constants/theme';

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const roleLabel = useUserDisplayRole();
  const theme = useRoleTheme();
  const { data: home, refetch: refetchHome, isFetching: homeLoading } = useLearningHome();
  const { data: diagnosis } = useMyDiagnosis();
  const { data: assessments, refetch: refetchAssess, isFetching: assessLoading } = useMyAssessments();
  const { data: gamification } = useGamificationProfile();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchHome(), refetchAssess()]);
    setRefreshing(false);
  }, [refetchHome, refetchAssess]);

  const role = user?.role ?? 'STUDENT';
  const isStudent = role === 'STUDENT';
  const isTeacher = role === 'TEACHER';
  const isParent = role === 'PARENT';
  const isAdmin = role === 'INSTITUTION_ADMIN' || role === 'SUPER_ADMIN';

  const firstName = user?.name ? user.name.split(' ')[0] : 'Student';

  // Student-specific data
  const weakConcepts = diagnosis?.weakConcepts ?? [];
  const pendingAssessments = (assessments?.assignments ?? []).filter((a) =>
    !a.attempts.some((at) => at.status === 'SUBMITTED' || at.status === 'AUTO_SUBMITTED'),
  );
  const xp = gamification?.profile?.totalXp ?? 0;
  const streak = gamification?.profile?.currentStreak ?? 0;
  const mastery = gamification?.profile?.averageMastery ?? 0;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // ─── Teacher / Admin Home ───
  if (isTeacher || isAdmin) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={[styles.header, { backgroundColor: theme.primary }]}>
          <View style={styles.headerTop}>
            <View style={styles.greetingWrap}>
              <Text style={styles.greetingSmall}>{greeting()},</Text>
              <Text style={styles.greeting}>{firstName}</Text>
              <Text style={styles.roleChip}>{roleLabel}</Text>
            </View>
            <TouchableOpacity style={styles.logoWrap} onPress={() => router.push('/(tabs)/me')}>
              <Ionicons name="school" size={30} color={Colors.white} />
            </TouchableOpacity>
          </View>
          <Text style={styles.subHeader}>ASSESS → DIAGNOSE → FIX → RETEST</Text>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tabs)/classes')}>
            <Ionicons name="people" size={24} color={Colors.primary} />
            <Text style={styles.actionLabel}>My Classes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tabs)/assessments')}>
            <Ionicons name="clipboard" size={24} color="#10b981" />
            <Text style={styles.actionLabel}>Assessments</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/leaderboard')}>
            <Ionicons name="bar-chart" size={24} color="#f59e0b" />
            <Text style={styles.actionLabel}>Reports</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Your Groups</Text>
        <Card style={styles.emptyCard}>
          <Ionicons name="people-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyText}>Groups will appear once assigned</Text>
        </Card>
      </ScrollView>
    );
  }

  // ─── Parent Home ───
  if (isParent) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={[styles.header, { backgroundColor: theme.primary }]}>
          <View style={styles.headerTop}>
            <View style={styles.greetingWrap}>
              <Text style={styles.greetingSmall}>{greeting()},</Text>
              <Text style={styles.greeting}>{firstName}</Text>
              <Text style={styles.roleChip}>{roleLabel}</Text>
            </View>
            <TouchableOpacity style={styles.logoWrap} onPress={() => router.push('/(tabs)/me')}>
              <Ionicons name="school" size={30} color={Colors.white} />
            </TouchableOpacity>
          </View>
          <Text style={styles.subHeader}>Track your children&apos;s academic progress</Text>
        </View>

        <Text style={styles.sectionTitle}>Your Children</Text>
        <Card style={styles.emptyCard}>
          <Ionicons name="people-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyText}>No children linked yet</Text>
          <Text style={styles.emptyHint}>Contact your school to link accounts</Text>
        </Card>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tabs)/children')}>
            <Ionicons name="bar-chart" size={24} color={Colors.primary} />
            <Text style={styles.actionLabel}>Reports</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tabs)/children')}>
            <Ionicons name="alert-circle" size={24} color="#ef4444" />
            <Text style={styles.actionLabel}>Weak Areas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tabs)/children')}>
            <Ionicons name="calendar" size={24} color="#10b981" />
            <Text style={styles.actionLabel}>Upcoming</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // ─── Student Home (default) ───
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <View style={styles.headerTop}>
          <View style={styles.greetingWrap}>
            <Text style={styles.greetingSmall}>{greeting()},</Text>
            <Text style={styles.greeting}>{firstName}</Text>
            <Text style={styles.roleChip}>{roleLabel}</Text>
          </View>
          <TouchableOpacity style={styles.logoWrap} onPress={() => router.push('/(tabs)/me')}>
            <Ionicons name="school" size={30} color={Colors.white} />
          </TouchableOpacity>
        </View>
        <Text style={styles.subHeader}>TODAY → DO THIS → IMPROVE</Text>
      </View>

      <View style={styles.statsRow}>
        <StatChip icon="star" label="XP" value={String(xp)} color="#7c3aed" />
        <StatChip icon="flame" label="Streak" value={`${streak}d`} color="#f59e0b" />
        <StatChip icon="fitness" label="Mastery" value={`${Math.round(mastery)}%`} color="#059669" />
      </View>

      {weakConcepts.length > 0 || pendingAssessments.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Your Focus Today</Text>

          {weakConcepts.slice(0, 2).map((wc) => (
            <Card key={wc.conceptId} accent style={styles.focusCard}>
              <View style={styles.focusRow}>
                <View style={styles.focusIcon}>
                  <Ionicons name="alert-circle" size={20} color={Colors.error} />
                </View>
                <View style={styles.focusBody}>
                  <Text style={styles.focusTitle}>{wc.conceptName}</Text>
                  <Text style={styles.focusSub}>
                    {wc.subjectName} • {wc.chapterName} • {wc.masteryScore}% mastery
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.fixBtn}
                onPress={() => router.push({ pathname: '/concept/[conceptId]', params: { conceptId: wc.conceptId } })}
              >
                <Text style={styles.fixBtnText}>Fix This</Text>
                <Ionicons name="arrow-forward" size={16} color={Colors.white} />
              </TouchableOpacity>
            </Card>
          ))}

          {pendingAssessments.slice(0, 2).map((a) => (
            <Card key={a.id} style={styles.focusCard}>
              <View style={styles.focusRow}>
                <View style={[styles.focusIcon, { backgroundColor: Colors.primary + '20' }]}>
                  <Ionicons name="document-text" size={20} color={Colors.primary} />
                </View>
                <View style={styles.focusBody}>
                  <Text style={styles.focusTitle}>{a.assessment.title}</Text>
                  <Text style={styles.focusSub}>
                    {a.assessment.subject?.name ?? 'Subject'} • {a.assessment.durationMinutes} min • Start when ready
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.fixBtn, { backgroundColor: Colors.primary }]}
                onPress={() => router.push('/(tabs)/tests')}
              >
                <Text style={styles.fixBtnText}>Prepare</Text>
                <Ionicons name="arrow-forward" size={16} color={Colors.white} />
              </TouchableOpacity>
            </Card>
          ))}
        </>
      ) : null}

      <Text style={styles.sectionTitle}>Continue Learning</Text>
      {home && home.boards.length > 0 ? (
        home.boards.flatMap((b) =>
          b.grades.map((g) =>
            g.subjects.map((s) => (
              <Card key={s.id} style={styles.subjectCard}>
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: '/learn/[boardId]/[grade]/[subjectId]',
                      params: { boardId: b.id, grade: g.grade, subjectId: s.id },
                    })
                  }
                >
                  <View style={styles.subjectRow}>
                    <View style={styles.subjectIcon}>
                      <Ionicons name={s.code === 'MATH' ? 'calculator' : 'flask'} size={22} color={Colors.primary} />
                    </View>
                    <View style={styles.subjectBody}>
                      <Text style={styles.subjectName}>{s.name}</Text>
                      <Text style={styles.subjectMeta}>Class {g.grade}</Text>
                    </View>
                    <View style={styles.subjectPct}>
                      <Text style={styles.subjectPctText}>
                        {s.totalContent > 0 ? Math.round((s.completedContent / s.totalContent) * 100) : 0}%
                      </Text>
                    </View>
                  </View>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${s.totalContent > 0 ? (s.completedContent / s.totalContent) * 100 : 0}%`,
                        },
                      ]}
                    />
                  </View>
                </TouchableOpacity>
              </Card>
            )),
          ),
        )
      ) : (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>Loading your classes…</Text>
        </Card>
      )}
    </ScrollView>
  );
}

function StatChip({ icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <View style={[styles.statChip, { backgroundColor: color + '15', borderColor: color + '30' }]}>
      <Ionicons name={icon} size={14} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: Spacing.xxxl },
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: BorderRadius.xxl,
    borderBottomRightRadius: BorderRadius.xxl,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greetingWrap: {},
  greetingSmall: { color: Colors.primaryLight, fontSize: 13 },
  greeting: { color: Colors.white, fontSize: 24, fontWeight: '700', marginTop: 2 },
  roleChip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: Colors.white,
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginTop: 6,
  },
  logoWrap: {
    width: 56, height: 56, borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  subHeader: { color: Colors.primaryLight, fontSize: 11, fontWeight: '600', letterSpacing: 1.5, marginTop: Spacing.lg },
  statsRow: { flexDirection: 'row', marginHorizontal: Spacing.lg, marginTop: -Spacing.lg, gap: Spacing.sm },
  statChip: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    ...Shadow.sm,
  },
  statValue: { fontSize: 14, fontWeight: '700', color: Colors.text },
  statLabel: { fontSize: 10, color: Colors.textSecondary, fontWeight: '500' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginTop: Spacing.xxl, marginHorizontal: Spacing.lg, marginBottom: Spacing.md },
  focusCard: { marginHorizontal: Spacing.lg, marginBottom: Spacing.md },
  focusRow: { flexDirection: 'row', alignItems: 'center' },
  focusIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.error + '20', alignItems: 'center', justifyContent: 'center' },
  focusBody: { flex: 1, marginLeft: Spacing.md },
  focusTitle: { fontSize: 15, fontWeight: '600', color: Colors.text },
  focusSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  fixBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.md,
    paddingVertical: 10,
    marginTop: Spacing.md,
  },
  fixBtnText: { color: Colors.white, fontSize: 14, fontWeight: '600' },
  subjectCard: { marginHorizontal: Spacing.lg, marginBottom: Spacing.md, padding: Spacing.md },
  subjectRow: { flexDirection: 'row', alignItems: 'center' },
  subjectIcon: { width: 44, height: 44, borderRadius: BorderRadius.md, backgroundColor: Colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
  subjectBody: { flex: 1, marginLeft: Spacing.md },
  subjectName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  subjectMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  subjectPct: { backgroundColor: Colors.primary + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full },
  subjectPctText: { color: Colors.primary, fontSize: 13, fontWeight: '700' },
  progressTrack: { height: 6, backgroundColor: Colors.surfaceSecondary, borderRadius: 3, marginTop: Spacing.md, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: Colors.primary, borderRadius: 3 },
  emptyCard: { marginHorizontal: Spacing.lg, alignItems: 'center', padding: Spacing.xl },
  emptyText: { color: Colors.textSecondary, fontSize: 14 },
  emptyHint: { color: Colors.textMuted, fontSize: 12, marginTop: 4 },
  actionsRow: { flexDirection: 'row', marginHorizontal: Spacing.lg, gap: Spacing.md },
  actionBtn: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  actionLabel: { fontSize: 12, fontWeight: '600', color: Colors.text, textAlign: 'center' },
});