import { ReactNode } from 'react';
import { TouchableOpacity, View, ViewStyle, StyleProp } from 'react-native';
import { Colors, Spacing, BorderRadius, Shadow } from '../constants/theme';

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accent?: boolean;
}

export function Card({ children, onPress, style, accent }: CardProps) {
  const accentStyle = accent ? { borderLeftWidth: 3, borderLeftColor: '#ef4444' } : { borderLeftWidth: 0 };
  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[styles.card, accentStyle, style]}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.card, accentStyle, style]}>{children}</View>;
}

const styles = {
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
};