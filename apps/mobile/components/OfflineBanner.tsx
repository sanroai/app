import { View, Text, StyleSheet } from 'react-native';
import { useOfflineStore } from '../lib/offline';
import { Colors, Spacing } from '../constants/theme';

export function OfflineBanner() {
  const offline = useOfflineStore((s) => s.offline);
  const queued = useOfflineStore((s) => s.queue.length);
  if (!offline && queued === 0) return null;
  return (
    <View style={styles.banner} accessibilityRole="alert" accessibilityLabel="Offline">
      <Text style={styles.text}>
        {queued > 0
          ? `Offline — ${queued} change${queued === 1 ? '' : 's'} saved locally, will sync when back online.`
          : 'Offline — answers saved locally, will sync when back online.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { backgroundColor: Colors.warning + '22', paddingHorizontal: Spacing.lg, paddingVertical: 6 },
  text: { fontSize: 11, fontWeight: '600', color: '#92400e', textAlign: 'center' },
});