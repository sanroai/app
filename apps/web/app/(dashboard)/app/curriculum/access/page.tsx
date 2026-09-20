'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import {
  useBoardNodes,
  useSubjectNodes,
  useCurriculumAccess,
  useGrantCurriculumAccess,
  useRevokeCurriculumAccess,
  type CurriculumAccessRow,
} from '@/lib/admin-curriculum-hooks';
import { useInstitutions } from '@/lib/institution-hooks';
import { useGrades } from '@/lib/api-hooks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertCircle,
  KeyRound,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/cn';

const NONE = '__none__';

function GradeBadge({ grade }: { grade: string }) {
  return (
    <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600">
      Grade {grade}
    </Badge>
  );
}

export default function CurriculumAccessPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  const [filterInstitutionId, setFilterInstitutionId] = useState('');
  const [institutionId, setInstitutionId] = useState('');
  const [boardId, setBoardId] = useState('');
  const [grade, setGrade] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<CurriculumAccessRow | null>(null);
  const [revokeError, setRevokeError] = useState<string | null>(null);

  const accessQ = useCurriculumAccess(filterInstitutionId || undefined);
  const boardsQ = useBoardNodes();
  const institutionsQ = useInstitutions({ page: 1, pageSize: 100 });
  const gradeOptionsQ = useGrades(boardId || undefined);
  const subjectsQ = useSubjectNodes(boardId || undefined);
  const grantAccess = useGrantCurriculumAccess();
  const revokeAccess = useRevokeCurriculumAccess();

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) {
      router.replace('/login');
    } else if (user.role !== 'SUPER_ADMIN') {
      router.replace('/app');
    }
  }, [hasHydrated, user, router]);

  if (!hasHydrated || !user) return null;
  if (user.role !== 'SUPER_ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
        <p className="font-medium text-surface-800">Access restricted</p>
        <p className="mt-1 text-sm text-surface-500">Only SUPER_ADMIN can manage curriculum access grants.</p>
      </div>
    );
  }

  const institutions = institutionsQ.data?.items ?? [];
  const boards = boardsQ.data ?? [];
  const gradeNames = gradeOptionsQ.data ?? [];
  const subjects = subjectsQ.data ?? [];
  const rows = accessQ.data ?? [];

  const changeBoard = (v: string) => {
    setBoardId(v === NONE ? '' : v);
    setGrade('');
    setSubjectId('');
  };

  const changeGrade = (v: string) => {
    setGrade(v === NONE ? '' : v);
    setSubjectId('');
  };

  const handleGrant = () => {
    if (!institutionId || !boardId) {
      setFormError('Institution and board are required.');
      return;
    }
    setFormError(null);
    grantAccess.mutate(
      {
        institutionId,
        boardId,
        grade: grade || undefined,
        subjectId: subjectId || undefined,
      },
      {
        onSuccess: () => {
          setInstitutionId('');
          setBoardId('');
          setGrade('');
          setSubjectId('');
        },
        onError: (err) => setFormError(err instanceof Error ? err.message : 'Could not grant access'),
      },
    );
  };

  const handleRevoke = () => {
    if (!revokeTarget) return;
    setRevokeError(null);
    revokeAccess.mutate(revokeTarget.id, {
      onSuccess: () => setRevokeTarget(null),
      onError: (err) => setRevokeError(err instanceof Error ? err.message : 'Could not revoke access'),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Curriculum Access</h1>
          <p className="mt-1 text-sm text-surface-500">Grant institutions access to boards, grades and subjects from the canonical curriculum.</p>
        </div>
        <Button variant="outline" size="icon" onClick={() => void accessQ.refetch()} aria-label="Refresh">
          <RefreshCw className={cn('h-4 w-4', accessQ.isFetching && 'animate-spin')} />
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center gap-2 text-surface-800">
            <KeyRound className="h-5 w-5 text-brand-600" />
            <p className="font-semibold">Grant new access</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-surface-500">Institution</Label>
              <Select value={institutionId} onValueChange={(v) => setInstitutionId(v === NONE ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select institution" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Select institution</SelectItem>
                  {institutions.map((i) => (
                    <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-surface-500">Board</Label>
              <Select value={boardId} onValueChange={changeBoard}>
                <SelectTrigger>
                  <SelectValue placeholder="Select board" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Select board</SelectItem>
                  {boards.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-surface-500">Grade (optional)</Label>
              <Select value={grade} onValueChange={changeGrade} disabled={!boardId}>
                <SelectTrigger>
                  <SelectValue placeholder="All grades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>All grades</SelectItem>
                  {gradeNames.map((g) => (
                    <SelectItem key={g} value={g}>Grade {g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-surface-500">Subject (optional)</Label>
              <Select value={subjectId} onValueChange={(v) => setSubjectId(v === NONE ? '' : v)} disabled={!boardId}>
                <SelectTrigger>
                  <SelectValue placeholder="All subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>All subjects</SelectItem>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.code} · {s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full lg:w-auto" onClick={handleGrant} disabled={grantAccess.isPending}>
                {grantAccess.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Grant access
              </Button>
            </div>
          </div>
          {formError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {formError}
            </div>
          ) : null}
          {grantAccess.isSuccess ? (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800" role="alert">
              Curriculum access granted.
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <p className="text-sm font-medium text-surface-800">Access grants</p>
          <div className="w-64">
            <Select value={filterInstitutionId || NONE} onValueChange={(v) => setFilterInstitutionId(v === NONE ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by institution" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>All institutions</SelectItem>
                {institutions.map((i) => (
                  <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {accessQ.isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : accessQ.error ? (
          <div className="py-12 text-center">
            <p className="font-medium text-surface-800">Could not load access grants</p>
            <p className="mt-1 text-sm text-surface-500">{(accessQ.error as Error).message}</p>
            <Button className="mt-4" variant="outline" onClick={() => void accessQ.refetch()}>Retry</Button>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center">
            <KeyRound className="mx-auto h-10 w-10 text-surface-300" />
            <p className="mt-4 text-sm font-medium text-surface-500">No access grants found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-surface-500">
                  <th className="px-4 py-3 font-medium">Institution</th>
                  <th className="px-4 py-3 font-medium">Board</th>
                  <th className="px-4 py-3 font-medium">Grade</th>
                  <th className="px-4 py-3 font-medium">Subject</th>
                  <th className="px-4 py-3 font-medium">Granted</th>
                  <th className="px-2 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <p className="font-medium text-surface-900">{row.institution.name}</p>
                      <p className="text-xs text-surface-500">{row.institution.code}</p>
                    </td>
                    <td className="px-4 py-3 text-surface-700">{row.board.name}</td>
                    <td className="px-4 py-3">
                      {row.grade ? <GradeBadge grade={row.grade} /> : <span className="text-xs text-surface-400">All</span>}
                    </td>
                    <td className="px-4 py-3 text-surface-700">{row.subject ? row.subject.name : <span className="text-xs text-surface-400">All</span>}</td>
                    <td className="px-4 py-3 text-xs text-surface-500">
                      {new Date(row.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-2 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Revoke access"
                        onClick={() => setRevokeTarget(row)}
                        className="text-red-500 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Dialog open={!!revokeTarget} onOpenChange={(v) => { if (!v) setRevokeTarget(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Revoke curriculum access?</DialogTitle>
            <DialogDescription>
              {revokeTarget ? (
                <>
                  Remove access for <strong>{revokeTarget.institution.name}</strong> to <strong>{revokeTarget.board.name}</strong>
                  {revokeTarget.grade ? ` · Grade ${revokeTarget.grade}` : ''}
                  {revokeTarget.subject ? ` · ${revokeTarget.subject.name}` : ''}?
                </>
              ) : 'Remove this access grant?'}
            </DialogDescription>
          </DialogHeader>
          {revokeError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {revokeError}
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeTarget(null)} disabled={revokeAccess.isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRevoke} disabled={revokeAccess.isPending}>
              {revokeAccess.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Revoke
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}