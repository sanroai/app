import { ScrollView, View, Text, StyleSheet, TouchableOpacity, FlatList, Linking, Alert, ActivityIndicator, Modal, Image } from 'react-native';
import { useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useConceptDetail, useCompleteContent, useUncompleteContent, useStartPractice, useChapterHub } from '../../lib/hooks';
import { subjectBanner } from '../../lib/subject-art';
import { useConceptAr } from '../../lib/ar-hooks';
import { normalizeSegments, formatTimestamp, sectionStartForConcept, type VideoSegment } from '../../lib/chapter-hub';
import { Icon3D } from '../../components/Icon3D';
import { Colors, Spacing, BorderRadius, Pastel } from '../../constants/theme';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { ArConceptPanel } from '../../components/ArConceptPanel';
import { CONCEPT_MODES } from '../../components/concept-modes';
import { YouTubePlayer } from '../../components/YouTubePlayer';
import { Markdown } from '../../components/Markdown';
import * as Clipboard from 'expo-clipboard';

const TABS = CONCEPT_MODES;

export default function ConceptDetailScreen() {
  const { conceptId = '', t, video: videoParam, tab: tabParam } = useLocalSearchParams<{
    conceptId: string;
    t?: string;
    video?: string;
    tab?: string;
  }>();
  const parsedStart = Number.parseInt(t ?? '', 10);
  const startAt = Number.isFinite(parsedStart) && parsedStart > 0 ? parsedStart : 0;
  const [fromStart, setFromStart] = useState(false);
  const router = useRouter();
  const [tab, setTab] = useState(tabParam === 'practice' || tabParam === 'ask' ? tabParam : 'learn');
  // Notes are open by default (a student who must tap twice to read them just
  // leaves); `closedNotes` records the exceptions so nothing depends on the async
  // content arriving before the first render.
  const [closedNotes, setClosedNotes] = useState<string[]>([]);
  const [copiedNote, setCopiedNote] = useState<string | null>(null);

  /**
   * Copy a note (or all notes) to the clipboard.
   *
   * The button is the reliable path on Android; long-press selection still works
   * on the text itself because the notes render with `selectable`.
   */
  const copyNote = async (id: string, text: string) => {
    if (!text.trim()) return;
    try {
      await Clipboard.setStringAsync(text);
      setCopiedNote(id);
      setTimeout(() => setCopiedNote((current) => (current === id ? null : current)), 2000);
    } catch {
      Alert.alert('Copy', 'Long-press the text to select and copy it.');
    }
  };
  const { data: concept, isLoading, error } = useConceptDetail(conceptId);
  const completeContent = useCompleteContent();
  const uncompleteContent = useUncompleteContent();
  const startPractice = useStartPractice();
  const { data: arItems } = useConceptAr(conceptId);
  const arContent = arItems ?? [];
  const [arOpen, setArOpen] = useState(false);

  // The chapter hub owns the chapter markers (the points a video lesson is
  // split at). The concept screen borrows them for the videos it shows.
  const { data: chapterHub } = useChapterHub(concept?.chapter?.id ?? '');
  const markersByContentId = useMemo(() => {
    const map = new Map<string, VideoSegment[]>();
    for (const video of chapterHub?.videos ?? []) {
      const markers = normalizeSegments(video.segments);
      if (video.contentId && markers.length > 0) map.set(video.contentId, markers);
    }
    return map;
  }, [chapterHub]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }
  if (error || !concept) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Could not load this concept.</Text>
      </View>
    );
  }

  const mastery = concept.mastery;
  const weak = !!mastery && (mastery.level === 'WEAK' || mastery.level === 'NEEDS_INTERVENTION' || mastery.level === 'INSUFFICIENT_EVIDENCE');
  const videos = concept.content.filter((c) => c.type === 'VIDEO');
  const notes = concept.content.filter((c) => c.type === 'NOTES' || c.type === 'ARTICLE');
  const questions = concept.practiceQuestions ?? [];
  const markersFor = (video: { id: string; segments?: VideoSegment[] | null }) =>
    normalizeSegments(video.segments ?? markersByContentId.get(video.id) ?? null);
  // The chapter hub names the exact video + timestamp that teaches this concept.
  // A chapter can carry several chapter-wide videos, so when the named clip is
  // not one of this concept's own lessons we use that lesson's own marker for
  // this concept - applying the other clip's offset would start in the middle of
  // the previous concept.
  const requestedVideo = startAt > 0 ? (videos.find((v) => v.id === videoParam) ?? null) : null;
  const fallbackVideo = startAt > 0 && !requestedVideo ? (videos[0] ?? null) : null;
  const targetVideoId = requestedVideo?.id ?? fallbackVideo?.id ?? null;
  const targetStart = requestedVideo
    ? startAt
    : fallbackVideo
      ? sectionStartForConcept(markersFor(fallbackVideo), concept.name)
      : 0;

  const startMode = (count: number) => {
    startPractice.mutate(
      { conceptId, questionCount: Math.min(Math.max(count, 5), 10) },
      {
        onSuccess: (data) => {
          const practiceId = data?.practiceId;
          if (!practiceId) {
            // without a practice id there is nothing to open - say so instead
            // of navigating to a broken route
            Alert.alert('Could not start practice', 'The practice set did not start. Please try again.');
            return;
          }
          router.push({ pathname: '/practice/[practiceId]', params: { practiceId } });
        },
        onError: (err) => {
          const e = err as { message?: string };
          Alert.alert('Could not start practice', e.message || 'Please try again in a moment.');
        },
      },
    );
  };

  return (
    <View style={styles.container}>
      {/* Hero: the class+subject artwork behind the concept name, like the chapter hub */}
      <View style={styles.header}>
        <Image
          source={subjectBanner(concept.chapter?.subject?.name, concept.chapter?.subject?.code, concept.chapter?.grade)}
          style={styles.headerBanner}
          resizeMode="cover"
        />
        <View style={styles.headerScrim} />
        <View style={styles.headerBody}>
          <Text style={styles.headerEyebrow}>
            {concept.chapter?.subject?.name ?? 'Subject'}
            {concept.chapter?.grade ? ` · Class ${concept.chapter.grade}` : ''}
          </Text>
          <Text style={styles.headerTitle}>{concept.name}</Text>
          <Text style={styles.headerSub}>
            <Text
              style={styles.headerLink}
              onPress={() =>
                concept.chapter?.id
                  ? router.push({ pathname: '/chapter/[chapterId]', params: { chapterId: concept.chapter.id } })
                  : undefined
              }
            >
              {concept.chapter?.name ?? ''}
            </Text>
            {' • '}
            {concept.topic?.name ?? ''}
          </Text>
          {mastery && (
            <View style={styles.masteryRow}>
              <View style={styles.masteryChip}>
                <View style={[styles.masteryDot, { backgroundColor: weak ? '#dc2626' : '#059669' }]} />
                <Text style={[styles.masteryText, { color: weak ? '#b91c1c' : '#047857' }]}>
                  Mastery {mastery.score}% · {mastery.level.replace(/_/g, ' ')}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Tab bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={styles.tabBarContent}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.tab, tab === t.id && styles.tabActive]}
            onPress={() => setTab(t.id)}
            accessibilityLabel={`Switch to ${t.label} mode`}
            accessibilityRole="button"
          >
            <Ionicons name={t.icon} size={16} color={tab === t.id ? Colors.white : t.color} />
            <Text style={[styles.tabText, tab === t.id && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tab content */}
      <ScrollView style={styles.contentScroll} contentContainerStyle={styles.content}>
        {tab === 'learn' && (
          <>
            {videos.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Video Lessons</Text>
                {videos.map((v) => {
                  const done = v.progress?.state === 'COMPLETED';
                  const isTarget = v.id === targetVideoId;
                  const effectiveStart = isTarget ? (fromStart ? 0 : targetStart) : 0;
                  return (
                    <Card key={v.id} style={styles.itemCard}>
                      <Text style={styles.itemTitle}>{v.title}</Text>
                      {isTarget && targetStart > 0 ? (
                        <View style={styles.startRow}>
                          <View style={styles.startChip}>
                            <Ionicons name="play-forward" size={12} color={Colors.primary} />
                            <Text style={styles.startChipText}>
                              Starting at {formatTimestamp(effectiveStart)}
                            </Text>
                          </View>
                          {!fromStart ? (
                            <TouchableOpacity
                              onPress={() => setFromStart(true)}
                              accessibilityRole="button"
                              accessibilityLabel="Play the lesson from the start"
                            >
                              <Text style={styles.startLink}>Play from the start</Text>
                            </TouchableOpacity>
                          ) : null}
                        </View>
                      ) : null}
                      <YouTubePlayer
                        key={`${v.id}-${effectiveStart}`}
                        url={v.url}
                        videoId={v.videoId}
                        title={v.title}
                        thumbnailUrl={v.thumbnailUrl}
                        durationSeconds={v.durationSeconds}
                        startSeconds={effectiveStart}
                        autoPlay={isTarget && targetStart > 0}
                        segments={markersFor(v)}
                      />
                      {v.description ? <Text style={styles.itemDesc}>{v.description}</Text> : null}
                      {done ? (
                        <View style={styles.doneRow}>
                          <View style={[styles.doneBtn, styles.doneBtnInline]}>
                            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                            <Text style={styles.doneBtnText}>Completed</Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => uncompleteContent.mutate(v.id)}
                            disabled={uncompleteContent.isPending}
                            accessibilityLabel="Mark as not done"
                            accessibilityRole="button"
                          >
                            <Text style={styles.undoText}>Undo</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.doneBtn}
                          onPress={() => completeContent.mutate(v.id)}
                          disabled={completeContent.isPending}
                          accessibilityLabel="Mark as done"
                          accessibilityRole="button"
                        >
                          <Ionicons name="ellipse-outline" size={16} color={Colors.textSecondary} />
                          <Text style={[styles.doneBtnText, styles.doneBtnIdle]}>Mark as done</Text>
                        </TouchableOpacity>
                      )}
                    </Card>
                  );
                })}
              </View>
            )}

            {arContent.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Interactive 3D Model</Text>
                <Card style={styles.itemCard}>
                  <TouchableOpacity
                    style={styles.arEntry}
                    onPress={() => setArOpen(true)}
                    accessibilityLabel="Open the 3D viewer"
                    accessibilityRole="button"
                  >
                    <View style={[styles.modeIcon, { backgroundColor: Colors.indigo + '20' }]}>
                      <Icon3D name="puzzle" size={30} />
                    </View>
                    <View style={styles.modeInfo}>
                      <Text style={styles.modeTitle}>Open the 3D viewer</Text>
                      <Text style={styles.modeSub}>
                        {arContent.length} interactive model{arContent.length === 1 ? '' : 's'} · rotate, tap the labels,
                        then try the quick check
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </Card>
              </View>
            )}

            <Card style={styles.revisionCard}>
              <View style={styles.revisionHeader}>
                <Ionicons name="bulb" size={20} color={Colors.warning} />
                <Text style={styles.revisionTitle}>Quick Revision</Text>
              </View>
              {concept.description ? (
                <View style={{ marginTop: Spacing.sm }}>
                  <Markdown selectable>{concept.description}</Markdown>
                </View>
              ) : null}
              {notes.length > 0 ? (
                <View style={{ marginTop: Spacing.sm, gap: 4 }}>
                  {notes.slice(0, 4).map((n) => {
                    const noteUrl = n.url ?? (n as { body?: string }).body ?? '';
                    return (
                      <TouchableOpacity
                        key={n.id}
                        style={styles.revisionItem}
                        onPress={() => noteUrl ? Linking.openURL(noteUrl) : null}
                      >
                        <Ionicons name="document-text-outline" size={14} color={Colors.textMuted} />
                        <Text style={styles.revisionItemText} numberOfLines={1}>{n.title}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.revisionBody}>
                  Review the key definitions above before your next test, then use Practice to test yourself.
                </Text>
              )}
            </Card>

            {/* Study notes last on the page: the reading material follows the video
                and the summary, and every note is selectable and copyable. */}
            {notes.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHead}>
                  <Text style={[styles.sectionTitle, styles.sectionTitleInline]}>Study notes</Text>
                  <TouchableOpacity
                    style={styles.copyBtn}
                    onPress={() =>
                      void copyNote(
                        'all',
                        notes.map((n) => `${n.title}\n\n${n.description ?? ''}`).join('\n\n---\n\n'),
                      )
                    }
                    accessibilityRole="button"
                    accessibilityLabel="Copy all study notes"
                  >
                    <Ionicons
                      name={copiedNote === 'all' ? 'checkmark' : 'copy-outline'}
                      size={14}
                      color={copiedNote === 'all' ? Colors.success : Colors.primary}
                    />
                    <Text style={[styles.copyBtnText, copiedNote === 'all' && styles.copyBtnTextDone]}>
                      {copiedNote === 'all' ? 'Copied' : 'Copy all'}
                    </Text>
                  </TouchableOpacity>
                </View>
                {notes.map((n) => {
                  const noteUrl = n.url;
                  const open = !closedNotes.includes(n.id);
                  const done = n.progress?.state === 'COMPLETED';
                  return (
                    <Card key={n.id} style={styles.itemCard}>
                      <TouchableOpacity
                        style={styles.noteRow}
                        disabled={!n.description}
                        onPress={() =>
                          setClosedNotes((prev) =>
                            prev.includes(n.id) ? prev.filter((id) => id !== n.id) : [...prev, n.id],
                          )
                        }
                        accessibilityRole={n.description ? 'button' : 'text'}
                        accessibilityState={{ expanded: open }}
                      >
                        <View style={styles.noteIcon}>
                          <Ionicons name="document-text" size={20} color={Colors.success} />
                        </View>
                        <Text style={styles.itemTitleF}>{n.title}</Text>
                        {n.description ? (
                          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textMuted} />
                        ) : noteUrl ? (
                          <TouchableOpacity onPress={() => Linking.openURL(noteUrl)}>
                            <Ionicons name="open-outline" size={18} color={Colors.textMuted} />
                          </TouchableOpacity>
                        ) : null}
                      </TouchableOpacity>
                      {n.description ? (
                        <View style={styles.noteActions}>
                          <TouchableOpacity
                            style={styles.copyBtn}
                            onPress={() => void copyNote(n.id, n.description ?? '')}
                            accessibilityRole="button"
                            accessibilityLabel={`Copy ${n.title}`}
                          >
                            <Ionicons
                              name={copiedNote === n.id ? 'checkmark' : 'copy-outline'}
                              size={14}
                              color={copiedNote === n.id ? Colors.success : Colors.primary}
                            />
                            <Text style={[styles.copyBtnText, copiedNote === n.id && styles.copyBtnTextDone]}>
                              {copiedNote === n.id ? 'Copied' : 'Copy'}
                            </Text>
                          </TouchableOpacity>
                          <Text style={styles.noteHint}>Long-press to select any line</Text>
                        </View>
                      ) : null}
                      {open && n.description ? (
                        <View style={styles.noteBody}>
                          <Markdown selectable>{n.description}</Markdown>
                        </View>
                      ) : null}
                      {done ? (
                        <View style={styles.doneRow}>
                          <View style={[styles.doneBtn, styles.doneBtnInline]}>
                            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                            <Text style={styles.doneBtnText}>Completed</Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => uncompleteContent.mutate(n.id)}
                            disabled={uncompleteContent.isPending}
                            accessibilityLabel="Mark as unread"
                            accessibilityRole="button"
                          >
                            <Text style={styles.undoText}>Undo</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.doneBtn}
                          onPress={() => completeContent.mutate(n.id)}
                          disabled={completeContent.isPending}
                          accessibilityLabel="Mark as read"
                          accessibilityRole="button"
                        >
                          <Ionicons name="ellipse-outline" size={16} color={Colors.textSecondary} />
                          <Text style={[styles.doneBtnText, styles.doneBtnIdle]}>Mark as read</Text>
                        </TouchableOpacity>
                      )}
                    </Card>
                  );
                })}
              </View>
            )}
          </>
        )}

        {tab === 'practice' && (
          <Card style={styles.modeCard}>
            <View style={styles.modeHeader}>
              <View style={[styles.modeIcon, { backgroundColor: Pastel.violet }]}>
                <Icon3D name="rocket" size={30} />
              </View>
              <View style={styles.modeInfo}>
                <Text style={styles.modeTitle}>Practice Mode</Text>
                <Text style={styles.modeSub}>Instant feedback with mastery tracking</Text>
              </View>
            </View>
            <View style={styles.statsGrid}>
              <View style={[styles.statBox, { backgroundColor: Colors.info + '15' }]}>
                <Text style={[styles.statNum, { color: Colors.info }]}>{questions.length}</Text>
                <Text style={styles.statLabel}>Questions</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: Colors.purple + '15' }]}>
                <Text style={[styles.statNum, { color: Colors.purple }]}>5 XP</Text>
                <Text style={styles.statLabel}>Per correct answer</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: Colors.success + '15' }]}>
                <Text style={[styles.statNum, { color: Colors.success }]}>80%</Text>
                <Text style={styles.statLabel}>To master</Text>
              </View>
            </View>
            <Text style={styles.modeSub}>
              Earn 5 XP per correct answer plus 10 XP for finishing. Your result updates your mastery and the
              leaderboard.
            </Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => startMode(Math.min(Math.max(questions.length, 5), 10))}
              disabled={startPractice.isPending}
            >
              {startPractice.isPending ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="play" size={18} color={Colors.white} />
                  <Text style={styles.primaryBtnText}>Start practice</Text>
                </>
              )}
            </TouchableOpacity>
            {questions.length === 0 && (
              <Text style={styles.noQText}>No questions available for this concept yet.</Text>
            )}
          </Card>
        )}

        {tab === 'ask' && (
          <Card style={styles.modeCard}>
            <View style={styles.modeHeader}>
              <View style={[styles.modeIcon, { backgroundColor: Pastel.lavender }]}>
                <Icon3D name="speech-balloon" size={30} />
              </View>
              <View style={styles.modeInfo}>
                <Text style={styles.modeTitle}>Ask Sanro AI</Text>
                <Text style={styles.modeSub}>Context-aware help for {concept.name}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => router.push({ pathname: '/ask/[conceptId]', params: { conceptId } })}
            >
              <Ionicons name="chatbubbles" size={18} color={Colors.white} />
              <Text style={styles.primaryBtnText}>Open AI Chat</Text>
            </TouchableOpacity>
          </Card>
        )}
      </ScrollView>

      {/* 3D viewer - opened from the Learn tab */}
      <Modal visible={arOpen} animationType="slide" onRequestClose={() => setArOpen(false)} transparent={false}>
        <View style={styles.arModalRoot}>
          <View style={styles.arModalHeader}>
            <Text style={styles.arModalTitle}>Interactive 3D model</Text>
            <TouchableOpacity
              onPress={() => setArOpen(false)}
              accessibilityLabel="Close the 3D viewer"
              accessibilityRole="button"
              hitSlop={8}
            >
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <ArConceptPanel conceptId={conceptId} items={arContent} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  errorText: { color: Colors.error, fontSize: 15, fontWeight: '600', textAlign: 'center', marginTop: Spacing.md },
  header: {
    backgroundColor: Colors.primaryDark,
    borderBottomLeftRadius: BorderRadius.xxl,
    borderBottomRightRadius: BorderRadius.xxl,
    overflow: 'hidden',
    minHeight: 210,
    justifyContent: 'flex-end',
  },
  headerBanner: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  headerScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.45)',
  },
  headerBody: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xxl, paddingBottom: Spacing.lg },
  headerEyebrow: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  headerTitle: { color: Colors.white, fontSize: 28, fontWeight: '800', marginTop: 4 },
  headerSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 4 },
  headerLink: { textDecorationLine: 'underline', fontWeight: '600' },
  masteryRow: { marginTop: Spacing.md },
  masteryChip: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: BorderRadius.full, paddingHorizontal: 12, paddingVertical: 6, gap: 6 },
  masteryDot: { width: 8, height: 8, borderRadius: 4 },
  masteryText: { fontSize: 12, fontWeight: '800' },
  tabBar: { flexGrow: 0, flexShrink: 0, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabBarContent: { paddingLeft: Spacing.sm, paddingRight: Spacing.lg, paddingVertical: Spacing.sm, gap: 6 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.full, backgroundColor: Colors.surfaceSecondary },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: Colors.white },
  contentScroll: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  section: { marginBottom: Spacing.lg },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },
  sectionTitleInline: { marginBottom: 0 },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  copyBtnText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  copyBtnTextDone: { color: Colors.success },
  noteActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  noteHint: { flexShrink: 1, fontSize: 11, color: Colors.textMuted },
  itemCard: { marginBottom: Spacing.md, padding: Spacing.md },
  itemTitle: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: Spacing.sm },
  startRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm, marginBottom: Spacing.sm },
  startChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary + '12',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  startChipText: { fontSize: 11, fontWeight: '700', color: Colors.primary },
  startLink: { fontSize: 11, fontWeight: '700', color: Colors.primary, textDecorationLine: 'underline' },
  itemDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  itemTitleF: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.text },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  noteIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.success + '20', alignItems: 'center', justifyContent: 'center' },
  doneBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.sm, alignSelf: 'flex-start' },
  doneBtnText: { fontSize: 13, fontWeight: '600', color: Colors.success },
  doneBtnIdle: { color: Colors.textSecondary },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: Spacing.sm, alignSelf: 'flex-start' },
  doneBtnInline: { marginTop: 0 },
  undoText: { fontSize: 13, fontWeight: '600', color: Colors.primary, textDecorationLine: 'underline' },
  revisionCard: { backgroundColor: Colors.amber, borderWidth: 1, borderColor: Colors.amberBorder, padding: Spacing.lg },
  revisionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  revisionTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  revisionBody: { fontSize: 13, color: Colors.textSecondary, marginTop: Spacing.sm, lineHeight: 20 },
  noteBody: { marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  revisionItem: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  revisionItemText: { flex: 1, fontSize: 13, fontWeight: '500', color: Colors.text },
  modeCard: { padding: Spacing.lg },
  modeHeader: { flexDirection: 'row', alignItems: 'center' },
  modeIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  modeInfo: { flex: 1, marginLeft: Spacing.md },
  modeTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  modeSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  statsGrid: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg },
  statBox: { flex: 1, borderRadius: BorderRadius.md, paddingVertical: Spacing.md, alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: '700' },
  statLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  primaryBtn: { flexDirection: 'row', backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: Spacing.lg },
  primaryBtnDisabled: { backgroundColor: '#a8a29e' },
  primaryBtnText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
  noQText: { color: Colors.textSecondary, fontSize: 13, marginTop: Spacing.md, textAlign: 'center' },
  arEntry: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  arModalRoot: { flex: 1, backgroundColor: Colors.background },
  arModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  arModalTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
});
