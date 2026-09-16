import { ScrollView, View, Text, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/Card';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';

export default function AssessmentsScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Assessments</Text>
        <Text style={styles.subHeader}>Create and manage assessments for your students</Text>
      </View>

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="add-circle" size={28} color={Colors.primary} />
          <Text style={styles.actionLabel}>New{'\n'}Assessment</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="file-tray" size={28} color="#10b981" />
          <Text style={styles.actionLabel}>Question{'\n'}Bank</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="document-text" size={28} color="#f59e0b" />
          <Text style={styles.actionLabel}>Generate{'\n'}Paper</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Recent Assessments</Text>
      <Card style={styles.emptyCard}>
        <Ionicons name="clipboard-outline" size={48} color={Colors.textMuted} />
        <Text style={styles.emptyText}>No assessments created yet</Text>
        <Text style={styles.emptyHint}>Create your first assessment to get started</Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 40 },
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
  emptyHint: { color: Colors.textMuted, fontSize: 12, marginTop: 4 },
});
