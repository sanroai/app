'use client';

import Link from 'next/link';
import { useGamificationProfile } from '@/lib/learning-hooks';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Spinner, ErrorBanner } from '@/components/ui';
import { Trophy, Flame, Star, Award, ChevronRight, Zap, Target, TrendingUp, Brain, ClipboardList, Rocket, Heart, BookOpen, Target as TargetIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { type LucideIcon } from 'lucide-react';

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

export default function GamificationPage() {
  const { data: profile, isLoading, error } = useGamificationProfile();

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

  const p = profile ?? {};
  const xpForLevel = p.xpForLevel ?? 500;
  const levelProgress = xpForLevel > 0 ? Math.round(((p.xpInLevel ?? 0) / xpForLevel) * 100) : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Your Progress</h1>
        <p className="mt-1 text-sm text-surface-500">Track your achievements and climb the leaderboard</p>
      </div>

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

        <Link href="/app/learn">
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
            {p.recentAchievements.map((a: any) => (
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
    </div>
  );
}