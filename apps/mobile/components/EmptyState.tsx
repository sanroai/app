import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../constants/theme';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
}

export function EmptyState({ icon, title, subtitle }: Props) {
  return (
    <View style={styles.wrap}>
      <Ionicons name={icon} size={48} color={Colors.textMuted} />
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl },
  title: { marginTop: Spacing.md, fontSize: 16, fontWeight: '600', color: Colors.textSecondary, textAlign: 'center' },
  sub: { marginTop: 4, fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
});