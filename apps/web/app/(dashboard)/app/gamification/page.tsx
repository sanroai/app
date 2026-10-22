'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  useGamificationProfile,
  useLeaderboard,
  useAchievements,
  useLearningProgress,
} from '@/lib/learning-hooks';
import { useAuthStore } from '@/lib/auth-store';
import { useRole } from '@/lib/role-theme';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner, ErrorBanner } from '@/components/ui';
import { Trophy, Flame, Star, Award, ChevronRight, Zap, Target, TrendingUp, Brain, ClipboardList, Rocket, Heart, BookOpen, Users, Settings, Crown, Medal, Lock } from 'lucide-react';
import { cn } from '@/lib/cn';
import { type LucideIcon } from 'lucide-react';
import {
  BadgeGrid,
  LearningProgressBars,
} from '@/lib/learner-progress';

const ICON_MAP: Record<string, LucideIcon> = {
  brain: Brain,
  flame: Flame,
  star: Star,
  trophy: Trophy,
  award: Award,
  zap: Zap,
  target: Target,
  rocket: Rocket,
  heart: Heart,
  book: BookOpen,
  clipboard: ClipboardList,
};

function AchievementIcon({ name, className }: { name?: string | null; className?: string }) {
  if (!name) return <Trophy className={className} />;
  const Icon = ICON_MAP[name.toLowerCase()] ?? Trophy;
  return <Icon className={className} />;
}

