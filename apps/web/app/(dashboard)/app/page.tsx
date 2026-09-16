'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  BookOpen,
  ListChecks,
  Target,
  Trophy,
  Users,
  Zap,
  Star,
  Flame,
  Clock,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  FileText,
  AlertTriangle,
  AlertCircle,
  GraduationCap,
  Eye,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/cn';

/* ─── Types ─── */

type TeacherSubject = { id: string; name: string };

type AssessmentSummary = {
  id: string;
  title: string;
  avgScore: number;
  completionRate: number;
  date: string;
};

type StudentPerf = {
  id: string;
  name: string;
  avgMastery: number;
  trend?: 'up' | 'stable' | 'down';
  weakConcepts?: string[];
};

type TeacherClass = {
  id: string;
  name: string;
  grade: string | null;
  studentCount: number;
  recentAssessments: AssessmentSummary[];
  topStudents: StudentPerf[];
  strugglingStudents: StudentPerf[];
};

type PendingWorkItem = { type: string; count: number };

type SubjectStat = {
  subjectId: string;
  name: string;
  avgMastery: number;
  totalQuestions: number;
  contentCount: number;
};

type TeacherData = {
  teacher: { name: string; email: string; subjects: TeacherSubject[] } | null;
  classes: TeacherClass[];
  pendingWork: PendingWorkItem[];
  subjectStats: SubjectStat[];
};

type WeakConcept = { name: string; score: number; level: string };

type ActivityItem = {
  type: string;
  title: string;
  score: number | null;
  date: string | null;
};

type UpcomingAssessment = { title: string; date: string | null; subject: string };

type ChildData = {
  id: string;
  name: string;
  grade: string | null;
  overallMastery: number;
  recentActivity: ActivityItem[];
  weakConcepts: WeakConcept[];
  upcomingAssessments: UpcomingAssessment[];
};

type ParentData = {
  parent: { name: string; email: string } | null;
  children: ChildData[];
};

const ROLE_ENDPOINT: Record<string, string> = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  INSTITUTION_ADMIN: 'institution',
  PARENT: 'parent',
  SUPER_ADMIN: 'super-admin',
};

export default function DashboardPage() {
  const { user, token } = useAuthStore();
  const router = useRouter();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !user) return;
    const ctrl = new AbortController();
    const endpoint = ROLE_ENDPOINT[user.role] ?? 'student';
    setLoading(true);
    api<Record<string, unknown>>(`/dashboard/${endpoint}`, { token, signal: ctrl.signal })
      .then((payload) => setData(payload))
      .catch((e) => {
        if (ctrl.signal.aborted) return;
        if (e instanceof ApiError && e.status === 401) router.replace('/login');
        else setError(e instanceof Error ? e.message : 'Failed to load dashboard');
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [token, user, router]);

  if (!user) return null;

  const isStudent = user.role === 'STUDENT';
  const isTeacher = user.role === 'TEACHER';
  const isParent = user.role === 'PARENT';

  const greeting = getGreeting();

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-surface-900 leading-tight">
            {greeting}, {user.name.split(' ')[0]}! 👋
          </h1>
          <p className="text-surface-600 mt-1 text-sm sm:text-base">
            {isStudent
              ? "Let's continue your learning journey"
              : isTeacher
                ? "Here's your class overview and student performance"
                : isParent
                  ? "Track your children's academic progress"
                  : "Here's what's happening today"}
          </p>
        </div>
        {isStudent && (
          <Link href="/app/learn">
            <Button className="sm:w-auto w-full bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-700 hover:to-purple-700">
              <Lightbulb className="mr-2 h-4 w-4" />
              Continue Learning
            </Button>
          </Link>
        )}
        {isTeacher && (
          <Link href="/app/papers/new">
            <Button className="bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-700 hover:to-purple-700">
              <FileText className="mr-2 h-4 w-4" />
              Create Assessment
            </Button>
          </Link>
        )}
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading && <DashboardSkeleton />}

      {!loading && data && (
        <>
          {isTeacher && <TeacherDashboard data={data as unknown as TeacherData} />}
          {isParent && <ParentDashboard data={data as unknown as ParentData} />}
          {isStudent && (
            <>
              <StudentStats data={data} />
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                  <StudentContent data={data} />
                </div>
                <div className="space-y-6">
                  <QuickActions role={user.role} />
                  <RecentActivity data={data} />
                </div>
              </div>
            </>
          )}
          {!isStudent && !isTeacher && !isParent && (
            <>
              <StaffStats data={data} role={user.role} />
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                  <StaffContent data={data} role={user.role} />
                </div>
                <div className="space-y-6">
                  <QuickActions role={user.role} />
                  <RecentActivity data={data} />
                </div>
              </div>
            </>
          )}
        </>
      )}

      {!loading && !data && !error && <EmptyState role={user.role} />}
    </div>
  );
}

