import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
import { useAuthStore } from '../../lib/auth-store';

export default function TabsLayout() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? 'STUDENT';
  const isStudent = role === 'STUDENT';
  const isTeacher = role === 'TEACHER';
  const isParent = role === 'PARENT';
  const isAdmin = role === 'INSTITUTION_ADMIN' || role === 'SUPER_ADMIN';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
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

      {isStudent && (
        <>
          <Tabs.Screen
            name="learn"
            options={{
              title: 'Learn',
              tabBarIcon: ({ color, size }) => <Ionicons name="book" size={size} color={color} />,
            }}
          />
          <Tabs.Screen
            name="practice"
            options={{
              title: 'Practice',
              tabBarIcon: ({ color, size }) => <Ionicons name="flash" size={size} color={color} />,
            }}
          />
          <Tabs.Screen
            name="tests"
            options={{
              title: 'Tests',
              tabBarIcon: ({ color, size }) => <Ionicons name="document-text" size={size} color={color} />,
            }}
          />
        </>
      )}

      {(isTeacher || isAdmin) && (
        <>
          <Tabs.Screen
            name="classes"
            options={{
              title: 'Classes',
              tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
            }}
          />
          <Tabs.Screen
            name="assessments"
            options={{
              title: 'Assess',
              tabBarIcon: ({ color, size }) => <Ionicons name="clipboard" size={size} color={color} />,
            }}
          />
        </>
      )}

      {isParent && (
        <Tabs.Screen
          name="children"
          options={{
            title: 'Children',
              tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
          }}
        />
      )}

      <Tabs.Screen
        name="me"
        options={{
          title: 'Me',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />

      {/* Hide student-only tabs for non-student roles */}
      {!isStudent && <Tabs.Screen name="learn" options={{ href: null }} />}
      {!isStudent && <Tabs.Screen name="practice" options={{ href: null }} />}
      {!isStudent && <Tabs.Screen name="tests" options={{ href: null }} />}
      {!isTeacher && !isAdmin && <Tabs.Screen name="classes" options={{ href: null }} />}
      {!isTeacher && !isAdmin && <Tabs.Screen name="assessments" options={{ href: null }} />}
      {!isParent && <Tabs.Screen name="children" options={{ href: null }} />}
    </Tabs>
  );
}