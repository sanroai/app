import { ScrollView, View, Text, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMyDiagnosis, useLearningHome, useGamificationProfile } from '../../lib/hooks';
import { useStartPractice } from '../../lib/hooks';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';
import { EmptyState } from '../../components/EmptyState';

export default function PracticeScreen() {
  const router = useRouter();
  const { data: diagnosis, refetch, isFetching } = useMyDiagnosis();
  const { data: home } = useLearningHome();
  const { data: gamification } = useGamificationProfile();
  const startPractice = useStartPractice();
  const [refreshing, setRefreshing] = useState(false);
  const [practicing, setPracticing] = useState<string | null>(null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const weak = diagnosis?.weakConcepts ?? [];
  const profile = gamification?.profile;

  const handlePractice = async (conceptId: string) => {
    setPracticing(conceptId);
    try {
      const res = await startPractice.mutateAsync({ conceptId, questionCount: 5 });
      const practiceData = res as { practiceId: string };
      router.push({ pathname: '/practice/[practiceId]', params: { practiceId: practiceData.practiceId } });
    } catch {
      setPracticing(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Practice</Text>
        <Text style={styles.headerSub}>Sharpen what's weak. Master what's strong.</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Streak summary */}
        {profile ? (
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Ionicons name="flame" size={18} color="#f97316" />
              <Text style={styles.summaryValue}>{profile.currentStreak ?? 0}</Text>
              <Text style={styles.summaryLabel}>Day streak</Text>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="star" size={18} color={Colors.accent} />
              <Text style={styles.summaryValue}>{profile.totalXp ?? 0}</Text>
              <Text style={styles.summaryLabel}>Total XP</Text>
            </View>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Weak Concepts — Fix Them</Text>
        {weak.length === 0 ? (
          isFetching ? (
            <EmptyState icon="flash" title="Loading…" />
          ) : (
            <EmptyState icon="checkmark-circle" title="No weak concepts" subtitle="Great job! Your concepts look strong. Keep practising to stay sharp." />
          )
        ) : (
          weak.slice(0, 8).map((wc) => {
            const levelColor =
              wc.masteryLevel === 'NEEDS_INTERVENTION' ? Colors.error :
              wc.masteryLevel === 'WEAK' ? '#f97316' : Colors.accent;
            return (
              <View key={wc.conceptId} style={styles.weakCard}>
                <View style={styles.weakTop}>
                  <View style={[styles.levelDot, { backgroundColor: levelColor }]} />
                  <View style={styles.weakBody}>
                    <Text style={styles.weakTitle}>{wc.conceptName}</Text>
                    <Text style={styles.weakMeta}>{wc.chapterName}</Text>
                  </View>
                  <Text style={[styles.weakScore, { color: levelColor }]}>{Math.round(wc.masteryScore)}%</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { backgroundColor: levelColor, width: `${Math.min(wc.masteryScore, 100)}%` }]} />
                </View>
                <TouchableOpacity
                  style={[styles.skillBtn, practicing === wc.conceptId && styles.skillBtnDisabled]}
                  disabled={practicing === wc.conceptId}
                  onPress={() => handlePractice(wc.conceptId)}
                >
                  <Ionicons name="flash" size={16} color={Colors.white} />
                  <Text style={styles.skillBtnText}>
                    {practicing === wc.conceptId ? 'Starting…' : 'Practice 5 questions'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}

        {/* Browse all for practice */}
        {home && home.boards.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Practice by Subject</Text>
            {home.boards.flatMap((b) =>
              b.grades.map((g) =>
                g.subjects.map((s) => {
                  const subjectId = s.id;
                  const grade = g.grade;
                  const boardId = b.id;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={styles.subjRow}
                      onPress={() => router.push({ pathname: '/learn/[boardId]/[grade]/[subjectId]', params: { boardId, grade, subjectId } })}
                    >
                      <Ionicons name={s.code === 'MATH' ? 'calculator' : 'flask'} size={18} color={Colors.primary} />
                      <Text style={styles.subjName}>{s.name}</Text>
                      <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                    </TouchableOpacity>
                  );
                }),
              ),
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing.lg, borderBottomLeftRadius: BorderRadius.xxl, borderBottomRightRadius: BorderRadius.xxl },
  headerTitle: { color: Colors.white, fontSize: 26, fontWeight: '700' },
  headerSub: { color: Colors.primaryLight, fontSize: 13, marginTop: 2 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  summaryRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  summaryItem: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  summaryValue: { fontSize: 18, fontWeight: '700', color: Colors.text },
  summaryLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.text, marginTop: Spacing.lg, marginBottom: Spacing.md },
  weakCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md },
  weakTop: { flexDirection: 'row', alignItems: 'center' },
  levelDot: { width: 8, height: 8, borderRadius: 4, marginRight: Spacing.sm },
  weakBody: { flex: 1 },
  weakTitle: { fontSize: 15, fontWeight: '600', color: Colors.text },
  weakMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  weakScore: { fontSize: 15, fontWeight: '700' },
  progressTrack: { height: 6, backgroundColor: Colors.surfaceSecondary, borderRadius: 3, marginTop: Spacing.md, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  skillBtn: { flexDirection: 'row', backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: Spacing.md },
  skillBtnDisabled: { opacity: 0.6 },
  skillBtnText: { color: Colors.white, fontSize: 14, fontWeight: '600' },
  subjRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm, gap: Spacing.md },
  subjName: { flex: 1, fontSize: 14, fontWeight: '500', color: Colors.text },
});