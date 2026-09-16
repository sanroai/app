'use client';

import Link from 'next/link';
import { useTeachers } from '@/lib/people-hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner, ErrorBanner } from '@/components/ui';
import { UserPlus, Mail, Phone, BookOpen, Users, CreditCard } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';

export default function TeachersPage() {
  const user = useAuthStore((s) => s.user);
  const isStaff =
    user?.role === 'TEACHER' || user?.role === 'INSTITUTION_ADMIN' || user?.role === 'SUPER_ADMIN';

  if (!isStaff) {
    return (
      <div className="text-center py-12 text-surface-500">
        You do not have permission to view this page.
      </div>
    );
  }

  return <TeachersList />;
}

function TeachersList() {
  const { data: teachers, isLoading, error } = useTeachers();

  if (isLoading) return <Spinner label="Loading teachers…" />;
  if (error) return <ErrorBanner message={(error as Error).message} />;

  const list = teachers ?? [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-surface-900">Teacher Management</h1>
        <Button asChild>
          <Link href="/app/teachers/new">
            <UserPlus className="h-4 w-4" />
            Add Teacher
          </Link>
        </Button>
      </div>

      {list.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <UserPlus className="mx-auto h-12 w-12 text-surface-300" />
            <p className="mt-4 text-lg font-medium text-surface-600">No teachers found</p>
            <p className="mt-1 text-sm text-surface-400">
              Teachers will appear here once they are added.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((teacher) => (
            <Card key={teacher.id}>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white font-semibold text-sm">
                    {teacher.user.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-surface-900 truncate">
                        {teacher.user.name}
                      </h2>
                      <span
                        className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                          teacher.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {teacher.status}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1.5 text-sm text-surface-500">
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" />
                        <span className="truncate">{teacher.user.email}</span>
                      </div>
                      {teacher.user.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5" />
                          <span>{teacher.user.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="h-3.5 w-3.5" />
                        <span>{teacher.employeeId}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {teacher.subjects.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-surface-400 mb-1">Subjects</p>
                      <div className="flex flex-wrap gap-1">
                        {teacher.subjects.map((s) => (
                          <span
                            key={s.id}
                            className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700"
                          >
                            <BookOpen className="h-3 w-3" />
                            {s.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {teacher.groups.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-surface-400 mb-1">Groups</p>
                      <div className="flex flex-wrap gap-1">
                        {teacher.groups.map((g) => (
                          <span
                            key={g.id}
                            className="inline-flex items-center gap-1 rounded-lg bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700"
                          >
                            <Users className="h-3 w-3" />
                            {g.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
