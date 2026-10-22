import { ScrollView, View, Text, StyleSheet, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useAuthStore } from '../../lib/auth-store';
import { useGamificationProfile, useAchievements, useLearningProgress, useUserDisplayRole } from '../../lib/hooks';
import { Card } from '../../components/Card';
import { ProgressBar } from '../../components/Progress';
import { StatTile, resolveAchievement } from '../../components/visuals';
import { Icon3D } from '../../components/Icon3D';
import { Colors, Spacing, BorderRadius, Pastel } from '../../constants/theme';

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

  const xp = gamification?.xp ?? 0;
  const streak = gamification?.streakDays ?? 0;
  const avgMastery = progress?.mastery.averageScore ?? 0;
  const masteredCount = progress?.mastery.byLevel?.MASTERED ?? 0;
  const achievementList = achievements?.earned ?? [];

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
        <StatTile icon="star" label="Total XP" value={String(xp)} tint={Pastel.sand} />
        <StatTile icon="fire" label="Day streak" value={String(streak)} tint={Pastel.peach} />
        <StatTile icon="chart" label="Mastery" value={`${Math.round(avgMastery)}%`} tint={Pastel.mint} />
      </View>

      {/* Learning progress */}
      {progress ? (
        <Card style={styles.block}>
          <Text style={styles.blockTitle}>Learning progress</Text>
          <ProgressBar label="Content completed" value={progress.contentProgress.completedContent} max={Math.max(progress.contentProgress.totalContent, 1)} />
          <ProgressBar label="Concepts mastered" value={masteredCount} max={Math.max(progress.mastery.totalConcepts, 1)} color={Colors.success} />
          <ProgressBar label="Average mastery" value={progress.mastery.averageScore} color={Colors.accent} />
        </Card>
      ) : null}

      {/* Achievements */}
      <Text style={styles.sectionTitle}>Achievements</Text>
      {achievementList.length > 0 ? (
        <View style={styles.achGrid}>
          {achievementList.map((ach: { id: string; name: string; icon: string; description: string; unlockedAt?: string | null }) => {
            const unlocked = ach.unlockedAt != null;
            const badge = resolveAchievement(ach.icon);
            return (
              <View key={ach.id} style={[styles.achCard, !unlocked && { opacity: 0.5 }]}>
                <View style={[styles.achIconWrap, { backgroundColor: badge.bg }]}>
                  <Icon3D name={badge.icon} size={36} />
                </View>
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

      <TouchableOpacity style={styles.menuRow} onPress={() => router.push('/profile-edit')}>
        <Ionicons name="person-outline" size={20} color={Colors.primary} />
        <Text style={styles.menuLabel}>Edit Profile</Text>
        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuRow} onPress={handleLogout} accessibilityLabel="Log out" accessibilityRole="button">
        <Ionicons name="log-out" size={20} color={Colors.error} />
        <Text style={[styles.menuLabel, { color: Colors.error }]}>Log out</Text>
        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
      </TouchableOpacity>

      <Text style={styles.footer}>Sanro AI v{Constants.expoConfig?.version ?? '1.1.0'}</Text>
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
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginHorizontal: Spacing.lg, marginTop: Spacing.lg },
  statCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, paddingVertical: Spacing.md, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 18, fontWeight: '700', color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },
  block: { marginHorizontal: Spacing.lg, marginTop: Spacing.xl },
  blockTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  mutedText: { fontSize: 13, color: Colors.textSecondary },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.text, marginTop: Spacing.xl, marginHorizontal: Spacing.lg, marginBottom: Spacing.md },
  achGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.md },
  achIconWrap: { width: 60, height: 60, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  achCard: { width: '45%', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', margin: Spacing.xs },
  achName: { fontSize: 13, fontWeight: '600', color: Colors.text, marginTop: Spacing.sm, textAlign: 'center' },
  achDesc: { fontSize: 11, color: Colors.textSecondary, marginTop: 2, textAlign: 'center' },
  achLocked: { fontSize: 10, color: Colors.textMuted, marginTop: 4 },
  menuRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, marginHorizontal: Spacing.lg, marginTop: Spacing.md, padding: Spacing.lg, borderRadius: BorderRadius.lg, gap: Spacing.md },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: Colors.text },
  footer: { textAlign: 'center', color: Colors.textMuted, fontSize: 12, marginTop: Spacing.xxl },
});