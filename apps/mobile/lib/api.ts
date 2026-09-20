import { useAuthStore } from './auth-store';
import { useOfflineStore, isNetworkError } from './offline';
import { blockedFromBody, blockedFromError, BlockedState, BlockState } from './blocked';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.sanroai.com/api/v1';

export class BlockedAuthError extends Error {
  readonly state: BlockState;

  constructor(state: BlockState, message: string) {
    super(message);
    this.name = 'BlockedAuthError';
    this.state = state;
  }
}

export class OfflineError extends Error {
  constructor() {
    super('You are offline. Answers were saved and will sync automatically.');
    this.name = 'OfflineError';
  }
}

export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
}

export async function api<T>(
  path: string,
  options: {
    method?: string;
    token?: string | null;
    body?: unknown;
    params?: Record<string, string>;
  } = {},
): Promise<T> {
  const { method = 'GET', token, body, params } = options;

  let url = `${API_BASE}${path}`;
  if (params) {
    const qs = new URLSearchParams(params).toString();
    if (qs) url += `?${qs}`;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    const blocked = blockedFromError(err);
    if (blocked) {
      const store = useAuthStore.getState();
      if (store.blocked?.state !== blocked.state) store.setBlocked(blocked);
      throw new BlockedAuthError(blocked.state, blocked.message);
    }
    throw { code: err.code || 'UNKNOWN', message: err.message || res.statusText, statusCode: res.status } as ApiError;
  }

  if (res.status === 204) return undefined as T;
  const data = await res.json();
  const blocked = blockedFromBody(data);
  if (blocked) {
    const store = useAuthStore.getState();
    if (store.blocked?.state !== blocked.state) store.setBlocked(blocked);
  }
  return data;
}

let refreshPromise: Promise<string> | null = null;

export async function refreshAccessToken(refreshToken: string): Promise<string> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      const data = await res.json().catch(() => ({}));
      const blockedPayload = blockedFromBody(data);
      if (blockedPayload) {
        useAuthStore.getState().setBlocked(blockedPayload);
        throw new BlockedAuthError(blockedPayload.state, blockedPayload.message);
      }
      if (!res.ok) {
        const blockedError = blockedFromError(data);
        if (blockedError) {
          useAuthStore.getState().setBlocked(blockedError);
          throw new BlockedAuthError(blockedError.state, blockedError.message);
        }
        throw new Error('Refresh failed');
      }
      const store = useAuthStore.getState();
      store.setAuth({ ...data, refreshToken: data.refreshToken ?? refreshToken });
      return data.accessToken as string;
    } catch (err: unknown) {
      if (err instanceof BlockedAuthError) throw err;
      if (isNetworkError(err)) throw err;
      useAuthStore.getState().logout();
      throw new Error('Session expired');
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function checkAccountState(): Promise<boolean> {
  const store = useAuthStore.getState();
  if (!store.token) return false;
  try {
    const res = await api<unknown>('/auth/account-state', { token: store.token });
    const blocked = blockedFromBody(res);
    if (blocked) {
      const s = useAuthStore.getState();
      if (s.blocked?.state !== blocked.state) s.setBlocked(blocked);
      return false;
    }
    const s = useAuthStore.getState();
    if (s.blocked) s.setBlocked(null);
    return true;
  } catch (err: unknown) {
    if (err instanceof BlockedAuthError) return false;
    return false;
  }
}

export async function apiAuthed<T>(
  path: string,
  options: { method?: string; body?: unknown; params?: Record<string, string>; queueOffline?: boolean } = {},
): Promise<T> {
  const store = useAuthStore.getState();
  let token = store.token;

  if (!token) throw new Error('Not authenticated');

  try {
    return await api<T>(path, { ...options, token });
  } catch (err: unknown) {
    const e = err as { statusCode?: number };
    if (e.statusCode === 401 && store.refreshToken) {
      token = await refreshAccessToken(store.refreshToken);
      return api<T>(path, { ...options, token });
    }
    if (isNetworkError(err)) {
      useOfflineStore.getState().setOffline(true);
      const method = (options.method ?? 'GET').toUpperCase();
      if (options.queueOffline !== false && method !== 'GET') {
        useOfflineStore.getState().enqueue({ method, path, body: options.body });
        throw new OfflineError();
      }
    }
    throw err;
  }
}

let flushPromise: Promise<void> | null = null;

export async function flushOfflineQueue(): Promise<void> {
  if (flushPromise) return flushPromise;

  flushPromise = (async () => {
    const state = useOfflineStore.getState();
    if (state.flushing || state.queue.length === 0) return;
    state.setFlushing(true);
    try {
      for (const req of [...state.queue]) {
        try {
          await apiAuthed(req.path, {
            method: req.method,
            body: req.body,
            queueOffline: false,
          });
          useOfflineStore.getState().remove(req.id);
        } catch (err: unknown) {
          if (isNetworkError(err)) break;
          useOfflineStore.getState().remove(req.id);
        }
      }
    } finally {
      const s = useOfflineStore.getState();
      s.setFlushing(false);
      s.setOffline(s.queue.length > 0);
    }
  })();

  return flushPromise;
}
