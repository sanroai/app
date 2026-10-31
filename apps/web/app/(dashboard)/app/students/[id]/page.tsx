'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  useStudentDetail,
  useDeactivateStudent,
  useActivateStudent,
  useUpdateStudentClasses,
} from '@/lib/people-hooks';
import { useLearningHome } from '@/lib/learning-hooks';
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
  const updateClasses = useUpdateStudentClasses(id);
  const [editingClasses, setEditingClasses] = useState(false);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [classesError, setClassesError] = useState<string | null>(null);
  // Every class the board offers. The staff board list is not available to an
  // institution admin, so the options come from the curriculum the server
  // returns for staff (unrestricted = all classes).
  const homeQuery = useLearningHome();
  const grades = useMemo(() => {
    const names = new Set<string>();
    for (const board of homeQuery.data?.boards ?? []) {
      for (const g of board.grades ?? []) names.add(g.grade);
    }
    return [...names].sort((a, b) => Number(a) - Number(b) || a.localeCompare(b));
  }, [homeQuery.data]);
  if (isLoading) return <Spinner label="Loading student…" />;
  if (error) return <ErrorBanner message={(error as Error).message} />;
  if (!student) return <ErrorBanner message="Student not found." />;

  const isActive = student.status === 'ACTIVE';
  const currentClasses = student.grades?.length ? student.grades : student.grade ? [student.grade] : [];

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

          {/* Classes — a student may be enrolled in more than one class */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Classes</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedClasses(currentClasses);
                    setEditingClasses((v) => !v);
                  }}
                >
                  <Edit3 className="h-4 w-4" />
                  {editingClasses ? 'Cancel' : 'Edit classes'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-surface-500">
                The student sees the curriculum, textbook, practice and AI answers of every
                class listed here. The primary class is fixed and always included.
              </p>

              {!editingClasses ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {currentClasses.map((g) => (
                    <span
                      key={g}
                      className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700"
                    >
                      Class {g}
                      {g === student.grade ? (
                        <span className="rounded-full bg-brand-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                          primary
                        </span>
                      ) : null}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {(grades.length ? grades : currentClasses).map((g) => {
                      const value = String(g);
                      const isPrimary = value === student.grade;
                      const checked = isPrimary || selectedClasses.includes(value);
                      return (
                        <label
                          key={value}
                          className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                            checked
                              ? 'border-brand-300 bg-brand-50 text-brand-700'
                              : 'border-surface-200 bg-white text-surface-600 hover:border-brand-200'
                          } ${isPrimary ? 'cursor-not-allowed opacity-80' : ''}`}
                        >
                          <input
                            type="checkbox"
                            className="h-3.5 w-3.5 accent-brand-600"
                            checked={checked}
                            disabled={isPrimary}
                            onChange={(e) =>
                              setSelectedClasses((list) =>
                                e.target.checked
                                  ? [...new Set([...list, value])]
                                  : list.filter((c) => c !== value),
                              )
                            }
                          />
                          Class {value}
                          {isPrimary ? <span className="text-[10px] font-bold uppercase tracking-wide">primary</span> : null}
                        </label>
                      );
                    })}
                  </div>
                  {classesError ? (
                    <p className="text-xs font-medium text-red-600">{classesError}</p>
                  ) : null}
                  <Button
                    size="sm"
                    disabled={
                      updateClasses.isPending ||
                      selectedClasses.length + (currentClasses.includes(student.grade) ? 1 : 0) === 0
                    }
                    onClick={() =>
                      updateClasses.mutate([...new Set([student.grade, ...selectedClasses])], {
                        onSuccess: () => {
                          setEditingClasses(false);
                          setClassesError(null);
                        },
                        onError: (e) => setClassesError((e as Error).message),
                      })
                    }
                  >
                    {updateClasses.isPending ? 'Saving…' : 'Save classes'}
                  </Button>
                </div>
              )}
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
