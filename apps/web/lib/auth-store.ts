'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Role, AccountStateResponse, BlockedAccountResponse } from '@sanro/types';
import { apiUrl } from '@/lib/api';
import { toBlockedState, isBlockedCode, type BlockedState } from '@/lib/blocked-state';

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
  blocked: BlockedState | null;
  _hasHydrated: boolean;
  setSession: (resp: LoginResponse) => void;
  setUser: (patch: Partial<SessionUser>) => void;
  setBlocked: (state: BlockedState | null) => void;
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
      blocked: null,
      _hasHydrated: false,
      setSession: (resp) =>
        set({ token: resp.accessToken, refreshToken: resp.refreshToken, user: resp.user }),
      setUser: (patch) =>
        set((s) => ({ user: s.user ? { ...s.user, ...patch } : null })),
      setBlocked: (state) => set({ blocked: state }),
      clearSession: () => set({ token: null, refreshToken: null, user: null, blocked: null }),
      setHasHydrated: (v) => set({ _hasHydrated: v }),
      refreshTokens: async () => {
        const currentRefreshToken = useAuthStore.getState().refreshToken;
        if (!currentRefreshToken) return false;
        try {
          const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.sanroai.com/api/v1';
          const res = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: currentRefreshToken }),
          });
          if (!res.ok) return false;
          const data = (await res.json()) as
            | { accessToken: string; refreshToken: string }
            | Partial<BlockedAccountResponse>;
          if (data && 'state' in data && isBlockedCode(data.state) && !('accessToken' in data)) {
            set({ blocked: toBlockedState(data as BlockedAccountResponse) });
            return false;
          }
          set({
            token: (data as { accessToken: string }).accessToken,
            refreshToken: (data as { refreshToken: string }).refreshToken,
          });
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'sanro-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        token: s.token,
        refreshToken: s.refreshToken,
        user: s.user,
        blocked: s.blocked,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

export function authToken(): string | null {
  return useAuthStore.getState().token;
}

export async function accountState(): Promise<{ access: boolean; blocked: BlockedState | null }> {
  const { token, setBlocked } = useAuthStore.getState();
  if (!token) return { access: false, blocked: null };

  let res: Response;
  try {
    res = await fetch(`${apiUrl()}/auth/account-state`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
  } catch {
    return { access: true, blocked: null };
  }

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  const resp = body as Partial<AccountStateResponse> | null;

  if (resp && resp.access === false && isBlockedCode(resp.state ?? undefined)) {
    const bs = toBlockedState(resp as BlockedAccountResponse);
    setBlocked(bs);
    return { access: false, blocked: bs };
  }

  if (resp && resp.access !== false) {
    if (useAuthStore.getState().blocked) setBlocked(null);
    return { access: true, blocked: null };
  }

  if (res.status === 401) return { access: false, blocked: null };
  return { access: true, blocked: null };
}