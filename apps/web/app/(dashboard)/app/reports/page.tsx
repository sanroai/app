'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  TrendingUp,
  Users,
  Target,
  BookOpen,
  AlertTriangle,
  Download,
  Loader2,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

type StudentSummary = {
  id: string;
  name: string;
  email: string;
  overallMastery: number;
  weakConcepts: number;
  completedAssessments: number;
  totalAssessments: number;
};

type ClassSummary = {
  id: string;
  name: string;
  grade: string;
  studentCount: number;
  avgMastery: number;
  studentsNeedingHelp: number;
};

type ReportsData = {
  classes: ClassSummary[];
  topStudents: StudentSummary[];
  strugglingStudents: StudentSummary[];
  subjectStats: Array<{
    subject: string;
    avgMastery: number;
    totalStudents: number;
  }>;
};

export default function ReportsPage() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const router = useRouter();
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('this-month');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!token || !user) return;
    const ctrl = new AbortController();
    setLoading(true);
    const params = new URLSearchParams();
    if (dateRange && dateRange !== 'all') params.set('range', dateRange);
    const qs = params.toString();
    api<ReportsData>(`/dashboard/teacher${qs ? `?${qs}` : ''}`, { token, signal: ctrl.signal })
      .then((res) => setData(res))
      .catch((err) => {
        if (ctrl.signal.aborted) return;
        if (err instanceof ApiError && err.status === 401) router.replace('/login');
        else setError(err instanceof Error ? err.message : 'Failed to load reports');
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [token, user, router, dateRange]);

  const exportCsv = async () => {
    if (!data) return;
    setExporting(true);
    try {
      const rows: string[] = ['Section,Name,Metric,Value'];
      data.classes.forEach((c) => {
        rows.push(`Class,${c.name},Students,${c.studentCount}`);
        rows.push(`Class,${c.name},Avg Mastery,${c.avgMastery}%`);
        rows.push(`Class,${c.name},Need Help,${c.studentsNeedingHelp}`);
      });
      data.subjectStats.forEach((s) => {
        rows.push(`Subject,${s.subject},Avg Mastery,${s.avgMastery}%`);
        rows.push(`Subject,${s.subject},Students,${s.totalStudents}`);
      });
      data.topStudents.forEach((s) => {
        rows.push(`Top Performer,${s.name},Mastery,${s.overallMastery}%`);
        rows.push(`Top Performer,${s.name},Weak Concepts,${s.weakConcepts}`);
      });
      data.strugglingStudents.forEach((s) => {
        rows.push(`Needs Attention,${s.name},Mastery,${s.overallMastery}%`);
        rows.push(`Needs Attention,${s.name},Weak Concepts,${s.weakConcepts}`);
      });
      const csv = rows.join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reports-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export ready');
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Reports & Analytics</h1>
          <p className="text-surface-500 mt-1">Academic performance overview</p>
        </div>
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-surface-300 border-t-brand-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Reports & Analytics</h1>
          <p className="text-surface-500 mt-1">Academic performance overview</p>
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-amber-400 mx-auto mb-3" />
              <p className="text-surface-600">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const classes = data?.classes ?? [];
  const topStudents = data?.topStudents ?? [];
  const strugglingStudents = data?.strugglingStudents ?? [];
  const subjectStats = data?.subjectStats ?? [];

  const totalStudents = classes.reduce((sum, c) => sum + c.studentCount, 0);
  const avgMastery = classes.length > 0
    ? Math.round(classes.reduce((sum, c) => sum + c.avgMastery, 0) / classes.length)
    : 0;
  const totalNeedingHelp = classes.reduce((sum, c) => sum + c.studentsNeedingHelp, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Reports & Analytics</h1>
          <p className="text-surface-500 mt-1">Academic performance overview across your classes</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this-week">This Week</SelectItem>
              <SelectItem value="this-month">This Month</SelectItem>
              <SelectItem value="this-quarter">This Quarter</SelectItem>
              <SelectItem value="this-year">This Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => void exportCsv()} disabled={exporting || loading}>
            {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-violet-500 to-purple-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium">Total Students</p>
                <p className="text-3xl font-bold mt-1">{totalStudents}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-green-500 text-white border-0">
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
                <p className="text-white/80 text-sm font-medium">Need Help</p>
                <p className="text-3xl font-bold mt-1">{totalNeedingHelp}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium">Classes</p>
                <p className="text-3xl font-bold mt-1">{classes.length}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <BookOpen className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Class Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-violet-500" />
              Class Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {classes.length === 0 ? (
              <p className="text-sm text-surface-500 text-center py-4">No classes assigned yet.</p>
            ) : (
              <div className="space-y-3">
                {classes.map((cls) => (
                  <div key={cls.id} className="flex items-center justify-between rounded-lg bg-surface-50 border border-surface-200 p-3">
                    <div>
                      <p className="text-sm font-medium text-surface-700">{cls.name}</p>
                      <p className="text-xs text-surface-500">{cls.studentCount} students · Grade {cls.grade}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={cls.avgMastery >= 70 ? 'default' : cls.avgMastery >= 50 ? 'secondary' : 'destructive'}>
                        {cls.avgMastery}%
                      </Badge>
                      {cls.studentsNeedingHelp > 0 && (
                        <p className="text-xs text-amber-600 mt-1">{cls.studentsNeedingHelp} need help</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subject Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              Subject Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subjectStats.length === 0 ? (
              <p className="text-sm text-surface-500 text-center py-4">No subject data available.</p>
            ) : (
              <div className="space-y-3">
                {subjectStats.map((s) => (
                  <div key={s.subject}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-surface-700">{s.subject}</span>
                      <span className="text-sm font-semibold text-surface-900">{s.avgMastery}%</span>
                    </div>
                    <Progress value={s.avgMastery} className="h-2" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Students */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topStudents.length === 0 ? (
              <p className="text-sm text-surface-500 text-center py-4">No student data yet.</p>
            ) : (
              <div className="space-y-2">
                {topStudents.slice(0, 5).map((s, i) => (
                  <div key={s.id} className="flex items-center gap-3 rounded-lg bg-surface-50 border border-surface-200 p-3">
                    <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-600">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-700 truncate">{s.name}</p>
                      <p className="text-xs text-surface-500">{s.completedAssessments}/{s.totalAssessments} assessments</p>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700">{s.overallMastery}%</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Struggling Students */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Students Needing Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            {strugglingStudents.length === 0 ? (
              <p className="text-sm text-surface-500 text-center py-4">No struggling students identified.</p>
            ) : (
              <div className="space-y-2">
                {strugglingStudents.slice(0, 5).map((s) => (
                  <div key={s.id} className="flex items-center gap-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
                    <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-700 truncate">{s.name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <p className="text-xs text-amber-600">{s.weakConcepts} weak concept{s.weakConcepts !== 1 ? 's' : ''}</p>
                        <p className="text-xs text-surface-500">Mastery: {s.overallMastery}%</p>
                        <p className="text-xs text-surface-500">{s.completedAssessments}/{s.totalAssessments} assessments</p>
                      </div>
                    </div>
                    <Badge variant="destructive">{s.overallMastery}%</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