const ADMIN_ROLES = new Set(['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'TEACHER']);

const RANK_STYLES: Record<number, string> = {
  1: 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white',
  2: 'bg-gradient-to-br from-gray-300 to-gray-400 text-white',
  3: 'bg-gradient-to-br from-orange-300 to-orange-500 text-white',
};

const RANK_ICONS: Record<number, typeof Trophy> = {
  1: Crown,
  2: Medal,
  3: Medal,
};

function StudentProfile({ profile: profileData }: { profile: any }) {
  const p = profileData ?? {};
  const xpForLevel = p.xpForLevel ?? 500;
  const levelProgress = xpForLevel > 0 ? Math.round(((p.xpInLevel ?? 0) / xpForLevel) * 100) : 0;

  return (
    <>
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-purple-500 to-violet-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/80">Total XP</p>
                <p className="mt-1 text-3xl font-bold">{p.xp ?? 0}</p>
                <p className="mt-1 text-xs text-white/60">Level {p.level ?? 1}</p>
              </div>
              <Zap className="h-10 w-10 text-white/40" />
            </div>
            <Progress value={levelProgress} className="mt-3 h-2 bg-white/20" />
            <p className="mt-1 text-xs text-white/60">{p.xpInLevel ?? 0}/{xpForLevel} to next level</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-400 to-red-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/80">Current Streak</p>
                <p className="mt-1 text-3xl font-bold">{p.streakDays ?? 0} days</p>
                <p className="mt-1 text-xs text-white/60">Keep it going!</p>
              </div>
              <Flame className="h-10 w-10 text-white/40" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-400 to-emerald-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/80">Badges Earned</p>
                <p className="mt-1 text-3xl font-bold">{p.achievementCount ?? 0}</p>
                <p className="mt-1 text-xs text-white/60">Collect them all</p>
              </div>
              <Award className="h-10 w-10 text-white/40" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-400 to-indigo-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/80">Your Rank</p>
                <p className="mt-1 text-3xl font-bold">#{p.rank ?? 1}</p>
                <p className="mt-1 text-xs text-white/60">In your school</p>
              </div>
              <TrendingUp className="h-10 w-10 text-white/40" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/app/gamification/leaderboard">
          <Card className="group cursor-pointer hover:shadow-md transition-all">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100">
                <Trophy className="h-7 w-7 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-surface-900 group-hover:text-brand-700 transition-colors">Leaderboard</h3>
                <p className="text-xs text-surface-500">See how you rank against others</p>
              </div>
              <ChevronRight className="h-5 w-5 text-surface-300 group-hover:text-brand-600" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/app/gamification/achievements">
          <Card className="group cursor-pointer hover:shadow-md transition-all">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100">
                <Award className="h-7 w-7 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-surface-900 group-hover:text-brand-700 transition-colors">Achievements</h3>
                <p className="text-xs text-surface-500">View your badge collection</p>
              </div>
              <ChevronRight className="h-5 w-5 text-surface-300 group-hover:text-brand-600" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/app/library">
          <Card className="group cursor-pointer hover:shadow-md transition-all">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100">
                <Target className="h-7 w-7 text-brand-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-surface-900 group-hover:text-brand-700 transition-colors">Keep Learning</h3>
                <p className="text-xs text-surface-500">Earn more XP by completing lessons</p>
              </div>
              <ChevronRight className="h-5 w-5 text-surface-300 group-hover:text-brand-600" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Achievements */}
      {p.recentAchievements && p.recentAchievements.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-bold text-surface-900">Recent Achievements</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {p.recentAchievements.map((a: { id: string; name: string; icon: string; description?: string; key?: string }) => (
              <Card key={a.id}>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                    <AchievementIcon name={a.icon} className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-surface-900 truncate">{a.name}</p>
                    <p className="text-xs text-surface-500">{a.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function AdminOverview({ profile: profileData }: { profile: any }) {
  const { data: leaderboardData } = useLeaderboard('all');
  const { data: achievementsData } = useAchievements();
  const entries = leaderboardData?.entries ?? [];
  const earned = achievementsData?.earned ?? [];

  const totalXpAwarded = entries.reduce((sum: number, e: { xp: number }) => sum + (e.xp ?? 0), 0);
  const activeStreaks = entries.filter((e: { streakDays: number }) => (e.streakDays ?? 0) > 0).length;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-surface-900">Platform Overview</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-gradient-to-br from-purple-500 to-violet-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/80">Total XP Awarded</p>
                <p className="mt-1 text-3xl font-bold">{totalXpAwarded.toLocaleString()}</p>
                <p className="mt-1 text-xs text-white/60">Across all students</p>
              </div>
              <Zap className="h-10 w-10 text-white/40" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-400 to-emerald-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/80">Badges Earned</p>
                <p className="mt-1 text-3xl font-bold">{earned.length}</p>
                <p className="mt-1 text-xs text-white/60">Total achievements unlocked</p>
              </div>
              <Award className="h-10 w-10 text-white/40" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-400 to-red-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/80">Active Streaks</p>
                <p className="mt-1 text-3xl font-bold">{activeStreaks}</p>
                <p className="mt-1 text-xs text-white/60">Students on a streak</p>
              </div>
              <Flame className="h-10 w-10 text-white/40" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-bold text-surface-900">Your Profile</h2>
        <StudentProfile profile={profileData} />
      </div>
    </div>
  );
}

function AdminLeaderboard() {
  const [period, setPeriod] = useState('weekly');
  const { data, isLoading, error } = useLeaderboard(period);
  const myUserId = useAuthStore((s) => s.user?.id);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-50" />
        ))}
      </div>
    );
  }

  if (error) return <ErrorBanner message={(error as Error).message} />;

  const entries = data?.entries ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-surface-900">All Students</h2>
        <div className="flex gap-2">
          {['weekly', 'monthly', 'all'].map((p) => (
            <Button
              key={p}
              variant={period === p ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod(p)}
              className={period === p ? 'bg-brand-600 hover:bg-brand-700' : ''}
            >
              {p === 'weekly' ? 'This Week' : p === 'monthly' ? 'This Month' : 'All Time'}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {entries.length === 0 ? (
            <div className="py-12 text-center">
              <Trophy className="mx-auto h-12 w-12 text-surface-300" />
              <p className="mt-4 text-sm font-medium text-surface-500">No leaderboard data yet</p>
            </div>
          ) : (
            <div className="divide-y divide-surface-100">
              {entries.map((entry) => (
                <div
                  key={entry.userId}
                  className={cn(
                    'flex items-center gap-4 px-6 py-4 transition-colors',
                    entry.userId === myUserId ? 'bg-brand-50' : 'hover:bg-surface-50'
                  )}
                >
                  <span className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold',
                    entry.rank <= 3 ? RANK_STYLES[entry.rank] : 'bg-surface-100 text-surface-600'
                  )}>
                    {entry.rank <= 3 ? (() => { const Icon = RANK_ICONS[entry.rank] ?? Trophy; return <Icon className="h-4 w-4" />; })() : entry.rank}
                  </span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-purple-500 text-sm font-bold text-white">
                    {entry.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-surface-900">{entry.name}</p>
                    <p className="text-xs text-surface-500">Level {entry.level}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-amber-600">
                      <Flame className="h-4 w-4" />
                      <span className="font-medium">{entry.streakDays}d</span>
                    </div>
                    <div className="font-bold text-surface-900">{entry.xp} XP</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AdminAchievements() {
  const { data, isLoading, error } = useAchievements();

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface-50" />
        ))}
      </div>
    );
  }

  if (error) return <ErrorBanner message={(error as Error).message} />;

  const earned = data?.earned ?? [];
  const locked = data?.locked ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-surface-900">All Achievements</h2>
        <Badge variant="secondary">{earned.length} earned · {locked.length} locked</Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {earned.map((a: { id: string; name: string; icon: string; description?: string; key?: string }) => (
          <Card key={a.id} className="border-amber-200 bg-amber-50/30">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100">
                <AchievementIcon name={a.icon} className="h-6 w-6 text-amber-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-surface-900">{a.name}</p>
                <p className="text-xs text-surface-500 line-clamp-1">{a.description}</p>
                {a.key && (
                  <Badge variant="secondary" className="mt-1 text-[10px]">{a.key}</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {locked.map((a: { id: string; name: string; icon: string; description?: string; key?: string }) => (
          <Card key={a.id} className="opacity-60">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-100 text-surface-400">
                <Lock className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-surface-600">{a.name}</p>
                <p className="text-xs text-surface-400 line-clamp-1">{a.description}</p>
                {a.key && (
                  <Badge variant="outline" className="mt-1 text-[10px] text-surface-400">{a.key}</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/**
 * The mobile "Me" tab is the learner's progress hub: the gamification tiles,
 * the learning-progress numbers and the badges. The web splits it over
 * /app/gamification (Progress) and /app/profile, so both carry the same
 * numbers from the same endpoints.
 */
function StudentProgressSection() {
  const role = useRole();
  const { data: progress } = useLearningProgress({ enabled: role === 'STUDENT' });
  const { data: achievements } = useAchievements();

  return (
    <div className="space-y-6">
      {progress ? (
        <Card>
          <CardHeader>
            <CardTitle>Learning progress</CardTitle>
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
              <CardTitle>Achievements</CardTitle>
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
    </div>
  );
}

export default function GamificationPage() {
  const role = useRole();
  // A parent has no gamification profile - the endpoint rejects the role, so
  // the query stays off instead of raising an error banner.
  const { data: profile, isLoading, error } = useGamificationProfile({ enabled: role !== 'PARENT' });
  const isAdmin = ADMIN_ROLES.has(role);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-surface-100" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-surface-50" />
          ))}
        </div>
      </div>
    );
  }

  if (error) return <ErrorBanner message={(error as Error).message} />;

  if (isAdmin) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Settings className="h-6 w-6 text-brand-600" />
          <div>
            <h1 className="text-2xl font-bold text-surface-900">Gamification Settings</h1>
            <p className="text-sm text-surface-500">Manage platform gamification and view analytics</p>
          </div>
        </div>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <AdminOverview profile={profile} />
          </TabsContent>

          <TabsContent value="leaderboard" className="mt-6">
            <AdminLeaderboard />
          </TabsContent>

          <TabsContent value="achievements" className="mt-6">
            <AdminAchievements />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Your Progress</h1>
        <p className="mt-1 text-sm text-surface-500">Track your achievements and climb the leaderboard</p>
      </div>

      <StudentProfile profile={profile} />

      <StudentProgressSection />
    </div>
  );
}