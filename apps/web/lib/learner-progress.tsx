'use client';

import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { SubjectBanner } from '@/components/subject-banner';
import { cn } from '@/lib/cn';
import {
  Award,
  BookOpen,
  Brain,
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
 *
 * The card is the SAME card as the Library subject grid (`library/subjects`):
 * one 16:9 photograph banner, the subject's 3D icon, a fixed body and a mastery
 * footer. A student should recognise the subject at a glance instead of reading
 * three different card designs for the same three subjects.
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
            className="group block h-full"
          >
            <Card className="flex h-full cursor-pointer flex-col overflow-hidden border-surface-200 transition-all hover:border-brand-300 hover:shadow-lg">
              <CardContent className="flex flex-1 flex-col p-0">
                <SubjectBanner
                  name={subject.name}
                  subtitle={`Class ${subject.grade} · ${subject.totalContent} topics`}
                  sizes="(max-width: 640px) 100vw, 320px"
                />

                <div className="flex flex-1 flex-col px-4 py-4">
                  <Progress value={pct} className="h-2" />
                  <div className="mt-2 flex items-center justify-between text-xs text-surface-500">
                    <span>
                      {subject.completedContent}/{subject.totalContent} lessons
                    </span>
                    <span className="font-medium text-surface-700">{pct}%</span>
                  </div>
                </div>

                <div className="border-t border-surface-100 bg-surface-50 px-4 py-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-surface-500">Mastery</span>
                    <span
                      className={cn(
                        'font-semibold',
                        subject.averageMastery >= 80
                          ? 'text-green-600'
                          : subject.averageMastery >= 50
                            ? 'text-amber-600'
                            : subject.averageMastery > 0
                              ? 'text-red-600'
                              : 'text-surface-400',
                      )}
                    >
                      {subject.averageMastery > 0 ? `${subject.averageMastery}%` : 'Not started'}
                    </span>
                  </div>
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
