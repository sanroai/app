import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../lib/auth-store';
import { QueryProvider } from '../lib/query-provider';
import { Colors } from '../constants/theme';
import { useOfflineStore } from '../lib/offline';
import { flushOfflineQueue, checkAccountState } from '../lib/api';
import { hydrateCachedEntitlement } from '../lib/offline-auth';
import { routeForBlocked } from '../lib/blocked';
import { ErrorBoundary } from '../components/ErrorBoundary';

function AuthGate() {
  const router = useRouter();
  const segments = useSegments();
  const token = useAuthStore((s) => s.token);
  const blocked = useAuthStore((s) => s.blocked);
  const hydrated = useAuthStore((s) => s._hasHydrated);

  useEffect(() => {
    if (!hydrated) return;
    const inAuth = segments[0] === '(auth)';
    const inExpired = segments[0] === 'expired';
    if (blocked) {
      if (!inExpired) router.replace(routeForBlocked(blocked.state));
      return;
    }
    if (!token && !inAuth) router.replace('/(auth)/login');
    if (token && inAuth) router.replace('/(tabs)');
  }, [hydrated, token, blocked, segments, router]);

  return null;
}

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const hydrateOffline = useOfflineStore((s) => s.hydrate);
  const token = useAuthStore((s) => s.token);
  const blocked = useAuthStore((s) => s.blocked);
  const hydrated = useAuthStore((s) => s._hasHydrated);
  const accountChecked = useRef(false);

  useEffect(() => {
    hydrate();
    hydrateOffline();
    void hydrateCachedEntitlement().catch(() => {});
  }, [hydrate, hydrateOffline]);

  useEffect(() => {
    if (hydrated && token && !blocked && !accountChecked.current) {
      accountChecked.current = true;
      void checkAccountState().catch(() => {});
    }
  }, [hydrated, token, blocked]);

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <QueryProvider>
            <StatusBar style="dark" />
            <AuthGate />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="expired" options={{ headerShown: false }} />
            <Stack.Screen name="learn/[boardId]/[grade]/[subjectId]" options={{ headerShown: true, title: 'Chapters', headerTintColor: Colors.primary }} />
            <Stack.Screen name="learn/chapter/[chapterId]" options={{ headerShown: true, title: 'Chapter', headerTintColor: Colors.primary }} />
            <Stack.Screen name="chapter/[chapterId]" options={{ headerShown: true, title: 'Chapter', headerTintColor: Colors.primary }} />
            <Stack.Screen name="textbook/[chapterId]" options={{ headerShown: true, title: 'Textbook', headerTintColor: Colors.primary }} />
            <Stack.Screen name="concept/[conceptId]" options={{ headerShown: true, title: 'Concept', headerTintColor: Colors.primary }} />
            <Stack.Screen name="remediation" options={{ headerShown: false }} />
            <Stack.Screen name="practice/[practiceId]" options={{ headerShown: true, title: 'Practice', headerTintColor: Colors.primary }} />
            <Stack.Screen name="attempt/[attemptId]" options={{ headerShown: true, title: 'Assessment', headerTintColor: Colors.primary }} />
            <Stack.Screen name="flashcards/[conceptId]" options={{ headerShown: true, title: 'Practice', headerTintColor: Colors.primary }} />
            <Stack.Screen name="ask/[conceptId]" options={{ headerShown: true, title: 'Ask Sanro AI', headerTintColor: Colors.primary }} />
            <Stack.Screen name="leaderboard" options={{ headerShown: true, title: 'Leaderboard', headerTintColor: Colors.primary }} />
            <Stack.Screen name="profile-edit" options={{ headerShown: true, title: 'Edit Profile', headerTintColor: Colors.primary }} />
          </Stack>
          </QueryProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}