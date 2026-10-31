import { ScrollView, View, Text, StyleSheet, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useAuthStore } from '../../lib/auth-store';
import { useGamificationProfile, useAchievements, useLearningProgress, useUserDisplayRole, useSubscription } from '../../lib/hooks';
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
  const isStudent = user?.role === 'STUDENT';
  const { data: gamification, refetch } = useGamificationProfile({ enabled: isStudent });
  const { data: achievements } = useAchievements({ enabled: isStudent });
  const { data: progress, refetch: refetchProgress } = useLearningProgress({ enabled: isStudent });
  const { data: subscription } = useSubscription();
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

      {/* Subscription - the plan that governs this account (own plan, else the school's) */}
      {subscription ? (
        <Card style={styles.subscriptionCard}>
          <View style={styles.subscriptionHead}>
            <View style={styles.subscriptionTitleWrap}>
              <Ionicons name="card-outline" size={18} color={Colors.primary} />
              <Text style={styles.subscriptionTitle}>Subscription</Text>
            </View>
            <View
              style={[
                styles.subscriptionBadge,
                { backgroundColor: subscription.access ? '#dcfce7' : '#fee2e2' },
              ]}
            >
              <Text
                style={[
                  styles.subscriptionBadgeText,
                  { color: subscription.access ? '#047857' : '#b91c1c' },
                ]}
              >
                {subscription.status ?? 'NO PLAN'}
              </Text>
            </View>
          </View>
          {subscription.plan ? (
            <>
              <Text style={styles.subscriptionPlan}>{subscription.plan.name}</Text>
              <Text style={styles.subscriptionMeta}>
                {subscription.scope === 'INSTITUTION'
                  ? `Provided by ${subscription.institution?.name ?? 'your school'}`
                  : 'Personal plan'}
                {subscription.endsAt
                  ? ` · valid till ${new Date(subscription.endsAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}`
                  : ' · no expiry'}
              </Text>
              <View style={styles.subscriptionRow}>
                <Text style={styles.subscriptionStat}>
                  {subscription.daysRemaining !== null ? `${subscription.daysRemaining} days left` : 'No expiry'}
                </Text>
                <Text style={styles.subscriptionStat}>
                  {subscription.seatLimit ?? 'Unlimited'} seats
                </Text>
                <Text style={styles.subscriptionStat}>
                  {subscription.plan.priceYearly
                    ? `₹${subscription.plan.priceYearly.toLocaleString('en-IN')}/yr`
                    : subscription.plan.priceMonthly
                      ? `₹${subscription.plan.priceMonthly.toLocaleString('en-IN')}/mo`
                      : 'Free'}
                </Text>
              </View>
              {!subscription.access && subscription.message ? (
                <Text style={styles.subscriptionWarning}>{subscription.message}</Text>
              ) : null}
            </>
          ) : (
            <Text style={styles.subscriptionMeta}>
              No plan is attached to this account yet. Ask your school administrator to activate one.
            </Text>
          )}
        </Card>
      ) : null}

      {/* Progress summary - gamification and learning progress are student-only,
          exactly as on the web profile page */}
      {isStudent ? (
        <>
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
        </>
      ) : null}

      {/* Leaderboard shortcut */}
      <TouchableOpacity style={styles.menuRow} onPress={() => router.push('/leaderboard')}>
        <Ionicons name="trophy-outline" size={20} color={Colors.textSecondary} />
        <Text style={styles.menuLabel}>Leaderboard</Text>
        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuRow} onPress={() => router.push('/profile-edit')}>
        <Ionicons name="create-outline" size={20} color={Colors.textSecondary} />
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
  subscriptionCard: { margin: Spacing.lg, marginBottom: 0, padding: Spacing.lg },
  subscriptionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  subscriptionTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  subscriptionTitle: { fontSize: 15, fontWeight: '800', color: Colors.text },
  subscriptionBadge: { borderRadius: BorderRadius.full, paddingHorizontal: 10, paddingVertical: 3 },
  subscriptionBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  subscriptionPlan: { fontSize: 18, fontWeight: '800', color: Colors.text, marginTop: Spacing.sm },
  subscriptionMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  subscriptionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: Spacing.sm },
  subscriptionStat: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  subscriptionWarning: { marginTop: Spacing.sm, fontSize: 12, fontWeight: '600', color: '#b91c1c' },
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