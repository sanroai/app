import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLeaderboard } from '../lib/hooks';
import { useAuthStore } from '../lib/auth-store';
import { buildPodium, PODIUM_COLOR, PODIUM_HEIGHT } from '../components/leaderboard-podium';
import { buildScopeChips, scopeChipToGroupId } from '../components/leaderboard-scope';
import { Icon3D } from '../components/Icon3D';
import { EmptyState } from '../components/EmptyState';
import { Colors, Spacing, BorderRadius } from '../constants/theme';

const PERIODS = ['weekly', 'monthly', 'allTime'] as const;

const PODIUM_ICON: Record<number, string> = { 1: 'medal-1st', 2: 'medal', 3: 'star' };

export default function LeaderboardScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'allTime'>('weekly');
  const [groupId, setGroupId] = useState<string | null>(null);
  const { data, isLoading, isFetching, isError, error } = useLeaderboard(period, groupId);

  const myUserId = user?.id;

  const entries = (data?.entries ?? data?.leaderboard ?? data?.rows ?? []).map((e: { rank?: number; name?: string; studentName?: string; totalXp?: number; xp?: number; userId?: string; studentId?: string }, i: number) => ({
    rank: e.rank ?? i + 1,
    name: e.name ?? e.studentName ?? 'Student',
    xp: e.totalXp ?? e.xp ?? 0,
    userId: e.userId ?? e.studentId,
    me: myUserId != null && (e.userId === myUserId || e.studentId === myUserId),
  }));

  const podium = buildPodium(entries);
  const groups = data?.groups ?? [];
  const scopeChips = buildScopeChips(groups, groupId);

  return (
    <View style={styles.container}>
      <View style={styles.pills}>
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.pill, period === p && styles.pillActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.pillText, period === p && styles.pillTextActive]}>
              {p === 'allTime' ? 'All time' : p.charAt(0).toUpperCase() + p.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {scopeChips.length > 1 && (
        <View style={styles.scopeRow}>
          <Text style={styles.scopeLabel}>Scope</Text>
          {scopeChips.map((chip) => (
            <TouchableOpacity
              key={chip.key}
              style={[styles.scopeChip, chip.active && styles.scopeChipActive]}
              onPress={() => setGroupId(scopeChipToGroupId(chip.key))}
            >
              <Text style={[styles.scopeChipText, chip.active && styles.scopeChipTextActive]}>
                {chip.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <FlatList
        data={entries}
        keyExtractor={(item) => String(item.userId)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          podium.length > 0 ? (
            <View style={styles.stage}>
              <View style={styles.stageRow}>
                {podium.map((slot) => {
                  const entry = slot.entry;
                  if (!entry) return <View key={slot.rank} style={styles.podiumSlot} />;
                  return (
                    <View key={slot.rank} style={styles.podiumSlot}>
                      <View style={styles.podiumLabel}>
                        <Icon3D name={PODIUM_ICON[slot.rank]} size={30} />
                        <Text style={styles.podiumName} numberOfLines={1}>
                          {entry.name}
                        </Text>
                        <Text style={styles.podiumXp}>{entry.xp} XP</Text>
                      </View>
                      <View style={styles.podiumBlockWrap}>
                        <View
                          style={[
                            styles.podiumBlock,
                            { height: PODIUM_HEIGHT[slot.rank], backgroundColor: PODIUM_COLOR[slot.rank] },
                          ]}
                        >
                          <Text style={styles.podiumRank}>{slot.rank}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
              <View style={styles.floor} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          isError ? (
            <EmptyState
              icon="alert-circle"
              title="Could not load the leaderboard"
              subtitle={(error as Error)?.message ?? 'Check your connection and try again.'}
            />
          ) : isLoading || isFetching ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            <EmptyState
              icon="trophy"
              title="No learners yet"
              subtitle="Complete lessons and quizzes to appear on the board."
            />
          )
        }
        renderItem={({ item }) => {
          const top = item.rank <= 3;
          return (
            <View style={[styles.row, item.me && styles.rowMe]}>
              {top ? (
                <View style={styles.rankIconWrap}>
                  <Icon3D name="trophy" size={24} />
                </View>
              ) : (
                <View style={[styles.rankCircle, { backgroundColor: Colors.surfaceSecondary }]}>
                  <Text style={[styles.rankText, item.me && { color: Colors.white }]}>{item.rank}</Text>
                </View>
              )}
              <View style={styles.rowBody}>
                <Text style={styles.rowName}>{item.name}</Text>
                {item.me && <Text style={styles.mebadge}>You</Text>}
              </View>
              <Text style={styles.rowXp}>{item.xp.toLocaleString()} XP</Text>
            </View>
          );
        }}
      />
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={16} color={Colors.primary} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  pills: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.lg, paddingBottom: Spacing.sm },
  pill: { flex: 1, paddingVertical: 8, borderRadius: BorderRadius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  pillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pillText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  pillTextActive: { color: Colors.white },
  scopeRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  scopeLabel: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  scopeChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: BorderRadius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  scopeChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  scopeChipText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  scopeChipTextActive: { color: Colors.white },
  list: { padding: Spacing.lg },
  center: { padding: Spacing.xxxl, alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm },
  rowMe: { borderWidth: 2, borderColor: Colors.primary },
  rankCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  rankIconWrap: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },
  rowBody: { flex: 1, marginLeft: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  mebadge: { fontSize: 10, fontWeight: '700', color: Colors.primary, backgroundColor: Colors.primary + '15', paddingHorizontal: 6, paddingVertical: 2, borderRadius: BorderRadius.full, overflow: 'hidden' },
  rowXp: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  backBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: Spacing.md },
  backText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
  stage: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  stageRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: Spacing.sm, transform: [{ perspective: 900 }, { rotateX: '6deg' }] },
  podiumSlot: { alignItems: 'center', width: 92 },
  podiumLabel: { alignItems: 'center', marginBottom: 6, transform: [{ rotateX: '-6deg' }] },
  podiumName: { fontSize: 12, fontWeight: '700', color: Colors.text, marginTop: 4, maxWidth: 88 },
  podiumXp: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },
  podiumBlockWrap: { justifyContent: 'flex-end' },
  podiumBlock: { width: 64, borderTopLeftRadius: 10, borderTopRightRadius: 10, alignItems: 'center', paddingTop: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 10, elevation: 6 },
  podiumRank: { fontSize: 22, fontWeight: '900', color: 'rgba(255,255,255,0.95)' },
  floor: { height: 3, marginTop: 2, marginHorizontal: Spacing.xl, borderRadius: 2, backgroundColor: Colors.primary + '30' },
});
