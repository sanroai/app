'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UpdateProfileSchema, type UpdateProfile } from '@sanro/validation';
import { useAuthStore } from '@/lib/auth-store';
import { api, ApiError } from '@/lib/api';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle2, Loader2, UserCircle2 } from 'lucide-react';

const LANGUAGE_LABELS: Record<string, string> = {
  EN: 'English',
  MR: 'Marathi',
  HI: 'Hindi',
};

type MeResponse = {
  id: string;
  name?: string;
  email: string;
  language: string;
  avatarUrl?: string | null;
  memberships: Array<{
    role: string;
    institution: { id: string; name: string; type: string };
  }>;
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser, clearSession } = useAuthStore();
  const [meInfo, setMeInfo] = useState<MeResponse | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProfile>({
    resolver: zodResolver(UpdateProfileSchema),
    defaultValues: {
      name: user?.name ?? '',
      phone: user?.phone ?? '',
      language: ((user as { language?: string })?.language ?? 'EN') as 'EN' | 'MR' | 'HI',
    },
  });

  useEffect(() => {
    api<MeResponse>('/users/me')
      .then((info) => {
        setMeInfo(info);
        reset({
          name: info.name ?? user?.name ?? '',
          phone: user?.phone ?? '',
          language: (info.language ?? 'EN') as 'EN' | 'MR' | 'HI',
        });
      })
      .catch(() => setMeInfo(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(values: UpdateProfile) {
    setError(null);
    setSuccess(false);
    try {
      const updated = await api<{ name: string; phone: string | null; language: string }>(
        '/users/me',
        { method: 'PATCH', body: values },
      );
      setUser({
        name: updated.name,
        phone: updated.phone,
      });
      setSuccess(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to update profile');
    }
  }

  const initials = (user?.name ?? '?')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const roleLabel = user?.role?.replace('_', ' ') ?? '';

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Profile</h1>
        <p className="mt-1 text-surface-600">Manage your personal information.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Avatar className="h-16 w-16">
              {meInfo?.avatarUrl ? (
                <AvatarImage src={meInfo.avatarUrl} alt={user?.name ?? ''} />
              ) : null}
              <AvatarFallback className="bg-gradient-to-br from-brand-500 to-purple-600 text-lg font-bold text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-lg font-semibold text-surface-900">{user?.name}</div>
              <div className="text-sm text-surface-500">{user?.email}</div>
              <div className="text-xs font-medium uppercase tracking-wide text-brand-600">
                {roleLabel}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {meInfo && meInfo.memberships.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Institutions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {meInfo.memberships.map((m, i) => (
              <div
                key={`${m.institution.id}-${i}`}
                className="flex items-center justify-between rounded-xl border border-surface-100 bg-surface-50/50 px-4 py-3"
              >
                <div>
                  <div className="text-sm font-semibold text-surface-900">{m.institution.name}</div>
                  <div className="text-xs text-surface-500">{m.institution.type}</div>
                </div>
                <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
                  {m.role.replace('_', ' ')}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Edit Profile</CardTitle>
          <CardDescription>Update your name, phone number and language.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" placeholder="Your name" {...register('name')} />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" placeholder="+91 98765 43210" {...register('phone')} />
              {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select
                value={watch('language') ?? 'EN'}
                onValueChange={(v) => setValue('language', v as 'EN' | 'MR' | 'HI')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LANGUAGE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.language && (
                <p className="text-sm text-red-500">{errors.language.message}</p>
              )}
            </div>

            {success && (
              <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                <CheckCircle2 className="h-4 w-4" /> Profile updated successfully.
              </div>
            )}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                'Save changes'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Session</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-sm text-surface-600">
            Sign out of the app on this device.
          </p>
          <Button
            variant="outline"
            className="text-red-600 hover:text-red-700"
            onClick={() => {
              clearSession();
              router.replace('/login');
            }}
          >
            <UserCircle2 className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}