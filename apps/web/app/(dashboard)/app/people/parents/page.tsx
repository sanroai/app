'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  useAdminParents,
  useCreateAdminParent,
  useUpdateAdminParent,
  useDisableAdminParent,
  useEnableAdminParent,
  useAdminParentLinkChild,
  useAdminParentUnlinkChild,
  useAdminStudentSearch,
  type AdminParentQuery,
  type AdminParentListItem,
} from '@/lib/people-hooks';
import { useInstitutions } from '@/lib/institution-hooks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
  ChevronLeft,
  ChevronRight,
  Link2,
  Loader2,
  MoreVertical,
  Power,
  PowerOff,
  RefreshCw,
  Search,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700 border-green-200',
  DEACTIVATED: 'bg-red-100 text-red-700 border-red-200',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  DEACTIVATED: 'Deactivated',
};

const SOURCE_FILTERS = ['INSTITUTION', 'DIRECT_SANRO'];

const ParentFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().optional().or(z.literal('')),
  institutionId: z.string().min(1, 'Institution is required'),
});
type ParentFormValues = z.infer<typeof ParentFormSchema>;

export default function PeopleParentsPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [source, setSource] = useState('');
  const [institutionId, setInstitutionId] = useState('');
  const [status, setStatus] = useState('');
  const [childrenFilter, setChildrenFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminParentListItem | null>(null);
  const [pendingAction, setPendingAction] = useState<{ kind: string; id: string; name: string } | null>(null);
  const [pendingBulk, setPendingBulk] = useState<'deactivate' | 'enable' | null>(null);
  const [linkTarget, setLinkTarget] = useState<AdminParentListItem | null>(null);
  const [unlinkTarget, setUnlinkTarget] = useState<AdminParentListItem | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search), 400);
    return () => window.clearTimeout(t);
  }, [search]);

  const params: AdminParentQuery = {
    search: debouncedSearch || undefined,
    source: source || undefined,
    institutionId: institutionId || undefined,
    status: status || undefined,
    page,
    pageSize,
  };

  const { data, isLoading, isFetching, error, refetch } = useAdminParents(params);

  const institutionsQuery = useInstitutions({ page: 1, pageSize: 100 });
  const institutions = institutionsQuery.data?.items ?? [];
  const institutionOptions = useMemo(() => {
    const map = new Map(institutions.map((i) => [i.id, i.name]));
    return map;
  }, [institutions]);

  const defaultInstitutionId = useMemo(() => {
    const sanro = institutions.find((i) => i.name === 'Sanro AI');
    return sanro?.id ?? institutions[0]?.id ?? '';
  }, [institutions]);

  const rows = data?.items ?? [];

  const filteredRows = useMemo(() => {
    if (childrenFilter === 'LINKED') return rows.filter((r) => (r.childrenCount ?? 0) > 0);
    if (childrenFilter === 'UNLINKED') return rows.filter((r) => (r.childrenCount ?? 0) === 0);
    return rows;
  }, [rows, childrenFilter]);

  const allSelected = filteredRows.length > 0 && filteredRows.every((r) => selectedIds.has(r.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRows.map((r) => r.id)));
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
    setChildrenFilter('');
    setPage(1);
    setSelectedIds(new Set());
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Parents</h1>
          <p className="mt-1 text-sm text-surface-500">
            {isLoading ? 'Loading parents...' : `${data?.total ?? 0} parents`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setAddOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Parent
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
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="DEACTIVATED">Deactivated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-44">
              <Select
                value={childrenFilter || 'ALL'}
                onValueChange={(v) => {
                  setChildrenFilter(v === 'ALL' ? '' : v);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All children status</SelectItem>
                  <SelectItem value="LINKED">Has children</SelectItem>
                  <SelectItem value="UNLINKED">No children</SelectItem>
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
          <Button size="sm" variant="outline" onClick={() => setPendingBulk('deactivate')}>
            <PowerOff className="mr-1.5 h-3.5 w-3.5" />
            Deactivate Selected
          </Button>
          <Button size="sm" variant="outline" onClick={() => setPendingBulk('enable')}>
            <Power className="mr-1.5 h-3.5 w-3.5" />
            Enable Selected
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
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
          <p className="font-medium text-surface-800">Could not load parents</p>
          <p className="mt-1 text-sm text-surface-500">{(error as Error).message}</p>
          <Button className="mt-4" variant="outline" onClick={() => void refetch()}>Retry</Button>
        </Card>
      ) : filteredRows.length === 0 ? (
        <Card className="py-16 text-center">
          <Users className="mx-auto h-12 w-12 text-surface-300" />
          <p className="mt-4 text-sm font-medium text-surface-500">No parents match your filters</p>
          <Button className="mt-4" variant="outline" onClick={resetFilters}>Reset filters</Button>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-surface-200 text-xs uppercase tracking-wide text-surface-500">
                  <th className="px-4 py-3 font-medium w-10">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={() => toggleAll()}
                    />
                  </th>
                  <th className="px-4 py-3 font-medium">Parent</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Institution</th>
                  <th className="px-4 py-3 font-medium">Children</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-2 py-3" />
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => {
                  const children = row.children ?? [];
                  return (
                    <tr key={row.id} className={cn('border-b border-surface-100 last:border-0 hover:bg-surface-50/70', selectedIds.has(row.id) && 'bg-brand-50/50')}>
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={selectedIds.has(row.id)}
                          onCheckedChange={() => toggleOne(row.id)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-surface-900">
                          <Link
                            href={`/app/people/parents/${row.id}`}
                            className="hover:text-brand-700 hover:underline"
                          >
                            {row.name}
                          </Link>
                        </p>
                        <p className="text-xs text-surface-500">
                          {row.email ?? '—'}
                          {row.phone ? ` · ${row.phone}` : ''}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <SourceBadge source={row.source} />
                      </td>
                      <td className="px-4 py-3 text-surface-700">
                        {institutionOptions.get(row.institutionId ?? '') ?? row.institutionName ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-surface-700">
                        {children.length === 0 ? (
                          <span className="text-surface-500">0 children</span>
                        ) : (
                          <div className="space-y-1">
                            {children.map((c) => (
                              <div key={c.studentId} className="flex items-center gap-2">
                                <span className="text-surface-700">{c.studentName}</span>
                                <SourceBadge source={c.source} className="text-[9px]" />
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={cn('text-xs', STATUS_STYLES[row.status ?? ''] ?? 'bg-surface-100 text-surface-600')}>
                          {STATUS_LABELS[row.status ?? ''] ?? row.status ?? '—'}
                        </Badge>
                      </td>
                      <td className="px-2 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Actions">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem asChild>
                              <Link href={`/app/people/parents/${row.id}`}>View details</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditTarget(row)}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {row.status === 'ACTIVE' && (
                              <DropdownMenuItem
                                onClick={() => setPendingAction({ kind: 'deactivate', id: row.id, name: row.name })}
                                className="text-red-600"
                              >
                                <PowerOff className="mr-2 h-4 w-4" />
                                Deactivate
                              </DropdownMenuItem>
                            )}
                            {row.status === 'DEACTIVATED' && (
                              <DropdownMenuItem
                                onClick={() => setPendingAction({ kind: 'enable', id: row.id, name: row.name })}
                              >
                                <Power className="mr-2 h-4 w-4" />
                                Enable
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setLinkTarget(row)}>
                              <Link2 className="mr-2 h-4 w-4" />
                              Link Child
                            </DropdownMenuItem>
                            {(row.children ?? []).length > 0 && (
                              <DropdownMenuItem onClick={() => setUnlinkTarget(row)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Unlink Child
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

      {addOpen && (
        <ParentFormDialog
          defaultInstitutionId={defaultInstitutionId}
          institutions={institutions}
          onClose={() => setAddOpen(false)}
        />
      )}

      {editTarget && (
        <ParentFormDialog
          defaultInstitutionId={editTarget.institutionId ?? ''}
          institutions={institutions}
          onClose={() => setEditTarget(null)}
          initialData={{
            name: editTarget.name,
            email: editTarget.email ?? '',
            phone: editTarget.phone ?? '',
            institutionId: editTarget.institutionId ?? '',
            id: editTarget.id,
          }}
        />
      )}

      {pendingAction && (
        <StatusConfirmDialog
          kind={pendingAction.kind}
          id={pendingAction.id}
          name={pendingAction.name}
          onClose={() => setPendingAction(null)}
        />
      )}

      {pendingBulk && (
        <BulkStatusDialog
          kind={pendingBulk}
          count={selectedIds.size}
          onClose={() => setPendingBulk(null)}
          onConfirm={() => {
            const ids = Array.from(selectedIds);
            const statusValue = pendingBulk === 'deactivate' ? 'DEACTIVATED' : 'ACTIVE';
            let ok = 0;
            const doAll = async () => {
              for (const id of ids) {
                try {
                  const mut = pendingBulk === 'deactivate'
                    ? useDisableAdminParent(id)
                    : useEnableAdminParent(id);
                  await mut.mutateAsync();
                  ok++;
                } catch {}
              }
              toast.success(`${ok} of ${ids.length} parents ${pendingBulk === 'deactivate' ? 'deactivated' : 'activated'}`);
              setSelectedIds(new Set());
              setPendingBulk(null);
            };
            void doAll();
          }}
        />
      )}

      {linkTarget && (
        <LinkChildDialog
          parentId={linkTarget.id}
          parentName={linkTarget.name}
          onClose={() => setLinkTarget(null)}
        />
      )}

      {unlinkTarget && (
        <UnlinkChildDialog
          parent={unlinkTarget}
          onClose={() => setUnlinkTarget(null)}
        />
      )}
    </div>
  );
}

function ParentFormDialog({
  defaultInstitutionId,
  institutions,
  onClose,
  initialData,
}: {
  defaultInstitutionId: string;
  institutions: Array<{ id: string; name: string }>;
  onClose: () => void;
  initialData?: { name: string; email: string; phone?: string; institutionId?: string; id: string };
}) {
  const isEdit = !!initialData;
  const createMut = useCreateAdminParent();
  const updateMut = useUpdateAdminParent(initialData?.id ?? '');

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ParentFormValues>({
    resolver: zodResolver(ParentFormSchema),
    defaultValues: {
      name: initialData?.name ?? '',
      email: initialData?.email ?? '',
      phone: initialData?.phone ?? '',
      institutionId: initialData?.institutionId ?? defaultInstitutionId,
    },
  });

  const onSubmit = async (values: ParentFormValues) => {
    try {
      if (isEdit) {
        await updateMut.mutateAsync({
          name: values.name,
          email: values.email,
          phone: values.phone || undefined,
        });
        toast.success('Parent updated');
      } else {
        await createMut.mutateAsync({
          name: values.name,
          email: values.email,
          phone: values.phone || undefined,
          institutionId: values.institutionId,
        });
        toast.success('Parent created');
      }
      onClose();
    } catch (err) {
      toast.error((err as { message?: string }).message ?? 'Failed');
    }
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Parent' : 'Add Parent'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update parent details.' : 'Create a new parent account.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="parent-name">Full Name *</Label>
            <Input id="parent-name" placeholder="e.g. Sunita Sharma" {...register('name')} />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="parent-email">Email *</Label>
            <Input id="parent-email" type="email" placeholder="parent@example.com" {...register('email')} />
            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="parent-phone">Phone</Label>
            <Input id="parent-phone" placeholder="9876543210" {...register('phone')} />
            {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
          </div>
          {!isEdit && (
            <div className="space-y-2">
              <Label>Institution *</Label>
              <Controller
                control={control}
                name="institutionId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {institutions.map((i) => (
                        <SelectItem key={i.id} value={i.id}>
                          {i.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.institutionId && <p className="text-sm text-red-500">{errors.institutionId.message}</p>}
            </div>
          )}
          {!isEdit && (
            <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-sm text-blue-700">
              The parent will receive a default password (<code className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-sm font-mono">sanro123</code>). They should change it on first login.
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {(createMut.isPending || updateMut.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Save Changes' : 'Create Parent'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function StatusConfirmDialog({
  kind,
  id,
  name,
  onClose,
}: {
  kind: string;
  id: string;
  name: string;
  onClose: () => void;
}) {
  const deactivateMut = useDisableAdminParent(id);
  const enableMut = useEnableAdminParent(id);

  const actionPending = kind === 'deactivate' ? deactivateMut.isPending : enableMut.isPending;

  const run = async () => {
    try {
      if (kind === 'deactivate') {
        await deactivateMut.mutateAsync();
      } else {
        await enableMut.mutateAsync();
      }
      toast.success(`${kind === 'deactivate' ? 'Deactivated' : 'Enabled'} ${name}`);
      onClose();
    } catch (err) {
      toast.error((err as { message?: string }).message ?? 'Action failed');
    }
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {kind === 'deactivate' ? 'Deactivate' : 'Enable'} parent
          </DialogTitle>
          <DialogDescription>
            {kind === 'deactivate'
              ? `Deactivate "${name}". They will no longer have access to SANRO.`
              : `Enable "${name}" and restore their access to SANRO.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            variant={kind === 'deactivate' ? 'destructive' : 'default'}
            disabled={actionPending}
            onClick={() => void run()}
          >
            {actionPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {kind === 'deactivate' ? 'Deactivate' : 'Enable'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BulkStatusDialog({
  kind,
  count,
  onClose,
  onConfirm,
}: {
  kind: 'deactivate' | 'enable';
  count: number;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {kind === 'deactivate' ? 'Deactivate' : 'Enable'} {count} parents
          </DialogTitle>
          <DialogDescription>
            {kind === 'deactivate'
              ? `Deactivate ${count} selected parents. They will no longer have access to SANRO.`
              : `Enable ${count} selected parents and restore their access to SANRO.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant={kind === 'deactivate' ? 'destructive' : 'default'} onClick={onConfirm}>
            {kind === 'deactivate' ? 'Deactivate' : 'Enable'} Selected
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LinkChildDialog({
  parentId,
  parentName,
  onClose,
}: {
  parentId: string;
  parentName: string;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const linkMut = useAdminParentLinkChild(parentId);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query), 300);
    return () => window.clearTimeout(t);
  }, [query]);

  const { data: results, isLoading } = useAdminStudentSearch(debouncedQuery);

  const handleLink = async (studentId: string) => {
    try {
      await linkMut.mutateAsync(studentId);
      toast.success('Child linked');
      onClose();
    } catch (err) {
      toast.error((err as { message?: string }).message ?? 'Failed to link');
    }
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Link Child to {parentName}</DialogTitle>
          <DialogDescription>Search for a student to link as a child.</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search student name or email..."
            className="pl-9"
            autoFocus
          />
        </div>
        <div className="max-h-64 space-y-1 overflow-y-auto">
          {debouncedQuery.length === 0 ? (
            <p className="py-4 text-center text-sm text-surface-400">Type to search students</p>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-surface-400" />
            </div>
          ) : (results ?? []).length === 0 ? (
            <p className="py-4 text-center text-sm text-surface-400">No students found</p>
          ) : (
            (results ?? []).map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-surface-50"
              >
                <div>
                  <p className="text-sm font-medium text-surface-900">{s.name}</p>
                  <p className="text-xs text-surface-500">
                    {s.email ?? '—'}{s.grade ? ` · Grade ${s.grade}` : ''}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void handleLink(s.id)}
                  disabled={linkMut.isPending}
                >
                  {linkMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Link'}
                </Button>
              </div>
            ))
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UnlinkChildDialog({
  parent,
  onClose,
}: {
  parent: AdminParentListItem;
  onClose: () => void;
}) {
  const children = parent.children ?? [];
  const unlinkMut = useAdminParentUnlinkChild(parent.id);

  const handleUnlink = async (studentId: string) => {
    try {
      await unlinkMut.mutateAsync(studentId);
      toast.success('Child unlinked');
      onClose();
    } catch (err) {
      toast.error((err as { message?: string }).message ?? 'Failed to unlink');
    }
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Unlink Child from {parent.name}</DialogTitle>
          <DialogDescription>Select a child to unlink from this parent.</DialogDescription>
        </DialogHeader>
        <div className="space-y-1">
          {children.map((c) => (
            <div
              key={c.studentId}
              className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-surface-50"
            >
              <div>
                <p className="text-sm font-medium text-surface-900">{c.studentName}</p>
                <p className="text-xs text-surface-500">{c.grade ?? '—'}</p>
              </div>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => void handleUnlink(c.studentId)}
                disabled={unlinkMut.isPending}
              >
                {unlinkMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Unlink'}
              </Button>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
