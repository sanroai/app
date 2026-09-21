'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChangePasswordSchema, UpdateProfileSchema } from '@sanro/validation';
import { useAuthStore } from '@/lib/auth-store';
import { api, ApiError } from '@/lib/api';
import { useMarkAllNotificationsRead, useUnreadCount } from '@/lib/notification-hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  Monitor,
  Moon,
  Palette,
  Save,
  Sun,
  User,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  INSTITUTION_ADMIN: 'Institution Admin',
  TEACHER: 'Teacher',
  STUDENT: 'Student',
  PARENT: 'Parent',
};

type Theme = 'light' | 'dark' | 'system';

function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system';
  return (localStorage.getItem('sanro-theme') as Theme) || 'system';
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
type ProfileInput = { name: string };

export default function SettingsPage() {
  const router = useRouter();
  const clearSession = useAuthStore((s) => s.clearSession);
  const markAllRead = useMarkAllNotificationsRead();
  const unread = useUnreadCount();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [theme, setThemeState] = useState<Theme>('system');
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    setThemeState(getStoredTheme());
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem('sanro-theme', t);
    applyTheme(t);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => { if (theme === 'system') applyTheme('system'); };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '' },
  });

  const profileForm = useForm<ProfileInput>({
    resolver: zodResolver(UpdateProfileSchema.pick({ name: true })),
    defaultValues: { name: user?.name ?? '' },
  });

  useEffect(() => {
    if (user?.name) profileForm.reset({ name: user.name });
  }, [user?.name]);

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

  async function onSaveProfile(values: ProfileInput) {
    setProfileError(null);
    setProfileSuccess(false);
    try {
      await api('/users/me', { method: 'PUT', body: values });
      setUser({ name: values.name });
      setProfileSuccess(true);
    } catch (e) {
      setProfileError(e instanceof ApiError ? e.message : 'Failed to update profile');
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Settings</h1>
        <p className="mt-1 text-surface-600">Manage your profile, appearance, and security.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" /> Profile
          </CardTitle>
          <CardDescription>Your display name and account information.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4">
            <div className="flex items-center gap-4 mb-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-purple-600 text-lg font-bold text-white">
                {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
              </div>
              <div>
                <p className="text-sm font-semibold text-surface-900">{user?.name}</p>
                <p className="text-xs text-surface-500">{user?.email}</p>
                <Badge variant="purple" className="mt-1">
                  {ROLE_LABELS[user?.role ?? ''] ?? user?.role}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profileName">Display name</Label>
              <Input
                id="profileName"
                placeholder="Your name"
                {...profileForm.register('name')}
              />
              {profileForm.formState.errors.name && (
                <p className="text-sm text-red-500">{profileForm.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label>Email</Label>
              <Input value={user?.email ?? ''} disabled />
              <p className="text-xs text-surface-400">Contact support to change your email.</p>
            </div>

            {profileSuccess && (
              <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                <CheckCircle2 className="h-4 w-4" /> Profile updated successfully.
              </div>
            )}
            {profileError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {profileError}
              </div>
            )}

            <Button type="submit" disabled={profileForm.formState.isSubmitting} className="gap-2">
              {profileForm.formState.isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                <><Save className="h-4 w-4" /> Save profile</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

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
            <Palette className="h-4 w-4" /> Appearance
          </CardTitle>
          <CardDescription>Choose how SANRO looks on this device.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {([
              { value: 'light' as const, icon: Sun, label: 'Light' },
              { value: 'dark' as const, icon: Moon, label: 'Dark' },
              { value: 'system' as const, icon: Monitor, label: 'System' },
            ]).map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-5 py-3 text-sm font-medium transition-all ${
                  theme === value
                    ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm'
                    : 'border-surface-200 bg-white text-surface-600 hover:border-surface-300 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:border-surface-600'
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            ))}
          </div>
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
              router.replace('/login');
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