import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Pastel } from '../constants/theme';

interface Props {
  message: string;
  onRetry: () => void;
  retrying?: boolean;
  /** Compact card instead of a full-screen block (used for a partial failure). */
  inline?: boolean;
}

/**
 * The error state of the Remediation screen: the screen is never blank - it
 * says what failed and offers a retry.
 */
export function RemediationErrorState({ message, onRetry, retrying, inline }: Props) {
  if (inline) {
    return (
      <View style={styles.inlineWrap}>
        <View style={styles.inlineIcon}>
          <Ionicons name="alert-circle" size={20} color={Colors.error} />
        </View>
        <View style={styles.inlineBody}>
          <Text style={styles.inlineTitle}>Could not load this part</Text>
          <Text style={styles.inlineMessage}>{message}</Text>
        </View>
        <TouchableOpacity
          style={styles.inlineBtn}
          onPress={onRetry}
          disabled={retrying}
          accessibilityRole="button"
          accessibilityLabel="Retry loading the remediation data"
        >
          {retrying ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={styles.inlineBtnText}>Retry</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.icon}>
        <Ionicons name="alert-circle" size={40} color={Colors.error} />
      </View>
      <Text style={styles.title}>We could not load your remediation plan</Text>
      <Text style={styles.message}>{message}</Text>
      <TouchableOpacity
        style={[styles.retryBtn, retrying && styles.retryBtnBusy]}
        onPress={onRetry}
        disabled={retrying}
        accessibilityRole="button"
        accessibilityLabel="Retry loading the remediation data"
      >
        {retrying ? (
          <ActivityIndicator size="small" color={Colors.white} />
        ) : (
          <>
            <Ionicons name="refresh" size={16} color={Colors.white} />
            <Text style={styles.retryText}>Try again</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl, backgroundColor: Colors.background },
  icon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Pastel.rose,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { marginTop: Spacing.lg, fontSize: 16, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  message: { marginTop: Spacing.sm, fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.xl,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  retryBtnBusy: { opacity: 0.6 },
  retryText: { color: Colors.white, fontSize: 14, fontWeight: '700' },
  inlineWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Pastel.rose,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  inlineIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  inlineBody: { flex: 1 },
  inlineTitle: { fontSize: 13, fontWeight: '700', color: Colors.text },
  inlineMessage: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  inlineBtn: {
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  inlineBtnText: { color: Colors.primary, fontSize: 13, fontWeight: '700' },
});
