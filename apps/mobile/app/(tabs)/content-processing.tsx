import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MOCK_STATS = [
  { label: 'Knowledge Bases', value: 3, icon: 'library' as const, color: '#7c3aed' },
  { label: 'Total Chunks', value: 847, icon: 'document-text' as const, color: '#2563eb' },
  { label: 'Processing', value: 1, icon: 'sync' as const, color: '#f59e0b' },
  { label: 'Published', value: 1, icon: 'checkmark-circle' as const, color: '#10b981' },
];

const MOCK_KBS = [
  { id: '1', name: 'NCERT Science Class 10', type: 'PDF_BOOK', status: 'PUBLISHED', chunks: 423 },
  { id: '2', name: 'Physics Video Lectures', type: 'VIDEO', status: 'PROCESSING', chunks: 234 },
  { id: '3', name: 'Math Formula Notes', type: 'NOTES', status: 'DRAFT', chunks: 190 },
];

export default function ContentProcessingScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Content Processing</Text>
      <Text style={styles.subtitle}>Manage knowledge bases and content</Text>

      <View style={styles.statsGrid}>
        {MOCK_STATS.map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <Ionicons name={stat.icon} size={24} color={stat.color} />
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Knowledge Bases</Text>
      {MOCK_KBS.map((kb) => (
        <View key={kb.id} style={styles.kbCard}>
          <View style={styles.kbHeader}>
            <Text style={styles.kbName}>{kb.name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: kb.status === 'PUBLISHED' ? '#dcfce7' : kb.status === 'PROCESSING' ? '#fef3c7' : '#f3f4f6' }]}>
              <Text style={[styles.statusText, { color: kb.status === 'PUBLISHED' ? '#16a34a' : kb.status === 'PROCESSING' ? '#d97706' : '#6b7280' }]}>{kb.status}</Text>
            </View>
          </View>
          <Text style={styles.kbMeta}>{kb.type.replace('_', ' ')} • {kb.chunks} chunks</Text>
          <View style={styles.kbActions}>
            <TouchableOpacity style={styles.actionBtn}>
              <Text style={styles.actionText}>View</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Text style={styles.actionText}>Process</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.uploadBtn}>
        <Ionicons name="cloud-upload" size={20} color="#fff" />
        <Text style={styles.uploadText}>Upload Content</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#0f172a' },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 4, marginBottom: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statCard: { width: '47%', backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  statValue: { fontSize: 24, fontWeight: '700', color: '#0f172a', marginTop: 8 },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a', marginBottom: 12 },
  kbCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  kbHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kbName: { fontSize: 15, fontWeight: '600', color: '#0f172a', flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '600' },
  kbMeta: { fontSize: 12, color: '#64748b', marginTop: 4 },
  kbActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  actionText: { fontSize: 12, fontWeight: '500', color: '#374151' },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#7c3aed', borderRadius: 16, padding: 16, marginTop: 12 },
  uploadText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
