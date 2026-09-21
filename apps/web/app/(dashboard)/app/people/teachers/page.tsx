'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  useAdminTeachers,
  useCreateAdminTeacher,
  useUpdateAdminTeacher,
  useDisableAdminTeacher,
  useEnableAdminTeacher,
  useTransferAdminTeacher,
  type AdminTeacherQuery,
  type AdminTeacherListItem,
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
import { cn } from '@/lib/cn';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  MoreVertical,
  Pencil,
  Power,
  PowerOff,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
} from 'lucide-react';

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700 border-green-200',
  DEACTIVATED: 'bg-red-100 text-red-700 border-red-200',
  INVITED: 'bg-amber-100 text-amber-700 border-amber-200',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  DEACTIVATED: 'Deactivated',
  INVITED: 'Invited',
};

const teacherFormSchema = z.object({
  name: z.string().trim().min(2, 'Name is required'),
  email: z.string().trim().toLowerCase().email('Invalid email'),
  phone: z.string().trim().optional().refine(
    (v) => !v || /^\+?[0-9\s-]{8,15}$/.test(v),
    'Invalid phone number',
  ),
  institutionId: z.string().min(1, 'Institution is required'),
  employeeId: z.string().trim().optional(),
});

type TeacherFormData = z.infer<typeof teacherFormSchema>;

const transferSchema = z.object({
  targetInstitutionId: z.string().min(1, 'Target institution is required'),
});

