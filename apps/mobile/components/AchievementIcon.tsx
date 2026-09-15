import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  flame: 'flame',
  brain: 'fitness',
  star: 'star',
  shield: 'shield-checkmark',
  trophy: 'trophy',
  bolt: 'flash',
  medal: 'ribbon',
  crown: 'diamond',
};

const COLOR_MAP: Record<string, string> = {
  flame: '#f59e0b',
  brain: '#8b5cf6',
  star: '#eab308',
  shield: '#10b981',
  trophy: '#f97316',
  bolt: '#06b6d4',
  medal: '#ec4899',
  crown: '#facc15',
};

interface Props {
  name: string;
  icon: string;
  color?: string;
  size?: number;
  unlocked?: boolean;
}

export function AchievementIcon({ name, icon, color, size = 48, unlocked = true }: Props) {
  const iconName = ICON_MAP[icon] ?? 'star';
  const bg = color ?? COLOR_MAP[icon] ?? Colors.primary;

  return (
    <View
      style={[
        styles.wrap,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: unlocked ? bg + '20' : Colors.surfaceSecondary },
      ]}
    >
      <Ionicons name={iconName} size={size * 0.45} color={unlocked ? bg : Colors.textMuted} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
});