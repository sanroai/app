import {
  isBlockedCode,
  isBlockedResponseBody,
  toBlockedState,
  type BlockedStateCode,
} from '@/lib/blocked-state';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'https://api.sanroai.com/api/v1';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly details?: unknown[],
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
  signal?: AbortSignal;
};

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  const { useAuthStore } = await import('@/lib/auth-store');
  const store = useAuthStore.getState();
  if (!store.refreshToken) return false;
  if (isRefreshing && refreshPromise) return refreshPromise;
  isRefreshing = true;
  refreshPromise = store.refreshTokens();
  const result = await refreshPromise;
  isRefreshing = false;
  refreshPromise = null;
  return result;
}

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token, signal } = options;
  const headers: Record<string, string> = {};

  const { useAuthStore } = await import('@/lib/auth-store');
  const blocked = useAuthStore.getState().blocked;
  if (blocked) {
    throw new ApiError(blocked.message, 403, blocked.state, undefined, undefined);
  }

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  if (!isFormData && body !== undefined) headers['Content-Type'] = 'application/json';
  const resolvedToken = token === undefined ? useAuthStore.getState().token : token;
  if (resolvedToken) headers['Authorization'] = `Bearer ${resolvedToken}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? (isFormData ? body : JSON.stringify(body)) : undefined,
      signal,
      cache: 'no-store',
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') throw err;
    throw new ApiError('Network error - please check your connection.', 0);
  }

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (isBlockedResponseBody(payload)) {
    const bs = toBlockedState(payload);
    const { useAuthStore: blockedStore } = await import('@/lib/auth-store');
    blockedStore.getState().setBlocked(bs);
    throw new ApiError(bs.message, res.status, bs.state);
  }

  if (!res.ok) {
    const p = payload as Record<string, unknown> | null;
    if (p && isBlockedCode(typeof p.code === 'string' ? p.code : undefined)) {
      const state = p.code as BlockedStateCode;
      const bs = toBlockedState({
        state,
        message: typeof p.message === 'string' ? p.message : state,
        institution: null,
      });
      const { useAuthStore: blockedStore } = await import('@/lib/auth-store');
      blockedStore.getState().setBlocked(bs);
      throw new ApiError(
        bs.message,
        res.status,
        state,
        Array.isArray(p.details) ? (p.details as unknown[]) : undefined,
        typeof p.requestId === 'string' ? p.requestId : undefined,
      );
    }
    const message =
      typeof p?.message === 'string' ? p.message : `Request failed with status ${res.status}`;
    throw new ApiError(
      message,
      res.status,
      typeof p?.code === 'string' ? p.code : undefined,
      Array.isArray(p?.details) ? (p.details as unknown[]) : undefined,
      typeof p?.requestId === 'string' ? p.requestId : undefined,
    );
  }

  return payload as T;
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  try {
    return await apiRequest<T>(path, options);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      const { useAuthStore } = await import('@/lib/auth-store');
      const store = useAuthStore.getState();
      if (store.blocked) throw err;
      const hadSession = Boolean(store.token || store.refreshToken || options.token);
      if (!hadSession) throw err;
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        const newToken = useAuthStore.getState().token;
        return await apiRequest<T>(path, { ...options, token: newToken });
      }
      if (useAuthStore.getState().blocked) throw err;
      useAuthStore.getState().clearSession();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    throw err;
  }
}

export function apiUrl(): string {
  return API_URL;
}
