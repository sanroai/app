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
  Users,
  Target,
  TrendingUp,
  Clock,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { titleCase } from '@/lib/format';

type ChildData = {
  id: string;
  name: string;
  grade: string | null;
  overallMastery: number;
  weakConcepts: Array<{
    name: string;
    score: number;
    level: string;
  }>;
  recentActivity: Array<{
    type: string;
    title: string;
    score: number | null;
    date: string;
  }>;
  upcomingAssessments: Array<{
    title: string;
    date: string | null;
    subject: string;
  }>;
};

type ParentData = {
  children: ChildData[];
};

export default function ChildrenPage() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const router = useRouter();
  const [data, setData] = useState<ParentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !user) return;
    const ctrl = new AbortController();
    setLoading(true);
    api<ParentData>('/dashboard/parent', { token, signal: ctrl.signal })
      .then((res) => setData(res))
      .catch((err) => {
        if (ctrl.signal.aborted) return;
        if (err instanceof ApiError && err.status === 401) router.replace('/login');
        else setError(err instanceof Error ? err.message : 'Failed to load children');
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [token, user, router]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">My Children</h1>
          <p className="text-surface-500 mt-1">Track your children&apos;s academic progress</p>
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

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">My Children</h1>
          <p className="text-surface-500 mt-1">Track your children&apos;s academic progress</p>
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

  const children = data?.children ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">My Children</h1>
        <p className="text-surface-500 mt-1">Track your children&apos;s academic progress</p>
      </div>

      {children.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Users className="h-12 w-12 text-surface-300 mx-auto mb-3" />
              <p className="text-surface-600">No children linked to your account yet.</p>
              <p className="text-sm text-surface-400 mt-1">Contact your school to link your child&apos;s account.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {children.map((child) => (
            <ChildDetailCard key={child.id} child={child} />
          ))}
        </div>
      )}
    </div>
  );
}

function ChildDetailCard({ child }: { child: ChildData }) {
  const { overallMastery, weakConcepts, recentActivity, upcomingAssessments } = child;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-violet-100 flex items-center justify-center">
              <span className="text-lg font-bold text-violet-600">
                {child.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <CardTitle className="text-lg">{child.name}</CardTitle>
              <p className="text-sm text-surface-500">{child.grade ? `Grade ${child.grade}` : 'No grade assigned'}</p>
            </div>
          </div>
          <div className={cn(
            'h-14 w-14 rounded-2xl flex flex-col items-center justify-center',
            overallMastery >= 70 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
          )}>
            <span className="text-lg font-bold">{overallMastery}%</span>
            <span className="text-[10px] font-medium">Mastery</span>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-surface-500">Overall Mastery</span>
            <span className="font-medium text-surface-700">{overallMastery}%</span>
          </div>
          <Progress value={overallMastery} className="h-2" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Weak concepts */}
        {weakConcepts.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-surface-700 mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Weak Areas
            </h4>
            <div className="space-y-2">
              {weakConcepts.slice(0, 3).map((wc) => (
                <div key={wc.name} className="flex items-center justify-between rounded-lg bg-amber-50 border border-amber-200 p-3">
                  <div>
                    <p className="text-sm font-medium text-amber-800">{wc.name}</p>
                    <p className="text-xs text-amber-600">{titleCase(wc.level)}</p>
                  </div>
                  <Badge variant="outline" className="text-amber-600 border-amber-300">
                    {wc.score}%
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming assessments */}
        {upcomingAssessments.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-surface-700 mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              Upcoming Assessments
            </h4>
            <div className="space-y-2">
              {upcomingAssessments.slice(0, 3).map((ua, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-blue-50 border border-blue-200 p-3">
                  <div>
                    <p className="text-sm font-medium text-blue-800">{ua.title}</p>
                    <p className="text-xs text-blue-600">{ua.subject}</p>
                  </div>
                  <span className="text-xs text-blue-600">
                    {ua.date ? new Date(ua.date).toLocaleDateString() : 'No due date'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent activity */}
        {recentActivity.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-surface-700 mb-2 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Recent Activity
            </h4>
            <div className="space-y-2">
              {recentActivity.slice(0, 5).map((activity, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-surface-50 border border-surface-200 p-3">
                  <div>
                    <p className="text-sm font-medium text-surface-700">{activity.title}</p>
                    <p className="text-xs text-surface-500">{activity.type}</p>
                  </div>
                  {activity.score != null && (
                    <Badge variant={activity.score >= 50 ? 'default' : 'destructive'}>
                      {activity.score}%
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {weakConcepts.length === 0 && upcomingAssessments.length === 0 && recentActivity.length === 0 && (
          <div className="text-center py-4">
            <BookOpen className="h-8 w-8 text-surface-300 mx-auto mb-2" />
            <p className="text-sm text-surface-500">No activity recorded yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