/* ─── Teacher Dashboard ─── */

function TeacherDashboard({ data }: { data: TeacherData }) {
  const { teacher, classes, pendingWork, subjectStats } = data;

  const totalStudents = classes.reduce((sum, c) => sum + c.studentCount, 0);
  const totalPending = pendingWork.reduce((sum, w) => sum + w.count, 0);

  return (
    <div className="space-y-8">
      {/* Subject badges */}
      {teacher && teacher.subjects.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {teacher.subjects.map((s) => (
            <Badge key={s.id} variant="purple">
              <BookOpen className="mr-1 h-3 w-3" />
              {s.name}
            </Badge>
          ))}
        </div>
      )}

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-brand-500 to-purple-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium">My Classes</p>
                <p className="text-3xl font-bold mt-1">{classes.length}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-emerald-500 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium">Total Students</p>
                <p className="text-3xl font-bold mt-1">{totalStudents}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <GraduationCap className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium">Subjects</p>
                <p className="text-3xl font-bold mt-1">{teacher?.subjects.length ?? 0}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <BookOpen className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-500 to-rose-500 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium">Pending Work</p>
                <p className="text-3xl font-bold mt-1">{totalPending}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Class overview cards */}
      <div>
        <h2 className="text-xl font-bold text-surface-900 mb-4">Class Overview</h2>
        {classes.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Users className="h-12 w-12 text-surface-300 mx-auto mb-3" />
                <p className="text-surface-600">No classes assigned yet. Contact your admin to get started.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {classes.map((cls) => (
              <ClassCard key={cls.id} cls={cls} />
            ))}
          </div>
        )}
      </div>

      {/* Student Performance */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TopPerformers classes={classes} />
        <NeedsAttention classes={classes} />
      </div>

      {/* Pending Work & Subject Stats */}
      <div className="grid gap-6 lg:grid-cols-2">
        <PendingWorkCards items={pendingWork} />
        <SubjectStatsCards stats={subjectStats} />
      </div>
    </div>
  );
}

