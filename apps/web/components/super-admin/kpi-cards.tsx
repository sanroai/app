'use client';

import { AlertCircle, Building2, GraduationCap, ListChecks, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  useSuperAdminOverview,
  type SuperAdminRange,
} from '@/lib/super-admin-hooks';

function KpiSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <Card key={i} className="animate-pulse" aria-hidden>
          <CardContent className="p-4">
            <div className="h-3 w-20 rounded bg-surface-200" />
            <div className="mt-2 h-6 w-14 rounded bg-surface-200" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function KpiCards({ range }: { range: SuperAdminRange }) {
  const { data, isLoading, error } = useSuperAdminOverview(range);

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-sm text-red-600">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>Could not load platform overview.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !data) return <KpiSkeleton />;

  const { institutions, users, students, assessments, seats } = data;
  const seatsPct = seats.capacity > 0 ? seats.utilizationPct : 0;
  const seatsPctClamped = Math.max(0, Math.min(100, seatsPct));

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-surface-500 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-brand-500" />
              Institutions
            </p>
          </div>
          <p className="mt-1 text-2xl font-bold text-surface-900">{institutions.total}</p>
          <p className="mt-0.5 text-xs text-surface-500">
            +{institutions.newInRange ?? 0} new · {seats.used}/{seats.capacity} seats ({Math.round(seatsPctClamped)}%)
          </p>
          <Progress value={seatsPctClamped} className="mt-2 h-1" indicatorClassName={seatsPctClamped >= 90 ? 'bg-red-500' : undefined} />
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-brand-500 to-purple-600 text-white border-0">
        <CardContent className="p-4">
          <p className="text-xs font-medium text-brand-100 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Users
          </p>
          <p className="mt-1 text-2xl font-bold text-white">{users.total}</p>
          <p className="mt-0.5 text-xs text-brand-100">+{users.newInRange} new</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0">
        <CardContent className="p-4">
          <p className="text-xs font-medium text-emerald-100 flex items-center gap-1.5">
            <GraduationCap className="h-3.5 w-3.5" />
            Students
          </p>
          <p className="mt-1 text-2xl font-bold text-white">{students.active}</p>
          <p className="mt-0.5 text-xs text-emerald-100">+{students.newInRange} new</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0">
        <CardContent className="p-4">
          <p className="text-xs font-medium text-amber-100 flex items-center gap-1.5">
            <ListChecks className="h-3.5 w-3.5" />
            Assessments
          </p>
          <p className="mt-1 text-2xl font-bold text-white">{assessments.conductedInRange}</p>
          <p className="mt-0.5 text-xs text-amber-100">{assessments.total} total · {assessments.gradedInRange} graded</p>
        </CardContent>
      </Card>
    </div>
  );
}