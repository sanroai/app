import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../lib/api';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../../constants/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      await api('/auth/forgot-password', { method: 'POST', body: { email: email.trim().toLowerCase() } });
      setSent(true);
    } catch (e: unknown) {
      const err = e as { message?: string };
      Alert.alert('Error', err.message || 'Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.centerContent}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle-outline" size={64} color={Colors.success || '#22c55e'} />
          </View>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.subtitle}>
            We&apos;ve sent password reset instructions to{'\n'}<Text style={{ fontWeight: '600', color: Colors.text }}>{email}</Text>
          </Text>
          <TouchableOpacity style={styles.button} onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.buttonText}>Back to Sign in</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <View style={styles.logoWrap}>
          <Ionicons name="key-outline" size={36} color={Colors.white} />
        </View>
        <Text style={styles.brand}>Reset Password</Text>
        <Text style={styles.tagline}>Enter your email to receive a reset link</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.inputWrap}>
          <Ionicons name="mail-outline" size={18} color={Colors.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder="Email address"
            placeholderTextColor={Colors.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />
        </View>

        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleReset} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Sending…' : 'Send reset link'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} disabled={loading}>
          <Text style={styles.backLink}>Back to Sign in</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingBottom: 30 },
  logoWrap: { width: 72, height: 72, borderRadius: BorderRadius.xl, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', ...Shadow.lg },
  brand: { marginTop: Spacing.md, fontSize: 24, fontWeight: '700', color: Colors.text },
  tagline: { marginTop: Spacing.xs, fontSize: 14, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: 40 },
  card: { backgroundColor: Colors.surface, marginHorizontal: Spacing.lg, padding: Spacing.xl, borderRadius: BorderRadius.xl, ...Shadow.md },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl },
  successIcon: { marginBottom: Spacing.lg },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceSecondary, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  input: { flex: 1, paddingVertical: 12, paddingHorizontal: Spacing.sm, fontSize: 15, color: Colors.text },
  button: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: 14, alignItems: 'center', marginTop: Spacing.xl },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
  backLink: { textAlign: 'center', marginTop: Spacing.lg, fontSize: 14, color: Colors.primary, fontWeight: '500' },
  title: { fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  subtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: Spacing.xl },
});
