'use client';

import { createContext, useContext, useMemo } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { ROLE_THEMES, type RoleKey, type RoleTheme } from '@sanro/config';

const defaultTheme = ROLE_THEMES.STUDENT;

const RoleThemeContext = createContext<RoleTheme>(defaultTheme);

export function RoleThemeProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const role = (user?.role as RoleKey) || 'STUDENT';

  const theme = useMemo(() => ROLE_THEMES[role] || defaultTheme, [role]);

  return (
    <RoleThemeContext.Provider value={theme}>
      <div data-role={role.toLowerCase()}>
        {children}
      </div>
    </RoleThemeContext.Provider>
  );
}

export function useRoleTheme() {
  return useContext(RoleThemeContext);
}

export function useRole() {
  const user = useAuthStore((s) => s.user);
  return (user?.role as RoleKey) || 'STUDENT';
}
