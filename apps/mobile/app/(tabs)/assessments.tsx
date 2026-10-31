import { ScrollView, View, Text, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAssessmentsList } from '../../lib/hooks';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';

export default function AssessmentsScreen() {
  const router = useRouter();
  const { data: assessments, isLoading, refetch, isRefetching } = useAssessmentsList();

  const onRefresh = useCallback(() => { refetch(); }, [refetch]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return '#10b981';
      case 'DRAFT': return '#f59e0b';
      case 'CLOSED': return '#6b7280';
      default: return Colors.textSecondary;
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Assessments</Text>
        <Text style={styles.subHeader}>See how your classes are doing and open their results</Text>
      </View>

      <Text style={styles.sectionTitle}>Create on the web</Text>
      <Card style={styles.webOnlyCard}>
        <View style={styles.webOnlyRow}>
          <Ionicons name="desktop-outline" size={26} color={Colors.primary} />
          <View style={styles.webOnlyText}>
            <Text style={styles.webOnlyTitle}>Authoring lives on the web app</Text>
            <Text style={styles.webOnlySub}>
              Create an assessment, build a question paper or generate one from the bank at app.sanroai.com -
              this app is where you review what your students have done.
            </Text>
          </View>
        </View>
      </Card>

      <Text style={styles.sectionTitle}>Recent Assessments</Text>
      {isLoading ? (
        <Card style={styles.emptyCard}>
          <Ionicons name="hourglass-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyText}>Loading assessments...</Text>
        </Card>
      ) : !assessments || assessments.length === 0 ? (
        <EmptyState
          icon="clipboard-outline"
          title="No assessments yet"
          subtitle="Create your first assessment to get started"
        />
      ) : (
        assessments.slice(0, 10).map((a) => (
          <View key={a.id} style={styles.assessmentCard}>
            <View style={styles.assessmentHeader}>
              <Text style={styles.assessmentTitle} numberOfLines={1}>{a.title}</Text>
              <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(a.status)}20` }]}>
                <Text style={[styles.statusText, { color: getStatusColor(a.status) }]}>{a.status}</Text>
              </View>
            </View>
            <View style={styles.assessmentMeta}>
              {a.type && (
                <View style={styles.metaItem}>
                  <Ionicons name="document-outline" size={14} color={Colors.textSecondary} />
                  <Text style={styles.metaText}>{a.type}</Text>
                </View>
              )}
              {a.groupNames && a.groupNames.length > 0 && (
                <View style={styles.metaItem}>
                  <Ionicons name="school-outline" size={14} color={Colors.textSecondary} />
                  <Text style={styles.metaText}>{a.groupNames.join(', ')}</Text>
                </View>
              )}
              {a.dueAt && (
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
                  <Text style={styles.metaText}>Due {new Date(a.dueAt).toLocaleDateString()}</Text>
                </View>
              )}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: Spacing.xxxl },
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: BorderRadius.xxl,
    borderBottomRightRadius: BorderRadius.xxl,
  },
  title: { color: Colors.white, fontSize: 24, fontWeight: '700' },
  subHeader: { color: Colors.primaryLight, fontSize: 12, marginTop: Spacing.sm },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginTop: Spacing.xl, marginHorizontal: Spacing.lg, marginBottom: Spacing.md },
  actionsRow: { flexDirection: 'row', marginHorizontal: Spacing.lg, gap: Spacing.md },
  webOnlyCard: { marginHorizontal: Spacing.lg, padding: Spacing.lg },
  webOnlyRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  webOnlyText: { flex: 1 },
  webOnlyTitle: { fontSize: 14, fontWeight: '800', color: Colors.text },
  webOnlySub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2, lineHeight: 18 },
  actionBtn: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  actionLabel: { fontSize: 12, fontWeight: '600', color: Colors.text, textAlign: 'center' },
  emptyCard: { marginHorizontal: Spacing.lg, alignItems: 'center', padding: Spacing.xl },
  emptyText: { color: Colors.textSecondary, fontSize: 14, marginTop: Spacing.md },
  assessmentCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  assessmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assessmentTitle: { fontSize: 16, fontWeight: '600', color: Colors.text, flex: 1, marginRight: Spacing.sm },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: { fontSize: 11, fontWeight: '600' },
  assessmentMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: Colors.textSecondary },
});
