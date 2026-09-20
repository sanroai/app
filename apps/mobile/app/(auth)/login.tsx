import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api, BlockedAuthError } from '../../lib/api';
import { useAuthStore, AuthUser, AuthMembership } from '../../lib/auth-store';
import { useOfflineStore, isNetworkError } from '../../lib/offline';
import { cacheSuccessfulLogin, verifyOfflineLogin, setCachedEntitlement, OfflineEntitlementError } from '../../lib/offline-auth';
import { blockedFromBody, routeForBlocked } from '../../lib/blocked';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../../constants/theme';

interface AuthPayload {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  memberships: AuthMembership[];
}

export default function LoginScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing details', 'Enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const data = await api<AuthPayload | { state?: string }>('/auth/login', {
        method: 'POST',
        body: { email: email.trim().toLowerCase(), password },
      });
      const blocked = blockedFromBody(data);
      if (blocked) {
        useAuthStore.getState().setBlocked(blocked);
        void setCachedEntitlement({
          state: 'expired',
          expiresAt: blocked.institution?.expiresAt ?? null,
          message: blocked.message,
          blockState: blocked.state,
        });
        router.replace(routeForBlocked(blocked.state));
        return;
      }
      const session = data as AuthPayload;
      setAuth(session);
      void cacheSuccessfulLogin(email, password, session, { state: 'ok', expiresAt: null });
      setOfflineMode(false);
      router.replace('/(tabs)');
    } catch (err: unknown) {
      if (err instanceof BlockedAuthError) {
        router.replace(routeForBlocked(err.state));
        return;
      }
      if (err instanceof OfflineEntitlementError) {
        useAuthStore.getState().setBlocked({ state: err.blockState, message: err.message, institution: null });
        router.replace(routeForBlocked(err.blockState));
        return;
      }
      const e = err as { message?: string };
      if (isNetworkError(err)) {
        try {
          const cached = await verifyOfflineLogin(email, password);
          if (cached) {
            setAuth(cached);
            useOfflineStore.getState().setOffline(true);
            setOfflineMode(true);
            router.replace('/(tabs)');
            return;
          }
        } catch (offlineErr: unknown) {
          if (offlineErr instanceof OfflineEntitlementError) {
            useAuthStore.getState().setBlocked({ state: offlineErr.blockState, message: offlineErr.message, institution: null });
            router.replace(routeForBlocked(offlineErr.blockState));
            return;
          }
          throw offlineErr;
        }
        Alert.alert('You are offline', 'Could not reach the server and no saved login was found for this account. Sign in once online to enable offline access.');
        return;
      }
      Alert.alert('Login failed', e.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <View style={styles.logoWrap}>
          <Ionicons name="school-outline" size={40} color={Colors.white} />
        </View>
        <Text style={styles.brand}>Sanro AI</Text>
        <Text style={styles.tagline}>Academic intelligence for every student</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to continue learning.</Text>

        <View style={styles.inputWrap}>
          <Ionicons name="mail-outline" size={18} color={Colors.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={Colors.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />
        </View>

        <View style={styles.inputWrap}>
          <Ionicons name="lock-closed-outline" size={18} color={Colors.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={Colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />
        </View>

        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleLogin} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Signing in…' : 'Sign in'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')} disabled={loading}>
          <Text style={styles.forgotLink}>Forgot password?</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(auth)/register')} disabled={loading}>
          <Text style={styles.switchLink}>
            New here? <Text style={styles.switchLinkStrong}>Create an account</Text>
          </Text>
        </TouchableOpacity>

        {offlineMode ? (
          <View style={styles.offlineNote}>
            <Ionicons name="cloud-offline-outline" size={14} color={Colors.warning} />
            <Text style={styles.offlineNoteText}>Signed in with saved details while offline.</Text>
          </View>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingBottom: 30 },
  logoWrap: { width: 84, height: 84, borderRadius: BorderRadius.xxl, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', ...Shadow.lg },
  brand: { marginTop: Spacing.md, fontSize: 26, fontWeight: '700', color: Colors.text },
  tagline: { marginTop: Spacing.xs, fontSize: 14, color: Colors.textSecondary },
  card: { backgroundColor: Colors.surface, marginHorizontal: Spacing.lg, padding: Spacing.xl, borderRadius: BorderRadius.xl, ...Shadow.md },
  title: { fontSize: 22, fontWeight: '700', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceSecondary, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, marginTop: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  input: { flex: 1, paddingVertical: 12, paddingHorizontal: Spacing.sm, fontSize: 15, color: Colors.text },
  button: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: 14, alignItems: 'center', marginTop: Spacing.xl },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
  switchLink: { textAlign: 'center', marginTop: Spacing.lg, fontSize: 14, color: Colors.textSecondary },
  switchLinkStrong: { color: Colors.primary, fontWeight: '600' },
  forgotLink: { textAlign: 'center', marginTop: Spacing.md, fontSize: 13, color: Colors.primary, fontWeight: '500' },
  offlineNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: Spacing.lg },
  offlineNoteText: { fontSize: 12, color: Colors.textSecondary, flexShrink: 1 },
});