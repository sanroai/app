import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useChapterHub, useStartPractice } from '../../lib/hooks';
import { absoluteApiUrl } from '../../lib/api';
import {
  conceptStatusLabel,
  isMasteredConcept,
  masteryLabel,
  masteryTone,
  pickContinueConcept,
  progressPercent,
  type ChapterConcept,
} from '../../lib/chapter-hub';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { Icon3D } from '../../components/Icon3D';
import { Markdown } from '../../components/Markdown';
import { ChapterPdfViewer } from '../../components/ChapterPdfViewer';
import { YouTubePlayer } from '../../components/YouTubePlayer';
import { Colors, Spacing, BorderRadius, Pastel } from '../../constants/theme';

export default function ChapterHubScreen() {
  const { chapterId = '' } = useLocalSearchParams<{ chapterId: string }>();
  const router = useRouter();
  const { data: chapter, isLoading, error, refetch } = useChapterHub(chapterId);
  const startPractice = useStartPractice();
  const [pdfOpen, setPdfOpen] = useState(false);

  const concepts = useMemo<ChapterConcept[]>(() => chapter?.concepts ?? [], [chapter]);
  const videos = useMemo(() => chapter?.videos ?? [], [chapter]);
  const continueConcept = useMemo(() => pickContinueConcept(concepts), [concepts]);
  const percent = progressPercent(chapter?.progress?.percent);
  const practice = chapter?.practice;
  const pdfUrl = chapter?.pdfUrl ?? null;

  const openConcept = (conceptId: string) =>
    router.push({ pathname: '/concept/[conceptId]', params: { conceptId } });

  const startChapterPractice = () => {
    if (!practice?.available) {
      Alert.alert('Practice', 'There are no practice questions for this chapter yet.');
      return;
    }
    startPractice.mutate(
      { chapterId },
      {
        onSuccess: (data) => {
          if (!data?.practiceId) {
            Alert.alert('Practice', 'Could not start the practice set. Try again in a moment.');
            return;
          }
          router.push({ pathname: '/practice/[practiceId]', params: { practiceId: data.practiceId } });
        },
        onError: (err: unknown) => {
          const e = err as { message?: string };
          Alert.alert('Practice', e.message ?? 'Could not start the practice set.');
        },
      },
    );
  };

  const askAboutChapter = () => {
    const first = concepts[0];
    if (!first) {
      Alert.alert('Ask Sanro AI', 'This chapter has no concepts yet, so there is nothing to ask about.');
      return;
    }
    router.push({ pathname: '/ask/[conceptId]', params: { conceptId: first.id, chapterId } });
  };

  const openPdf = () => {
    // The PDF endpoint is behind the JWT guard, so it is opened in the in-app
    // viewer (which sends the bearer token) - the browser fallback lives in
    // the viewer header.
    if (!pdfUrl) return;
    setPdfOpen(true);
  };

  if (isLoading && !chapter) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading the chapter…</Text>
      </View>
    );
  }

  if (error || !chapter) {
    return (
      <View style={styles.center}>
        <EmptyState
          icon="cloud-offline"
          title="Could not load this chapter"
          subtitle="Check your connection and try again."
        />
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()} accessibilityRole="button" accessibilityLabel="Retry loading the chapter">
          <Text style={styles.retryText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerEyebrow}>
          {[chapter.subject, chapter.grade ? `Class ${chapter.grade}` : null].filter(Boolean).join(' • ')}
        </Text>
        <Text style={styles.headerTitle}>{chapter.name}</Text>
        {chapter.code ? (
          <View style={styles.codeChip}>
            <Text style={styles.codeText}>{chapter.code}</Text>
          </View>
        ) : null}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Progress */}
        <Card style={styles.progressCard}>
          <View style={styles.progressTop}>
            <Text style={styles.progressLabel}>Chapter progress</Text>
            <Text style={styles.progressPct}>{percent}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${percent}%` }]} />
          </View>
          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{chapter.progress?.concepts ?? concepts.length}</Text>
              <Text style={styles.statLabel}>Concepts</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: Colors.success }]}>
                {chapter.progress?.mastered ?? concepts.filter((c) => isMasteredConcept(c)).length}
              </Text>
              <Text style={styles.statLabel}>Mastered</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{chapter.progress?.videos ?? videos.length}</Text>
              <Text style={styles.statLabel}>Videos</Text>
            </View>
          </View>
        </Card>

        {/* Continue where you left off */}
        {continueConcept ? (
          <Card style={styles.focusCard}>
            <View style={styles.focusHeader}>
              <View style={[styles.focusIcon, { backgroundColor: Pastel.violet }]}>
                <Icon3D name="rocket" size={30} />
              </View>
              <View style={styles.focusInfo}>
                <Text style={styles.focusTitle}>Continue where you left off</Text>
                <Text style={styles.focusSub} numberOfLines={2}>
                  {continueConcept.name}
                </Text>
              </View>
            </View>
            {continueConcept.mastery ? (
              <Text style={styles.focusMeta}>
                Mastery {Math.round(continueConcept.mastery.score)}% · {masteryLabel(continueConcept.mastery.level)}
              </Text>
            ) : (
              <Text style={styles.focusMeta}>Not started yet</Text>
            )}
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => openConcept(continueConcept.id)}
              accessibilityRole="button"
              accessibilityLabel={`Continue with ${continueConcept.name}`}
            >
              <Ionicons name="play" size={18} color={Colors.white} />
              <Text style={styles.primaryBtnText}>Continue learning</Text>
            </TouchableOpacity>
          </Card>
        ) : concepts.length > 0 ? (
          <Card style={styles.doneCard}>
            <View style={styles.focusHeader}>
              <View style={[styles.focusIcon, { backgroundColor: Pastel.mint }]}>
                <Icon3D name="trophy" size={30} />
              </View>
              <View style={styles.focusInfo}>
                <Text style={styles.focusTitle}>Chapter complete</Text>
                <Text style={styles.focusSub}>Every concept in this chapter is mastered. Nice work.</Text>
              </View>
            </View>
          </Card>
        ) : null}

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <Card style={styles.actionCard}>
            <TouchableOpacity
              style={[styles.actionRow, !practice?.available && styles.actionRowDisabled]}
              onPress={startChapterPractice}
              disabled={!practice?.available || startPractice.isPending}
              accessibilityRole="button"
              accessibilityLabel="Practice the whole chapter"
              accessibilityState={{ disabled: !practice?.available }}
            >
              <View style={[styles.actionIcon, { backgroundColor: Pastel.lemon }]}>
                <Ionicons name="clipboard" size={18} color={Colors.accent} />
              </View>
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>Practice the whole chapter</Text>
                <Text style={styles.actionSub}>
                  {practice?.available
                    ? `${practice.questionCount} question${practice.questionCount === 1 ? '' : 's'} across every concept`
                    : 'No questions available for this chapter yet'}
                </Text>
              </View>
              {startPractice.isPending ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionRow}
              onPress={askAboutChapter}
              disabled={concepts.length === 0}
              accessibilityRole="button"
              accessibilityLabel="Ask Sanro AI about this chapter"
              accessibilityState={{ disabled: concepts.length === 0 }}
            >
              <View style={[styles.actionIcon, { backgroundColor: Pastel.lavender }]}>
                <Ionicons name="chatbubbles" size={18} color={Colors.primary} />
              </View>
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>Ask SANRO AI about this chapter</Text>
                <Text style={styles.actionSub}>
                  {concepts.length > 0 ? 'Explanations, doubts and worked examples' : 'Available once the chapter has concepts'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionRow, !pdfUrl && styles.actionRowDisabled]}
              onPress={openPdf}
              disabled={!pdfUrl}
              accessibilityRole="button"
              accessibilityLabel="View the chapter PDF"
              accessibilityState={{ disabled: !pdfUrl }}
            >
              <View style={[styles.actionIcon, { backgroundColor: Pastel.sky }]}>
                <Ionicons name="document-text" size={18} color={Colors.info} />
              </View>
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>View chapter PDF</Text>
                <Text style={styles.actionSub}>
                  {pdfUrl ? 'The textbook chapter, read in the app' : 'No PDF available for this chapter yet'}
                </Text>
              </View>
              <Ionicons name="open-outline" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          </Card>
        </View>

        {/* Overall chapter notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chapter notes</Text>
          <Card style={styles.notesCard}>
            {chapter.summary ? (
              <Markdown>{chapter.summary}</Markdown>
            ) : (
              <Text style={styles.mutedText}>
                The notes for this chapter are being prepared. The video lessons and concept summaries below cover the
                same ground.
              </Text>
            )}
          </Card>
        </View>

        {/* Concepts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Concepts</Text>
          {concepts.length === 0 ? (
            <View style={styles.emptyBlock}>
              <Ionicons name="bulb-outline" size={22} color={Colors.textMuted} />
              <Text style={styles.mutedText}>No concepts have been mapped to this chapter yet.</Text>
            </View>
          ) : (
            concepts.map((concept) => (
              <Card
                key={concept.id}
                style={styles.conceptCard}
                onPress={() => openConcept(concept.id)}
              >
                <View style={styles.conceptRow}>
                  <View
                    style={[
                      styles.conceptDot,
                      { backgroundColor: toneColor(masteryTone(concept.mastery?.level)) },
                    ]}
                  />
                  <View style={styles.conceptBody}>
                    <Text style={styles.conceptName}>{concept.name}</Text>
                    <Text style={styles.conceptMeta}>
                      {conceptStatusLabel(concept.status)}
                      {concept.hasVideo ? ' • video lesson' : ''}
                    </Text>
                  </View>
                  {concept.mastery ? (
                    <View
                      style={[
                        styles.masteryChip,
                        { backgroundColor: toneColor(masteryTone(concept.mastery.level)) + '20' },
                      ]}
                    >
                      <Text
                        style={[styles.masteryChipText, { color: toneColor(masteryTone(concept.mastery.level)) }]}
                      >
                        {Math.round(concept.mastery.score)}%
                      </Text>
                    </View>
                  ) : null}
                  <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                </View>
              </Card>
            ))
          )}
        </View>

        {/* Video lessons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Video lessons</Text>
          {videos.length === 0 ? (
            <View style={styles.emptyBlock}>
              <Ionicons name="film-outline" size={22} color={Colors.textMuted} />
              <Text style={styles.mutedText}>No video lessons for this chapter yet.</Text>
            </View>
          ) : (
            videos.map((video) => (
              <Card key={video.contentId || video.title} style={styles.videoCard}>
                <YouTubePlayer
                  url={video.url}
                  title={video.title}
                  thumbnailUrl={video.thumbnailUrl}
                  durationSeconds={video.durationSeconds}
                  segments={video.segments}
                />
                <Text style={styles.videoTitle}>{video.title}</Text>
                {video.segments && video.segments.length > 0 ? (
                  <Text style={styles.videoMeta}>
                    {video.segments.length} chapter marker{video.segments.length === 1 ? '' : 's'} — tap one to jump
                  </Text>
                ) : null}
              </Card>
            ))
          )}
        </View>
      </ScrollView>

      <ChapterPdfViewer
        visible={pdfOpen}
        url={pdfUrl ? absoluteApiUrl(pdfUrl) : null}
        onClose={() => setPdfOpen(false)}
      />
    </View>
  );
}

function toneColor(tone: string): string {
  switch (tone) {
    case 'mastered':
      return Colors.success;
    case 'weak':
      return Colors.error;
    case 'developing':
      return Colors.accent;
    default:
      return Colors.textMuted;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  loadingText: { color: Colors.textSecondary, fontSize: 13, marginTop: Spacing.md },
  errorText: { color: Colors.error, fontSize: 15, fontWeight: '600', textAlign: 'center', marginTop: Spacing.md },
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomLeftRadius: BorderRadius.xxl,
    borderBottomRightRadius: BorderRadius.xxl,
  },
  headerEyebrow: { color: Colors.primaryLight, fontSize: 12, fontWeight: '600' },
  headerTitle: { color: Colors.white, fontSize: 22, fontWeight: '700', marginTop: 2 },
  codeChip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: Spacing.sm,
  },
  codeText: { color: Colors.white, fontSize: 11, fontWeight: '700' },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  section: { marginTop: Spacing.xl },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },
  progressCard: { padding: Spacing.lg },
  progressTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  progressPct: { fontSize: 16, fontWeight: '800', color: Colors.primary },
  progressTrack: { height: 8, backgroundColor: Colors.surfaceSecondary, borderRadius: 4, marginTop: Spacing.sm, overflow: 'hidden' },
  progressFill: { height: 8, backgroundColor: Colors.primary, borderRadius: 4 },
  statRow: { flexDirection: 'row', marginTop: Spacing.lg },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  focusCard: { marginTop: Spacing.lg, padding: Spacing.lg },
  doneCard: { marginTop: Spacing.lg, padding: Spacing.lg, backgroundColor: Pastel.mint, borderWidth: 1, borderColor: Colors.success + '40' },
  focusHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  focusIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  focusInfo: { flex: 1 },
  focusTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  focusSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  focusMeta: { fontSize: 12, fontWeight: '600', color: Colors.primary, marginTop: Spacing.md },
  primaryBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.lg,
  },
  primaryBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  actionCard: { paddingVertical: Spacing.sm },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  actionRowDisabled: { opacity: 0.5 },
  actionIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionInfo: { flex: 1 },
  actionTitle: { fontSize: 14, fontWeight: '600', color: Colors.text },
  actionSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  notesCard: { padding: Spacing.lg },
  mutedText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  emptyBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  conceptCard: { marginBottom: Spacing.sm, paddingVertical: Spacing.md },
  conceptRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  conceptDot: { width: 10, height: 10, borderRadius: 5 },
  conceptBody: { flex: 1 },
  conceptName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  conceptMeta: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  masteryChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full },
  masteryChipText: { fontSize: 11, fontWeight: '700' },
  videoCard: { marginBottom: Spacing.md, padding: Spacing.md },
  videoTitle: { fontSize: 14, fontWeight: '600', color: Colors.text, marginTop: Spacing.sm },
  videoMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  retryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    marginTop: Spacing.lg,
  },
  retryText: { color: Colors.white, fontSize: 14, fontWeight: '600' },
});
