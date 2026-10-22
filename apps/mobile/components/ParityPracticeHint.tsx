import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Pastel } from '../constants/theme';

/**
 * The wording the web shows when a concept has no practice questions yet.
 * Kept in one place so the mobile learning path can render the same sentence
 * the web renders (`apps/web/components/learning-path.tsx`).
 */
export const NO_PRACTICE_QUESTIONS_HINT =
  'No practice questions yet — take a test to unlock practice.';

interface Props {
  message?: string;
}

export function ParityPracticeHint({ message = NO_PRACTICE_QUESTIONS_HINT }: Props) {
  return (
    <View style={styles.wrap} accessibilityRole="text">
      <Ionicons name="information-circle-outline" size={14} color={Colors.textSecondary} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Pastel.lemon,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 11, color: Colors.textSecondary, flexShrink: 1 },
});
