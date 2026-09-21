'use client';

import { useParams, useRouter } from 'next/navigation';
import { useStudentDetail, useDeactivateStudent, useActivateStudent } from '@/lib/people-hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner, ErrorBanner } from '@/components/ui';
import { ArrowLeft, Mail, Phone, GraduationCap, Shield, Users, Edit3 } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';

export default function StudentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const { data: student, isLoading, error } = useStudentDetail(id);
  const deactivateMutation = useDeactivateStudent();
  const activateMutation = useActivateStudent();

  if (isLoading) return <Spinner label="Loading student…" />;
  if (error) return <ErrorBanner message={(error as Error).message} />;
  if (!student) return <ErrorBanner message="Student not found." />;

  const isActive = student.status === 'ACTIVE';

  function handleToggleStatus() {
    if (!student) return;
    if (isActive) {
      deactivateMutation.mutate(student.id, {
        onSuccess: () => router.push('/app/students'),
      });
    } else {
      activateMutation.mutate(student.id);
    }
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-surface-500">
        <button onClick={() => router.push('/app/students')} className="hover:text-brand-600 transition-colors">
          Students
        </button>
        <span>/</span>
        <span className="text-surface-900 font-medium">{student.name}</span>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/app/students')}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 text-white text-xl font-bold">
                {student.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
              <h1 className="mt-4 text-xl font-bold text-surface-900">{student.name}</h1>
              <span
                className={`mt-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                  isActive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {student.status}
              </span>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-surface-400" />
                <span className="text-surface-700">{student.email}</span>
              </div>
              {student.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-surface-400" />
                  <span className="text-surface-700">{student.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <GraduationCap className="h-4 w-4 text-surface-400" />
                <span className="text-surface-700">Grade {student.grade}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Shield className="h-4 w-4 text-surface-400" />
                <span className="text-surface-700">Roll #{student.rollNumber}</span>
              </div>
              {student.group && (
                <div className="flex items-center gap-3 text-sm">
                  <Users className="h-4 w-4 text-surface-400" />
                  <span className="text-surface-700">{student.group.name}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Academic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Academic Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-surface-50 p-4">
                  <p className="text-sm text-surface-500">Current Grade</p>
                  <p className="mt-1 text-lg font-semibold text-surface-900">{student.grade}</p>
                </div>
                <div className="rounded-xl bg-surface-50 p-4">
                  <p className="text-sm text-surface-500">Group</p>
                  <p className="mt-1 text-lg font-semibold text-surface-900">
                    {student.group?.name ?? 'Unassigned'}
                  </p>
                </div>
                <div className="rounded-xl bg-surface-50 p-4">
                  <p className="text-sm text-surface-500">Roll Number</p>
                  <p className="mt-1 text-lg font-semibold text-surface-900">{student.rollNumber}</p>
                </div>
                <div className="rounded-xl bg-surface-50 p-4">
                  <p className="text-sm text-surface-500">Status</p>
                  <p className="mt-1 text-lg font-semibold text-surface-900">{student.status}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-surface-50 p-4 text-center">
                  <p className="text-sm text-surface-500">Mastery Level</p>
                  <p className="mt-1 text-2xl font-bold text-brand-600">—</p>
                  <p className="text-xs text-surface-400">No data yet</p>
                </div>
                <div className="rounded-xl bg-surface-50 p-4 text-center">
                  <p className="text-sm text-surface-500">Assessments</p>
                  <p className="mt-1 text-2xl font-bold text-brand-600">—</p>
                  <p className="text-xs text-surface-400">No data yet</p>
                </div>
                <div className="rounded-xl bg-surface-50 p-4 text-center">
                  <p className="text-sm text-surface-500">Accuracy</p>
                  <p className="mt-1 text-2xl font-bold text-brand-600">—</p>
                  <p className="text-xs text-surface-400">No data yet</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" disabled>
                  <Edit3 className="h-4 w-4" />
                  Edit Student
                </Button>
                <Button
                  variant={isActive ? 'destructive' : 'success'}
                  onClick={handleToggleStatus}
                  disabled={deactivateMutation.isPending || activateMutation.isPending}
                >
                  <Shield className="h-4 w-4" />
                  {isActive ? 'Deactivate' : 'Activate'}
                </Button>
                <Button variant="outline" disabled>
                  <Users className="h-4 w-4" />
                  Move to Group
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
