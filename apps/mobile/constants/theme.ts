export interface RoleTheme {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  accentLight: string;
  gradientStart: string;
  gradientEnd: string;
}

export const ROLE_THEMES: Record<string, RoleTheme> = {
  STUDENT: {
    primary: '#7c3aed',
    primaryLight: '#a78bfa',
    primaryDark: '#5b21b6',
    accent: '#8b5cf6',
    accentLight: '#ede9fe',
    gradientStart: '#7c3aed',
    gradientEnd: '#9333ea',
  },
  TEACHER: {
    primary: '#4f46e5',
    primaryLight: '#818cf8',
    primaryDark: '#3730a3',
    accent: '#6366f1',
    accentLight: '#e0e7ff',
    gradientStart: '#4f46e5',
    gradientEnd: '#2563eb',
  },
  PARENT: {
    primary: '#0d9488',
    primaryLight: '#5eead4',
    primaryDark: '#115e59',
    accent: '#14b8a6',
    accentLight: '#ccfbf1',
    gradientStart: '#0d9488',
    gradientEnd: '#059669',
  },
  INSTITUTION_ADMIN: {
    primary: '#1e40af',
    primaryLight: '#60a5fa',
    primaryDark: '#1e3a8a',
    accent: '#3b82f6',
    accentLight: '#dbeafe',
    gradientStart: '#1e40af',
    gradientEnd: '#4338ca',
  },
  SUPER_ADMIN: {
    primary: '#475569',
    primaryLight: '#94a3b8',
    primaryDark: '#334155',
    accent: '#6366f1',
    accentLight: '#e0e7ff',
    gradientStart: '#475569',
    gradientEnd: '#4f46e5',
  },
};

export const Colors = {
  primary: '#7c3aed',
  primaryLight: '#a78bfa',
  primaryDark: '#5b21b6',
  secondary: '#ec4899',
  accent: '#f59e0b',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  background: '#faf7f2',
  surface: '#ffffff',
  surfaceSecondary: '#f3efe8',
  text: '#1c1917',
  textSecondary: '#78716c',
  textMuted: '#a8a29e',
  border: '#ece5db',
  borderLight: '#f5f0e8',
  info: '#3b82f6',
  purple: '#8b5cf6',
  pink: '#ec4899',
  indigo: '#4f46e5',
  amber: '#fffbeb',
  amberBorder: '#fde68a',
  cream: '#faf7f2',
  white: '#ffffff',
  black: '#000000',
};

export const Pastel = {
  violet: '#ede9fe',
  indigo: '#e0e7ff',
  sky: '#e0f2fe',
  mint: '#d1fae5',
  peach: '#ffedd5',
  rose: '#ffe4e6',
  lemon: '#fef9c3',
  lavender: '#f3e8ff',
  sand: '#fef3c7',
};

export const Ink = {
  violet: '#6d28d9',
  indigo: '#4338ca',
  sky: '#0369a1',
  mint: '#047857',
  peach: '#c2410c',
  rose: '#be123c',
  lemon: '#a16207',
  lavender: '#7e22ce',
  sand: '#b45309',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
};

export const Typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodySmall: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  caption: { fontSize: 11, fontWeight: '500' as const, letterSpacing: 0.3 },
  label: { fontSize: 13, fontWeight: '600' as const },
  button: { fontSize: 16, fontWeight: '600' as const, letterSpacing: 0.2 },
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
};
