import { ScrollView, View, Text, StyleSheet, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../lib/auth-store';
import { useUserDisplayRole } from '../../lib/hooks';
import { useLearningHome, useMyDiagnosis, useMyAssessments, useGamificationProfile, useLearningProgress } from '../../lib/hooks';
import { useRoleTheme } from '../../lib/role-theme';
import { Card } from '../../components/Card';
import { Icon3D } from '../../components/Icon3D';
import { SubjectCard, StatTile, SectionHeader, ProgressBar } from '../../components/visuals';
import { SUBJECT_ART } from '../../lib/subject-art';
import { Colors, Spacing, BorderRadius, Shadow, Pastel } from '../../constants/theme';

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const roleLabel = useUserDisplayRole();
  const theme = useRoleTheme();
  const role = user?.role ?? 'STUDENT';
  const isStudent = role === 'STUDENT';
  const isTeacher = role === 'TEACHER';
  const isParent = role === 'PARENT';
  const isAdmin = role === 'INSTITUTION_ADMIN' || role === 'SUPER_ADMIN';
  // Every one of these endpoints is student-only; a parent or a teacher opening
  // Home would otherwise fire five requests that answer 403 (the web dashboard
  // avoids this by mounting StudentContent only for a student).
  const { data: home, refetch: refetchHome, isFetching: homeLoading } = useLearningHome({ enabled: isStudent });
  const { data: diagnosis } = useMyDiagnosis({ enabled: isStudent });
  const { data: assessments, refetch: refetchAssess, isFetching: assessLoading } = useMyAssessments({ enabled: isStudent });
  const { data: gamification } = useGamificationProfile({ enabled: isStudent });
  const { data: progress } = useLearningProgress({ enabled: isStudent });
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchHome(), refetchAssess()]);
    setRefreshing(false);
  }, [refetchHome, refetchAssess]);

  const firstName = user?.name ? user.name.split(' ')[0] : 'Student';

  // Student-specific data
  const weakConcepts = diagnosis?.weakConcepts ?? [];
  const pendingAssessments = (assessments?.assignments ?? []).filter((a) =>
    !a.attempts.some((at) => at.status === 'SUBMITTED' || at.status === 'AUTO_SUBMITTED'),
  );
  const xp = gamification?.xp ?? 0;
  const streak = gamification?.streakDays ?? 0;
  const mastery = progress?.mastery.averageScore ?? 0;
  const subjects =
    home?.boards.flatMap((b) =>
      b.grades.flatMap((g) =>
        g.subjects.map((s) => ({ key: `${b.id}-${g.grade}-${s.id}`, boardId: b.id, grade: g.grade, ...s })),
      ),
    ) ?? [];

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
                    <Ionicons name="clipboard" size={24} color={Colors.success} />
            <Text style={styles.actionLabel}>Assessments</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/leaderboard')}>
            <Ionicons name="bar-chart" size={24} color={Colors.warning} />
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
            <Ionicons name="alert-circle" size={24} color={Colors.error} />
            <Text style={styles.actionLabel}>Weak Areas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tabs)/children')}>
            <Ionicons name="calendar" size={24} color={Colors.success} />
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
        <Image source={SUBJECT_ART.dashboard} style={styles.headerBanner} resizeMode="cover" />
        <View style={styles.headerOverlay} />
        <View style={styles.headerTop}>
          <View style={styles.greetingWrap}>
            <Text style={styles.greetingSmall}>{greeting()},</Text>
            <Text style={styles.greeting}>{firstName}</Text>
            <Text style={styles.roleChip}>{roleLabel}</Text>
          </View>
          <TouchableOpacity style={styles.logoWrap} onPress={() => router.push('/(tabs)/me')}>
            <Icon3D name="graduation-cap" size={38} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.streakCard}>
        <View style={styles.streakIcon}>
          <Icon3D name="fire" size={30} />
        </View>
        <View style={styles.streakBody}>
          <Text style={styles.streakTitle}>You&apos;re on a {streak} day streak!</Text>
          <Text style={styles.streakSub}>Study today to keep it alive.</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatTile icon="star" label="Total XP" value={String(xp)} tint={Pastel.sand} />
        <StatTile icon="chart" label="Mastery" value={`${Math.round(mastery)}%`} tint={Pastel.mint} />
      </View>

      <View style={styles.levelCard}>
        <View style={styles.levelRow}>
          <Text style={styles.levelLabel}>Level {gamification?.level ?? 1}</Text>
          <Text style={styles.levelValue}>
            {gamification?.xpInLevel ?? 0} / {gamification?.xpForLevel ?? 500} XP
          </Text>
        </View>
        <ProgressBar
          pct={gamification && gamification.xpForLevel > 0 ? (gamification.xpInLevel / gamification.xpForLevel) * 100 : 0}
          color={Colors.primary}
        />
      </View>

      {/* The same three destinations as the web student dashboard's Quick Actions
          (docs/PARITY_POLICY.md): take an assessment, see what to fix, compare. */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tabs)/tests')}>
          <Ionicons name="checkbox" size={24} color={Colors.primary} />
          <Text style={styles.actionLabel}>Take Assessment</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/remediation')}>
          <Ionicons name="locate" size={24} color="#7c3aed" />
          <Text style={styles.actionLabel}>View Remediation</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/leaderboard')}>
          <Ionicons name="trophy" size={24} color={Colors.warning} />
          <Text style={styles.actionLabel}>Leaderboard</Text>
        </TouchableOpacity>
      </View>

      {weakConcepts.length > 0 || pendingAssessments.length > 0 ? (
        <>
          <SectionHeader title="Your focus today" />

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

      <SectionHeader title="Continue learning" actionLabel="See all" onAction={() => router.push('/(tabs)/learn')} />
      {subjects.length > 0 ? (
        <View style={styles.subjectGrid}>
          {subjects.map((s) => (
            <SubjectCard
              key={s.key}
              name={s.name}
              subtitle={`Class ${s.grade} · ${s.totalContent} topics`}
              progress={s.totalContent > 0 ? (s.completedContent / s.totalContent) * 100 : 0}
              style={styles.subjectGridItem}
              onPress={() =>
                router.push({
                  pathname: '/learn/[boardId]/[grade]/[subjectId]',
                  params: { boardId: s.boardId, grade: s.grade, subjectId: s.id },
                })
              }
            />
          ))}
        </View>
      ) : (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>Loading your classes…</Text>
        </Card>
      )}

    </ScrollView>
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
    overflow: 'hidden',
  },
  headerBanner: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(31, 14, 71, 0.62)',
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greetingWrap: {},
  greetingSmall: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '500' },
  greeting: { color: Colors.white, fontSize: 26, fontWeight: '800', marginTop: 2 },
  roleChip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.25)',
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginTop: 8,
  },
  logoWrap: {
    width: 56, height: 56, borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  subHeader: { color: Colors.primaryLight, fontSize: 11, fontWeight: '600', letterSpacing: 1.5, marginTop: Spacing.lg },
  statsRow: { flexDirection: 'row', marginHorizontal: Spacing.lg, marginTop: Spacing.lg, gap: Spacing.sm },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    backgroundColor: Pastel.sand,
    borderRadius: BorderRadius.xl,
    gap: Spacing.md,
  },
  streakIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakBody: { flex: 1 },
  streakTitle: { fontSize: 15, fontWeight: '800', color: Colors.text },
  streakSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  levelCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    ...Shadow.sm,
  },
  levelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  levelLabel: { fontSize: 13, fontWeight: '700', color: Colors.text },
  levelValue: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  subjectGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginHorizontal: Spacing.lg },
  subjectGridItem: { flexBasis: '47%', flexGrow: 0, flexShrink: 0 },
  badgeRow: { gap: Spacing.md, paddingHorizontal: Spacing.lg },
  badgeItem: { width: 76, alignItems: 'center' },
  badgeIcon: {
    width: 62,
    height: 62,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  badgeName: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary, textAlign: 'center' },
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