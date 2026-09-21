'use client';

import Link from 'next/link';
import { useAchievements } from '@/lib/learning-hooks';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner, ErrorBanner } from '@/components/ui';
import { Award, Lock, ChevronRight, Trophy, Brain, Flame, Star, Zap, Target, Rocket, Heart, BookOpen, ClipboardList } from 'lucide-react';
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

export default function AchievementsPage() {
  const { data, isLoading, error } = useAchievements();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-surface-100" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface-50" />
          ))}
        </div>
      </div>
    );
  }

  if (error) return <ErrorBanner message={(error as Error).message} />;

  const earned = data?.earned ?? [];
  const locked = data?.locked ?? [];

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-2 text-sm text-surface-500">
        <Link href="/app/gamification" className="hover:text-brand-600 transition-colors">
          Progress
        </Link>
        <span>/</span>
        <span className="text-surface-900">Achievements</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-surface-900">Achievements</h1>
        <p className="mt-1 text-sm text-surface-500">
          {earned.length} earned · {locked.length} remaining
        </p>
      </div>

      {/* Earned */}
      {earned.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold text-surface-900">Earned</h2>
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
          </div>
        </section>
      )}

      {/* Locked */}
      {locked.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold text-surface-500">Locked</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
        </section>
      )}

      {earned.length === 0 && locked.length === 0 && (
        <Card className="py-16 text-center">
          <Award className="mx-auto h-12 w-12 text-surface-300" />
          <p className="mt-4 text-sm font-medium text-surface-500">No achievements available yet</p>
          <p className="mt-1 text-xs text-surface-400">Complete lessons and assessments to earn badges</p>
        </Card>
      )}
    </div>
  );
}