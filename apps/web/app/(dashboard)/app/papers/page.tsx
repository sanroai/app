'use client';

import { useRouter } from 'next/navigation';
import { usePapers } from '@/lib/api-hooks';
import { useRole } from '@/lib/role-theme';
import { useAuthStore } from '@/lib/auth-store';
import { Badge, Button, Card, ErrorBanner, Spinner } from '@/components/ui';
import { formatDate } from '@/lib/format';
import { AlertCircle, Eye, FileText, Plus } from 'lucide-react';

export default function PapersPage() {
  const router = useRouter();
  const role = useRole();
  const { user } = useAuthStore();
  const { data, isLoading, error } = usePapers();

  // Question papers are a staff authoring tool: the nav only exposes this route to
  // staff, and the API mutations (`POST /papers`, duplicate/regenerate/export) are
  // `@Roles(INSTITUTION_ADMIN, TEACHER)`. Students/parents receive papers through the
  // assessment flow, not this page. This render-guard is defense-in-depth UX only —
  // the API `@Roles` guard remains the actual security boundary. (FINDING-G)
  const isStaff = user?.role === 'TEACHER' || user?.role === 'INSTITUTION_ADMIN' || user?.role === 'SUPER_ADMIN';
  if (!isStaff) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold">Access Denied</h2>
        <p className="text-surface-500">Question papers are available to teaching staff.</p>
      </div>
    );
  }

  if (isLoading) return <Spinner label="Loading papers…" />;
  if (error) return <ErrorBanner message={(error as Error).message} />;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Question papers</h1>
        {role !== 'SUPER_ADMIN' && (
          <Button onClick={() => router.push('/app/papers/new')}>
            <Plus className="h-4 w-4" />
            New paper
          </Button>
        )}
      </div>
      <div className="space-y-3">
        {(data ?? []).map((p: { id: string; title: string; status: string; subject?: { name: string } | null; examName?: string; totalMarks?: number; durationMinutes?: number; date?: string | null }) => (
          <Card key={p.id} className="flex items-center justify-between gap-4 hover:shadow-md transition-all">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-brand-600" />
                <h2 className="font-semibold text-surface-900">{p.title}</h2>
                <Badge>{p.status}</Badge>
              </div>
              <p className="mt-1 text-sm text-surface-500">
                {p.subject?.name ?? '—'} · {p.examName ?? ''} · {p.totalMarks ?? '—'} marks · {p.durationMinutes ?? '—'} min ·{' '}
                {formatDate(p.date)}
              </p>
            </div>
            <Button variant="outline" onClick={() => router.push(`/app/papers/${p.id}`)}>
              <Eye className="h-4 w-4" />
              Open
            </Button>
          </Card>
        ))}
        {data && data.length === 0 ? <p className="text-sm text-surface-400">No papers yet — generate your first one.</p> : null}
      </div>
    </div>
  );
}