import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
import { useAuthStore } from '../../lib/auth-store';
import { useRoleTheme } from '../../lib/role-theme';

/**
 * The tab bar is the app menu, so it uses one line-icon set at one weight
 * (Ionicons outline when idle, filled when active) tinted by the role theme.
 * The rendered 3D artwork stays on content (lessons, AR, subject banners) and is
 * deliberately not used here: a row of small glossy objects in the menu reads as
 * emoji, which is what the flat glyphs replaced.
 */
type TabGlyph = { active: keyof typeof Ionicons.glyphMap; idle: keyof typeof Ionicons.glyphMap };

const GLYPHS: Record<string, TabGlyph> = {
  index: { active: 'home', idle: 'home-outline' },
  learn: { active: 'library', idle: 'library-outline' },
  tests: { active: 'document-text', idle: 'document-text-outline' },
  ask: { active: 'chatbubble-ellipses', idle: 'chatbubble-ellipses-outline' },
  classes: { active: 'people', idle: 'people-outline' },
  assessments: { active: 'clipboard', idle: 'clipboard-outline' },
  children: { active: 'happy', idle: 'happy-outline' },
  me: { active: 'person-circle', idle: 'person-circle-outline' },
};

function TabIcon({ name, color, focused }: { name: string; color: string; focused: boolean }) {
  const glyph = GLYPHS[name] ?? GLYPHS.index;
  return (
    <Ionicons
      name={focused ? glyph.active : glyph.idle}
      size={23}
      color={color}
      style={{ marginBottom: -1 }}
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
          tabBarIcon: ({ color, focused }) => <TabIcon name="index" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: 'Library',
          tabBarIcon: ({ color, focused }) => <TabIcon name="learn" color={color} focused={focused} />,
          href: isStudent ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="tests"
        options={{
          title: 'Assessments',
          tabBarIcon: ({ color, focused }) => <TabIcon name="tests" color={color} focused={focused} />,
          href: isStudent ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="ask"
        options={{
          title: 'Ask Sanro AI',
          tabBarIcon: ({ color, focused }) => <TabIcon name="ask" color={color} focused={focused} />,
          href: isStudent ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="classes"
        options={{
          title: 'Classes',
          tabBarIcon: ({ color, focused }) => <TabIcon name="classes" color={color} focused={focused} />,
          href: isTeacher || isAdmin ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="assessments"
        options={{
          title: 'Assess',
          tabBarIcon: ({ color, focused }) => <TabIcon name="assessments" color={color} focused={focused} />,
          href: isTeacher || isAdmin ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="children"
        options={{
          title: 'Children',
          tabBarIcon: ({ color, focused }) => <TabIcon name="children" color={color} focused={focused} />,
          href: isParent ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: 'Me',
          tabBarIcon: ({ color, focused }) => <TabIcon name="me" color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
