'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  channel: string;
  entityType?: string | null;
  entityId?: string | null;
  readAt?: string | null;
  createdAt: string;
};

export type UnreadCount = { count: number };

function useToken() {
  return useAuthStore((s) => s.token);
}

/**
 * The notification list. Loaded only when the bell is opened: every dashboard
 * page carries the bell, and fetching the whole list on each navigation was one
 * of four API round trips a screen had to finish before it settled.
 */
export function useNotifications({ enabled = true }: { enabled?: boolean } = {}) {
  const token = useToken();
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => api<NotificationItem[]>('/users/me/notifications', { token }),
    enabled: !!token && enabled,
    refetchInterval: enabled ? 60_000 : false,
    staleTime: 60_000,
  });
}

export function useUnreadCount() {
  const token = useToken();
  return useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => api<UnreadCount>('/users/me/notifications/unread', { token }),
    enabled: !!token,
    // The badge can be two minutes old; polling it every 30 s kept a free,
    // single-CPU API busy with a request no student asked for.
    refetchInterval: 120_000,
    staleTime: 60_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: (id: string) => api(`/users/me/notifications/${id}/read`, { method: 'POST', token }),
    onSuccess: (_data, id) => {
      qc.setQueryData<NotificationItem[]>(
        ['notifications'],
        (current) => current?.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
      );
      void qc.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: () => api('/users/me/notifications/read-all', { method: 'POST', token }),
    onSuccess: () => {
      qc.setQueryData<NotificationItem[]>(['notifications'], (current) =>
        current?.map((n) => (n.readAt ? n : { ...n, readAt: new Date().toISOString() })),
      );
      void qc.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    },
  });
}