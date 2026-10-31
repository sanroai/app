'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useAdminStudents, useArchiveAdminStudent, useRestoreAdminStudent, useDisableAdminStudent, useEnableAdminStudent, useBulkAdminStudentAction, type AdminStudentQuery } from '@/lib/people-hooks';
import { useInstitutions } from '@/lib/institution-hooks';
import { useBoards, useGrades } from '@/lib/api-hooks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SourceBadge } from '@/components/people/source-badge';
import { cn } from '@/lib/cn';
import {
  Archive,
  ArchiveRestore,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  MoreVertical,
  Power,
  PowerOff,
  RefreshCw,
  Search,
  Users,
} from 'lucide-react';

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700 border-green-200',
  DEACTIVATED: 'bg-red-100 text-red-700 border-red-200',
  ARCHIVED: 'bg-surface-100 text-surface-600 border-surface-200',
};

const SUB_STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-green-50 text-green-700 border-green-200',
  TRIAL: 'bg-sky-50 text-sky-700 border-sky-200',
  EXPIRING_SOON: 'bg-amber-50 text-amber-700 border-amber-200',
  EXPIRED: 'bg-rose-50 text-rose-700 border-rose-200',
  CANCELLED: 'bg-surface-50 text-surface-500 border-surface-200',
  SUSPENDED: 'bg-surface-50 text-surface-500 border-surface-200',
  NONE: 'bg-surface-50 text-surface-500 border-surface-200',
};

const SOURCE_FILTERS = ['INSTITUTION', 'DIRECT_SANRO'];
const STATUS_FILTERS = ['ACTIVE', 'DEACTIVATED', 'ARCHIVED'];
const SUB_FILTERS = ['ACTIVE', 'TRIAL', 'EXPIRING_SOON', 'EXPIRED', 'NONE', 'CANCELLED'];

