import { ReactNode } from 'react';
import { TouchableOpacity, View, ViewStyle, StyleProp } from 'react-native';
import { Colors, Spacing, BorderRadius, Shadow } from '../constants/theme';

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accent?: boolean;
}

export function Card({ children, onPress, style }: CardProps) {
  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[styles.card, style]}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = {
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
};