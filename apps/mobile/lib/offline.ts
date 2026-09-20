import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { useAuthStore } from './auth-store';
import { isCachedEntitlementExpiredSync } from './offline-auth';

const QUEUE_KEY = 'sanro-offline-queue';

export interface QueuedRequest {
  id: string;
  method: string;
  path: string;
  body?: unknown;
  createdAt: number;
}

export class NetworkError extends Error {
  constructor() {
    super('Network request failed');
    this.name = 'NetworkError';
  }
}

export function isNetworkError(err: unknown): boolean {
  return (
    err instanceof NetworkError ||
    err instanceof TypeError ||
    ((err as { message?: string })?.message === 'Network request failed')
  );
}

interface OfflineState {
  queue: QueuedRequest[];
  hydrated: boolean;
  flushing: boolean;
  offline: boolean;
  setOffline: (value: boolean) => void;
  setFlushing: (value: boolean) => void;
  enqueue: (req: Omit<QueuedRequest, 'id' | 'createdAt'>) => void;
  remove: (id: string) => void;
  hydrate: () => Promise<void>;
}

function bodyKey(body?: unknown): string {
  try {
    return JSON.stringify(body ?? {});
  } catch {
    return String(body);
  }
}

export const useOfflineStore = create<OfflineState>((set, get) => ({
  queue: [],
  hydrated: false,
  flushing: false,
  offline: false,
  setOffline: (value) => set({ offline: value }),
  setFlushing: (value) => set({ flushing: value }),
  enqueue: (req) => {
    if (useAuthStore.getState().blocked || isCachedEntitlementExpiredSync()) return;
    const { queue } = get();
    const key = bodyKey(req.body);
    const deduped = queue.filter(
      (q) => !(q.method === req.method && q.path === req.path && bodyKey(q.body) === key),
    );
    const next = [
      ...deduped,
      {
        ...req,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: Date.now(),
      },
    ];
    set({ queue: next, offline: true });
    AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(next)).catch(() => {});
  },
  remove: (id) => {
    const { queue } = get();
    const next = queue.filter((q) => q.id !== id);
    set({ queue: next });
    AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(next)).catch(() => {});
  },
  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const raw = await AsyncStorage.getItem(QUEUE_KEY);
      const queue = raw ? (JSON.parse(raw) as QueuedRequest[]) : [];
      set({ queue, hydrated: true, offline: queue.length > 0 });
    } catch {
      set({ hydrated: true });
    }
  },
}));