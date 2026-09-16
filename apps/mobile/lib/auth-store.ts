import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  institutionId: string;
  isActive: boolean;
  isSuperAdmin: boolean;
}

export interface AuthMembership {
  id: string;
  role: string;
  institution: { id: string; name: string; type: string };
  status: string;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  memberships: AuthMembership[];
  _hasHydrated: boolean;
  setAuth: (data: {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
    memberships: AuthMembership[];
  }) => void;
  logout: () => void;
  hydrate: () => Promise<void>;
  hasHydrated: () => boolean;
}

const TOKEN_KEY = 'sanro-token';
const REFRESH_KEY = 'sanro-refresh';
const USER_KEY = 'sanro-user';
const MEMBERSHIPS_KEY = 'sanro-memberships';

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  refreshToken: null,
  user: null,
  memberships: [],
  _hasHydrated: false,

  setAuth: (data) => {
    SecureStore.setItem(TOKEN_KEY, data.accessToken);
    SecureStore.setItem(REFRESH_KEY, data.refreshToken);
    SecureStore.setItem(USER_KEY, JSON.stringify(data.user));
    SecureStore.setItem(MEMBERSHIPS_KEY, JSON.stringify(data.memberships));
    set({
      token: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user,
      memberships: data.memberships,
    });
  },

  logout: () => {
    SecureStore.deleteItemAsync(TOKEN_KEY);
    SecureStore.deleteItemAsync(REFRESH_KEY);
    SecureStore.deleteItemAsync(USER_KEY);
    SecureStore.deleteItemAsync(MEMBERSHIPS_KEY);
    set({ token: null, refreshToken: null, user: null, memberships: [] });
  },

  hydrate: async () => {
    const [token, refreshToken, userStr, membershipsStr] = await Promise.all([
      SecureStore.getItemAsync(TOKEN_KEY),
      SecureStore.getItemAsync(REFRESH_KEY),
      SecureStore.getItemAsync(USER_KEY),
      SecureStore.getItemAsync(MEMBERSHIPS_KEY),
    ]);
    set({
      token,
      refreshToken,
      user: userStr ? JSON.parse(userStr) : null,
      memberships: membershipsStr ? JSON.parse(membershipsStr) : [],
      _hasHydrated: true,
    });
  },

  hasHydrated: () => get()._hasHydrated,
}));
