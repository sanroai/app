import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../lib/api';
import { Colors, Spacing, BorderRadius, Shadow } from '../../constants/theme';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string }>();
  const token = typeof params.token === 'string' ? params.token : '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleReset = async () => {
    if (password.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Please re-enter the same password.');
      return;
    }
    setLoading(true);
    try {
      await api('/auth/reset-password', { method: 'POST', body: { token, password } });
      setDone(true);
    } catch (e: unknown) {
      const err = e as { message?: string };
      Alert.alert('Error', err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle-outline" size={64} color={Colors.error || '#ef4444'} />
          <Text style={styles.title}>Invalid reset link</Text>
          <Text style={styles.subtitle}>This password reset link is missing its token.</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.replace('/(auth)/forgot-password')}>
            <Text style={styles.buttonText}>Request new link</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  if (done) {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.centerContent}>
          <Ionicons name="checkmark-circle-outline" size={64} color={Colors.success || '#22c55e'} />
          <Text style={styles.title}>Password updated</Text>
          <Text style={styles.subtitle}>You can now sign in with your new password.</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.buttonText}>Back to Sign in</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.logoWrap}>
            <Ionicons name="lock-open-outline" size={36} color={Colors.white} />
          </View>
          <Text style={styles.brand}>Set New Password</Text>
          <Text style={styles.tagline}>Choose a strong password with at least 8 characters</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color={Colors.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="New password"
              placeholderTextColor={Colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />
          </View>

          <View style={[styles.inputWrap, { marginTop: Spacing.md }]}>
            <Ionicons name="lock-closed-outline" size={18} color={Colors.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="Confirm password"
              placeholderTextColor={Colors.textMuted}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!loading}
            />
          </View>

          <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleReset} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Updating…' : 'Reset password'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace('/(auth)/login')} disabled={loading}>
            <Text style={styles.backLink}>Back to Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 40 },
  header: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingBottom: 30 },
  logoWrap: { width: 72, height: 72, borderRadius: BorderRadius.xl, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', ...Shadow.lg },
  brand: { marginTop: Spacing.md, fontSize: 24, fontWeight: '700', color: Colors.text },
  tagline: { marginTop: Spacing.xs, fontSize: 14, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: 40 },
  card: { backgroundColor: Colors.surface, marginHorizontal: Spacing.lg, padding: Spacing.xl, borderRadius: BorderRadius.xl, ...Shadow.md },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceSecondary, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  input: { flex: 1, paddingVertical: 12, paddingHorizontal: Spacing.sm, fontSize: 15, color: Colors.text },
  button: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: 14, alignItems: 'center', marginTop: Spacing.xl },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
  backLink: { textAlign: 'center', marginTop: Spacing.lg, fontSize: 14, color: Colors.primary, fontWeight: '500' },
  title: { fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm, marginTop: Spacing.lg },
  subtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: Spacing.xl },
});