function ClassCard({ cls }: { cls: TeacherClass }) {
  const { recentAssessments, studentCount, grade } = cls;
  const latestAssessment = recentAssessments[0];
  const avgScore = latestAssessment?.avgScore ?? 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{cls.name}</CardTitle>
            <CardDescription>
              {grade ? `Grade ${grade}` : 'No grade'} · {studentCount} students
            </CardDescription>
          </div>
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${masteryColor(avgScore)}`}>
            <span className="text-sm font-bold">{avgScore}%</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {recentAssessments.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-surface-500 mb-2">Recent Assessments</p>
            <div className="space-y-2">
              {recentAssessments.slice(0, 3).map((a) => (
                <div key={a.id} className="flex items-center justify-between text-sm">
                  <span className="text-surface-700 truncate">{a.title}</span>
                  <div className="flex items-center gap-2 ml-2">
                    <Badge
                      variant={a.avgScore >= 80 ? 'success' : a.avgScore >= 50 ? 'warning' : 'destructive'}
                    >
                      {a.avgScore}%
                    </Badge>
                    <span className="text-xs text-surface-400">{a.completionRate}% done</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <Link href={`/app/students?groupId=${cls.id}`}>
            <Button size="sm" variant="outline" className="flex-1">
              <Eye className="mr-1 h-4 w-4" />
              View Class
            </Button>
          </Link>
          <Link href="/app/papers/new">
            <Button size="sm" className="flex-1">
              <ListChecks className="mr-1 h-4 w-4" />
              Create Assessment
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function TopPerformers({ classes }: { classes: TeacherClass[] }) {
  const allTop = classes.flatMap((c) =>
    c.topStudents.map((s) => ({ ...s, className: c.name })),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-500" />
          Top Performers
        </CardTitle>
        <CardDescription>Students with highest mastery across your classes</CardDescription>
      </CardHeader>
      <CardContent>
        {allTop.length === 0 ? (
          <div className="text-center py-6">
            <Star className="h-10 w-10 text-surface-300 mx-auto mb-2" />
            <p className="text-sm text-surface-500">No performance data yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allTop.slice(0, 8).map((s, i) => (
              <div key={`${s.id}-${i}`} className="flex items-center justify-between rounded-xl bg-surface-50 p-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-xs font-bold text-green-700">#{i + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-surface-900 text-sm">{s.name}</p>
                    <p className="text-xs text-surface-500">{s.className}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-surface-900">{s.avgMastery}%</span>
                  {s.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                  {s.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function NeedsAttention({ classes }: { classes: TeacherClass[] }) {
  const allStruggling = classes.flatMap((c) =>
    c.strugglingStudents.map((s) => ({ ...s, className: c.name })),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Needs Attention
        </CardTitle>
        <CardDescription>Students who may need extra support</CardDescription>
      </CardHeader>
      <CardContent>
        {allStruggling.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle2 className="h-10 w-10 text-green-400 mx-auto mb-2" />
            <p className="text-sm text-surface-500">All students are performing well!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allStruggling.slice(0, 8).map((s, i) => {
              const weakConcepts = s.weakConcepts ?? [];
              return (
                <div key={`${s.id}-${i}`} className="flex items-center justify-between rounded-xl bg-surface-50 p-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${masteryBg(s.avgMastery)}`}>
                      <span className="text-xs font-bold">{s.avgMastery}%</span>
                    </div>
                    <div>
                      <p className="font-medium text-surface-900 text-sm">{s.name}</p>
                      <p className="text-xs text-surface-500">{s.className}</p>
                    </div>
                  </div>
                  {weakConcepts.length > 0 && (
                    <div className="flex flex-wrap gap-1 max-w-[140px]">
                      {weakConcepts.slice(0, 2).map((c, j) => (
                        <Badge key={j} variant="destructive" className="text-[10px] px-1.5 py-0">
                          {c}
                        </Badge>
                      ))}
                      {weakConcepts.length > 2 && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          +{weakConcepts.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PendingWorkCards({ items }: { items: PendingWorkItem[] }) {
  const total = items.reduce((sum, w) => sum + w.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-500" />
          Pending Work
        </CardTitle>
        <CardDescription>Items requiring your attention</CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="text-center py-6">
            <CheckCircle2 className="h-10 w-10 text-green-400 mx-auto mb-2" />
            <p className="text-sm text-surface-500">All caught up! No pending items.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl bg-surface-50 p-4 hover:bg-surface-100 transition-all">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                    {item.type === 'PAPER_REVIEW' ? (
                      <FileText className="h-5 w-5 text-amber-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-surface-900 text-sm">
                      {item.type === 'PAPER_REVIEW' ? 'Papers to Review' : 'Ungraded Attempts'}
                    </p>
                    <p className="text-xs text-surface-500">
                      {item.type === 'PAPER_REVIEW'
                        ? 'Question papers awaiting your review'
                        : 'Student answers awaiting grading'}
                    </p>
                  </div>
                </div>
                <Badge variant={item.count > 10 ? 'destructive' : 'warning'}>{item.count}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SubjectStatsCards({ stats }: { stats: SubjectStat[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-brand-500" />
          Subject Statistics
        </CardTitle>
        <CardDescription>Performance breakdown by subject</CardDescription>
      </CardHeader>
      <CardContent>
        {stats.length === 0 ? (
          <div className="text-center py-6">
            <BookOpen className="h-10 w-10 text-surface-300 mx-auto mb-2" />
            <p className="text-sm text-surface-500">No subject data yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {stats.map((stat) => (
              <div key={stat.subjectId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-surface-900 text-sm">{stat.name}</span>
                  <span className="text-sm font-bold text-surface-900">{stat.avgMastery}%</span>
                </div>
                <Progress
                  value={stat.avgMastery}
                  className="h-2"
                  indicatorClassName={
                    stat.avgMastery >= 80
                      ? 'bg-green-500'
                      : stat.avgMastery >= 50
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                  }
                />
                <div className="flex items-center gap-4 text-xs text-surface-500">
                  <span>{stat.totalQuestions} questions</span>
                  <span>{stat.contentCount} content items</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Parent Dashboard ─── */

function ParentDashboard({ data }: { data: ParentData }) {
  const { children } = data;

  const avgMastery =
    children.length > 0
      ? Math.round(children.reduce((sum, c) => sum + c.overallMastery, 0) / children.length)
      : 0;
  const totalUpcoming = children.reduce((sum, c) => sum + c.upcomingAssessments.length, 0);

  return (
    <div className="space-y-8">
      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-gradient-to-br from-brand-500 to-purple-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium">Children</p>
                <p className="text-3xl font-bold mt-1">{children.length}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-emerald-500 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium">Avg Mastery</p>
                <p className="text-3xl font-bold mt-1">{avgMastery}%</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <Target className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium">Upcoming</p>
                <p className="text-3xl font-bold mt-1">{totalUpcoming}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Children cards */}
      <div>
        <h2 className="text-xl font-bold text-surface-900 mb-4">My Children</h2>
        {children.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Users className="h-12 w-12 text-surface-300 mx-auto mb-3" />
                <p className="text-surface-600">No children linked to your account yet.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {children.map((child) => (
              <ChildCard key={child.id} child={child} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ChildCard({ child }: { child: ChildData }) {
  const { recentActivity, weakConcepts, upcomingAssessments, overallMastery } = child;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{child.name}</CardTitle>
            <CardDescription>{child.grade ? `Grade ${child.grade}` : 'No grade assigned'}</CardDescription>
          </div>
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${masteryColor(overallMastery)}`}>
            <span className="text-sm font-bold">{overallMastery}%</span>
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-surface-500">Overall Mastery</span>
            <span className="font-medium text-surface-700">{overallMastery}%</span>
          </div>
          <Progress
            value={overallMastery}
            className="h-2"
            indicatorClassName={overallMastery >= 80 ? 'bg-green-500' : overallMastery >= 50 ? 'bg-amber-500' : 'bg-red-500'}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-3">
          {/* Recent Activity */}
          <div>
            <h4 className="text-sm font-semibold text-surface-900 mb-3 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-surface-400" />
              Recent Activity
            </h4>
            {recentActivity.length === 0 ? (
              <p className="text-xs text-surface-400">No recent activity</p>
            ) : (
              <div className="space-y-2">
                {recentActivity.slice(0, 4).map((a, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className="h-1.5 w-1.5 rounded-full bg-brand-500 shrink-0" />
                    <span className="text-surface-700 truncate">{a.title}</span>
                    {a.score != null && (
                      <Badge
                        variant={a.score >= 80 ? 'success' : a.score >= 50 ? 'warning' : 'destructive'}
                        className="ml-auto text-[10px] px-1.5 py-0 shrink-0"
                      >
                        {a.score}%
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Weak Concepts */}
          <div>
            <h4 className="text-sm font-semibold text-surface-900 mb-3 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              Weak Concepts
            </h4>
            {weakConcepts.length === 0 ? (
              <div className="flex items-center gap-1.5 text-xs text-green-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                No weak concepts
              </div>
            ) : (
              <div className="space-y-2">
                {weakConcepts.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-surface-700">{c.name}</span>
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                      {c.score}%
                    </Badge>
                  </div>
                ))}
                <Link href="/app/remediation">
                  <Button size="sm" variant="link" className="h-auto p-0 text-xs">
                    Start Remediation <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Upcoming Assessments */}
          <div>
            <h4 className="text-sm font-semibold text-surface-900 mb-3 flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-surface-400" />
              Upcoming
            </h4>
            {upcomingAssessments.length === 0 ? (
              <p className="text-xs text-surface-400">No upcoming assessments</p>
            ) : (
              <div className="space-y-2">
                {upcomingAssessments.slice(0, 4).map((a, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="min-w-0">
                      <p className="text-surface-700 truncate">{a.title}</p>
                      <p className="text-surface-400">{a.subject}</p>
                    </div>
                    {a.date && (
                      <span className="text-surface-500 whitespace-nowrap ml-2">
                        {new Date(a.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Student Dashboard ─── */

function StudentStats({ data }: { data: Record<string, unknown> | null }) {
  const gamification = data?.gamification as Record<string, unknown> | undefined;
  const mastery = data?.masterySummary as Record<string, unknown> | undefined;
  const weakConcepts = (data?.weakConcepts as { name: string; score: number; level: string; conceptId?: string }[]) ?? [];
  const pendingAssignments = (data?.pendingAssignments as Record<string, unknown>[]) ?? [];

  return (
    <>
      {/* Today's Focus */}
      <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-red-50">
        <CardContent className="p-6">
          <h2 className="text-lg font-bold text-surface-900 mb-1">Your Focus Today</h2>
          <p className="text-sm text-surface-500 mb-4">What needs your attention right now</p>

          <div className="space-y-3">
            {/* Fix weakness CTA */}
            {weakConcepts.length > 0 && (
              <div className="flex items-center justify-between rounded-xl bg-white p-4 border border-orange-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
                    <Target className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-surface-900">{weakConcepts[0].name}</p>
                    <p className="text-xs text-orange-600">{weakConcepts[0].score}% mastery · Needs practice</p>
                  </div>
                </div>
                <Link href={`/app/learn/concepts/${weakConcepts[0].conceptId ?? ''}`}>
                  <Button size="sm" className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white">
                    Fix This
                  </Button>
                </Link>
              </div>
            )}

            {/* Upcoming assessment */}
            {pendingAssignments.length > 0 && (
              <div className="flex items-center justify-between rounded-xl bg-white p-4 border border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-surface-900">{(pendingAssignments[0]?.title as string) ?? 'Assessment'}</p>
                    <p className="text-xs text-blue-600">Upcoming · {(pendingAssignments[0]?.questionCount as number) ?? 0} questions</p>
                  </div>
                </div>
                <Link href="/app/assessments">
                  <Button size="sm" variant="outline" className="rounded-xl border-blue-300 text-blue-700">
                    Prepare
                  </Button>
                </Link>
              </div>
            )}

            {/* No weak concepts */}
            {weakConcepts.length === 0 && pendingAssignments.length === 0 && (
              <div className="flex items-center gap-3 rounded-xl bg-white p-4 border border-green-100">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-surface-900">You&apos;re on track!</p>
                  <p className="text-xs text-green-600">No urgent items. Keep up the good work.</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Progress Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-violet-600 font-medium">Total XP</p>
                <p className="text-2xl font-bold text-violet-900 mt-1">{(gamification?.totalXp as number) ?? 0}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-violet-100 flex items-center justify-center">
                <Zap className="h-5 w-5 text-violet-600" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-violet-500">
              <TrendingUp className="h-3.5 w-3.5" />
              +{(gamification?.todayXp as number) ?? 0} today
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 font-medium">Streak</p>
                <p className="text-2xl font-bold text-amber-900 mt-1">{(gamification?.currentStreak as number) ?? 0} days</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Flame className="h-5 w-5 text-amber-600" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-amber-500">
              <Star className="h-3.5 w-3.5" />
              Best: {((gamification as Record<string, unknown>)?.bestStreak as number) ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600 font-medium">Mastery</p>
                <p className="text-2xl font-bold text-emerald-900 mt-1">{((mastery as Record<string, unknown>)?.averageMastery as number) ?? 0}%</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Target className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
            <div className="mt-3">
              <Progress value={((mastery as Record<string, unknown>)?.averageMastery as number) ?? 0} className="h-1.5 bg-emerald-100" />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function StudentContent({ data }: { data: Record<string, unknown> | null }) {
  const pendingAssignments = (data?.pendingAssignments as Record<string, unknown>[]) ?? [];
  const recentAttempts = (data?.recentAttempts as Record<string, unknown>[]) ?? [];

  return (
    <>
      {/* Continue Learning */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Continue Learning</CardTitle>
              <CardDescription>Pick up where you left off</CardDescription>
            </div>
            <Link href="/app/learn">
              <Button variant="ghost" size="sm">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Link href="/app/learn" className="flex items-center gap-4 rounded-xl bg-surface-50 p-4 hover:bg-surface-100 transition-all">
              <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-surface-900">Browse All Subjects</p>
                <p className="text-sm text-surface-500">Class 8-10 · Science & Mathematics</p>
              </div>
              <ChevronRight className="h-4 w-4 text-surface-400" />
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Pending Assessments */}
      {pendingAssignments.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Pending Assessments</CardTitle>
                <CardDescription>{pendingAssignments.length} assessment{pendingAssignments.length > 1 ? 's' : ''} waiting</CardDescription>
              </div>
              <Link href="/app/assessments">
                <Button variant="ghost" size="sm">
                  View all <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingAssignments.slice(0, 3).map((item, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl bg-surface-50 p-4 hover:bg-surface-100 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-brand-100 flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-brand-600" />
                    </div>
                    <div>
                      <p className="font-medium text-surface-900">
                        {(item.title as string) ?? 'Assessment'}
                      </p>
                      <p className="text-sm text-surface-500">
                        {`${(item.questionCount as number) ?? 0} questions`}
                      </p>
                    </div>
                  </div>
                  <Link href={`/app/assessments`}>
                    <Button variant="outline" size="sm" className="rounded-xl">
                      Start
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      {recentAttempts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAttempts.slice(0, 5).map((item, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl bg-surface-50 p-3">
                  <div className={cn(
                    'h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold',
                    ((item.score as number) ?? 0) >= 80
                      ? 'bg-green-100 text-green-700'
                      : ((item.score as number) ?? 0) >= 50
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-700'
                  )}>
                    {(item.score as number) ?? 0}%
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-900 truncate">{(item.title as string) ?? 'Assessment'}</p>
                    <p className="text-xs text-surface-400">{(item.date as string) ?? ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

/* ─── Staff (Admin) Dashboard ─── */

function StaffStats({ data, role }: { data: Record<string, unknown> | null; role: string }) {
  const platform = data?.platform as Record<string, unknown> | undefined;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-gradient-to-br from-brand-500 to-purple-600 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Total Students</p>
              <p className="text-3xl font-bold mt-1">{(platform?.totalStudents as number) ?? 0}</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-500 to-emerald-500 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Active Assessments</p>
              <p className="text-3xl font-bold mt-1">{(platform?.activeAssessments as number) ?? 0}</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <ListChecks className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Avg. Score</p>
              <p className="text-3xl font-bold mt-1">{(platform?.avgScore as number) ?? 0}%</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <BarChart3 className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-pink-500 to-rose-500 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Remediation Plans</p>
              <p className="text-3xl font-bold mt-1">{(platform?.activeRemediationPlans as number) ?? 0}</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <Lightbulb className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StaffContent({ data, role }: { data: Record<string, unknown> | null; role: string }) {
  const groups = (data?.groups as Record<string, unknown>[]) ?? [];
  const subjects = (data?.subjects as Record<string, unknown>[]) ?? [];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Groups</CardTitle>
              <CardDescription>Classes you're managing</CardDescription>
            </div>
            <Button variant="ghost" size="sm">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {groups.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-surface-300 mx-auto mb-3" />
              <p className="text-surface-600">No groups yet. Create your first group!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.slice(0, 4).map((item, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl bg-surface-50 p-4 hover:bg-surface-100 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-brand-100 flex items-center justify-center">
                      <Users className="h-5 w-5 text-brand-600" />
                    </div>
                    <div>
                      <p className="font-medium text-surface-900">
                        {(item.name as string) ?? 'Group'}
                      </p>
                      <p className="text-sm text-surface-500">
                        {`${(item.studentCount as number) ?? 0} students`}
                      </p>
                    </div>
                  </div>
                  <Link href={`/app/students?groupId=${item.id as string}`}>
                    <Button size="sm" variant="outline">
                      Manage
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Subjects</CardTitle>
              <CardDescription>Active subjects this term</CardDescription>
            </div>
            <Link href="/app/learn">
              <Button variant="ghost" size="sm">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {subjects.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-surface-300 mx-auto mb-3" />
              <p className="text-surface-600">No subjects configured yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {subjects.slice(0, 4).map((item, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl bg-surface-50 p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-surface-900">
                        {(item.name as string) ?? 'Subject'}
                      </p>
                      <p className="text-sm text-surface-500">
                        {`${(item.chapterCount as number) ?? 0} chapters`}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {(item.grade as string) ?? ''}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

/* ─── Shared Components ─── */

function QuickActions({ role }: { role: string }) {
  const isStudent = role === 'STUDENT';
  const isTeacher = role === 'TEACHER';

  const actions = isStudent
    ? [
        { label: 'Take Assessment', icon: ListChecks, color: 'bg-brand-100 text-brand-600', href: '/app/assessments' },
        { label: 'View Remediation', icon: Target, color: 'bg-purple-100 text-purple-600', href: '/app/remediation' },
        { label: 'Leaderboard', icon: Trophy, color: 'bg-amber-100 text-amber-600', href: '/app/gamification/leaderboard' },
      ]
    : isTeacher
      ? [
          { label: 'Create Paper', icon: FileText, color: 'bg-brand-100 text-brand-600', href: '/app/papers/new' },
          { label: 'New Assessment', icon: ListChecks, color: 'bg-green-100 text-green-600', href: '/app/assessments' },
          { label: 'View Reports', icon: BarChart3, color: 'bg-purple-100 text-purple-600', href: '/app/gamification' },
          { label: 'Grade Attempts', icon: CheckCircle2, color: 'bg-amber-100 text-amber-600', href: '/app/assessments' },
        ]
      : [
          { label: 'Create Paper', icon: FileText, color: 'bg-brand-100 text-brand-600', href: '/app/papers/new' },
          { label: 'New Assessment', icon: ListChecks, color: 'bg-green-100 text-green-600', href: '/app/assessments' },
          { label: 'View Reports', icon: BarChart3, color: 'bg-purple-100 text-purple-600', href: '/app/gamification' },
        ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {actions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex items-center gap-3 rounded-xl p-3 hover:bg-surface-50 transition-all"
            >
              <div className={`h-10 w-10 rounded-xl ${action.color} flex items-center justify-center`}>
                <action.icon className="h-5 w-5" />
              </div>
              <span className="font-medium text-surface-900">{action.label}</span>
              <ArrowRight className="ml-auto h-4 w-4 text-surface-400" />
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RecentActivity({ data }: { data: Record<string, unknown> | null }) {
  const recentAttempts = (data?.recentAttempts as Record<string, unknown>[]) ?? [];
  const recentResults = (data?.recentResults as Record<string, unknown>[]) ?? [];
  const items = recentAttempts.length > 0 ? recentAttempts : recentResults;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-surface-500 text-center py-4">No recent activity</p>
        ) : (
          <div className="space-y-4">
            {items.slice(0, 3).map((obj, i) => {
              const assessment = obj?.assessment as Record<string, unknown> | undefined;
              const student = obj?.student as Record<string, unknown> | undefined;
              return (
                <div key={i} className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-brand-500 mt-2" />
                  <div>
                    <p className="text-sm font-medium text-surface-900">
                      {(obj?.title as string) ?? (assessment?.title as string) ?? 'Assessment'}
                    </p>
                    <p className="text-xs text-surface-500">
                      Score: {(obj?.score as number) ?? 0}%
                      {student?.name ? ` · ${student.name as string}` : ''}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-surface-200 rounded w-20 mb-3" />
              <div className="h-8 bg-surface-200 rounded w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-surface-200 rounded w-32 mb-3" />
              <div className="h-3 bg-surface-200 rounded w-full mb-2" />
              <div className="h-3 bg-surface-200 rounded w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ role }: { role: string }) {
  return (
    <Card>
      <CardContent className="py-12">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-surface-300 mx-auto mb-3" />
          <p className="text-surface-600">
            {role === 'TEACHER'
              ? "You don't have any classes assigned yet. Contact your administrator."
              : role === 'PARENT'
                ? "No data available yet. Your children's information will appear here."
                : "Dashboard data is loading..."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Helpers ─── */

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function masteryColor(score: number): string {
  if (score >= 80) return 'bg-green-100 text-green-700';
  if (score >= 50) return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
}

function masteryBg(score: number): string {
  if (score >= 80) return 'bg-green-100 text-green-700';
  if (score >= 50) return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
}
