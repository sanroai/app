'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

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

async function fetchNotifications(): Promise<NotificationItem[]> {
  return api<NotificationItem[]>('/users/me/notifications');
}

async function fetchUnreadCount(): Promise<UnreadCount> {
  return api<UnreadCount>('/users/me/notifications/unread');
}

async function markNotificationRead(id: string) {
  return api(`/users/me/notifications/${id}/read`, { method: 'POST' });
}

async function markAllNotificationsRead() {
  return api('/users/me/notifications/read-all', { method: 'POST' });
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: fetchUnreadCount,
    refetchInterval: 30_000,
    staleTime: 0,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
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
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      qc.setQueryData<NotificationItem[]>(['notifications'], (current) =>
        current?.map((n) => (n.readAt ? n : { ...n, readAt: new Date().toISOString() })),
      );
      void qc.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    },
  });
}