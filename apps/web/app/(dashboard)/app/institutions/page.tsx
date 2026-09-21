'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { InstitutionType, type InstitutionListItem } from '@sanro/types';
import {
  useInstitutions,
  usePlans,
  useCreateInstitution,
  useActivateInstitution,
  useSuspendInstitution,
  useArchiveInstitution,
  useRestoreInstitution,
  useExpireInstitution,
  downloadInstitutionsCsv,
  type InstitutionQuery,
  type AdminCreateInstitutionInput,
} from '@/lib/institution-hooks';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
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
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Download,
  GraduationCap,
  Loader2,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/cn';

type Row = InstitutionListItem & {
  isSystemInstitution?: boolean;
  billableUsers?: number;
  usagePct?: number;
  limitExceeded?: boolean;
  seatLimit?: number | null;
  createdAt?: string;
  subscriptionStatus?: string;
  counts?: {
    students: number;
    teachers: number;
    parents: number;
    groups: number;
    assessments: number;
    papers: number;
    questions: number;
    members: number;
    admins: number;
  };
};

const TYPE_LABELS: Record<string, string> = {
  SCHOOL: 'School',
  COACHING_CENTRE: 'Coaching Centre',
  COACHING: 'Coaching',
  ACADEMY: 'Academy',
  TUITION_CENTRE: 'Tuition Centre',
  EDUCATIONAL_INSTITUTE: 'Educational Institute',
  TRAINING_CENTRE: 'Training Centre',
  OTHER: 'Other',
  SANRO_PLATFORM: 'SANRO AI',
};

function humanizeEnum(s: string) {
  return s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function isSystemRow(row: Row) {
  return row.isSystemInstitution === true || row.type === InstitutionType.SANRO_PLATFORM;
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700 border-green-200',
  PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
  SUSPENDED: 'bg-red-100 text-red-700 border-red-200',
  ARCHIVED: 'bg-surface-100 text-surface-600 border-surface-200',
  EXPIRED: 'bg-rose-100 text-rose-800 border-rose-200',
};

const SUB_STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-green-50 text-green-700 border-green-200',
  TRIAL: 'bg-sky-50 text-sky-700 border-sky-200',
  EXPIRING_SOON: 'bg-amber-50 text-amber-700 border-amber-200',
  EXPIRED: 'bg-rose-50 text-rose-700 border-rose-200',
  NONE: 'bg-surface-50 text-surface-500 border-surface-200',
  CANCELLED: 'bg-surface-50 text-surface-500 border-surface-200',
};

const STATUS_FILTERS = ['ACTIVE', 'PENDING', 'SUSPENDED', 'EXPIRED', 'ARCHIVED'];
const SUB_FILTERS = ['ACTIVE', 'TRIAL', 'EXPIRING_SOON', 'EXPIRED', 'NONE', 'CANCELLED'];
const SORT_OPTIONS = ['name', 'createdAt', 'expiry', 'users', 'limit', 'type', 'status'];

const CreateInstitutionSchema = z.object({
  name: z.string().trim().min(2, 'Institution name is required'),
  type: z.enum(Object.values(InstitutionType) as [string, ...string[]], {
    message: 'Select an institution type',
  }),
  code: z.string().trim().max(20).optional().or(z.literal('')),
  address: z.string().trim().max(300).optional().or(z.literal('')),
  city: z.string().trim().max(120).optional().or(z.literal('')),
  state: z.string().trim().max(120).optional().or(z.literal('')),
  country: z.string().trim().max(120).optional().or(z.literal('')),
  website: z.string().trim().url('Enter a valid URL').optional().or(z.literal('')),
  contactPerson: z.string().trim().max(200).optional().or(z.literal('')),
  primaryPhone: z.string().trim().max(20).optional().or(z.literal('')),
  primaryEmail: z.string().trim().email('Enter a valid email').optional().or(z.literal('')),
  seatLimit: z.coerce.number().int().positive('Seat limit must be positive').optional().or(z.literal('')),
  gracePeriodDays: z.coerce.number().int().min(0).max(3650).optional().or(z.literal('')),
  planKey: z.string().optional().or(z.literal('')),
  startsAt: z.string().optional().or(z.literal('')),
  endsAt: z.string().optional().or(z.literal('')),
  adminName: z.string().trim().min(2, 'Admin name is required').optional().or(z.literal('')),
  adminEmail: z.string().trim().email('Enter a valid admin email').optional().or(z.literal('')),
  adminPhone: z.string().trim().max(20).optional().or(z.literal('')),
  adminPassword: z.string().trim().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
});

