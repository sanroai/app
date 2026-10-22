import { ScrollView, View, Text, StyleSheet, RefreshControl } from 'react-native';
import { useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  useParentDashboard,
  useParentInstitution,
  type ParentChild,
} from '../../lib/parity-hooks';
import { useAuthStore } from '../../lib/auth-store';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { Colors, Spacing, BorderRadius, Pastel } from '../../constants/theme';

const MASTERY_STRONG = 70;

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/** The API rejects with a plain `{ code, message, statusCode }` object, not an Error. */
function errorText(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === 'string' && message.length > 0) return message;
  }
  return 'Please try again.';
}

function formatDate(value: string | null): string {
  if (!value) return 'No due date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No due date';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ChildrenScreen() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, error, refetch, isRefetching } = useParentDashboard();
  const { data: institution } = useParentInstitution();

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const children = data?.children ?? [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.greetingSmall}>Good day,</Text>
        <Text style={styles.greeting}>{user?.name?.split(' ')[0] ?? 'Parent'}</Text>
        <Text style={styles.subHeader}>Track your children&apos;s academic progress</Text>
      </View>

      <Text style={styles.sectionTitle}>Your Children</Text>
      {isLoading ? (
        <Card style={styles.emptyCard}>
          <Ionicons name="hourglass-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyText}>Loading children...</Text>
        </Card>
      ) : error ? (
        <EmptyState
          icon="alert-circle"
          title="Could not load children"
          subtitle={errorText(error)}
        />
      ) : children.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title="No children linked to your account yet."
          subtitle="Contact your school to link your child's account"
        />
      ) : (
        children.map((child) => (
          <ChildCard key={child.id} child={child} institutionName={institution?.name ?? null} />
        ))
      )}
    </ScrollView>
  );
}

function ChildCard({ child, institutionName }: { child: ParentChild; institutionName: string | null }) {
  const mastery = child.overallMastery;
  const strong = mastery >= MASTERY_STRONG;
  const weak = child.weakConcepts.slice(0, 3);
  const upcoming = child.upcomingAssessments.slice(0, 3);
  const activity = child.recentActivity.slice(0, 5);

  return (
    <Card style={styles.childCard}>
      <View style={styles.childHead}>
        <View style={styles.childAvatar}>
          <Text style={styles.avatarText}>{child.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.childInfo}>
          <Text style={styles.childName}>{child.name}</Text>
          <Text style={styles.childMeta}>{child.grade ? `Grade ${child.grade}` : 'No grade assigned'}</Text>
          {institutionName ? (
            <View style={styles.institutionRow}>
              <Ionicons name="school-outline" size={12} color={Colors.textSecondary} />
              <Text style={styles.childInstitution}>{institutionName}</Text>
            </View>
          ) : null}
        </View>
        <View style={[styles.masteryBadge, strong ? styles.masteryBadgeStrong : styles.masteryBadgeWeak]}>
          <Text style={[styles.masteryValue, { color: strong ? Colors.success : Colors.warning }]}>
            {mastery}%
          </Text>
          <Text style={styles.masteryLabel}>Mastery</Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${Math.max(mastery, 3)}%`, backgroundColor: strong ? Colors.success : Colors.warning },
          ]}
        />
      </View>

      {weak.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Ionicons name="alert-circle" size={15} color={Colors.warning} />
            <Text style={styles.sectionLabel}>Weak Areas</Text>
          </View>
          {weak.map((concept) => (
            <View key={concept.name} style={[styles.row, { backgroundColor: Pastel.sand }]}>
              <View style={styles.rowBody}>
                <Text style={[styles.rowTitle, { color: Colors.text }]}>{concept.name}</Text>
                <Text style={styles.rowMeta}>{titleCase(concept.level)}</Text>
              </View>
              <Text style={[styles.rowBadge, { color: Colors.warning }]}>{concept.score}%</Text>
            </View>
          ))}
        </View>
      )}

      {upcoming.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Ionicons name="time-outline" size={15} color={Colors.info} />
            <Text style={styles.sectionLabel}>Upcoming Assessments</Text>
          </View>
          {upcoming.map((assessment, index) => (
            <View key={`${assessment.title}-${index}`} style={[styles.row, { backgroundColor: Pastel.sky }]}>
              <View style={styles.rowBody}>
                <Text style={[styles.rowTitle, { color: Colors.text }]}>{assessment.title}</Text>
                <Text style={styles.rowMeta}>{assessment.subject}</Text>
              </View>
              <Text style={[styles.rowBadge, { color: Colors.info }]}>{formatDate(assessment.date)}</Text>
            </View>
          ))}
        </View>
      )}

      {activity.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Ionicons name="checkmark-circle" size={15} color={Colors.success} />
            <Text style={styles.sectionLabel}>Recent Activity</Text>
          </View>
          {activity.map((entry, index) => (
            <View key={`${entry.title}-${index}`} style={[styles.row, { backgroundColor: Pastel.mint }]}>
              <View style={styles.rowBody}>
                <Text style={[styles.rowTitle, { color: Colors.text }]} numberOfLines={2}>
                  {entry.title}
                </Text>
                <Text style={styles.rowMeta}>{titleCase(entry.type)}</Text>
              </View>
              {entry.score != null && (
                <Text
                  style={[
                    styles.rowBadge,
                    { color: entry.score >= 50 ? Colors.success : Colors.error },
                  ]}
                >
                  {entry.score}%
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      {weak.length === 0 && upcoming.length === 0 && activity.length === 0 && (
        <View style={styles.noActivity}>
          <Ionicons name="book-outline" size={22} color={Colors.textMuted} />
          <Text style={styles.noActivityText}>No activity recorded yet.</Text>
        </View>
      )}
    </Card>
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
  greetingSmall: { color: Colors.primaryLight, fontSize: 13 },
  greeting: { color: Colors.white, fontSize: 24, fontWeight: '700', marginTop: 2 },
  subHeader: { color: Colors.primaryLight, fontSize: 12, marginTop: Spacing.sm },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginTop: Spacing.xl,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  emptyCard: { marginHorizontal: Spacing.lg, alignItems: 'center', padding: Spacing.xl },
  emptyText: { color: Colors.textSecondary, fontSize: 14, marginTop: Spacing.md },
  childCard: { marginHorizontal: Spacing.lg, marginBottom: Spacing.md },
  childHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  childAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: Colors.white, fontSize: 20, fontWeight: '700' },
  childInfo: { flex: 1 },
  childName: { fontSize: 16, fontWeight: '600', color: Colors.text },
  childMeta: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  institutionRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  childInstitution: { fontSize: 12, color: Colors.textSecondary },
  masteryBadge: {
    width: 58,
    height: 58,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  masteryBadgeStrong: { backgroundColor: Pastel.mint },
  masteryBadgeWeak: { backgroundColor: Pastel.sand },
  masteryValue: { fontSize: 16, fontWeight: '700' },
  masteryLabel: { fontSize: 9, fontWeight: '600', color: Colors.textSecondary },
  progressTrack: {
    height: 6,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 3,
    marginTop: Spacing.md,
    overflow: 'hidden',
  },
  progressFill: { height: 6, borderRadius: 3 },
  section: { marginTop: Spacing.lg },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.sm },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: Colors.text },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: 6,
    gap: Spacing.sm,
  },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: 13, fontWeight: '600' },
  rowMeta: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  rowBadge: { fontSize: 12, fontWeight: '700' },
  noActivity: { alignItems: 'center', paddingVertical: Spacing.lg },
  noActivityText: { fontSize: 13, color: Colors.textSecondary, marginTop: Spacing.sm },
});
