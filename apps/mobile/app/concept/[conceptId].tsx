import { ScrollView, View, Text, StyleSheet, TouchableOpacity, FlatList, Linking, Alert, ActivityIndicator, Modal } from 'react-native';
import { useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useConceptDetail, useCompleteContent, useStartPractice, useChapterHub } from '../../lib/hooks';
import { useConceptAr } from '../../lib/ar-hooks';
import { normalizeSegments, type VideoSegment } from '../../lib/chapter-hub';
import { Icon3D } from '../../components/Icon3D';
import { Colors, Spacing, BorderRadius, Pastel } from '../../constants/theme';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { ArConceptPanel } from '../../components/ArConceptPanel';
import { CONCEPT_MODES, PRACTICE_FORMATS, type PracticeFormat } from '../../components/concept-modes';
import { YouTubePlayer } from '../../components/YouTubePlayer';
import { Markdown } from '../../components/Markdown';

const TABS = CONCEPT_MODES;

export default function ConceptDetailScreen() {
  const { conceptId = '' } = useLocalSearchParams<{ conceptId: string }>();
  const router = useRouter();
  const [tab, setTab] = useState('learn');
  const [openNote, setOpenNote] = useState<string | null>(null);
  const { data: concept, isLoading, error } = useConceptDetail(conceptId);
  const completeContent = useCompleteContent();
  const startPractice = useStartPractice();
  const { data: arItems } = useConceptAr(conceptId);
  const arContent = arItems ?? [];
  const [arOpen, setArOpen] = useState(false);
  const [practiceFormat, setPracticeFormat] = useState<PracticeFormat>('quiz');

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

  const startMode = (count: number) => {
    if (questions.length === 0) {
      Alert.alert('No questions', 'No questions are available for this concept yet.');
      return;
    }
    startPractice.mutate(
      { conceptId, questionCount: Math.min(count, questions.length) },
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
      {/* Header */}
      <View style={styles.header}>
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
                {videos.map((v) => (
                  <Card key={v.id} style={styles.itemCard}>
                    <YouTubePlayer
                      url={v.url}
                      videoId={v.videoId}
                      title={v.title}
                      thumbnailUrl={v.thumbnailUrl}
                      durationSeconds={v.durationSeconds}
                      segments={normalizeSegments(v.segments ?? markersByContentId.get(v.id) ?? null)}
                    />
                    <Text style={styles.itemTitle}>{v.title}</Text>
                    {v.description ? <Text style={styles.itemDesc}>{v.description}</Text> : null}
                    <TouchableOpacity
                      style={styles.doneBtn}
                      onPress={() => completeContent.mutate(v.id)}
                      accessibilityLabel="Mark as complete"
                      accessibilityRole="button"
                    >
                      <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                      <Text style={styles.doneBtnText}>Mark as done</Text>
                    </TouchableOpacity>
                  </Card>
                ))}
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

            {notes.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Study Notes</Text>
                {notes.map((n) => {
                  const noteUrl = n.url;
                  const open = openNote === n.id;
                  return (
                    <Card key={n.id} style={styles.itemCard}>
                      <TouchableOpacity
                        style={styles.noteRow}
                        disabled={!n.description}
                        onPress={() => setOpenNote(open ? null : n.id)}
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
                      {open && n.description ? (
                        <View style={styles.noteBody}>
                          <Markdown>{n.description}</Markdown>
                        </View>
                      ) : null}
                      <TouchableOpacity style={styles.doneBtn} onPress={() => completeContent.mutate(n.id)} accessibilityLabel="Mark as complete" accessibilityRole="button">
                        <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                        <Text style={styles.doneBtnText}>Mark as read</Text>
                      </TouchableOpacity>
                    </Card>
                  );
                })}
              </View>
            )}

            <Card style={styles.revisionCard}>
              <View style={styles.revisionHeader}>
                <Ionicons name="bulb" size={20} color={Colors.warning} />
                <Text style={styles.revisionTitle}>Quick Revision</Text>
              </View>
              {concept.description ? (
                <View style={{ marginTop: Spacing.sm }}>
                  <Markdown>{concept.description}</Markdown>
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
            {/* One Practice mode, two formats: a graded quiz and self-rated flashcards */}
            <View style={styles.formatRow}>
              {PRACTICE_FORMATS.map((f) => {
                const active = practiceFormat === f.id;
                return (
                  <TouchableOpacity
                    key={f.id}
                    style={[styles.formatChip, active && styles.formatChipActive]}
                    onPress={() => setPracticeFormat(f.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <Text style={[styles.formatChipText, active && styles.formatChipTextActive]}>{f.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {practiceFormat === 'quiz' ? (
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => startMode(Math.min(questions.length, 10))}
                disabled={startPractice.isPending}
              >
                {startPractice.isPending ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <>
                    <Ionicons name="play" size={18} color={Colors.white} />
                    <Text style={styles.primaryBtnText}>Start Quiz</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: Colors.pink }]}
                onPress={() => router.push({ pathname: '/flashcards/[conceptId]', params: { conceptId } })}
                disabled={questions.length === 0}
              >
                <Ionicons name="sync" size={18} color={Colors.white} />
                <Text style={styles.primaryBtnText}>Start Flashcards</Text>
              </TouchableOpacity>
            )}
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
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomLeftRadius: BorderRadius.xxl,
    borderBottomRightRadius: BorderRadius.xxl,
  },
  headerTitle: { color: Colors.white, fontSize: 22, fontWeight: '700' },
  headerSub: { color: Colors.primaryLight, fontSize: 13, marginTop: 4 },
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
  itemCard: { marginBottom: Spacing.md, padding: Spacing.md },
  itemTitle: { fontSize: 14, fontWeight: '600', color: Colors.text, marginTop: Spacing.sm },
  itemDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  itemTitleF: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.text },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  noteIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.success + '20', alignItems: 'center', justifyContent: 'center' },
  doneBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.sm, alignSelf: 'flex-start' },
  doneBtnText: { fontSize: 13, fontWeight: '600', color: Colors.success },
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
  formatRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg },
  formatChip: { flex: 1, paddingVertical: 9, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  formatChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  formatChipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  formatChipTextActive: { color: Colors.white },
  arEntry: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  arModalRoot: { flex: 1, backgroundColor: Colors.background },
  arModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  arModalTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
});
