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

export function useNotifications() {
  const token = useToken();
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => api<NotificationItem[]>('/users/me/notifications', { token }),
    enabled: !!token,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useUnreadCount() {
  const token = useToken();
  return useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => api<UnreadCount>('/users/me/notifications/unread', { token }),
    enabled: !!token,
    refetchInterval: 30_000,
    staleTime: 0,
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