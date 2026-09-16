'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChangePasswordSchema } from '@sanro/validation';
import { useAuthStore } from '@/lib/auth-store';
import { api, ApiError } from '@/lib/api';
import { useMarkAllNotificationsRead, useUnreadCount } from '@/lib/notification-hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Loader2,
  Lock,
  LogOut,
} from 'lucide-react';
import { useEffect, useState } from 'react';

type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

export default function SettingsPage() {
  const clearSession = useAuthStore((s) => s.clearSession);
  const markAllRead = useMarkAllNotificationsRead();
  const unread = useUnreadCount();
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '' },
  });

  useEffect(() => {
    if (!unread.isSuccess) void unread.refetch();
  }, [unread]);

  async function onChangePassword(values: ChangePasswordInput) {
    setPasswordError(null);
    setPasswordSuccess(false);
    try {
      await api('/auth/change-password', { method: 'POST', body: values });
      setPasswordSuccess(true);
      reset({ currentPassword: '', newPassword: '' });
    } catch (e) {
      setPasswordError(e instanceof ApiError ? e.message : 'Failed to change password');
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Settings</h1>
        <p className="mt-1 text-surface-600">Account security and notification preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4" /> Change Password
          </CardTitle>
          <CardDescription>
            Use your current password to set a new one. All other sessions will be signed out.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onChangePassword)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                {...register('currentPassword')}
              />
              {errors.currentPassword && (
                <p className="text-sm text-red-500">{errors.currentPassword.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                {...register('newPassword')}
              />
              {errors.newPassword && (
                <p className="text-sm text-red-500">{errors.newPassword.message}</p>
              )}
            </div>

            {passwordSuccess && (
              <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                <CheckCircle2 className="h-4 w-4" /> Password changed successfully.
              </div>
            )}
            {passwordError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {passwordError}
              </div>
            )}

            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Updating...
                </>
              ) : (
                'Update password'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4" /> Notifications
          </CardTitle>
          <CardDescription>
            In-app notifications appear in the bell icon in the header. Mark everything as read
            here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-surface-600">
              {unread.data && unread.data.count > 0 ? (
                <>
                  You have{' '}
                  <span className="font-semibold text-surface-900">{unread.data.count}</span> unread
                  notification{unread.data.count > 1 ? 's' : ''}.
                </>
              ) : (
                'You\'re all caught up.'
              )}
            </div>
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending || (unread.data?.count ?? 0) === 0}
            >
              {markAllRead.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCheck className="h-4 w-4" />
              )}
              Mark all as read
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <LogOut className="h-4 w-4" /> Account
          </CardTitle>
          <CardDescription>Sign out of Sanro AI on this device.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="text-red-600 hover:text-red-700"
            onClick={() => {
              clearSession();
              window.location.href = '/login';
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}