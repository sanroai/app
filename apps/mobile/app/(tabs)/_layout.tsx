import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
import { useAuthStore } from '../../lib/auth-store';
import { useRoleTheme } from '../../lib/role-theme';

export default function TabsLayout() {
  const user = useAuthStore((s) => s.user);
  const theme = useRoleTheme();
  const role = user?.role ?? 'STUDENT';
  const isStudent = role === 'STUDENT';
  const isTeacher = role === 'TEACHER';
  const isParent = role === 'PARENT';
  const isAdmin = role === 'INSTITUTION_ADMIN' || role === 'SUPER_ADMIN';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: 'Learn',
          tabBarIcon: ({ color, size }) => <Ionicons name="book" size={size} color={color} />,
          href: isStudent ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="practice"
        options={{
          title: 'Practice',
          tabBarIcon: ({ color, size }) => <Ionicons name="flash" size={size} color={color} />,
          href: isStudent ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="tests"
        options={{
          title: 'Tests',
          tabBarIcon: ({ color, size }) => <Ionicons name="document-text" size={size} color={color} />,
          href: isStudent ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="classes"
        options={{
          title: 'Classes',
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
          href: isTeacher || isAdmin ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="assessments"
        options={{
          title: 'Assess',
          tabBarIcon: ({ color, size }) => <Ionicons name="clipboard" size={size} color={color} />,
          href: isTeacher || isAdmin ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="children"
        options={{
          title: 'Children',
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
          href: isParent ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: 'Me',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
