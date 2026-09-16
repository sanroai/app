import { useMemo } from 'react';
import { useAuthStore } from './auth-store';
import { ROLE_THEMES, type RoleTheme } from '../constants/theme';

export function useRoleTheme(): RoleTheme {
  const user = useAuthStore((s) => s.user);
  const role = user?.role || 'STUDENT';
  return useMemo(() => ROLE_THEMES[role] || ROLE_THEMES.STUDENT, [role]);
}

export function useRole(): string {
  const user = useAuthStore((s) => s.user);
  return user?.role || 'STUDENT';
}
