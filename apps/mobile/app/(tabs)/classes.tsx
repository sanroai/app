import { ScrollView, View, Text, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../lib/auth-store';
import { Card } from '../../components/Card';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';

type Group = { id: string; name: string; grade?: string; studentCount: number };

export default function ClassesScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="bar-chart" size={24} color="#f59e0b" />
          <Text style={styles.actionLabel}>View{'\n'}Reports</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Your Groups</Text>
      <Card style={styles.emptyCard}>
        <Ionicons name="people-outline" size={48} color={Colors.textMuted} />
        <Text style={styles.emptyText}>Groups will appear here once assigned</Text>
      </Card>
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
});
