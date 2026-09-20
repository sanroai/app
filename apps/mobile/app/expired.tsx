import { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../lib/auth-store';
import { checkAccountState } from '../lib/api';
import { setCachedEntitlement } from '../lib/offline-auth';
import {
  BlockedState,
  BlockState,
  blockedTitle,
  isBlockedState,
} from '../lib/blocked';
import { Colors, Spacing, BorderRadius, Shadow } from '../constants/theme';

const GUIDANCE: Record<BlockState, string> = {
  SUBSCRIPTION_EXPIRED: 'Ask your institution administrator to renew the subscription.',
  INSTITUTION_SUSPENDED: 'Access is controlled by your institution administrator.',
  INSTITUTION_ARCHIVED: 'Access is controlled by your institution administrator.',
  INSTITUTION_PENDING: 'Access is controlled by your institution administrator.',
  USER_DISABLED: 'Your account was disabled by an administrator.',
  MEMBERSHIP_DEACTIVATED: 'Your access was removed by an institution administrator.',
};

const ICONS: Record<BlockState, keyof typeof Ionicons.glyphMap> = {
  SUBSCRIPTION_EXPIRED: 'timer-outline',
  INSTITUTION_SUSPENDED: 'shield-outline',
  INSTITUTION_ARCHIVED: 'archive-outline',
  INSTITUTION_PENDING: 'time-outline',
  USER_DISABLED: 'person-remove-outline',
  MEMBERSHIP_DEACTIVATED: 'person-remove-outline',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatExpiry(iso?: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (isNaN(date.getTime())) return null;
  const day = String(date.getDate()).padStart(2, '0');
  return `${day} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export default function ExpiredScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ state?: string | string[] }>();
  const storeBlocked = useAuthStore((s) => s.blocked);
  const [checking, setChecking] = useState(false);

  const resolved = useMemo<BlockedState>(() => {
    const paramState = typeof params.state === 'string' ? params.state : null;
    if (isBlockedState(paramState)) {
      return storeBlocked && storeBlocked.state === paramState
        ? storeBlocked
        : { state: paramState, message: blockedTitle(paramState), institution: null };
    }
    return (
      storeBlocked ?? {
        state: 'SUBSCRIPTION_EXPIRED',
        message: 'Your access to Sanro AI is currently restricted.',
        institution: null,
      }
    );
  }, [params.state, storeBlocked]);

  useEffect(() => {
    void setCachedEntitlement({
      state: 'expired',
      expiresAt: resolved.institution?.expiresAt ?? null,
      message: resolved.message,
      blockState: resolved.state,
    }).catch(() => {});
  }, [resolved]);

  const handleTryAgain = async () => {
    setChecking(true);
    try {
      const ok = await checkAccountState();
      if (ok) {
        router.replace('/(tabs)');
        return;
      }
      Alert.alert('Still blocked', 'Your account is still blocked. Contact your institution administrator if you believe this is a mistake.');
    } finally {
      setChecking(false);
    }
  };

  const handleSignOut = () => {
    useAuthStore.getState().logout();
    router.replace('/(auth)/login');
  };

  const institution = resolved.institution ?? null;
  const expiresLabel = formatExpiry(institution?.expiresAt);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name={ICONS[resolved.state]} size={44} color={Colors.primary} />
        </View>

        <Text style={styles.brand}>Sanro AI</Text>
        <Text style={styles.heading}>{blockedTitle(resolved.state)}</Text>

        <Text style={styles.message}>{resolved.message}</Text>

        {institution ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Institution</Text>
            <Text style={styles.cardInstitution}>{institution.name || 'Your institution'}</Text>
            <Text style={styles.cardMeta}>
              {expiresLabel ? `Subscription valid until ${expiresLabel}` : 'Subscription validity is not on file'}
            </Text>
            <View style={styles.chip}>
              <Ionicons name="mail-outline" size={13} color={Colors.textSecondary} />
              <Text style={styles.chipText}>{institution.supportContact ?? 'support@sanroai.com'}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Need help?</Text>
            <Text style={styles.cardMeta}>Contact your institution administrator for support.</Text>
            <View style={styles.chip}>
              <Ionicons name="mail-outline" size={13} color={Colors.textSecondary} />
              <Text style={styles.chipText}>support@sanroai.com</Text>
            </View>
          </View>
        )}

        <Text style={styles.guidance}>{GUIDANCE[resolved.state]}</Text>

        <TouchableOpacity
          style={[styles.primaryButton, checking && styles.buttonDisabled]}
          onPress={handleTryAgain}
          disabled={checking}
        >
          <Text style={styles.primaryButtonText}>{checking ? 'Checking…' : 'Try again'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleSignOut}>
          <Text style={styles.secondaryButtonText}>Sign out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxxl },
  iconWrap: { width: 88, height: 88, borderRadius: BorderRadius.xxl, backgroundColor: Colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center', ...Shadow.md },
  brand: { marginTop: Spacing.lg, fontSize: 13, fontWeight: '600', color: Colors.textSecondary, letterSpacing: 0.3 },
  heading: { marginTop: Spacing.sm, fontSize: 22, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  message: { marginTop: Spacing.md, fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  card: { marginTop: Spacing.xl, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, width: '100%', ...Shadow.sm },
  cardLabel: { fontSize: 11, fontWeight: '600', color: Colors.textMuted, letterSpacing: 0.3, textTransform: 'uppercase' },
  cardInstitution: { marginTop: Spacing.xs, fontSize: 18, fontWeight: '600', color: Colors.text },
  cardMeta: { marginTop: Spacing.xs, fontSize: 13, color: Colors.textSecondary },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.md, alignSelf: 'flex-start', backgroundColor: Colors.surfaceSecondary, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: 6 },
  chipText: { fontSize: 13, color: Colors.textSecondary },
  guidance: { marginTop: Spacing.xl, fontSize: 13, color: Colors.warning, textAlign: 'center', lineHeight: 19 },
  primaryButton: { marginTop: Spacing.xxl, backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: 14, alignItems: 'center', alignSelf: 'stretch' },
  primaryButtonText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
  buttonDisabled: { opacity: 0.6 },
  secondaryButton: { marginTop: Spacing.md, paddingVertical: 12, alignItems: 'center' },
  secondaryButtonText: { color: Colors.textSecondary, fontSize: 15, fontWeight: '500' },
});