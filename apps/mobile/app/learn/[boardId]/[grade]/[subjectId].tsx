import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useChapters, ChapterItem } from '../../../../lib/hooks';
import { Colors, Spacing, BorderRadius } from '../../../../constants/theme';
import { EmptyState } from '../../../../components/EmptyState';
import { Card } from '../../../../components/Card';

export default function SubjectChaptersScreen() {
  const { boardId = '', grade = '', subjectId = '' } = useLocalSearchParams<{ boardId: string; grade: string; subjectId: string }>();
  const router = useRouter();
  const { data, isLoading } = useChapters(boardId, grade, subjectId);

  const chapters = data?.chapters ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{data?.subject?.name ?? 'Subject'}</Text>
        <Text style={styles.headerSub}>Class {grade} • {chapters.length} chapters</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {isLoading && chapters.length === 0 ? (
          <EmptyState icon="hourglass" title="Loading chapters…" />
        ) : chapters.length === 0 ? (
          <EmptyState icon="book" title="No chapters yet" subtitle="Check back soon — chapters are on the way." />
        ) : (
          chapters.map((ch: ChapterItem) => {
            const mastered = ch.averageMastery >= 75;
            return (
              <Card key={ch.id} style={styles.chapterCard}>
                <TouchableOpacity onPress={() => router.push({ pathname: '/learn/chapter/[chapterId]', params: { chapterId: ch.id } })}>
                  <View style={styles.chapterRow}>
                    <View style={[styles.chapterNum, mastered && { backgroundColor: Colors.success + '20' }]}>
                      <Text style={[styles.chapterNumText, mastered && { color: Colors.success }]}>{ch.order}</Text>
                    </View>
                    <View style={styles.chapterBody}>
                      <Text style={styles.chapterName}>{ch.name}</Text>
                      <Text style={styles.chapterMeta}>
                        {ch.conceptCount} concepts • {ch.completedContent}/{ch.totalContent} done
                      </Text>
                      {ch.averageMastery >= 0 && (
                        <Text style={[styles.mastery, { color: mastered ? Colors.success : Colors.primary }]}>
                          Mastery {Math.round(ch.averageMastery)}%
                        </Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${ch.percentComplete}%` }]} />
                  </View>
                </TouchableOpacity>
              </Card>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing.lg, borderBottomLeftRadius: BorderRadius.xxl, borderBottomRightRadius: BorderRadius.xxl },
  headerTitle: { color: Colors.white, fontSize: 24, fontWeight: '700' },
  headerSub: { color: Colors.primaryLight, fontSize: 13, marginTop: 2 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  chapterCard: { marginBottom: Spacing.md, padding: Spacing.lg },
  chapterRow: { flexDirection: 'row', alignItems: 'center' },
  chapterNum: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
  chapterNumText: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  chapterBody: { flex: 1, marginLeft: Spacing.md },
  chapterName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  chapterMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  mastery: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  progressTrack: { height: 6, backgroundColor: Colors.surfaceSecondary, borderRadius: 3, marginTop: Spacing.md, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: Colors.primary, borderRadius: 3 },
});