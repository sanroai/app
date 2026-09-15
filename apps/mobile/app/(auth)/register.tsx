import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../lib/api';
import { useAuthStore, AuthUser, AuthMembership } from '../../lib/auth-store';
import { cacheSuccessfulLogin } from '../../lib/offline-auth';
import { Colors, Spacing, BorderRadius, Shadow } from '../../constants/theme';

interface AuthPayload {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  memberships: AuthMembership[];
}

export default function RegisterScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [institutionCode, setInstitutionCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Missing details', 'Name, email and password are required.');
      return;
    }
    setLoading(true);
    try {
      const data = await api<AuthPayload>('/auth/register', {
        method: 'POST',
        body: {
          name,
          email: email.trim().toLowerCase(),
          password,
          role: 'STUDENT',
          institutionCode: institutionCode.trim() || undefined,
        },
      });
      setAuth(data);
      void cacheSuccessfulLogin(email.trim().toLowerCase(), password, data);
      router.replace('/(tabs)');
    } catch (err: unknown) {
      const e = err as { message?: string };
      Alert.alert('Registration failed', e.message || 'Could not create the account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Join Sanro AI and start your academic journey.</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Full name</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="person-outline" size={18} color={Colors.textSecondary} />
            <TextInput style={styles.input} placeholder="Your name" value={name} onChangeText={setName} editable={!loading} />
          </View>

          <Text style={styles.label}>Email</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={18} color={Colors.textSecondary} />
            <TextInput style={styles.input} placeholder="you@example.com" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" editable={!loading} />
          </View>

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color={Colors.textSecondary} />
            <TextInput style={styles.input} placeholder="Min 8 characters" value={password} onChangeText={setPassword} secureTextEntry editable={!loading} />
          </View>

          <Text style={styles.label}>School / institute code (optional)</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="business-outline" size={18} color={Colors.textSecondary} />
            <TextInput style={styles.input} placeholder="e.g. SANRO-001" value={institutionCode} onChangeText={setInstitutionCode} autoCapitalize="characters" editable={!loading} />
          </View>

          <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleRegister} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Creating…' : 'Create account'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingTop: 60 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontSize: 15, color: Colors.textSecondary },
  title: { fontSize: 24, fontWeight: '700', color: Colors.text, marginTop: 24 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  card: { backgroundColor: Colors.surface, marginTop: 20, padding: Spacing.xl, borderRadius: BorderRadius.xl, ...Shadow.md },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginTop: Spacing.lg },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceSecondary, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, marginTop: 6, borderWidth: 1, borderColor: Colors.border },
  input: { flex: 1, paddingVertical: 12, paddingHorizontal: Spacing.sm, fontSize: 15, color: Colors.text },
  button: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: 14, alignItems: 'center', marginTop: Spacing.xl },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
});