export default function PeopleTeachersPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [institutionId, setInstitutionId] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [addOpen, setAddOpen] = useState(false);
  const [editRow, setEditRow] = useState<AdminTeacherListItem | null>(null);
  const [deactivateRow, setDeactivateRow] = useState<AdminTeacherListItem | null>(null);
  const [enableRow, setEnableRow] = useState<AdminTeacherListItem | null>(null);
  const [transferRow, setTransferRow] = useState<AdminTeacherListItem | null>(null);
  const [pendingBulk, setPendingBulk] = useState<'deactivate' | 'enable' | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search), 400);
    return () => window.clearTimeout(t);
  }, [search]);

  const params: AdminTeacherQuery = {
    search: debouncedSearch || undefined,
    institutionId: institutionId || undefined,
    status: status || undefined,
    page,
    pageSize,
  };

  const { data, isLoading, isFetching, error, refetch } = useAdminTeachers(params);

  const institutionsQuery = useInstitutions({ page: 1, pageSize: 100 });
  const institutions = institutionsQuery.data?.items ?? [];

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
    setInstitutionId('');
    setStatus('');
    setPage(1);
    setSelectedIds(new Set());
  };

  const createMut = useCreateAdminTeacher();
  const addForm = useForm<TeacherFormData>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: { name: '', email: '', phone: '', institutionId: '', employeeId: '' },
  });

  const handleAddSubmit = async (values: TeacherFormData) => {
    try {
      const result = await createMut.mutateAsync({
        name: values.name,
        email: values.email,
        phone: values.phone || undefined,
        institutionId: values.institutionId,
        employeeId: values.employeeId || undefined,
      });
      toast.success('Teacher created', {
        description: result.defaultPassword ? `Default password: ${result.defaultPassword}` : undefined,
      });
      addForm.reset();
      setAddOpen(false);
    } catch (err) {
      toast.error((err as { message?: string }).message ?? 'Failed to create teacher');
    }
  };

  const updateMut = useUpdateAdminTeacher(editRow?.id ?? '');
  const editForm = useForm<TeacherFormData>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: { name: '', email: '', phone: '', institutionId: '', employeeId: '' },
  });

  const openEdit = (row: AdminTeacherListItem) => {
    editForm.reset({
      name: row.name ?? '',
      email: row.email ?? '',
      phone: row.phone ?? '',
      institutionId: row.institutionId ?? '',
      employeeId: row.employeeId ?? '',
    });
    setEditRow(row);
  };

  const handleEditSubmit = async (values: TeacherFormData) => {
    if (!editRow) return;
    try {
      await updateMut.mutateAsync({
        employeeId: values.employeeId || undefined,
      });
      toast.success('Teacher updated');
      setEditRow(null);
    } catch (err) {
      toast.error((err as { message?: string }).message ?? 'Failed to update teacher');
    }
  };

  const deactivateMut = useDisableAdminTeacher(deactivateRow?.id ?? '');
  const enableMut = useEnableAdminTeacher(enableRow?.id ?? '');
  const transferMut = useTransferAdminTeacher(transferRow?.id ?? '');

  const handleDeactivate = async () => {
    if (!deactivateRow) return;
    try {
      await deactivateMut.mutateAsync();
      toast.success('Teacher deactivated');
      setDeactivateRow(null);
    } catch (err) {
      toast.error((err as { message?: string }).message ?? 'Failed to deactivate');
    }
  };

  const handleEnable = async () => {
    if (!enableRow) return;
    try {
      await enableMut.mutateAsync();
      toast.success('Teacher enabled');
      setEnableRow(null);
    } catch (err) {
      toast.error((err as { message?: string }).message ?? 'Failed to enable');
    }
  };

  const transferForm = useForm<z.infer<typeof transferSchema>>({
    resolver: zodResolver(transferSchema),
    defaultValues: { targetInstitutionId: '' },
  });

  const handleTransfer = async (values: z.infer<typeof transferSchema>) => {
    if (!transferRow) return;
    try {
      await transferMut.mutateAsync(values);
      toast.success('Teacher transferred');
      transferForm.reset();
      setTransferRow(null);
    } catch (err) {
      toast.error((err as { message?: string }).message ?? 'Failed to transfer');
    }
  };

  const handleBulk = async () => {
    if (!pendingBulk || selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    let ok = 0;
    for (const id of ids) {
      try {
        const mut = pendingBulk === 'deactivate'
          ? useDisableAdminTeacher(id)
          : useEnableAdminTeacher(id);
        await mut.mutateAsync();
        ok++;
      } catch {}
    }
    toast.success(`${ok} of ${ids.length} teachers ${pendingBulk === 'deactivate' ? 'deactivated' : 'enabled'}`);
    setSelectedIds(new Set());
    setPendingBulk(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Teachers</h1>
          <p className="mt-1 text-sm text-surface-500">
            {isLoading ? 'Loading teachers...' : `${data?.total ?? 0} teachers`}
          </p>
          <p className="text-xs text-surface-400">Teachers are always bound to an institution.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => { addForm.reset(); setAddOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Teacher
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
                placeholder="Search name, email..."
                className="pl-9"
              />
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
            onClick={() => setPendingBulk('deactivate')}
          >
            <PowerOff className="mr-1.5 h-3.5 w-3.5" />
            Deactivate Selected
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPendingBulk('enable')}
          >
            <Power className="mr-1.5 h-3.5 w-3.5" />
            Enable Selected
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
          <p className="font-medium text-surface-800">Could not load teachers</p>
          <p className="mt-1 text-sm text-surface-500">{(error as Error).message}</p>
          <Button className="mt-4" variant="outline" onClick={() => void refetch()}>Retry</Button>
        </Card>
      ) : rows.length === 0 ? (
        <Card className="py-16 text-center">
          <Users className="mx-auto h-12 w-12 text-surface-300" />
          <p className="mt-4 text-sm font-medium text-surface-500">No teachers match your filters</p>
          <Button className="mt-4" variant="outline" onClick={resetFilters}>Reset filters</Button>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                  <tr className="border-b border-surface-200 text-xs uppercase tracking-wide text-surface-500">
                  <th className="px-4 py-3 font-medium w-10">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleAll}
                    />
                  </th>
                  <th className="px-4 py-3 font-medium">Teacher</th>
                  <th className="px-4 py-3 font-medium">Institution</th>
                  <th className="px-4 py-3 font-medium">Subjects</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-2 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
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
                          href={`/app/people/teachers/${row.id}`}
                          className="hover:text-brand-700 hover:underline"
                        >
                          {row.name}
                        </Link>
                      </p>
                      <p className="text-xs text-surface-500">{row.email ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-surface-700">{row.institutionName ?? '—'}</td>
                    <td className="px-4 py-3 text-surface-700">
                      {(row.subjects ?? []).map((s) => s.name).join(', ') || '—'}
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
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem asChild>
                            <Link href={`/app/people/teachers/${row.id}`}>View details</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(row)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {row.status === 'ACTIVE' && (
                            <DropdownMenuItem
                              onClick={() => setDeactivateRow(row)}
                              className="text-red-600"
                            >
                              <PowerOff className="mr-2 h-4 w-4" />
                              Deactivate
                            </DropdownMenuItem>
                          )}
                          {row.status === 'DEACTIVATED' && (
                            <DropdownMenuItem onClick={() => setEnableRow(row)}>
                              <Power className="mr-2 h-4 w-4" />
                              Enable
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => { transferForm.reset(); setTransferRow(row); }}>
                            Transfer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
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
        <Dialog open onOpenChange={(o) => { if (!o) setAddOpen(false); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Teacher</DialogTitle>
              <DialogDescription>Create a new teacher account. A default password will be generated.</DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => void addForm.handleSubmit(handleAddSubmit)(e)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="add-name">Name *</Label>
                <Input id="add-name" {...addForm.register('name')} placeholder="Full name" />
                {addForm.formState.errors.name && (
                  <p className="text-xs text-red-500">{addForm.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-email">Email *</Label>
                <Input id="add-email" type="email" {...addForm.register('email')} placeholder="teacher@school.com" />
                {addForm.formState.errors.email && (
                  <p className="text-xs text-red-500">{addForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-phone">Phone</Label>
                <Input id="add-phone" {...addForm.register('phone')} placeholder="+91 98765 43210" />
                {addForm.formState.errors.phone && (
                  <p className="text-xs text-red-500">{addForm.formState.errors.phone.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-institution">Institution *</Label>
                <Select
                  value={addForm.watch('institutionId')}
                  onValueChange={(v) => addForm.setValue('institutionId', v, { shouldValidate: true })}
                >
                  <SelectTrigger id="add-institution">
                    <SelectValue placeholder="Select institution" />
                  </SelectTrigger>
                  <SelectContent>
                    {institutions.map((i) => (
                      <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {addForm.formState.errors.institutionId && (
                  <p className="text-xs text-red-500">{addForm.formState.errors.institutionId.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-employeeId">Employee ID</Label>
                <Input id="add-employeeId" {...addForm.register('employeeId')} placeholder="Optional" />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMut.isPending}>
                  {createMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Teacher
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {editRow && (
        <Dialog open onOpenChange={(o) => { if (!o) setEditRow(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Teacher</DialogTitle>
              <DialogDescription>Update teacher details.</DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => void editForm.handleSubmit(handleEditSubmit)(e)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input id="edit-name" {...editForm.register('name')} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input id="edit-email" {...editForm.register('email')} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input id="edit-phone" {...editForm.register('phone')} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-institution">Institution</Label>
                <Input id="edit-institution" value={editRow.institutionName ?? ''} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-employeeId">Employee ID</Label>
                <Input id="edit-employeeId" {...editForm.register('employeeId')} placeholder="Optional" />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditRow(null)}>Cancel</Button>
                <Button type="submit" disabled={updateMut.isPending}>
                  {updateMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {deactivateRow && (
        <Dialog open onOpenChange={(o) => { if (!o) setDeactivateRow(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Deactivate Teacher</DialogTitle>
              <DialogDescription>
                Deactivate &quot;{deactivateRow.name}&quot;? They will no longer have access to SANRO.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeactivateRow(null)}>Cancel</Button>
              <Button variant="destructive" disabled={deactivateMut.isPending} onClick={() => void handleDeactivate()}>
                {deactivateMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Deactivate
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {enableRow && (
        <Dialog open onOpenChange={(o) => { if (!o) setEnableRow(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Enable Teacher</DialogTitle>
              <DialogDescription>
                Enable &quot;{enableRow.name}&quot; and restore their access to SANRO.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEnableRow(null)}>Cancel</Button>
              <Button disabled={enableMut.isPending} onClick={() => void handleEnable()}>
                {enableMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enable
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {transferRow && (
        <Dialog open onOpenChange={(o) => { if (!o) setTransferRow(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Transfer Teacher</DialogTitle>
              <DialogDescription>
                Transfer &quot;{transferRow.name}&quot; to a different institution.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => void transferForm.handleSubmit(handleTransfer)(e)} className="space-y-4">
              <div className="space-y-2">
                <Label>Current Institution</Label>
                <Input value={transferRow.institutionName ?? ''} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transfer-target">Target Institution *</Label>
                <Select
                  value={transferForm.watch('targetInstitutionId')}
                  onValueChange={(v) => transferForm.setValue('targetInstitutionId', v, { shouldValidate: true })}
                >
                  <SelectTrigger id="transfer-target">
                    <SelectValue placeholder="Select target institution" />
                  </SelectTrigger>
                  <SelectContent>
                    {institutions.filter((i) => i.id !== transferRow.institutionId).map((i) => (
                      <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {transferForm.formState.errors.targetInstitutionId && (
                  <p className="text-xs text-red-500">{transferForm.formState.errors.targetInstitutionId.message}</p>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setTransferRow(null)}>Cancel</Button>
                <Button type="submit" disabled={transferMut.isPending}>
                  {transferMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Transfer
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {pendingBulk && (
        <Dialog open onOpenChange={(o) => { if (!o) setPendingBulk(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {pendingBulk === 'deactivate' ? 'Deactivate' : 'Enable'} {selectedIds.size} teachers
              </DialogTitle>
              <DialogDescription>
                {pendingBulk === 'deactivate'
                  ? `Deactivate ${selectedIds.size} selected teachers. They will no longer have access to SANRO.`
                  : `Enable ${selectedIds.size} selected teachers and restore their access to SANRO.`}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPendingBulk(null)}>Cancel</Button>
              <Button
                variant={pendingBulk === 'deactivate' ? 'destructive' : 'default'}
                onClick={() => void handleBulk()}
              >
                {pendingBulk === 'deactivate' ? 'Deactivate' : 'Enable'} Selected
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
