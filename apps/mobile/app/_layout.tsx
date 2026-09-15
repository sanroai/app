import { useEffect } from 'react';
import { AppState } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../lib/auth-store';
import { QueryProvider } from '../lib/query-provider';
import { Colors } from '../constants/theme';
import { useOfflineStore } from '../lib/offline';
import { flushOfflineQueue } from '../lib/api';

function AuthGate() {
  const router = useRouter();
  const segments = useSegments();
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s._hasHydrated);

  useEffect(() => {
    if (!hydrated) return;
    const inAuth = segments[0] === '(auth)';
    if (!token && !inAuth) router.replace('/(auth)/login');
    if (token && inAuth) router.replace('/(tabs)');
  }, [hydrated, token, segments, router]);

  return null;
}

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const unsub = useOfflineStore.subscribe((s) => {
      if (s.queue.length > 0) flushOfflineQueue();
    });
    flushOfflineQueue();
    return unsub;
  }, []);

  useEffect(() => {
    const listener = AppState.addEventListener('change', (s) => {
      if (s === 'active') flushOfflineQueue();
    });
    const interval = setInterval(() => flushOfflineQueue(), 30000);
    return () => {
      listener.remove();
      clearInterval(interval);
    };
  }, []);

  return (
    <QueryProvider>
      <StatusBar style="dark" />
      <AuthGate />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="learn/[boardId]/[grade]/[subjectId]" options={{ headerShown: true, title: 'Chapters', headerTintColor: Colors.primary }} />
        <Stack.Screen name="learn/chapter/[chapterId]" options={{ headerShown: true, title: 'Chapter', headerTintColor: Colors.primary }} />
        <Stack.Screen name="concept/[conceptId]" options={{ headerShown: true, title: 'Concept', headerTintColor: Colors.primary }} />
        <Stack.Screen name="practice/[practiceId]" options={{ headerShown: true, title: 'Practice', headerTintColor: Colors.primary }} />
        <Stack.Screen name="attempt/[attemptId]" options={{ headerShown: true, title: 'Assessment', headerTintColor: Colors.primary }} />
        <Stack.Screen name="quiz/[conceptId]" options={{ headerShown: true, title: 'Quick Quiz', headerTintColor: Colors.primary }} />
        <Stack.Screen name="flashcards/[conceptId]" options={{ headerShown: true, title: 'Flashcards', headerTintColor: Colors.primary }} />
        <Stack.Screen name="challenge/[conceptId]" options={{ headerShown: true, title: 'Challenge', headerTintColor: Colors.primary }} />
        <Stack.Screen name="ask/[conceptId]" options={{ headerShown: true, title: 'Ask SANRO', headerTintColor: Colors.primary }} />
        <Stack.Screen name="leaderboard" options={{ headerShown: true, title: 'Leaderboard', headerTintColor: Colors.primary }} />
      </Stack>
    </QueryProvider>
  );
}