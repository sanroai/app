import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useChapterHub, useStartPractice } from '../../lib/hooks';
import { subjectBanner } from '../../lib/subject-art';
import { markdownToPlainText } from '../../lib/markdown-normalize';
import { absoluteApiUrl, apiAuthed } from '../../lib/api';
import {
  conceptStatusLabel,
  formatTimestamp,
  isMasteredConcept,
  masteryLabel,
  masteryTone,
  pickContinueConcept,
  progressPercent,
  type ChapterConcept,
  type ConceptSection,
} from '../../lib/chapter-hub';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { Icon3D } from '../../components/Icon3D';
import { Markdown } from '../../components/Markdown';
import { YouTubePlayer } from '../../components/YouTubePlayer';
import { Colors, Spacing, BorderRadius, Pastel } from '../../constants/theme';

export default function ChapterHubScreen() {
  const { chapterId = '' } = useLocalSearchParams<{ chapterId: string }>();
  const router = useRouter();
  const { data: chapter, isLoading, error, refetch } = useChapterHub(chapterId);
  const startPractice = useStartPractice();
  const [pdfBusy, setPdfBusy] = useState(false);
  const [notesOpen, setNotesOpen] = useState(true);
  const [notesCopied, setNotesCopied] = useState(false);

  const concepts = useMemo<ChapterConcept[]>(() => chapter?.concepts ?? [], [chapter]);
  const videos = useMemo(() => chapter?.videos ?? [], [chapter]);
  const continueConcept = useMemo(() => pickContinueConcept(concepts), [concepts]);
  const percent = progressPercent(chapter?.progress?.percent);
  const practice = chapter?.practice;
  const pdfUrl = chapter?.pdfUrl ?? null;
  const externalPdfUrl = chapter?.externalPdfUrl ?? null;
  const textbookAvailable = Boolean(pdfUrl || externalPdfUrl);

  const openConcept = (conceptId: string, section?: ConceptSection | null) =>
    router.push({
      pathname: '/concept/[conceptId]',
      params: {
        conceptId,
        ...(section
          ? { t: String(section.startSeconds), video: section.contentId }
          : {}),
      },
    });

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

  const openPdf = async () => {
    // The textbook is read as page images in the app: Android's WebView cannot
    // render a PDF, and a plain link only downloads it. Chapters without rendered
    // pages fall back to the signed PDF link opened by the platform viewer.
    // A deployment that ships no book files at all sends `externalPdfUrl` instead
    // (the official NCERT PDF), which opens in the browser.
    if (!textbookAvailable || pdfBusy) return;
    setPdfBusy(true);
    try {
      if (!pdfUrl && externalPdfUrl) {
        await Linking.openURL(externalPdfUrl);
        return;
      }
      const pages = await apiAuthed<{ count: number }>(`/learning/chapters/${chapterId}/pages`);
      if (pages.count > 0) {
        router.push({ pathname: '/textbook/[chapterId]', params: { chapterId } });
        return;
      }
      const link = await apiAuthed<{ path: string; expiresAt: string }>(
        `/learning/chapters/${chapterId}/pdf-link`,
        { method: 'POST', queueOffline: false },
      );
      await Linking.openURL(absoluteApiUrl(link.path));
    } catch (err) {
      const e = err as { message?: string };
      Alert.alert('Textbook', e.message ?? 'Could not open the chapter textbook. Try again in a moment.');
    } finally {
      setPdfBusy(false);
    }
  };

  /**
   * Copy the chapter notes as plain text (Markdown stripped), the same text the
   * web "Copy notes" button puts on the clipboard.
   */
  const copyNotes = async () => {
    if (!chapter?.summary) return;
    try {
      await Clipboard.setStringAsync(markdownToPlainText(chapter.summary));
      setNotesCopied(true);
      setTimeout(() => setNotesCopied(false), 2000);
    } catch {
      Alert.alert('Notes', 'Could not copy the notes on this device.');
    }
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
        <Image source={subjectBanner(chapter.subject, chapter.code, chapter.grade)} style={styles.headerBanner} />
        <View style={styles.headerOverlay} />
        <Text style={styles.headerEyebrow}>
          {[
            chapter.subject,
            chapter.grade ? `Class ${chapter.grade}` : null,
            Number.isFinite(chapter.order) ? `Chapter ${chapter.order}` : null,
          ]
            .filter(Boolean)
            .join(' • ')}
        </Text>
        <Text style={styles.headerTitle}>{chapter.name}</Text>
        <View style={styles.headerChipRow}>
          {Number.isFinite(chapter.order) ? (
            <View style={styles.chapterChip}>
              <Text style={styles.chapterChipText}>Chapter {chapter.order}</Text>
            </View>
          ) : null}
          {chapter.code ? (
            <View style={styles.codeChip}>
              <Text style={styles.codeText}>{chapter.code}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Continue where you left off + chapter progress, one card */}
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
            <View style={styles.progressTop}>
              <Text style={styles.progressLabel}>
                {chapter.progress?.mastered ?? 0} of {chapter.progress?.concepts ?? concepts.length} concepts mastered
              </Text>
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
            {continueConcept.mastery ? (
              <Text style={styles.focusMeta}>
                Mastery {Math.round(continueConcept.mastery.score)}% · {masteryLabel(continueConcept.mastery.level)}
              </Text>
            ) : (
              <Text style={styles.focusMeta}>Not started yet</Text>
            )}
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => openConcept(continueConcept.id, continueConcept.section)}
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
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: '100%' }]} />
            </View>
          </Card>
        ) : null}

        {/* Contents - the chapter's map, in curriculum order */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={[styles.sectionTitle, styles.sectionTitleInline]}>Contents</Text>
            <Text style={styles.sectionCount}>
              {concepts.length} concept{concepts.length === 1 ? '' : 's'}
            </Text>
          </View>
          {concepts.length === 0 ? (
            <View style={styles.emptyBlock}>
              <Ionicons name="bulb-outline" size={22} color={Colors.textMuted} />
              <Text style={styles.mutedText}>No concepts have been mapped to this chapter yet.</Text>
            </View>
          ) : (
            concepts.map((concept, index) => {
              const serial = Number.isFinite(concept.order) ? (concept.order as number) : index + 1;
              const section = concept.section ?? null;
              return (
                <Card
                  key={concept.id}
                  style={styles.conceptCard}
                  onPress={() => openConcept(concept.id, section)}
                >
                  <View style={styles.conceptRow}>
                    <View style={styles.serialBadge}>
                      <Text style={styles.serialText}>{String(serial).padStart(2, '0')}</Text>
                    </View>
                    <View style={styles.conceptBody}>
                      <Text style={styles.conceptName} numberOfLines={2}>
                        {concept.name}
                      </Text>
                      <View style={styles.conceptMetaRow}>
                        <View style={styles.conceptMetaLeft}>
                          <Text style={styles.conceptMeta} numberOfLines={1}>
                            {`${
                              section
                                ? `${formatTimestamp(section.durationSeconds)} video`
                                : concept.hasVideo
                                  ? 'Video lesson'
                                  : 'No video'
                            }${concept.mastery ? '' : ` · ${conceptStatusLabel(concept.status)}`}`}
                          </Text>
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
                        </View>
                        {section ? (
                          <Text style={styles.conceptRange}>
                            {formatTimestamp(section.startSeconds)} – {formatTimestamp(section.endSeconds)}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                  </View>
                </Card>
              );
            })
          )}
        </View>

        {/* Learn - the lesson itself and the textbook */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Learn</Text>
          {videos.length > 0 ? (
            videos.map((video) => (
              <Card key={video.contentId || video.title} style={styles.videoCard}>
                <Text style={styles.videoTitle}>{video.title}</Text>
                <YouTubePlayer
                  url={video.url}
                  title={video.title}
                  thumbnailUrl={video.thumbnailUrl}
                  durationSeconds={video.durationSeconds}
                  segments={video.segments}
                  collapseMarkers
                />
                {video.segments && video.segments.length > 0 ? (
                  <Text style={styles.videoMeta}>
                    Tap a section to jump to that part
                  </Text>
                ) : null}
              </Card>
            ))
          ) : (
            <View style={styles.emptyBlock}>
              <Ionicons name="film-outline" size={22} color={Colors.textMuted} />
              <Text style={styles.mutedText}>No video lessons for this chapter yet.</Text>
            </View>
          )}

          <Card style={styles.actionCard}>
            <TouchableOpacity
              style={[styles.actionRow, !textbookAvailable && styles.actionRowDisabled]}
              onPress={openPdf}
              disabled={!textbookAvailable || pdfBusy}
              accessibilityRole="button"
              accessibilityLabel="Open the chapter textbook"
              accessibilityState={{ disabled: !textbookAvailable || pdfBusy }}
            >
              <View style={[styles.actionIcon, { backgroundColor: Pastel.sky }]}>
                <Ionicons name="book" size={18} color={Colors.info} />
              </View>
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>Read the textbook</Text>
                <Text style={styles.actionSub}>
                  {pdfBusy
                    ? 'Opening the textbook…'
                    : pdfUrl
                      ? 'The NCERT chapter, page by page in the app'
                      : externalPdfUrl
                        ? 'The same chapter on the official NCERT site'
                        : 'No textbook available for this chapter yet'}
                </Text>
              </View>
              <Ionicons name="open-outline" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          </Card>
        </View>

        {/* Practise - one session over the whole chapter */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Practise</Text>
          <Card style={styles.actionCard}>
            <TouchableOpacity
              style={[styles.actionRow, !practice?.available && styles.actionRowDisabled]}
              onPress={startChapterPractice}
              disabled={!practice?.available || startPractice.isPending}
              accessibilityRole="button"
              accessibilityLabel="Practise the whole chapter"
              accessibilityState={{ disabled: !practice?.available }}
            >
              <View style={[styles.actionIcon, { backgroundColor: Pastel.lemon }]}>
                <Ionicons name="clipboard" size={18} color={Colors.accent} />
              </View>
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>Practise the whole chapter</Text>
                <Text style={styles.actionSub}>
                  {practice?.available
                    ? `${practice.questionCount} question${practice.questionCount === 1 ? '' : 's'} across every concept · 5 XP each`
                    : 'No questions available for this chapter yet'}
                </Text>
              </View>
              {startPractice.isPending ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
              )}
            </TouchableOpacity>
          </Card>
        </View>

        {/* Ask - the tutor, scoped to this chapter */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ask</Text>
          <Card style={styles.actionCard}>
            <TouchableOpacity
              style={[styles.actionRow, concepts.length === 0 && styles.actionRowDisabled]}
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
                <Text style={styles.actionTitle}>Ask Sanro AI about this chapter</Text>
                <Text style={styles.actionSub}>
                  {concepts.length > 0
                    ? 'Explanations, doubts and worked examples'
                    : 'Available once the chapter has concepts'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          </Card>
        </View>

        {/* Chapter notes - the reference sheet, open by default and copyable */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <TouchableOpacity
              style={styles.notesToggleHit}
              onPress={() => setNotesOpen((open) => !open)}
              accessibilityRole="button"
              accessibilityLabel={notesOpen ? 'Hide chapter notes' : 'Show chapter notes'}
              accessibilityState={{ expanded: notesOpen }}
            >
              <Text style={[styles.sectionTitle, styles.sectionTitleInline]}>Chapter notes</Text>
              <View style={styles.notesToggle}>
                <Text style={styles.notesToggleText}>{notesOpen ? 'Hide' : 'Show'}</Text>
                <Ionicons name={notesOpen ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.primary} />
              </View>
            </TouchableOpacity>
            {chapter.summary ? (
              <TouchableOpacity
                style={[styles.copyButton, notesCopied && styles.copyButtonDone]}
                onPress={copyNotes}
                accessibilityRole="button"
                accessibilityLabel="Copy chapter notes"
              >
                <Ionicons
                  name={notesCopied ? 'checkmark' : 'copy-outline'}
                  size={14}
                  color={notesCopied ? Colors.success : Colors.primary}
                />
                <Text style={[styles.copyButtonText, notesCopied && styles.copyButtonTextDone]}>
                  {notesCopied ? 'Copied' : 'Copy'}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {notesOpen ? (
            <Card style={styles.notesCard}>
              {chapter.summary ? (
                <Markdown selectable>{chapter.summary}</Markdown>
              ) : (
                <Text style={styles.mutedText}>
                  The notes for this chapter are being prepared. The video lessons and concept summaries cover the
                  same ground.
                </Text>
              )}
            </Card>
          ) : (
            <Text style={styles.notesHint}>
              The full revision sheet for this chapter · {chapter.summary ? 'tap to open' : 'coming soon'}
            </Text>
          )}
        </View>
      </ScrollView>
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
    overflow: 'hidden',
  },
  headerBanner: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(23, 12, 60, 0.62)',
  },
  headerEyebrow: { color: Colors.primaryLight, fontSize: 12, fontWeight: '600' },
  headerTitle: { color: Colors.white, fontSize: 22, fontWeight: '700', marginTop: 2 },
  headerChipRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm },
  chapterChip: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  chapterChipText: { color: Colors.primary, fontSize: 11, fontWeight: '800' },
  codeChip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  codeText: { color: Colors.white, fontSize: 10, fontWeight: '600', opacity: 0.85 },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  section: { marginTop: Spacing.xl },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },
  sectionTitleInline: { marginBottom: 0 },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sectionCount: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  notesToggleHit: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  copyButtonDone: { borderColor: '#a7f3d0', backgroundColor: '#ecfdf5' },
  copyButtonText: { fontSize: 12, fontWeight: '800', color: Colors.primary },
  copyButtonTextDone: { color: '#047857' },
  progressCard: { padding: Spacing.lg },
  progressTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.lg },
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
  copyHint: { fontSize: 11, color: Colors.textMuted, marginTop: Spacing.sm },
  notesHint: { fontSize: 12, color: Colors.textSecondary, paddingHorizontal: 2 },
  notesToggle: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  notesToggleText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
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
  serialBadge: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: Colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serialText: { fontSize: 12, fontWeight: '800', color: Colors.primary },
  conceptBody: { flex: 1 },
  conceptName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  conceptMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginTop: 3,
  },
  conceptMetaLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  conceptMeta: { flexShrink: 1, fontSize: 11, color: Colors.textSecondary },
  conceptRange: {
    flexShrink: 0,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    fontVariant: ['tabular-nums'],
  },
  masteryChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full },
  masteryChipText: { fontSize: 11, fontWeight: '700' },
  videoCard: { marginBottom: Spacing.md, padding: Spacing.md },
  videoTitle: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: Spacing.sm },
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
