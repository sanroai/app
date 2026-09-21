import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLeaderboard, useGamificationProfile } from '../lib/hooks';
import { Colors, Spacing, BorderRadius } from '../constants/theme';

const PERIODS = ['weekly', 'monthly', 'allTime'] as const;

export default function LeaderboardScreen() {
  const router = useRouter();
  const { data: myProfile } = useGamificationProfile();
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'allTime'>('weekly');
  const { data } = useLeaderboard(period);

  const myUserId = myProfile?.profile?.userId;

  const entries = (data?.entries ?? data?.leaderboard ?? data?.rows ?? []).map((e: any, i: number) => ({
    rank: e.rank ?? i + 1,
    name: e.name ?? e.studentName ?? 'Student',
    xp: e.totalXp ?? e.xp ?? 0,
    userId: e.userId ?? e.studentId,
    me: myUserId != null && (e.userId === myUserId || e.studentId === myUserId),
  }));

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

      <FlatList
        data={entries}
        keyExtractor={(item) => String(item.userId)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        }
        renderItem={({ item }) => {
          const top = item.rank <= 3;
          const medalColor = item.rank === 1 ? '#f59e0b' : item.rank === 2 ? '#94a3b8' : item.rank === 3 ? '#d97706' : Colors.surfaceSecondary;
          return (
            <View style={[styles.row, item.me && styles.rowMe]}>
              <View style={[styles.rankCircle, { backgroundColor: top ? medalColor : Colors.surfaceSecondary }]}>
                {top ? (
                  <Ionicons name="trophy" size={14} color={Colors.white} />
                ) : (
                  <Text style={[styles.rankText, item.me && { color: Colors.white }]}>{item.rank}</Text>
                )}
              </View>
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
  list: { padding: Spacing.lg },
  center: { padding: Spacing.xxxl, alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm },
  rowMe: { borderWidth: 2, borderColor: Colors.primary },
  rankCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },
  rowBody: { flex: 1, marginLeft: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  mebadge: { fontSize: 10, fontWeight: '700', color: Colors.primary, backgroundColor: Colors.primary + '15', paddingHorizontal: 6, paddingVertical: 2, borderRadius: BorderRadius.full, overflow: 'hidden' },
  rowXp: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  backBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: Spacing.md },
  backText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
});