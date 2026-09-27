import { ScrollView, View, Text, StyleSheet, TouchableOpacity, FlatList, Linking, Alert, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useConceptDetail, useCompleteContent, useStartPractice } from '../../lib/hooks';
import { useConceptAr } from '../../lib/ar-hooks';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { ArConceptPanel } from '../../components/ArConceptPanel';
import { YouTubePlayer } from '../../components/YouTubePlayer';
import { Markdown } from '../../components/Markdown';

const TABS = [
  { id: 'learn', label: 'Learn', icon: 'play-circle' as const, color: Colors.info },
  { id: 'practice', label: 'Practice', icon: 'flash' as const, color: Colors.purple },
  { id: 'quiz', label: 'Quick Quiz', icon: 'battery-charging' as const, color: Colors.warning },
  { id: 'flashcards', label: 'Flashcards', icon: 'sync' as const, color: Colors.pink },
  { id: 'challenge', label: 'Challenge', icon: 'game-controller' as const, color: Colors.error },
  { id: 'ask', label: 'Ask Sanro AI', icon: 'fitness' as const, color: Colors.primary },
];

const AR_TAB = { id: 'ar', label: 'AR / 3D', icon: 'cube' as const, color: Colors.indigo };

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
  const tabs = arContent.length > 0 ? [...TABS.slice(0, 5), AR_TAB, ...TABS.slice(5)] : TABS;

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
          const practiceId = ((data as unknown) as { practiceId: string }).practiceId;
          router.push({ pathname: '/practice/[practiceId]', params: { practiceId } });
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
          {concept.chapter?.name ?? ''} • {concept.topic?.name ?? ''}
        </Text>
        {mastery && (
          <View style={styles.masteryRow}>
            <View style={[styles.masteryChip, { backgroundColor: weak ? Colors.error + '20' : Colors.success + '20' }]}>
              <Text style={[styles.masteryText, { color: weak ? Colors.error : Colors.success }]}>
                Mastery {mastery.score}% • {mastery.level.replace(/_/g, ' ')}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Tab bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={styles.tabBarContent}>
        {tabs.map((t) => (
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
      <ScrollView contentContainerStyle={styles.content}>
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
              <View style={[styles.modeIcon, { backgroundColor: Colors.purple + '20' }]}>
                <Ionicons name="flash" size={24} color={Colors.purple} />
              </View>
              <View style={styles.modeInfo}>
                <Text style={styles.modeTitle}>Practice Mode</Text>
                <Text style={styles.modeSub}>Backend-graded with mastery tracking</Text>
              </View>
            </View>
            <View style={styles.statsGrid}>
              <View style={[styles.statBox, { backgroundColor: Colors.info + '15' }]}>
                <Text style={[styles.statNum, { color: Colors.info }]}>{questions.length}</Text>
                <Text style={styles.statLabel}>Questions</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: Colors.purple + '15' }]}>
                <Text style={[styles.statNum, { color: Colors.purple }]}>5 XP</Text>
                <Text style={styles.statLabel}>Per question</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: Colors.success + '15' }]}>
                <Text style={[styles.statNum, { color: Colors.success }]}>80%</Text>
                <Text style={styles.statLabel}>To master</Text>
              </View>
            </View>
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
                  <Text style={styles.primaryBtnText}>Start Practice</Text>
                </>
              )}
            </TouchableOpacity>
          </Card>
        )}

        {tab === 'quiz' && (
          <Card style={styles.modeCard}>
            <View style={styles.modeHeader}>
              <View style={[styles.modeIcon, { backgroundColor: Colors.warning + '20' }]}>
                <Ionicons name="battery-charging" size={24} color={Colors.warning} />
              </View>
              <View style={styles.modeInfo}>
                <Text style={styles.modeTitle}>Quick Quiz</Text>
                <Text style={styles.modeSub}>5 questions • ~2 minutes • +25 XP</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: Colors.warning }]}
              onPress={() => router.push({ pathname: '/quiz/[conceptId]', params: { conceptId } })}
              disabled={questions.length === 0}
            >
              <Ionicons name="battery-charging" size={18} color={Colors.white} />
              <Text style={styles.primaryBtnText}>Start Quick Quiz</Text>
            </TouchableOpacity>
            {questions.length === 0 && (
              <Text style={styles.noQText}>No questions available for this concept yet.</Text>
            )}
          </Card>
        )}

        {tab === 'flashcards' && (
          <Card style={styles.modeCard}>
            <View style={styles.modeHeader}>
              <View style={[styles.modeIcon, { backgroundColor: Colors.pink + '20' }]}>
                <Ionicons name="sync" size={24} color={Colors.pink} />
              </View>
              <View style={styles.modeInfo}>
                <Text style={styles.modeTitle}>Flashcards</Text>
                <Text style={styles.modeSub}>Flip + confidence: Again / Hard / Good / Easy</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: Colors.pink }]}
              onPress={() => router.push({ pathname: '/flashcards/[conceptId]', params: { conceptId } })}
              disabled={questions.length === 0}
            >
              <Ionicons name="sync" size={18} color={Colors.white} />
              <Text style={styles.primaryBtnText}>Start Flashcards</Text>
            </TouchableOpacity>
            {questions.length === 0 && (
              <Text style={styles.noQText}>No cards available for this concept yet.</Text>
            )}
          </Card>
        )}

        {tab === 'challenge' && (
          <Card style={styles.modeCard}>
            <View style={styles.modeHeader}>
              <View style={[styles.modeIcon, { backgroundColor: Colors.error + '20' }]}>
                <Ionicons name="game-controller" size={24} color={Colors.error} />
              </View>
              <View style={styles.modeInfo}>
                <Text style={styles.modeTitle}>Timed Challenge</Text>
                <Text style={styles.modeSub}>60 seconds • 10 questions • 50 XP max</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: Colors.error }]}
              onPress={() => router.push({ pathname: '/challenge/[conceptId]', params: { conceptId } })}
              disabled={questions.length === 0}
            >
              <Ionicons name="game-controller" size={18} color={Colors.white} />
              <Text style={styles.primaryBtnText}>Start Challenge</Text>
            </TouchableOpacity>
            {questions.length === 0 && (
              <Text style={styles.noQText}>No questions available for this concept yet.</Text>
            )}
          </Card>
        )}

        {tab === 'ask' && (
          <Card style={styles.modeCard}>
            <View style={styles.modeHeader}>
              <View style={[styles.modeIcon, { backgroundColor: Colors.primary + '20' }]}>
                <Ionicons name="fitness" size={24} color={Colors.primary} />
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

        {tab === 'ar' && arContent.length > 0 && (
          <ArConceptPanel conceptId={conceptId} items={arContent} />
        )}
      </ScrollView>
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
  masteryRow: { marginTop: Spacing.md },
  masteryChip: { alignSelf: 'flex-start', borderRadius: BorderRadius.full, paddingHorizontal: 12, paddingVertical: 5 },
  masteryText: { fontSize: 12, fontWeight: '700' },
  tabBar: { flexGrow: 0, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabBarContent: { padding: Spacing.sm, gap: 6 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.full, backgroundColor: Colors.surfaceSecondary },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: Colors.white },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  section: { marginBottom: Spacing.lg },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },
  itemCard: { marginBottom: Spacing.md, padding: Spacing.md },
  videoThumb: { height: 160, borderRadius: BorderRadius.lg, backgroundColor: Colors.info, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  playBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  duration: { position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', color: Colors.white, fontSize: 12, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' },
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
  primaryBtnText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
  noQText: { color: Colors.textSecondary, fontSize: 13, marginTop: Spacing.md, textAlign: 'center' },
});