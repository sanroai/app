'use client';

import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, Loader2, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadCount,
} from '@/lib/notification-hooks';

const ENTITY_ROUTES: Record<string, string> = {
  Assessment: '/app/assessments',
  AssessmentAttempt: '/app/assessments',
  RemediationPlan: '/app/remediation',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.max(1, Math.floor(diff / 60_000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const notifications = useNotifications();
  const unread = useUnreadCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = unread.data?.count ?? 0;
  const items =
    notifications.data?.filter((n) => n.type !== 'ACHIEVEMENT_UNLOCKED').slice(0, 30) ?? [];

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      void notifications.refetch();
      void unread.refetch();
    }
  }

  function handleClickNotification(id: string, entityType?: string | null, entityId?: string | null) {
    if (open) void markRead.mutate(id);
    const route = entityType ? ENTITY_ROUTES[entityType] : undefined;
    setOpen(false);
    if (route) router.push(route);
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" aria-label="Notifications">
          <Bell className="h-5 w-5 text-surface-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 sm:w-96 p-0">
        <div className="flex items-center justify-between border-b border-surface-100 px-4 py-3">
          <div className="text-sm font-semibold text-surface-900">Notifications</div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs text-brand-600 hover:text-brand-700"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              {markAllRead.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCheck className="h-3.5 w-3.5" />
              )}
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-[60vh]">
          {notifications.isLoading && (
            <div className="flex items-center gap-2 px-4 py-8 text-sm text-surface-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading notifications...
            </div>
          )}

          {notifications.isError && (
            <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
              <div className="text-sm text-surface-600">Couldn&apos;t load notifications.</div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  void notifications.refetch();
                  void unread.refetch();
                }}
              >
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </Button>
            </div>
          )}

          {!notifications.isLoading && !notifications.isError && items.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-surface-500">
              You&apos;re all caught up.
            </div>
          )}

          {items.length > 0 && (
            <div className="flex flex-col">
              {items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClickNotification(n.id, n.entityType, n.entityId)}
                  className="flex w-full items-start gap-3 border-b border-surface-50 px-4 py-3 text-left transition-colors hover:bg-surface-50"
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      n.readAt ? 'bg-transparent' : 'bg-brand-500'
                    }`}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-surface-900" title={n.title}>
                        {n.title}
                      </span>
                      <span className="shrink-0 text-xs text-surface-400">
                        {timeAgo(n.createdAt)}
                      </span>
                    </span>
                    <span className="mt-0.5 line-clamp-2 text-xs text-surface-600">{n.body}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}