import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
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
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => router.push({ pathname: '/chapter/[chapterId]', params: { chapterId: ch.id } })}
                >
                  <View style={styles.thumbWrap}>
                    {ch.thumbnailUrl ? (
                      <Image source={{ uri: ch.thumbnailUrl }} style={styles.thumb} resizeMode="cover" />
                    ) : (
                      <View style={[styles.thumb, styles.thumbFallback]}>
                        <Ionicons name="book" size={26} color={Colors.textMuted} />
                      </View>
                    )}
                    <View style={styles.thumbBadge}>
                      <Text style={styles.thumbBadgeText}>Chapter {ch.order}</Text>
                    </View>
                    {ch.percentComplete > 0 ? (
                      <View style={styles.thumbPct}>
                        <Text style={styles.thumbPctText}>{ch.percentComplete}%</Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.chapterBodyWrap}>
                    <View style={styles.chapterRow}>
                      <View style={styles.chapterBody}>
                        <Text style={styles.chapterName} numberOfLines={2}>
                          {ch.name}
                        </Text>
                        <Text style={styles.chapterMeta} numberOfLines={1}>
                          {ch.code} • {ch.conceptCount} concepts • {ch.completedContent}/{ch.totalContent} done
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
  chapterCard: { marginBottom: Spacing.md, padding: 0, overflow: 'hidden' },
  thumbWrap: { width: '100%', aspectRatio: 16 / 9, backgroundColor: Colors.surfaceSecondary, position: 'relative' },
  thumb: { width: '100%', height: '100%' },
  thumbFallback: { alignItems: 'center', justifyContent: 'center' },
  thumbBadge: {
    position: 'absolute',
    left: 10,
    top: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  thumbBadgeText: { fontSize: 10, fontWeight: '800', color: Colors.primary },
  thumbPct: {
    position: 'absolute',
    right: 10,
    top: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  thumbPctText: { fontSize: 10, fontWeight: '700', color: Colors.white },
  chapterBodyWrap: { padding: Spacing.lg },
  chapterRow: { flexDirection: 'row', alignItems: 'center' },
  chapterBody: { flex: 1 },
  chapterName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  chapterMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  mastery: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  progressTrack: { height: 6, backgroundColor: Colors.surfaceSecondary, borderRadius: 3, marginTop: Spacing.md, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: Colors.primary, borderRadius: 3 },
});