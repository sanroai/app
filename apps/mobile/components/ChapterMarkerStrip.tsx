import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { formatTimestamp, normalizeSegments, type VideoSegment } from '../lib/chapter-hub';

interface Props {
  /** Chapter markers: the points the video is split at. */
  segments?: VideoSegment[] | null;
  /** Called with the marker's start offset when the student taps a chip. */
  onSelect?: (startSeconds: number) => void;
  /** The marker the player is currently at (highlighted chip). */
  activeStartSeconds?: number | null;
  label?: string;
}

/**
 * The chapter-marker strip: a horizontally scrollable row of chips under a
 * video lesson. Each chip is a point the video is split at, so a student can
 * jump straight to "Total Surface Area" instead of scrubbing 40 minutes.
 */
export function ChapterMarkerStrip({ segments, onSelect, activeStartSeconds, label = 'Sections' }: Props) {
  const markers = normalizeSegments(segments);
  if (markers.length === 0) return null;

  // Derived markers come from the chapter's concept list, not from the creator,
  // so the heading says "approximate" instead of implying published chapters.
  const approximate = markers.every((marker) => marker.derived === true);
  const heading = approximate ? `${label} · approximate` : label;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Ionicons name="list" size={12} color={Colors.textSecondary} />
        <Text style={styles.headerText}>{heading}</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        style={styles.scroll}
      >
        {markers.map((marker, index) => {
          const active = activeStartSeconds === marker.startSeconds;
          return (
            <TouchableOpacity
              key={`${marker.startSeconds}-${index}`}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onSelect?.(marker.startSeconds)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`Jump to ${marker.title} at ${formatTimestamp(marker.startSeconds)}`}
            >
              <Text style={[styles.chipTitle, active && styles.chipTitleActive]} numberOfLines={1}>
                {marker.title}
              </Text>
              <Text style={[styles.chipTime, active && styles.chipTimeActive]}>{formatTimestamp(marker.startSeconds)}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: Spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.xs },
  headerText: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary, letterSpacing: 0.3 },
  scroll: { flexGrow: 0 },
  row: { gap: Spacing.sm, paddingRight: Spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    maxWidth: 220,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipTitle: { fontSize: 12, fontWeight: '600', color: Colors.text, flexShrink: 1 },
  chipTitleActive: { color: Colors.white },
  chipTime: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary },
  chipTimeActive: { color: Colors.primaryLight },
});
