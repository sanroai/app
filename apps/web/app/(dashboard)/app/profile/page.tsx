'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UpdateProfileSchema, type UpdateProfile } from '@sanro/validation';
import { useAuthStore } from '@/lib/auth-store';
import { api, ApiError } from '@/lib/api';
import {
  useAchievements,
  useGamificationProfile,
  useLearningProgress,
} from '@/lib/learning-hooks';
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
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CheckCircle2,
  Flame,
  Loader2,
  Target,
  Trophy,
  UserCircle2,
  Zap,
} from 'lucide-react';
import {
  BadgeGrid,
  LearningProgressBars,
} from '@/lib/learner-progress';

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

  // The mobile profile ("Me") is also the learner's progress hub: XP, streak,
  // mastery, learning progress and badges. The same three endpoints feed both.
  const isStudent = user?.role === 'STUDENT';
  const { data: gamification } = useGamificationProfile({ enabled: isStudent });
  const { data: progress } = useLearningProgress({ enabled: isStudent });
  const { data: achievements } = useAchievements();

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

      {isStudent ? (
        <>
          {/* Progress summary - the same three numbers the mobile profile shows */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="bg-gradient-to-br from-violet-500 to-purple-600 border-0 text-white">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-violet-100 font-medium">Total XP</p>
                    <p className="text-2xl font-bold text-white mt-1">{gamification?.xp ?? 0}</p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-400 to-orange-500 border-0 text-white">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-amber-100 font-medium">Day streak</p>
                    <p className="text-2xl font-bold text-white mt-1">{gamification?.streakDays ?? 0}</p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Flame className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-400 to-teal-500 border-0 text-white">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-emerald-100 font-medium">Mastery</p>
                    <p className="text-2xl font-bold text-white mt-1">
                      {Math.round(progress?.mastery?.averageScore ?? 0)}%
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="mt-3">
                  <Progress
                    value={Math.round(progress?.mastery?.averageScore ?? 0)}
                    className="h-1.5 bg-white/20"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {progress ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Learning progress</CardTitle>
                <CardDescription>
                  Content completed, concepts mastered and average mastery.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LearningProgressBars progress={progress} />
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base">Achievements</CardTitle>
                  <CardDescription>
                    {(achievements?.earned.length ?? 0)} earned ·{' '}
                    {(achievements?.locked.length ?? 0)} remaining
                  </CardDescription>
                </div>
                <Link
                  href="/app/gamification/achievements"
                  className="text-sm font-medium text-brand-600 transition-colors hover:text-brand-700"
                >
                  See all
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {(achievements?.earned.length ?? 0) > 0 ? (
                <BadgeGrid achievements={achievements?.earned ?? []} />
              ) : (
                <p className="py-2 text-sm text-surface-500">
                  Complete learning activities to earn achievements.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100">
                <Trophy className="h-6 w-6 text-amber-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-surface-900">Leaderboard</p>
                <p className="text-sm text-surface-500">
                  See where you rank against the rest of your class
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/app/gamification/leaderboard">Open</Link>
              </Button>
            </CardContent>
          </Card>
        </>
      ) : null}

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