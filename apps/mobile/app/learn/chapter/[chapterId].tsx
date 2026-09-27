import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useChapterDetail } from '../../../lib/hooks';
import { Colors, Spacing, BorderRadius } from '../../../constants/theme';
import { EmptyState } from '../../../components/EmptyState';
import { Card } from '../../../components/Card';
import { YouTubePlayer } from '../../../components/YouTubePlayer';

export default function ChapterDetailScreen() {
  const { chapterId = '' } = useLocalSearchParams<{ chapterId: string }>();
  const router = useRouter();
  const { data, isLoading } = useChapterDetail(chapterId);

  const videos = (data?.chapterContent ?? []).filter((item) => item.type === 'VIDEO');
  const topics = data?.topics ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{data?.name ?? 'Chapter'}</Text>
        <Text style={styles.headerSub}>
          Class {data?.grade ?? ''} • {data?.subject?.name ?? ''}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {isLoading && !data ? (
          <EmptyState icon="hourglass" title="Loading…" />
        ) : (
          <>
            {videos.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.topicTitle}>Chapter Videos</Text>
                {videos.map((video) => (
                  <View key={video.id} style={styles.videoBlock}>
                    <YouTubePlayer
                      url={video.url}
                      videoId={video.videoId}
                      title={video.title}
                      thumbnailUrl={video.thumbnailUrl}
                      durationSeconds={video.durationSeconds}
                    />
                    <Text style={styles.videoTitle} numberOfLines={2}>
                      {video.title}
                    </Text>
                    {video.description ? (
                      <Text style={styles.videoDesc} numberOfLines={2}>
                        {video.description}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </View>
            )}

            {topics.length === 0 ? (
              videos.length === 0 ? (
                <EmptyState icon="book" title="No topics yet" subtitle="This chapter is being built." />
              ) : null
            ) : (
              topics.map((topic: { id: string; name: string; concepts: Array<{ id: string; name: string; mastery: { level: string; score: number } | null; contentCount: number }> }) => (
                <View key={topic.id} style={styles.topicGroup}>
                  <Text style={styles.topicTitle}>{topic.name}</Text>
                  {topic.concepts.map((c: { id: string; name: string; mastery: { level: string; score: number } | null; contentCount: number }) => {
                    const lvl = c.mastery?.level;
                    const mastered = lvl === 'MASTERED' || lvl === 'GOOD';
                    const weak = lvl === 'WEAK' || lvl === 'NEEDS_INTERVENTION';
                    return (
                      <Card key={c.id} style={styles.conceptCard} onPress={() => router.push({ pathname: '/concept/[conceptId]', params: { conceptId: c.id } })}>
                        <View style={styles.conceptRow}>
                          <View style={[styles.conceptDot, { backgroundColor: mastered ? Colors.success : weak ? Colors.error : Colors.surfaceSecondary }]} />
                          <Text style={styles.conceptName}>{c.name}</Text>
                          {lvl ? (
                            <View style={[styles.masteryChip, { backgroundColor: mastered ? Colors.success + '20' : weak ? Colors.error + '20' : Colors.surfaceSecondary }]}>
                              <Text style={[styles.masteryChipText, { color: mastered ? Colors.success : weak ? Colors.error : Colors.textSecondary }]}>
                                {formatLevel(lvl)} {c.mastery ? `${Math.round(c.mastery.score)}%` : ''}
                              </Text>
                            </View>
                          ) : (
                            <Text style={styles.notStarted}>Not started</Text>
                          )}
                          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                        </View>
                      </Card>
                    );
                  })}
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function formatLevel(level: string) {
  const map: Record<string, string> = {
    NEEDS_INTERVENTION: 'Intervene',
    WEAK: 'Weak',
    DEVELOPING: 'Developing',
    GOOD: 'Good',
    MASTERED: 'Mastered',
    INSUFFICIENT_EVIDENCE: 'Unassessed',
  };
  return map[level] ?? level;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing.lg, borderBottomLeftRadius: BorderRadius.xxl, borderBottomRightRadius: BorderRadius.xxl },
  headerTitle: { color: Colors.white, fontSize: 24, fontWeight: '700' },
  headerSub: { color: Colors.primaryLight, fontSize: 13, marginTop: 2 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  section: { marginBottom: Spacing.xl },
  videoBlock: { marginBottom: Spacing.lg },
  videoTitle: { fontSize: 14, fontWeight: '600', color: Colors.text, marginTop: Spacing.sm },
  videoDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  topicGroup: { marginBottom: Spacing.xl },
  topicTitle: { fontSize: 16, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.md },
  conceptCard: { marginBottom: Spacing.sm, paddingVertical: Spacing.md },
  conceptRow: { flexDirection: 'row', alignItems: 'center' },
  conceptDot: { width: 10, height: 10, borderRadius: 5, marginRight: Spacing.md },
  conceptName: { flex: 1, fontSize: 14, fontWeight: '500', color: Colors.text },
  masteryChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full, marginRight: Spacing.sm },
  masteryChipText: { fontSize: 10, fontWeight: '700' },
  notStarted: { fontSize: 11, color: Colors.textMuted, marginRight: Spacing.sm },
});