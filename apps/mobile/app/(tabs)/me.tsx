import { ScrollView, View, Text, StyleSheet, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../lib/auth-store';
import { useGamificationProfile, useAchievements, useLearningProgress, useUserDisplayRole } from '../../lib/hooks';
import { Card } from '../../components/Card';
import { AchievementIcon } from '../../components/AchievementIcon';
import { ProgressBar } from '../../components/Progress';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';

export default function MeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const roleLabel = useUserDisplayRole();
  const { data: gamification, refetch } = useGamificationProfile();
  const { data: achievements } = useAchievements();
  const { data: progress, refetch: refetchProgress } = useLearningProgress();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchProgress()]);
    setRefreshing(false);
  }, [refetch, refetchProgress]);

  const profile = gamification?.profile;
  const achievementList = achievements?.achievements ?? [];

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <View style={styles.avatarWrap}>
          <Text style={styles.avatarText}>{(user?.name ?? '?').charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.role}>{roleLabel}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {/* Progress summary */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="star" size={18} color={Colors.accent} />
          <Text style={styles.statValue}>{profile?.totalXp ?? 0}</Text>
          <Text style={styles.statLabel}>XP</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="flame" size={18} color="#f97316" />
          <Text style={styles.statValue}>{profile?.currentStreak ?? 0}</Text>
          <Text style={styles.statLabel}>Day streak</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="fitness" size={18} color={Colors.primary} />
          <Text style={styles.statValue}>{Math.round(profile?.averageMastery ?? 0)}%</Text>
          <Text style={styles.statLabel}>Mastery</Text>
        </View>
      </View>

      {/* Learning progress */}
      {progress ? (
        <Card style={styles.block}>
          <Text style={styles.blockTitle}>Learning progress</Text>
          <ProgressBar label="Content completed" value={progress.completedContent} max={Math.max(progress.totalContent, 1)} />
          <ProgressBar label="Concepts mastered" value={progress.masteredConcepts} max={Math.max(progress.totalConcepts, 1)} color={Colors.success} />
          <ProgressBar label="Average mastery" value={progress.averageMastery} color={Colors.accent} />
        </Card>
      ) : null}

      {/* Achievements */}
      <Text style={styles.sectionTitle}>Achievements</Text>
      {achievementList.length > 0 ? (
        <View style={styles.achGrid}>
          {achievementList.map((ach: { id: string; name: string; icon: string; description: string; unlockedAt?: string | null }) => {
            const unlocked = ach.unlockedAt != null;
            return (
              <View key={ach.id} style={[styles.achCard, !unlocked && { opacity: 0.5 }]}>
                <AchievementIcon name={ach.name} icon={ach.icon} unlocked={unlocked} />
                <Text style={styles.achName}>{ach.name}</Text>
                <Text style={styles.achDesc} numberOfLines={2}>{ach.description}</Text>
                {unlocked ? null : <Text style={styles.achLocked}>Locked</Text>}
              </View>
            );
          })}
        </View>
      ) : (
        <Card style={styles.block}>
          <Text style={styles.mutedText}>Complete learning activities to earn achievements.</Text>
        </Card>
      )}

      {/* Leaderboard shortcut */}
      <TouchableOpacity style={styles.menuRow} onPress={() => router.push('/leaderboard')}>
        <Ionicons name="trophy" size={20} color={Colors.accent} />
        <Text style={styles.menuLabel}>Leaderboard</Text>
        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuRow} onPress={handleLogout}>
        <Ionicons name="log-out" size={20} color={Colors.error} />
        <Text style={[styles.menuLabel, { color: Colors.error }]}>Log out</Text>
        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
      </TouchableOpacity>

      <Text style={styles.footer}>Sanro AI v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: Spacing.xxxl },
  header: { backgroundColor: Colors.primary, alignItems: 'center', paddingTop: Spacing.xxl, paddingBottom: Spacing.xl, borderBottomLeftRadius: BorderRadius.xxl, borderBottomRightRadius: BorderRadius.xxl },
  avatarWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: Colors.white, fontSize: 30, fontWeight: '700' },
  name: { color: Colors.white, fontSize: 20, fontWeight: '700', marginTop: Spacing.md },
  role: { color: Colors.primaryLight, fontSize: 13, fontWeight: '600', marginTop: 2 },
  email: { color: Colors.primaryLight, fontSize: 12, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginHorizontal: Spacing.lg, marginTop: -Spacing.lg },
  statCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, paddingVertical: Spacing.md, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 18, fontWeight: '700', color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },
  block: { marginHorizontal: Spacing.lg, marginTop: Spacing.xl },
  blockTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  mutedText: { fontSize: 13, color: Colors.textSecondary },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.text, marginTop: Spacing.xl, marginHorizontal: Spacing.lg, marginBottom: Spacing.md },
  achGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.md },
  achCard: { width: '45%', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', margin: Spacing.xs },
  achName: { fontSize: 13, fontWeight: '600', color: Colors.text, marginTop: Spacing.sm, textAlign: 'center' },
  achDesc: { fontSize: 11, color: Colors.textSecondary, marginTop: 2, textAlign: 'center' },
  achLocked: { fontSize: 10, color: Colors.textMuted, marginTop: 4 },
  menuRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, marginHorizontal: Spacing.lg, marginTop: Spacing.md, padding: Spacing.lg, borderRadius: BorderRadius.lg, gap: Spacing.md },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: Colors.text },
  footer: { textAlign: 'center', color: Colors.textMuted, fontSize: 12, marginTop: Spacing.xxl },
});