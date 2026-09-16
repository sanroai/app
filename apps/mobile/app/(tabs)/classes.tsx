import { ScrollView, View, Text, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../lib/auth-store';
import { useGroups } from '../../lib/hooks';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';

export default function ClassesScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: groups, isLoading, refetch, isRefetching } = useGroups();

  const onRefresh = useCallback(() => { refetch(); }, [refetch]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.greetingSmall}>{greeting()},</Text>
        <Text style={styles.greeting}>{user?.name?.split(' ')[0] ?? 'Teacher'}</Text>
        <Text style={styles.subHeader}>Your Classes & Students</Text>
      </View>

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tabs)/assessments')}>
          <Ionicons name="clipboard" size={24} color={Colors.primary} />
          <Text style={styles.actionLabel}>Create{'\n'}Assessment</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tabs)/me')}>
          <Ionicons name="people" size={24} color="#10b981" />
          <Text style={styles.actionLabel}>View{'\n'}Students</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/leaderboard')}>
          <Ionicons name="bar-chart" size={24} color="#f59e0b" />
          <Text style={styles.actionLabel}>Leaderboard</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Your Groups</Text>
      {isLoading ? (
        <Card style={styles.emptyCard}>
          <Ionicons name="hourglass-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyText}>Loading groups...</Text>
        </Card>
      ) : !groups || groups.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title="No groups yet"
          subtitle="Groups will appear here once assigned by your institution admin"
        />
      ) : (
        groups.map((group) => (
          <TouchableOpacity
            key={group.id}
            style={styles.groupCard}
            onPress={() => router.push(`/(tabs)/me`)}
          >
            <View style={styles.groupIcon}>
              <Ionicons name="school" size={24} color={Colors.primary} />
            </View>
            <View style={styles.groupInfo}>
              <Text style={styles.groupName}>{group.name}</Text>
              <Text style={styles.groupMeta}>
                {group.grade ? `Grade ${group.grade}` : ''} · {group.studentCount} student{group.studentCount !== 1 ? 's' : ''}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 40 },
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
  subHeader: { color: Colors.primaryLight, fontSize: 11, fontWeight: '600', letterSpacing: 1, marginTop: Spacing.md },
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
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupInfo: { flex: 1 },
  groupName: { fontSize: 16, fontWeight: '600', color: Colors.text },
  groupMeta: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
});
