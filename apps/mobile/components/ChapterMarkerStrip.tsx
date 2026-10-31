import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { formatTimestamp, normalizeSegments, type VideoSegment } from '../lib/chapter-hub';

interface Props {
  /** Chapter markers: the points the video is split at. */
  segments?: VideoSegment[] | null;
  /** Called with the marker's start offset when the student taps a row. */
  onSelect?: (startSeconds: number) => void;
  /** The marker the player is currently at (highlighted row). */
  activeStartSeconds?: number | null;
  label?: string;
  /** Start closed. Used on the chapter hub, where the concept rows already
   *  carry the timings and a 14-section list would push Practise off-screen. */
  collapsible?: boolean;
}

/**
 * The chapter-marker list: every section of the video stacked vertically under
 * the player, timestamp first. Each row is a point the video is split at, so a
 * student can jump straight to "Total Surface Area" instead of scrubbing 40
 * minutes. Nothing is hidden behind a horizontal scroller - a section the
 * student cannot see is a section they will not jump to.
 */
export function ChapterMarkerStrip({
  segments,
  onSelect,
  activeStartSeconds,
  label = 'Sections',
  collapsible = false,
}: Props) {
  const [open, setOpen] = useState(!collapsible);
  const markers = normalizeSegments(segments);
  if (markers.length === 0) return null;

  // Derived markers come from the chapter's concept list, not from the creator,
  // so the heading says "approximate" instead of implying published chapters.
  const approximate = markers.every((marker) => marker.derived === true);
  const heading = approximate ? `${label} · approximate` : label;

  return (
    <View style={styles.wrap}>
      {collapsible ? (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setOpen((value) => !value)}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          accessibilityLabel={`${heading}, ${markers.length} sections`}
        >
          <View style={styles.header}>
            <Ionicons name="list" size={12} color={Colors.textSecondary} />
            <Text style={styles.headerText}>{heading}</Text>
            <Text style={styles.headerCount}>
              · {markers.length} section{markers.length === 1 ? '' : 's'}
            </Text>
          </View>
          <Ionicons name={open ? 'chevron-down' : 'chevron-forward'} size={14} color={Colors.textSecondary} />
        </TouchableOpacity>
      ) : (
        <View style={styles.header}>
          <Ionicons name="list" size={12} color={Colors.textSecondary} />
          <Text style={styles.headerText}>{heading}</Text>
        </View>
      )}
      {open ? (
        <View style={styles.list}>
          {markers.map((marker, index) => {
            const active = activeStartSeconds === marker.startSeconds;
            return (
              <TouchableOpacity
                key={`${marker.startSeconds}-${index}`}
                style={[styles.row, active && styles.rowActive]}
                onPress={() => onSelect?.(marker.startSeconds)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`Jump to ${marker.title} at ${formatTimestamp(marker.startSeconds)}`}
              >
                <Text style={[styles.time, active && styles.timeActive]}>{formatTimestamp(marker.startSeconds)}</Text>
                <Text style={[styles.title, active && styles.titleActive]}>{marker.title}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: Spacing.sm },
  headerButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.xs },
  headerText: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary, letterSpacing: 0.3 },
  headerCount: { fontSize: 11, fontWeight: '400', color: Colors.textSecondary },
  list: { gap: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
  },
  rowActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  time: {
    width: 48,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  timeActive: { color: Colors.primaryLight },
  title: { flex: 1, fontSize: 13, fontWeight: '600', color: Colors.text },
  titleActive: { color: Colors.white },
});
