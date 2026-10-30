import { View, Text, StyleSheet, TouchableOpacity, StyleProp, ViewStyle, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Icon3D, hasIcon3D } from './Icon3D';
import { subjectBanner, subjectMonogram } from '../lib/subject-art';
import { Colors, Pastel, Ink, BorderRadius, Spacing, Shadow } from '../constants/theme';

export interface SubjectVisual {
  icon: string;
  bg: string;
  ink: string;
}

const SCI = { icon: 'microscope', bg: Pastel.mint, ink: Ink.mint };
const MATH = { icon: 'abacus', bg: Pastel.violet, ink: Ink.violet };
const ENG = { icon: 'speech-balloon', bg: Pastel.peach, ink: Ink.peach };
const HIN = { icon: 'open-book', bg: Pastel.rose, ink: Ink.rose };
const SST = { icon: 'books', bg: Pastel.sky, ink: Ink.sky };
const ART = { icon: 'palette', bg: Pastel.lemon, ink: Ink.lemon };
const GENERIC = { icon: 'bookshelf', bg: Pastel.lavender, ink: Ink.lavender };

export function resolveSubject(name: string | null | undefined): SubjectVisual {
  const n = (name ?? '').toLowerCase();
  if (n.includes('scien')) return SCI;
  if (n.includes('math')) return MATH;
  if (n.includes('english')) return ENG;
  if (n.includes('hindi')) return HIN;
  if (n.includes('sanskrit')) return { icon: 'pencil', bg: Pastel.sand, ink: Ink.sand };
  if (n.includes('social') || n.includes('sst') || n.includes('history') || n.includes('geo') || n.includes('civic') || n.includes('economics')) return SST;
  if (n.includes('art') || n.includes('craft') || n.includes('creative')) return ART;
  return GENERIC;
}

const BADGE_ICONS: Record<string, string> = {
  star: 'star',
  clipboard: 'clipboard',
  flame: 'fire',
  trophy: 'trophy',
  medal: 'medal-1st',
  bulb: 'light-bulb',
  rocket: 'rocket',
  target: 'target',
  brain: 'brain',
  book: 'books',
  sparkles: 'sparkles',
  party: 'party-popper',
  check: 'check',
  chart: 'chart',
  zap: 'sparkles',
  clock: 'hourglass',
};

const BADGE_TINTS: string[] = [
  Pastel.sand,
  Pastel.sky,
  Pastel.rose,
  Pastel.mint,
  Pastel.violet,
  Pastel.peach,
  Pastel.lemon,
  Pastel.lavender,
];

export function resolveAchievement(icon: string | null | undefined, index = 0): { icon: string; bg: string } {
  const bg = BADGE_TINTS[index % BADGE_TINTS.length];
  const key = (icon ?? '').trim().toLowerCase();
  // Empty/unknown icon must resolve to a real asset; a missing glyph renders as a
  // blank square because Icon3D returns null for names with no registered PNG (BUG-K).
  if (!key) return { icon: 'glowing-star', bg };
  const mapped = BADGE_ICONS[key];
  const hit = mapped ?? Object.keys(BADGE_ICONS).find((c) => key.includes(c) || c.includes(key));
  const name = hit || 'glowing-star';
  return {
    icon: hasIcon3D(name) ? name : 'glowing-star',
    bg,
  };
}

export function SubjectCard({
  name,
  subtitle,
  progress,
  code,
  onPress,
  style,
}: {
  name: string;
  subtitle?: string;
  progress?: number;
  code?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const v = resolveSubject(name);
  return (
    <TouchableOpacity style={[styles.subjectCard, { backgroundColor: v.bg }, style]} onPress={onPress} activeOpacity={0.85}>
      {/* The same photograph the web subject card uses, cropped to the same
          16:9 box so every card in the grid is exactly the same size. The
          subject is identified by a typographic monogram, not a glossy icon. */}
      <View style={styles.subjectBannerWrap}>
        <Image source={subjectBanner(name, code)} style={styles.subjectBanner} resizeMode="cover" />
        <View style={[styles.subjectBannerTint, { backgroundColor: v.ink }]} />
        <View style={styles.subjectMonogram}>
          <Text style={styles.subjectMonogramText}>{subjectMonogram(name, code)}</Text>
        </View>
      </View>
      <View style={styles.subjectBody}>
        <Text style={styles.subjectTitle} numberOfLines={1}>
          {name}
        </Text>
        {subtitle ? (
          <Text style={styles.subjectSub} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
        {progress !== undefined ? (
          <View style={styles.subjectFooter}>
            <View style={styles.subjectTrack}>
              <View style={[styles.subjectFill, { width: `${Math.max(2, Math.min(progress, 100))}%`, backgroundColor: v.ink }]} />
            </View>
            <Text style={[styles.subjectPct, { color: v.ink }]}>{Math.round(progress)}%</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export function StatTile({
  icon,
  value,
  label,
  tint = Pastel.violet,
  onPress,
  style,
}: {
  icon: string;
  value: string;
  label: string;
  tint?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const Wrapper: typeof View | typeof TouchableOpacity = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      style={[styles.statTile, style]}
      {...(onPress ? { onPress, activeOpacity: 0.85 } : {})}
    >
      <View style={[styles.statIconWrap, { backgroundColor: tint }]}>
        <Icon3D name={icon} size={26} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Wrapper>
  );
}

export function SectionHeader({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionLabel ? (
        <TouchableOpacity onPress={onAction} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function ProgressBar({ pct, color = Colors.primary, height = 10 }: { pct: number; color?: string; height?: number }) {
  const clamped = Math.max(0, Math.min(pct, 100));
  return (
    <View style={[styles.barTrack, { height, borderRadius: height / 2 }]}>
      <View
        style={{
          width: `${clamped}%`,
          height,
          borderRadius: height / 2,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

export function Chevron() {
  return <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />;
}

const styles = StyleSheet.create({
  subjectCard: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  subjectBannerWrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: Colors.surfaceSecondary,
    position: 'relative',
  },
  subjectBanner: { width: '100%', height: '100%' },
  subjectBannerTint: { ...StyleSheet.absoluteFillObject, opacity: 0.16 },
  subjectBannerIcon: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  subjectMonogram: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    minWidth: 44,
    height: 44,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectMonogramText: { color: '#ffffff', fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  subjectBody: { flex: 1, minHeight: 104, padding: Spacing.md },
  subjectTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  subjectSub: { fontSize: 11, color: Colors.textSecondary, marginTop: 2, lineHeight: 15 },
  subjectFooter: { marginTop: 'auto', paddingTop: Spacing.md },
  subjectTrack: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.85)', overflow: 'hidden' },
  subjectFill: { height: 6, borderRadius: 3 },
  subjectPct: { fontSize: 11, fontWeight: '700', marginTop: 4 },
  statTile: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    ...Shadow.sm,
  },
  statIconWrap: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  statValue: { fontSize: 20, fontWeight: '800', color: Colors.text },
  statLabel: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary, marginTop: 2 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xxl,
    marginBottom: Spacing.md,
    marginHorizontal: Spacing.lg,
  },
  sectionTitle: { fontSize: 19, fontWeight: '800', color: Colors.text, letterSpacing: -0.3 },
  sectionAction: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  barTrack: { backgroundColor: '#ece5db', overflow: 'hidden' },
});
