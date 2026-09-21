import { ScrollView, View, Text, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useChildren } from '../../lib/hooks';
import { useAuthStore } from '../../lib/auth-store';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';

export default function ChildrenScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: children, isLoading, refetch, isRefetching } = useChildren();

  const onRefresh = useCallback(() => { refetch(); }, [refetch]);

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
      ) : !children || children.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title="No children linked"
          subtitle="Contact your school to link your child's account"
        />
      ) : (
        children.map((child) => (
          <TouchableOpacity key={child.id} style={styles.childCard}>
            <View style={styles.childAvatar}>
              <Text style={styles.avatarText}>{child.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.childInfo}>
              <Text style={styles.childName}>{child.name}</Text>
              <Text style={styles.childMeta}>
                {child.grade ? `Grade ${child.grade}` : ''} {child.institutionName ? `· ${child.institutionName}` : ''}
              </Text>
            </View>
            <View style={styles.childStats}>
              {child.mastery != null && (
                <View style={[styles.statBadge, { backgroundColor: child.mastery >= 70 ? '#dcfce7' : '#fef3c7' }]}>
                  <Text style={[styles.statText, { color: child.mastery >= 70 ? '#16a34a' : '#d97706' }]}>
                    {child.mastery}%
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))
      )}

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tabs)/children')}>
          <Ionicons name="bar-chart" size={24} color={Colors.primary} />
          <Text style={styles.actionLabel}>View{'\n'}Reports</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tabs)/children')}>
          <Ionicons name="alert-circle" size={24} color="#ef4444" />
          <Text style={styles.actionLabel}>Weak{'\n'}Areas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tabs)/children')}>
          <Ionicons name="calendar" size={24} color="#10b981" />
          <Text style={styles.actionLabel}>Upcoming{'\n'}Tests</Text>
        </TouchableOpacity>
      </View>
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
  },
  greetingSmall: { color: Colors.primaryLight, fontSize: 13 },
  greeting: { color: Colors.white, fontSize: 24, fontWeight: '700', marginTop: 2 },
  subHeader: { color: Colors.primaryLight, fontSize: 12, marginTop: Spacing.sm },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginTop: Spacing.xl, marginHorizontal: Spacing.lg, marginBottom: Spacing.md },
  actionsRow: { flexDirection: 'row', marginHorizontal: Spacing.lg, gap: Spacing.md },
  actionBtn: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  actionLabel: { fontSize: 12, fontWeight: '600', color: Colors.text, textAlign: 'center' },
  emptyCard: { marginHorizontal: Spacing.lg, alignItems: 'center', padding: Spacing.xl },
  emptyText: { color: Colors.textSecondary, fontSize: 14, marginTop: Spacing.md },
  childCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
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
  childStats: { flexDirection: 'row', gap: 6 },
  statBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statText: { fontSize: 13, fontWeight: '700' },
});