type CreateForm = z.infer<typeof CreateInstitutionSchema>;

const today = new Date();
const futureYearDate = new Date(today.getTime() + 365 * 86400000);
const fmtDate = (d: Date) => d.toISOString().slice(0, 10);

function CreateInstitutionDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: plans = [] } = usePlans();
  const create = useCreateInstitution();
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateForm>({
    resolver: zodResolver(CreateInstitutionSchema),
    defaultValues: {
      type: 'COACHING',
      seatLimit: 100,
      gracePeriodDays: 0,
      planKey: '',
      adminName: '',
      adminEmail: '',
    },
  });

  const onSubmit = async (values: CreateForm) => {
    const body: AdminCreateInstitutionInput = {
      name: values.name,
      type: values.type,
      code: values.code || undefined,
      address: values.address || undefined,
      city: values.city || undefined,
      state: values.state || undefined,
      country: values.country || undefined,
      website: values.website || undefined,
      contactPerson: values.contactPerson || undefined,
      primaryPhone: values.primaryPhone || undefined,
      primaryEmail: values.primaryEmail || undefined,
      seatLimit: values.seatLimit ? Number(values.seatLimit) : undefined,
      gracePeriodDays: values.gracePeriodDays ? Number(values.gracePeriodDays) : undefined,
      planKey: values.planKey || undefined,
      startsAt: values.startsAt || undefined,
      endsAt: values.endsAt || undefined,
      adminName: values.adminName || undefined,
      adminEmail: values.adminEmail || undefined,
      adminPhone: values.adminPhone || undefined,
      adminPassword: values.adminPassword || undefined,
    };
    try {
      const result = await create.mutateAsync(body);
      toast.success('Institution created');
      const warning = (result as { warning?: string }).warning;
      if (warning) toast.warning(warning);
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error((err as { message?: string }).message ?? 'Could not create institution');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Institution</DialogTitle>
          <DialogDescription>
            Create a new tenant and provision its admin + subscription.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="inst-name">Institution name *</Label>
              <Input id="inst-name" placeholder="e.g. ABC Coaching Academy" {...register('name')} />
              {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Type *</Label>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(InstitutionType).map((t) => (
                        <SelectItem key={t} value={t}>
                          {t.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.type && <p className="text-xs text-red-600">{errors.type.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Plan (trial if empty)</Label>
              <Controller
                control={control}
                name="planKey"
                render={({ field }) => (
                  <Select value={field.value || 'trial'} onValueChange={(v) => field.onChange(v === 'trial' ? '' : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trial">Trial / default</SelectItem>
                      {plans.map((p) => (
                        <SelectItem key={p.key} value={p.key}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inst-code">Code (auto if blank)</Label>
              <Input id="inst-code" placeholder="e.g. ABC001" {...register('code')} />
              {errors.code && <p className="text-xs text-red-600">{errors.code.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inst-seat">Seat limit</Label>
              <Input id="inst-seat" type="number" {...register('seatLimit')} />
              {errors.seatLimit && <p className="text-xs text-red-600">{errors.seatLimit.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inst-grace">Grace period (days)</Label>
              <Input id="inst-grace" type="number" {...register('gracePeriodDays')} />
              {errors.gracePeriodDays && <p className="text-xs text-red-600">{errors.gracePeriodDays.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inst-start">Subscription start</Label>
              <Input id="inst-start" type="date" defaultValue={fmtDate(today)} {...register('startsAt')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inst-end">Subscription end</Label>
              <Input id="inst-end" type="date" defaultValue={fmtDate(futureYearDate)} {...register('endsAt')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inst-email">Primary email</Label>
              <Input id="inst-email" type="email" {...register('primaryEmail')} />
              {errors.primaryEmail && <p className="text-xs text-red-600">{errors.primaryEmail.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inst-city">City</Label>
              <Input id="inst-city" {...register('city')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inst-address">Address</Label>
              <Input id="inst-address" {...register('address')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inst-contact">Contact person</Label>
              <Input id="inst-contact" {...register('contactPerson')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inst-website">Website</Label>
              <Input id="inst-website" {...register('website')} />
              {errors.website && <p className="text-xs text-red-600">{errors.website.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inst-state">State</Label>
              <Input id="inst-state" {...register('state')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inst-country">Country</Label>
              <Input id="inst-country" {...register('country')} />
            </div>
          </div>

          <div className="rounded-xl border border-surface-200 bg-surface-50 p-4">
            <p className="mb-3 text-sm font-medium text-surface-800">Institution admin</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="admin-name">Admin name</Label>
                <Input id="admin-name" {...register('adminName')} />
                {errors.adminName && <p className="text-xs text-red-600">{errors.adminName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="admin-email">Admin email</Label>
                <Input id="admin-email" type="email" {...register('adminEmail')} />
                {errors.adminEmail && <p className="text-xs text-red-600">{errors.adminEmail.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="admin-phone">Admin phone</Label>
                <Input id="admin-phone" {...register('adminPhone')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="admin-password">Temporary password (optional)</Label>
                <Input id="admin-password" type="password" {...register('adminPassword')} />
                {errors.adminPassword && <p className="text-xs text-red-600">{errors.adminPassword.message}</p>}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Create Institution
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type PendingAction =
  | { kind: 'activate'; row: Row }
  | { kind: 'suspend'; row: Row }
  | { kind: 'archive'; row: Row }
  | { kind: 'restore'; row: Row }
  | { kind: 'expire'; row: Row }
  | null;

const ACTION_META: Record<
  NonNullable<PendingAction>['kind'],
  { label: string; destructive?: boolean; description: (name: string) => string }
> = {
  activate: {
    label: 'Activate',
    description: (name) => `Re-activate "${name}" and restore normal access.`,
  },
  suspend: {
    label: 'Suspend',
    description: (name) => `Suspend "${name}". This institution's users can no longer access SANRO. Data is preserved.`,
  },
  archive: {
    label: 'Archive',
    destructive: true,
    description: (name) => `Archive "${name}". The institution is removed from active use but all data is preserved.`,
  },
  restore: {
    label: 'Restore',
    description: (name) => `Restore "${name}" from archive and bring it back to the active list.`,
  },
  expire: {
    label: 'Mark Expired',
    description: (name) => `Force-expire "${name}". Its subscription ends immediately.`,
  },
};

export default function InstitutionsPage() {
  const token = useAuthStore((s) => s.token);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [status, setStatus] = useState('');
  const [subStatus, setSubStatus] = useState('');
  const [type, setType] = useState('');
  const [limitExceeded, setLimitExceeded] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [createOpen, setCreateOpen] = useState(false);
  const [pending, setPending] = useState<PendingAction>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search), 400);
    return () => window.clearTimeout(t);
  }, [search]);

  const params: InstitutionQuery = {
    search: debouncedSearch || undefined,
    status: status || undefined,
    subscriptionStatus: subStatus || undefined,
    type: type || undefined,
    limitExceeded: limitExceeded || undefined,
    sortBy,
    sortDir,
    page,
    pageSize,
  };

  const { data, isLoading, isFetching, error, refetch } = useInstitutions(params);

  const rows = useMemo<Row[]>(() => (data?.items ?? []).map((i) => i as Row), [data]);

  const actionId = pending?.row?.id ?? '';
  const activate = useActivateInstitution(actionId);
  const suspend = useSuspendInstitution(actionId);
  const archive = useArchiveInstitution(actionId);
  const restore = useRestoreInstitution(actionId);
  const expire = useExpireInstitution(actionId);
  const actionPending =
    pending?.kind === 'activate'
      ? activate.isPending
      : pending?.kind === 'suspend'
        ? suspend.isPending
        : pending?.kind === 'archive'
          ? archive.isPending
          : pending?.kind === 'restore'
            ? restore.isPending
            : pending?.kind === 'expire'
              ? expire.isPending
              : false;

  const runAction = async () => {
    if (!pending) return;
    const hook =
      pending.kind === 'activate'
        ? activate
        : pending.kind === 'suspend'
          ? suspend
          : pending.kind === 'archive'
            ? archive
            : pending.kind === 'restore'
              ? restore
              : expire;
    try {
      await hook.mutateAsync();
      toast.success(`${ACTION_META[pending.kind].label} successful`);
      setPending(null);
    } catch (err) {
      toast.error((err as { message?: string }).message ?? 'Action failed');
    }
  };

  const exportCsv = async () => {
    const exportParams: InstitutionQuery = {
      search: debouncedSearch || undefined,
      status: status || undefined,
      subscriptionStatus: subStatus || undefined,
      type: type || undefined,
      limitExceeded: limitExceeded || undefined,
      sortBy,
      sortDir,
    };
    setExporting(true);
    try {
      const url = await downloadInstitutionsCsv(exportParams, token);
      const a = document.createElement('a');
      a.href = url;
      a.download = `institutions-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      toast.success('Export ready');
    } catch (err) {
      toast.error((err as { message?: string }).message ?? 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setStatus('');
    setSubStatus('');
    setType('');
    setLimitExceeded(false);
    setSortBy('createdAt');
    setSortDir('desc');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Institutions</h1>
          <p className="mt-1 text-sm text-surface-500">
            {isLoading ? 'Loading tenants...' : `${data?.total ?? 0} institutions`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => void exportCsv()} disabled={exporting || isLoading}>
            {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Export CSV
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Institution
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search name, code, email..."
                className="pl-9"
              />
            </div>
            <div className="w-40">
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
                    <SelectItem key={s} value={s}>{humanizeEnum(s)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-44">
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
                    <SelectItem key={s} value={s}>{humanizeEnum(s)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-44">
              <Select
                value={type || 'ALL'}
                onValueChange={(v) => {
                  setType(v === 'ALL' ? '' : v);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All types</SelectItem>
                  {Object.values(InstitutionType).map((t) => (
                    <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-44">
              <Select
                value={sortBy}
                onValueChange={(v) => {
                  setSortBy(v);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s === 'createdAt' ? 'Created' : s[0].toUpperCase() + s.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortDir(sortDir === 'desc' ? 'asc' : 'desc')}
              title="Toggle sort direction"
            >
              {sortDir === 'desc' ? 'Desc' : 'Asc'}
            </Button>
            <label className="flex items-center gap-2 text-sm text-surface-600">
              <input
                type="checkbox"
                checked={limitExceeded}
                onChange={(e) => {
                  setLimitExceeded(e.target.checked);
                  setPage(1);
                }}
                className="h-4 w-4 rounded border-surface-300"
              />
              Over limit
            </label>
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Reset
            </Button>
            <Button variant="ghost" size="icon" onClick={() => void refetch()} aria-label="Refresh">
              <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-100" />
          ))}
        </div>
      ) : error ? (
        <Card className="py-12 text-center">
          <p className="font-medium text-surface-800">Could not load institutions</p>
          <p className="mt-1 text-sm text-surface-500">{(error as Error).message}</p>
          <Button className="mt-4" variant="outline" onClick={() => void refetch()}>Retry</Button>
        </Card>
      ) : rows.length === 0 ? (
        <Card className="py-16 text-center">
          <Building2 className="mx-auto h-12 w-12 text-surface-300" />
          <p className="mt-4 text-sm font-medium text-surface-500">No institutions match your filters</p>
          <Button className="mt-4" variant="outline" onClick={resetFilters}>Reset filters</Button>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-surface-200 text-xs uppercase tracking-wide text-surface-500">
                  <th className="px-4 py-3 font-medium">Institution</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Subscription</th>
                  <th className="px-4 py-3 font-medium">Seat usage</th>
                  <th className="px-4 py-3 font-medium">Users</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-2 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const sub = row.subscription as { plan?: { key?: string; name?: string }; endsAt?: string } | null;
                  const endsAt = sub?.endsAt ?? null;
                  const isSystem = isSystemRow(row);
                  return (
                    <tr key={row.id} className="border-b border-surface-100 last:border-0 hover:bg-surface-50/70">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'flex h-10 w-10 flex-none items-center justify-center rounded-xl',
                              isSystem
                                ? 'bg-gradient-to-br from-slate-800 to-brand-900'
                                : 'bg-gradient-to-br from-brand-500 to-purple-600',
                            )}
                          >
                            {isSystem ? (
                              <Sparkles className="h-5 w-5 text-violet-300" />
                            ) : (
                              <GraduationCap className="h-5 w-5 text-white" />
                            )}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Link
                                href={`/app/institutions/${row.id}`}
                                className="font-medium text-surface-900 hover:text-brand-700 hover:underline"
                              >
                                {row.name}
                              </Link>
                              {isSystem ? (
                                <Badge className="text-[10px] bg-violet-100 text-violet-700 border-violet-200" variant="outline">
                                  System
                                </Badge>
                              ) : null}
                            </div>
                            <p className="text-xs text-surface-500">
                              {(row as { code?: string }).code}
                              {row.city ? ` · ${row.city}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className={isSystem ? 'font-medium text-violet-700' : 'text-surface-700'}>
                            {TYPE_LABELS[row.type] ?? String(row.type).replace(/_/g, ' ')}
                          </span>
                          {isSystem ? (
                            <Badge className="text-[10px] bg-surface-800 text-white" variant="outline">
                              Platform
                            </Badge>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={cn('text-xs', STATUS_STYLES[row.status] ?? 'bg-surface-100 text-surface-600')}>
                          {humanizeEnum(row.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={cn('text-xs', SUB_STATUS_STYLES[row.subscriptionStatus ?? 'NONE']) as string}
                        >
                          {humanizeEnum(row.subscriptionStatus ?? 'NONE')}
                        </Badge>
                        <p className="mt-0.5 text-xs text-surface-500">
                          {sub?.plan?.key ?? '—'}
                          {endsAt
                            ? ` · until ${new Date(endsAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                            : ''}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-28">
                          <Progress
                            value={Math.min(100, row.usagePct ?? 0)}
                            className={cn(
                              row.limitExceeded
                                ? '[&>div]:bg-red-500'
                                : row.usagePct != null && row.usagePct > 90
                                  ? '[&>div]:bg-amber-500'
                                  : undefined,
                            )}
                          />
                          <p className={cn('mt-1 text-xs', row.limitExceeded ? 'font-medium text-red-600' : 'text-surface-500')}>
                            {row.billableUsers ?? 0} / {row.seatLimit ?? '∞'}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-surface-600">
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-surface-400" />
                          {row.counts?.students ?? 0} S · {row.counts?.teachers ?? 0} T · {row.counts?.parents ?? 0} P
                        </span>
                      </td>
                      <td className="px-4 py-3 text-surface-500">
                        {row.createdAt
                          ? new Date(row.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                          : '—'}
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
                              <Link href={`/app/institutions/${row.id}`}>View details</Link>
                            </DropdownMenuItem>
                            {isSystem ? (
                              <DropdownMenuSeparator />
                            ) : (
                              <>
                                {row.status !== 'ACTIVE' && (
                                  <DropdownMenuItem onClick={() => setPending({ kind: 'activate', row })}>
                                    Activate
                                  </DropdownMenuItem>
                                )}
                                {(row.status === 'ACTIVE' || row.status === 'PENDING') && (
                                  <DropdownMenuItem onClick={() => setPending({ kind: 'suspend', row })}>
                                    Suspend
                                  </DropdownMenuItem>
                                )}
                                {row.status !== 'ARCHIVED' && (
                                  <DropdownMenuItem onClick={() => setPending({ kind: 'archive', row })} className="text-red-600">
                                    Archive
                                  </DropdownMenuItem>
                                )}
                                {row.status === 'ARCHIVED' && (
                                  <DropdownMenuItem onClick={() => setPending({ kind: 'restore', row })}>
                                    Restore
                                  </DropdownMenuItem>
                                )}
                                {row.status !== 'EXPIRED' && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => setPending({ kind: 'expire', row })} className="text-red-600">
                                      Mark expired
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </>
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

      <CreateInstitutionDialog open={createOpen} onOpenChange={setCreateOpen} />

      {pending && (
        <Dialog open onOpenChange={(o) => { if (!o) setPending(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {ACTION_META[pending.kind].label} {pending.row.name}
              </DialogTitle>
              <DialogDescription>{ACTION_META[pending.kind].description(pending.row.name)}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPending(null)}>
                Cancel
              </Button>
              <Button
                variant={ACTION_META[pending.kind].destructive ? 'destructive' : 'default'}
                disabled={actionPending}
                onClick={() => void runAction()}
              >
                {actionPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {ACTION_META[pending.kind].label}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}