export default function PeopleStudentsPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [source, setSource] = useState('');
  const [institutionId, setInstitutionId] = useState('');
  const [status, setStatus] = useState('');
  const [grade, setGrade] = useState('');
  const [subStatus, setSubStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pendingAction, setPendingAction] = useState<{ kind: string; id: string; name: string } | null>(null);
  const [pendingBulk, setPendingBulk] = useState<'archive' | 'restore' | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search), 400);
    return () => window.clearTimeout(t);
  }, [search]);

  const params: AdminStudentQuery = {
    search: debouncedSearch || undefined,
    source: source || undefined,
    institutionId: institutionId || undefined,
    status: status || undefined,
    grade: grade || undefined,
    subscriptionStatus: subStatus || undefined,
    page,
    pageSize,
  };

  const { data, isLoading, isFetching, error, refetch } = useAdminStudents(params);

  const institutionsQuery = useInstitutions({ page: 1, pageSize: 100 });
  const institutions = institutionsQuery.data?.items ?? [];
  const institutionOptions = useMemo(() => {
    const map = new Map(institutions.map((i) => [i.id, i.name]));
    return map;
  }, [institutions]);

  const boardsQuery = useBoards();
  const boardId = boardsQuery.data?.[0]?.id;
  const gradesQuery = useGrades(boardId);
  const grades = gradesQuery.data ?? [];

  const actionId = pendingAction?.id ?? '';
  const archiveMut = useArchiveAdminStudent(actionId);
  const restoreMut = useRestoreAdminStudent(actionId);
  const deactivateMut = useDisableAdminStudent(actionId);
  const enableMut = useEnableAdminStudent(actionId);
  const bulkAction = useBulkAdminStudentAction();

  const actionPending =
    pendingAction?.kind === 'archive'
      ? archiveMut.isPending
      : pendingAction?.kind === 'restore'
        ? restoreMut.isPending
        : pendingAction?.kind === 'deactivate'
          ? deactivateMut.isPending
          : pendingAction?.kind === 'enable'
            ? enableMut.isPending
            : false;

  const runAction = async () => {
    if (!pendingAction) return;
    const hook =
      pendingAction.kind === 'archive'
        ? archiveMut
        : pendingAction.kind === 'restore'
          ? restoreMut
          : pendingAction.kind === 'deactivate'
            ? deactivateMut
            : enableMut;
    try {
      const body = pendingAction.kind === 'archive'
        ? { status: 'ARCHIVED' }
        : pendingAction.kind === 'restore'
          ? { status: 'ACTIVE' }
          : undefined;
      await hook.mutateAsync(body);
      toast.success(`${pendingAction.kind.charAt(0).toUpperCase() + pendingAction.kind.slice(1)} successful`);
      setPendingAction(null);
    } catch (err) {
      toast.error((err as { message?: string }).message ?? 'Action failed');
    }
  };

  const runBulk = async () => {
    if (!pendingBulk || selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    const status = pendingBulk === 'archive' ? 'ARCHIVED' : 'ACTIVE';
    let ok = 0;
    for (const id of ids) {
      try {
        await bulkAction.mutateAsync({ id, path: '/status', body: { status } });
        ok++;
      } catch {}
    }
    toast.success(`${ok} of ${ids.length} students ${pendingBulk === 'archive' ? 'archived' : 'restored'}`);
    setSelectedIds(new Set());
    setPendingBulk(null);
  };

  const exportCsv = () => {
    setExporting(true);
    try {
      const header = 'Name,Email,Phone,Grade,Status,Source,Institution,Subscription\n';
      const csvRows = rows.map((r) =>
        [
          `"${(r.name ?? '').replace(/"/g, '""')}"`,
          `"${(r.email ?? '').replace(/"/g, '""')}"`,
          `"${(r.phone ?? '').replace(/"/g, '""')}"`,
          `"${r.grade ?? ''}"`,
          `"${r.status ?? ''}"`,
          `"${r.source ?? ''}"`,
          `"${(r.institutionName ?? '').replace(/"/g, '""')}"`,
          `"${r.subscriptionStatus ?? 'NONE'}"`,
        ].join(','),
      );
      const blob = new Blob([header + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `students-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export ready');
    } catch (err) {
      toast.error((err as { message?: string }).message ?? 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const rows = data?.items ?? [];
  const allSelected = rows.length > 0 && rows.every((r) => selectedIds.has(r.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(rows.map((r) => r.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const resetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setSource('');
    setInstitutionId('');
    setStatus('');
    setGrade('');
    setSubStatus('');
    setPage(1);
    setSelectedIds(new Set());
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Students</h1>
          <p className="mt-1 text-sm text-surface-500">
            {isLoading ? 'Loading students...' : `${data?.total ?? 0} students`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => exportCsv()} disabled={exporting || isLoading}>
            {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search name, email, phone..."
                className="pl-9"
              />
            </div>
            <div className="w-40">
              <Select
                value={source || 'ALL'}
                onValueChange={(v) => {
                  setSource(v === 'ALL' ? '' : v);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All sources</SelectItem>
                  {SOURCE_FILTERS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s === 'DIRECT_SANRO' ? 'Direct SANRO' : s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-44">
              <Select
                value={institutionId || 'ALL'}
                onValueChange={(v) => {
                  setInstitutionId(v === 'ALL' ? '' : v);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All institutions</SelectItem>
                  {institutions.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-36">
              <Select
                value={status || 'ALL'}
                onValueChange={(v) => {
                  setStatus(v === 'ALL' ? '' : v);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All statuses</SelectItem>
                  {STATUS_FILTERS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-32">
              <Select
                value={grade || 'ALL'}
                onValueChange={(v) => {
                  setGrade(v === 'ALL' ? '' : v);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All grades</SelectItem>
                  {grades.map((g) => (
                    <SelectItem key={g} value={g}>Grade {g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <Select
                value={subStatus || 'ALL'}
                onValueChange={(v) => {
                  setSubStatus(v === 'ALL' ? '' : v);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All subscriptions</SelectItem>
                  {SUB_FILTERS.map((s) => (
                    <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Reset
            </Button>
            <Button variant="ghost" size="icon" onClick={() => void refetch()} aria-label="Refresh">
              <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
          <p className="text-sm font-medium text-brand-800">{selectedIds.size} selected</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPendingBulk('archive')}
          >
            <Archive className="mr-1.5 h-3.5 w-3.5" />
            Archive Selected
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPendingBulk('restore')}
          >
            <ArchiveRestore className="mr-1.5 h-3.5 w-3.5" />
            Restore Selected
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelectedIds(new Set())}
          >
            Clear
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-100" />
          ))}
        </div>
      ) : error ? (
        <Card className="py-12 text-center">
          <p className="font-medium text-surface-800">Could not load students</p>
          <p className="mt-1 text-sm text-surface-500">{(error as Error).message}</p>
          <Button className="mt-4" variant="outline" onClick={() => void refetch()}>Retry</Button>
        </Card>
      ) : rows.length === 0 ? (
        <Card className="py-16 text-center">
          <Users className="mx-auto h-12 w-12 text-surface-300" />
          <p className="mt-4 text-sm font-medium text-surface-500">No students match your filters</p>
          <Button className="mt-4" variant="outline" onClick={resetFilters}>Reset filters</Button>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-surface-200 text-xs uppercase tracking-wide text-surface-500">
                  <th className="px-4 py-3 font-medium w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="h-4 w-4 rounded border-surface-300"
                    />
                  </th>
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Institution</th>
                  <th className="px-4 py-3 font-medium">Grade</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Subscription</th>
                  <th className="px-2 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const rowSub = row.subscription;
                  return (
                    <tr key={row.id} className={cn('border-b border-surface-100 last:border-0 hover:bg-surface-50/70', selectedIds.has(row.id) && 'bg-brand-50/50')}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(row.id)}
                          onChange={() => toggleOne(row.id)}
                          className="h-4 w-4 rounded border-surface-300"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-surface-900">
                          <Link
                            href={`/app/people/students/${row.id}`}
                            className="hover:text-brand-700 hover:underline"
                          >
                            {row.name}
                          </Link>
                        </p>
                        <p className="text-xs text-surface-500">{row.email ?? '—'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <SourceBadge source={row.source} />
                      </td>
                      <td className="px-4 py-3 text-surface-700">
                        {institutionOptions.get(row.institutionId ?? '') ?? row.institutionName ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-surface-700">{row.grade ? `Grade ${row.grade}` : '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={cn('text-xs', STATUS_STYLES[row.status ?? ''] ?? 'bg-surface-100 text-surface-600')}>
                          {row.status ?? '—'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={cn('text-xs', SUB_STATUS_STYLES[row.subscriptionStatus ?? 'NONE']) as string}
                        >
                          {row.subscriptionStatus ?? 'NONE'}
                        </Badge>
                        {rowSub?.endsAt ? (
                          <p className="mt-0.5 text-xs text-surface-500">
                            until {new Date(rowSub.endsAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-2 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Actions">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem asChild>
                              <Link href={`/app/people/students/${row.id}`}>View details</Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {row.status === 'ACTIVE' && (
                              <DropdownMenuItem
                                onClick={() => setPendingAction({ kind: 'archive', id: row.id, name: row.name })}
                                className="text-red-600"
                              >
                                <Archive className="mr-2 h-4 w-4" />
                                Archive
                              </DropdownMenuItem>
                            )}
                            {row.status === 'ARCHIVED' && (
                              <DropdownMenuItem
                                onClick={() => setPendingAction({ kind: 'restore', id: row.id, name: row.name })}
                              >
                                <ArchiveRestore className="mr-2 h-4 w-4" />
                                Restore
                              </DropdownMenuItem>
                            )}
                            {row.status === 'ACTIVE' && (
                              <DropdownMenuItem
                                onClick={() => setPendingAction({ kind: 'deactivate', id: row.id, name: row.name })}
                                className="text-red-600"
                              >
                                <PowerOff className="mr-2 h-4 w-4" />
                                Deactivate
                              </DropdownMenuItem>
                            )}
                            {(row.status === 'DEACTIVATED' || row.status === 'ARCHIVED') && (
                              <DropdownMenuItem
                                onClick={() => setPendingAction({ kind: 'enable', id: row.id, name: row.name })}
                              >
                                <Power className="mr-2 h-4 w-4" />
                                Enable
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-surface-200 px-4 py-3">
            <p className="text-xs text-surface-500">
              Showing {(data?.total ?? 0) === 0 ? 0 : (page - 1) * pageSize + 1}–
              {Math.min(page * pageSize, data?.total ?? 0)} of {data?.total ?? 0}
            </p>
            <div className="flex items-center gap-3">
              <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 50, 100].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n} / page</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" disabled={page <= 1 || isLoading} onClick={() => setPage((p) => p - 1)} aria-label="Previous page">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium text-surface-700">{page}</span>
              <Button
                variant="outline"
                size="icon"
                disabled={isLoading || (data?.items?.length ?? 0) < pageSize}
                onClick={() => setPage((p) => p + 1)}
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {pendingAction && (
        <Dialog open onOpenChange={(o) => { if (!o) setPendingAction(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {pendingAction.kind.charAt(0).toUpperCase() + pendingAction.kind.slice(1)} student
              </DialogTitle>
              <DialogDescription>
                {pendingAction.kind === 'archive'
                  ? `Archive "${pendingAction.name}". The student will be removed from active use but all data is preserved.`
                  : pendingAction.kind === 'restore'
                    ? `Restore "${pendingAction.name}" and bring them back to the active list.`
                    : pendingAction.kind === 'deactivate'
                      ? `Deactivate "${pendingAction.name}". They will no longer have access to SANRO.`
                      : `Enable "${pendingAction.name}" and restore their access to SANRO.`}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPendingAction(null)}>
                Cancel
              </Button>
              <Button
                variant={pendingAction.kind === 'archive' || pendingAction.kind === 'deactivate' ? 'destructive' : 'default'}
                disabled={actionPending}
                onClick={() => void runAction()}
              >
                {actionPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {pendingAction.kind.charAt(0).toUpperCase() + pendingAction.kind.slice(1)}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {pendingBulk && (
        <Dialog open onOpenChange={(o) => { if (!o) setPendingBulk(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {pendingBulk === 'archive' ? 'Archive' : 'Restore'} {selectedIds.size} students
              </DialogTitle>
              <DialogDescription>
                {pendingBulk === 'archive'
                  ? `Archive ${selectedIds.size} selected students. They will be removed from active use but all data is preserved.`
                  : `Restore ${selectedIds.size} selected students and bring them back to the active list.`}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPendingBulk(null)}>
                Cancel
              </Button>
              <Button
                variant={pendingBulk === 'archive' ? 'destructive' : 'default'}
                onClick={() => void runBulk()}
              >
                {pendingBulk === 'archive' ? 'Archive' : 'Restore'} Selected
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}