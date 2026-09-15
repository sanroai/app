import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  style?: object;
}

export function Button({ title, onPress, variant = 'primary', size = 'md', icon, loading, disabled, style }: ButtonProps) {
  const bg =
    variant === 'primary' ? Colors.primary :
    variant === 'secondary' ? Colors.surfaceSecondary :
    variant === 'outline' ? 'transparent' :
    variant === 'ghost' ? 'transparent' : Colors.error;

  const fg =
    variant === 'primary' ? Colors.white :
    variant === 'secondary' ? Colors.text :
    variant === 'outline' ? Colors.primary :
    variant === 'ghost' ? Colors.primary : Colors.white;

  const border = variant === 'outline' ? { borderWidth: 1, borderColor: Colors.primary } : {};

  const padding =
    size === 'sm' ? { paddingVertical: 8, paddingHorizontal: Spacing.md } :
    size === 'lg' ? { paddingVertical: 16, paddingHorizontal: Spacing.xxl } :
    { paddingVertical: 12, paddingHorizontal: Spacing.lg };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.btn, { backgroundColor: bg }, border, padding, (disabled || loading) && styles.disabled, style]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={18} color={fg} style={styles.icon} /> : null}
          <Text style={[styles.text, { color: fg }]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
  },
  icon: { marginRight: 6 },
  text: { fontSize: 15, fontWeight: '600' },
  disabled: { opacity: 0.5 },
});