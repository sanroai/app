'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { useStudents } from '@/lib/people-hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Spinner, ErrorBanner } from '@/components/ui';
import { Search, Users, Mail, Phone, GraduationCap, ChevronLeft, ChevronRight } from 'lucide-react';

const STATUS_TABS = ['All', 'ACTIVE', 'INACTIVE'] as const;

export default function StudentsPage() {
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

  return <StudentsList />;
}

function StudentsList() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [page, setPage] = useState(1);

  const params = {
    search: search || undefined,
    status: statusFilter === 'All' ? undefined : statusFilter,
    page,
  };

  const { data, isLoading, error } = useStudents(params);

  if (isLoading) return <Spinner label="Loading students…" />;
  if (error) return <ErrorBanner message={(error as Error).message} />;

  const students = data?.students ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 25);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-surface-900">Student Management</h1>
        <Button onClick={() => router.push('/app/students/new')}>
          <Users className="h-4 w-4" />
          Add Student
        </Button>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
          <Input
            placeholder="Search students by name, email, or roll number…"
            className="pl-10"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="flex gap-1 rounded-xl bg-surface-100 p-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setStatusFilter(tab);
                setPage(1);
              }}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                statusFilter === tab
                  ? 'bg-white text-surface-900 shadow-sm'
                  : 'text-surface-500 hover:text-surface-700'
              }`}
            >
              {tab === 'All' ? 'All' : tab === 'ACTIVE' ? 'Active' : 'Inactive'}
            </button>
          ))}
        </div>
      </div>

      {students.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-surface-300" />
            <p className="mt-4 text-lg font-medium text-surface-600">No students found</p>
            <p className="mt-1 text-sm text-surface-400">
              {search || statusFilter !== 'All'
                ? 'Try adjusting your search or filters.'
                : 'Get started by adding your first student.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {students.map((student) => (
              <Card
                key={student.id}
                className="cursor-pointer"
                onClick={() => router.push(`/app/students/${student.id}`)}
              >
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 text-white font-semibold text-sm">
                    {student.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-surface-900 truncate">{student.name}</h2>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          student.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {student.status}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-surface-500">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" />
                        {student.email}
                      </span>
                      {student.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          {student.phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <GraduationCap className="h-3.5 w-3.5" />
                        Grade {student.grade}
                      </span>
                    </div>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-sm font-medium text-surface-700">
                      Roll: {student.rollNumber}
                    </p>
                    {student.group && (
                      <p className="mt-1 text-xs text-surface-400">
                        {student.group.name}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-surface-500">
                Showing {(page - 1) * 25 + 1}–{Math.min(page * 25, total)} of {total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
