'use client';

import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/cn';
import {
  Award,
  BookOpen,
  Brain,
  ChevronRight,
  ClipboardList,
  Flame,
  Heart,
  Rocket,
  Star,
  Target,
  Trophy,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { AchievementItem, LearningProgress } from '@/lib/learning-hooks';

const ACHIEVEMENT_ICONS: Record<string, LucideIcon> = {
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

export function AchievementGlyph({ name, className }: { name?: string | null; className?: string }) {
  const Icon = name ? (ACHIEVEMENT_ICONS[name.toLowerCase()] ?? Trophy) : Trophy;
  return <Icon className={className} />;
}

/**
 * One row of the "Continue learning" grid. The mobile home screen renders the
 * same numbers (Class X · N topics, completed/total, progress bar) from the
 * same GET /learning/home payload.
 */
export type SubjectProgressItem = {
  id: string;
  name: string;
  boardId: string;
  boardName: string;
  grade: string;
  completedContent: number;
  totalContent: number;
  averageMastery: number;
};

export function SubjectProgressGrid({ subjects }: { subjects: SubjectProgressItem[] }) {
  if (subjects.length === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {subjects.map((subject) => {
        const pct =
          subject.totalContent > 0
            ? Math.round((subject.completedContent / subject.totalContent) * 100)
            : 0;
        return (
          <Link
            key={`${subject.boardId}-${subject.grade}-${subject.id}`}
            href={`/app/learn/${subject.boardId}/${subject.grade}/${subject.id}/chapters`}
            className="group"
          >
            <Card className="h-full cursor-pointer border-surface-200 transition-all hover:border-brand-300 hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-surface-900 transition-colors group-hover:text-brand-700">
                      {subject.name}
                    </p>
                    <p className="mt-0.5 text-xs text-surface-400">
                      Class {subject.grade} · {subject.totalContent} topics
                    </p>
                  </div>
                  <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-surface-300 transition-colors group-hover:text-brand-600" />
                </div>
                <Progress value={pct} className="mt-4 h-2" />
                <div className="mt-2 flex items-center justify-between text-xs text-surface-500">
                  <span>
                    {subject.completedContent}/{subject.totalContent} done
                  </span>
                  <span className="font-medium text-surface-700">{pct}%</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

/**
 * The badges a student has unlocked. Same endpoint and same shape as the
 * mobile "Badges earned" row on the home screen.
 */
export function BadgeGrid({ achievements }: { achievements: AchievementItem[] }) {
  if (achievements.length === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {achievements.map((achievement) => (
        <Card key={achievement.id} className="border-amber-200 bg-amber-50/30">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100">
              <AchievementGlyph name={achievement.icon} className="h-6 w-6 text-amber-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-surface-900">{achievement.name}</p>
              {achievement.description ? (
                <p className="line-clamp-2 text-xs text-surface-500">{achievement.description}</p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function BadgesEarned({
  achievements,
  href = '/app/gamification/achievements',
  title = 'Badges earned',
}: {
  achievements: AchievementItem[];
  href?: string;
  title?: string;
}) {
  if (achievements.length === 0) return null;

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-surface-900">{title}</h2>
        <Link href={href} className="text-sm font-medium text-brand-600 transition-colors hover:text-brand-700">
          See all
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {achievements.map((achievement) => (
          <Card key={achievement.id} className="border-amber-200 bg-amber-50/30">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100">
                <AchievementGlyph name={achievement.icon} className="h-6 w-6 text-amber-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-surface-900">{achievement.name}</p>
                {achievement.description ? (
                  <p className="line-clamp-2 text-xs text-surface-500">{achievement.description}</p>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

/**
 * The three learning-progress numbers the mobile profile shows:
 * content completed, concepts mastered and average mastery.
 */
export function LearningProgressBars({ progress }: { progress: LearningProgress }) {
  const mastered = progress.mastery?.byLevel?.MASTERED ?? 0;
  const totalConcepts = Math.max(progress.mastery?.totalConcepts ?? 0, 1);
  const totalContent = Math.max(progress.contentProgress?.totalContent ?? 0, 1);
  const averageMastery = Math.round(progress.mastery?.averageScore ?? 0);

  return (
    <div className="space-y-4">
      <ProgressRow
        label="Content completed"
        value={progress.contentProgress?.completedContent ?? 0}
        max={totalContent}
        indicator="from-brand-500 to-purple-500"
      />
      <ProgressRow
        label="Concepts mastered"
        value={mastered}
        max={totalConcepts}
        indicator="from-emerald-400 to-teal-500"
      />
      <ProgressRow
        label="Average mastery"
        value={averageMastery}
        max={100}
        indicator="from-amber-400 to-orange-500"
      />
    </div>
  );
}

function ProgressRow({
  label,
  value,
  max,
  indicator,
}: {
  label: string;
  value: number;
  max: number;
  indicator: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-surface-600">{label}</span>
        <span className="font-semibold text-surface-800">
          {value}/{max}
        </span>
      </div>
      <Progress value={pct} className={cn('h-2')} indicatorClassName={indicator} />
    </div>
  );
}
