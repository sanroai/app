import { ScrollView, View, Text, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLearningHome } from '../../lib/hooks';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';
import { EmptyState } from '../../components/EmptyState';
import { SubjectCard } from '../../components/visuals';

export default function LearnScreen() {
  const router = useRouter();
  const { data, refetch, isFetching } = useLearningHome();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (!data || (data.boards ?? []).length === 0) {
    return (
      <View style={styles.container}>
        <Header subtitle="Browse lessons by class and subject" />
        <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          <EmptyState icon="book" title={isFetching ? 'Loading…' : 'No classes yet'} subtitle="Your board classes will appear here." />
        </ScrollView>
      </View>
    );
  }

  // A student can be enrolled in more than one class; the library then lists
  // every one of them, so the header says so instead of naming a single class.
  const gradeCount = data.boards.reduce((n, b) => n + b.grades.length, 0);

  return (
    <View style={styles.container}>
      <Header
        subtitle={
          data.allGrades
            ? 'All classes · every subject'
            : gradeCount > 1
              ? `${gradeCount} classes · every subject`
              : 'Browse lessons by class and subject'
        }
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {data.boards.map((board) =>
          board.grades.map((grade) => (
            <View key={grade.id} style={styles.group}>
              <Text style={styles.groupTitle}>
                {board.name} • Class {grade.grade}
              </Text>
              <View style={styles.subjectGrid}>
                {grade.subjects.map((subject) => (
                  <SubjectCard
                    key={subject.id}
                    name={subject.name}
                    code={subject.code}
                    subtitle={`${subject.completedContent}/${subject.totalContent} topics done`}
                    progress={subject.totalContent > 0 ? (subject.completedContent / subject.totalContent) * 100 : 0}
                    style={styles.subjectGridItem}
                    onPress={() =>
                      router.push({
                        pathname: '/learn/[boardId]/[grade]/[subjectId]',
                        params: { boardId: board.id, grade: grade.grade, subjectId: subject.id },
                      })
                    }
                  />
                ))}
              </View>
            </View>
          )),
        )}
      </ScrollView>
    </View>
  );
}

function Header({ subtitle }: { subtitle: string }) {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Library</Text>
      <Text style={styles.headerSub}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing.lg, borderBottomLeftRadius: BorderRadius.xxl, borderBottomRightRadius: BorderRadius.xxl },
  headerTitle: { color: Colors.white, fontSize: 26, fontWeight: '700' },
  headerSub: { color: Colors.primaryLight, fontSize: 13, marginTop: 2 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  group: { marginBottom: Spacing.xl },
  subjectGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  // Fixed half-width columns: a `flexGrow` card stretches to full width when a
  // grade has an odd number of subjects (English), which makes the last card a
  // different size from the other two and breaks the shared thumbnail aspect.
  subjectGridItem: { flexBasis: '47%', flexGrow: 0, flexShrink: 0 },
  groupTitle: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.md },
  subjectRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm },
  subjectIcon: { width: 44, height: 44, borderRadius: BorderRadius.md, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  subjectBody: { flex: 1, marginLeft: Spacing.md },
  subjectName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  subjectMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  subjectPct: { marginRight: Spacing.md },
  subjectPctText: { color: Colors.primary, fontSize: 13, fontWeight: '700' },
});