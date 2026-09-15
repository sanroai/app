'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Role } from '@sanro/types';

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: Role;
  institutionId?: string | null;
  isActive: boolean;
  isSuperAdmin: boolean;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
  memberships: Array<{ institutionId: string; role: Role; institutionName: string }>;
  institution?: { id: string; name: string; role: Role } | null;
};

type AuthState = {
  token: string | null;
  refreshToken: string | null;
  user: SessionUser | null;
  _hasHydrated: boolean;
  setSession: (resp: LoginResponse) => void;
  clearSession: () => void;
  setHasHydrated: (v: boolean) => void;
  refreshTokens: () => Promise<boolean>;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      _hasHydrated: false,
      setSession: (resp) =>
        set({ token: resp.accessToken, refreshToken: resp.refreshToken, user: resp.user }),
      clearSession: () => set({ token: null, refreshToken: null, user: null }),
      setHasHydrated: (v) => set({ _hasHydrated: v }),
      refreshTokens: async () => {
        const currentRefreshToken = useAuthStore.getState().refreshToken;
        if (!currentRefreshToken) return false;
        try {
          const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
          const res = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: currentRefreshToken }),
          });
          if (!res.ok) return false;
          const data = (await res.json()) as { accessToken: string; refreshToken: string };
          set({ token: data.accessToken, refreshToken: data.refreshToken });
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'sanro-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ token: s.token, refreshToken: s.refreshToken, user: s.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

export function authToken(): string | null {
  return useAuthStore.getState().token;
}