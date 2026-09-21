'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useLeaderboard } from '@/lib/learning-hooks';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner, ErrorBanner } from '@/components/ui';
import { Trophy, ChevronLeft, Crown, Medal, Star, Flame } from 'lucide-react';
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

export default function LeaderboardPage() {
  const [period, setPeriod] = useState('weekly');
  const { data, isLoading, error } = useLeaderboard(period);

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

      {/* Top 3 Podium */}
      {entries.length >= 3 && (
        <div className="flex items-end justify-center gap-4 py-6">
          {[1, 0, 2].map((idx) => {
            const entry = entries[idx];
            if (!entry) return <div key={idx} className="w-32" />;
            const Icon = RANK_ICONS[entry.rank] ?? Trophy;
            return (
              <div key={entry.userId} className={cn(
                'flex flex-col items-center rounded-2xl p-4',
                entry.rank === 1 ? 'w-40 bg-gradient-to-b from-amber-50 to-white border-2 border-amber-200' :
                entry.rank === 2 ? 'w-36 bg-gradient-to-b from-gray-50 to-white border border-gray-200' :
                'w-36 bg-gradient-to-b from-orange-50 to-white border border-orange-200'
              )}>
                <div className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold',
                  RANK_STYLES[entry.rank] ?? 'bg-surface-100 text-surface-600'
                )}>
                  <Icon className="h-6 w-6" />
                </div>
                <p className="mt-2 text-sm font-bold text-surface-900 text-center truncate w-full">{entry.name}</p>
                <p className="text-xs text-surface-500">{entry.xp} XP</p>
                <p className="text-xs font-medium text-brand-600">Lv.{entry.level}</p>
              </div>
            );
          })}
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
              {entries.map((entry: { userId: string; name: string; xp: number; rank: number; level?: number; streakDays?: number }) => (
                <div
                  key={entry.userId}
                  className={cn(
                    'flex items-center gap-4 px-6 py-4 transition-colors',
                    entry.userId === data?.userId ? 'bg-brand-50' : 'hover:bg-surface-50'
                  )}
                >
                  <span className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold',
                    entry.rank <= 3 ? RANK_STYLES[entry.rank] : 'bg-surface-100 text-surface-600'
                  )}>
                    {entry.rank}
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