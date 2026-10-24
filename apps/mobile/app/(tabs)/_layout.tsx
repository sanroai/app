import { Tabs } from 'expo-router';
import { Colors } from '../../constants/theme';
import { useAuthStore } from '../../lib/auth-store';
import { useRoleTheme } from '../../lib/role-theme';
import { Icon3D, type Icon3DName } from '../../components/Icon3D';

/**
 * The tab bar is the app menu, so it uses the same premium 3D icons as the web
 * sidebar (`apps/web/app/(dashboard)/layout.tsx`) - no Ionicons glyphs and no
 * emoji, which the user rejected. The artwork is colour, so the inactive state is
 * expressed with opacity rather than a tint colour.
 */
function TabIcon({ name, size, focused }: { name: Icon3DName; size: number; focused: boolean }) {
  return (
    <Icon3D
      name={name}
      size={size + 2}
      style={{ opacity: focused ? 1 : 0.5, marginBottom: -1 }}
    />
  );
}

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
          tabBarIcon: ({ size, focused }) => <TabIcon name="glowing-star" size={size} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: 'Library',
          tabBarIcon: ({ size, focused }) => <TabIcon name="bookshelf" size={size} focused={focused} />,
          href: isStudent ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="tests"
        options={{
          title: 'Assessments',
          tabBarIcon: ({ size, focused }) => <TabIcon name="clipboard" size={size} focused={focused} />,
          href: isStudent ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="ask"
        options={{
          title: 'Ask Sanro AI',
          tabBarIcon: ({ size, focused }) => <TabIcon name="speech-balloon" size={size} focused={focused} />,
          href: isStudent ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="classes"
        options={{
          title: 'Classes',
          tabBarIcon: ({ size, focused }) => <TabIcon name="books" size={size} focused={focused} />,
          href: isTeacher || isAdmin ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="assessments"
        options={{
          title: 'Assess',
          tabBarIcon: ({ size, focused }) => <TabIcon name="clipboard" size={size} focused={focused} />,
          href: isTeacher || isAdmin ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="children"
        options={{
          title: 'Children',
          tabBarIcon: ({ size, focused }) => <TabIcon name="crayon" size={size} focused={focused} />,
          href: isParent ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: 'Me',
          tabBarIcon: ({ size, focused }) => <TabIcon name="waving-hand" size={size} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
