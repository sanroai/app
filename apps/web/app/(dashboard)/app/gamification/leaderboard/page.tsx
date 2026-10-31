'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useLeaderboard } from '@/lib/learning-hooks';
import { useAuthStore } from '@/lib/auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ErrorBanner } from '@/components/ui';
import { Trophy, Crown, Medal, Flame } from 'lucide-react';
import { cn } from '@/lib/cn';

const PERIODS = [
  { key: 'weekly', label: 'This Week' },
  { key: 'monthly', label: 'This Month' },
  { key: 'all', label: 'All Time' },
];

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

const PODIUM_ORDER = [2, 1, 3];

const PODIUM_HEIGHT: Record<number, string> = {
  1: 'h-40 sm:h-44',
  2: 'h-28 sm:h-32',
  3: 'h-20 sm:h-24',
};

const PODIUM_FACE: Record<number, string> = {
  1: 'from-yellow-300 via-amber-400 to-amber-500',
  2: 'from-slate-200 via-gray-300 to-gray-400',
  3: 'from-orange-200 via-orange-300 to-orange-400',
};

export default function LeaderboardPage() {
  const [period, setPeriod] = useState('weekly');
  const [groupId, setGroupId] = useState<string | null>(null);
  const { data, isLoading, error } = useLeaderboard(period, groupId);
  // The leaderboard rows carry the user id, so the caller's own row is the one
  // that matches the signed-in user - the API does not echo it back.
  const myUserId = useAuthStore((s) => s.user?.id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-surface-100" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-50" />
          ))}
        </div>
      </div>
    );
  }

  if (error) return <ErrorBanner message={(error as Error).message} />;

  const entries = data?.entries ?? [];
  const myRank = data?.myRank ?? 0;
  const groups = (data?.groups ?? []) as Array<{ id: string; name: string; grade?: string | null }>;

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-2 text-sm text-surface-500">
        <Link href="/app/gamification" className="hover:text-brand-600 transition-colors">
          Progress
        </Link>
        <span>/</span>
        <span className="text-surface-900">Leaderboard</span>
      </nav>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Leaderboard</h1>
          <p className="mt-1 text-sm text-surface-500">Top learners in your school</p>
        </div>
        {myRank > 0 && (
          <Badge className="bg-brand-100 text-brand-700 text-sm px-3 py-1">
            Your Rank: #{myRank}
          </Badge>
        )}
      </div>

      {/* Period Selector */}
      <div className="flex gap-2">
        {PERIODS.map((p) => (
          <Button
            key={p.key}
            variant={period === p.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod(p.key)}
            className={period === p.key ? 'bg-brand-600 hover:bg-brand-700' : ''}
          >
            {p.label}
          </Button>
        ))}
      </div>

      {/* Scope: whole school vs one class - competing with peers you know is what
          keeps a board motivating, so the class board is one click away. */}
      {groups.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-surface-400">Scope</span>
          <Button
            variant={groupId === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setGroupId(null)}
            className={groupId === null ? 'bg-brand-600 hover:bg-brand-700' : ''}
          >
            Whole school
          </Button>
          {groups.map((g) => (
            <Button
              key={g.id}
              variant={groupId === g.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setGroupId(g.id)}
              className={groupId === g.id ? 'bg-brand-600 hover:bg-brand-700' : ''}
            >
              {g.name}
            </Button>
          ))}
        </div>
      )}

      {/* Top 3 Podium (3D stage) */}
      {entries.length >= 3 && (
        <div className="relative overflow-hidden rounded-3xl border border-surface-200 bg-gradient-to-b from-white via-white to-surface-50 p-6">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.12),transparent_70%)]" />
          <div className="[perspective:1400px]">
            <div className="flex items-end justify-center gap-2 sm:gap-4">
              {PODIUM_ORDER.map((rank) => {
                const entry = entries.find((e: { rank: number }) => e.rank === rank);
                if (!entry) return <div key={rank} className="w-20 sm:w-24" />;
                const Icon = RANK_ICONS[rank] ?? Trophy;
                return (
                  <div key={entry.userId} className="flex flex-col items-center">
                    <div className="mb-2 flex flex-col items-center">
                      <span
                        className={cn(
                          'flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold shadow-lg',
                          RANK_STYLES[rank] ?? 'bg-surface-100 text-surface-600',
                        )}
                      >
                        <Icon className="h-6 w-6" />
                      </span>
                      <p className="mt-1.5 max-w-[7.5rem] truncate text-center text-sm font-bold text-surface-900">
                        {entry.name}
                      </p>
                      <p className="text-xs text-surface-500">{entry.xp} XP</p>
                    </div>
                    <div
                      className={cn(
                        'w-20 rounded-t-2xl bg-gradient-to-b shadow-[0_22px_32px_-20px_rgba(76,29,149,0.65)] sm:w-24',
                        PODIUM_HEIGHT[rank],
                        PODIUM_FACE[rank],
                      )}
                      style={{ transform: 'rotateX(7deg)', transformStyle: 'preserve-3d' }}
                    >
                      <div
                        className="flex h-full items-start justify-center pt-3 text-3xl font-black text-white/95 drop-shadow"
                        style={{ transform: 'translateZ(22px)' }}
                      >
                        {rank}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-8 h-2 rounded-[100%] bg-gradient-to-r from-transparent via-brand-200 to-transparent" />
        </div>
      )}

      {/* Full List */}
      <Card>
        <CardContent className="p-0">
          {entries.length === 0 ? (
            <div className="py-12 text-center">
              <Trophy className="mx-auto h-12 w-12 text-surface-300" />
              <p className="mt-4 text-sm font-medium text-surface-500">No leaderboard data yet</p>
              <p className="mt-1 text-xs text-surface-400">Complete lessons and quizzes to earn XP</p>
            </div>
          ) : (
            <div className="divide-y divide-surface-100">
              {entries.map((entry) => (
                <div
                  key={entry.userId}
                  className={cn(
                    'flex items-center gap-4 px-6 py-4 transition-colors',
                    entry.userId === myUserId ? 'bg-brand-50' : 'hover:bg-surface-50',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold',
                      entry.rank <= 3 ? RANK_STYLES[entry.rank] : 'bg-surface-100 text-surface-600',
                    )}
                  >
                    {entry.rank}
                  </span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-purple-500 text-sm font-bold text-white">
                    {entry.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-surface-900">
                      {entry.name}
                      {entry.userId === myUserId ? (
                        <span className="ml-2 rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-700">
                          You
                        </span>
                      ) : null}
                    </p>
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
