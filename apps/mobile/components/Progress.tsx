import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius } from '../constants/theme';

interface Props {
  label: string;
  value: number;
  max?: number;
  color?: string;
  showPercent?: boolean;
  height?: number;
}

export function ProgressBar({ label, value, max = 100, color = Colors.primary, showPercent = true, height = 8 }: Props) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        {showPercent ? <Text style={styles.pct}>{Math.round(pct)}%</Text> : null}
      </View>
      <View style={[styles.track, { height, borderRadius: height / 2 }]}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color, borderRadius: height / 2 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: Spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  pct: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  track: { backgroundColor: Colors.surfaceSecondary, overflow: 'hidden' },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0 },
});