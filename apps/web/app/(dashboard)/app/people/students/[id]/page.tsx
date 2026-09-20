'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { SUBSCRIPTION } from '@sanro/config';
import {
  useAdminStudentDetail,
  useDisableAdminStudent,
  useEnableAdminStudent,
  useTransferAdminStudent,
  useSetDirectSubscription,
  type AdminStudentDetail,
} from '@/lib/people-hooks';
import { useInstitutions, usePlans } from '@/lib/institution-hooks';
import { useAuthStore } from '@/lib/auth-store';
import { ApiError } from '@/lib/api';
import { SourceBadge } from '@/components/people/source-badge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/cn';
import {
  Calendar,
  ChevronLeft,
  CreditCard,
  GraduationCap,
  Loader2,
  LogIn,
  Mail,
  Phone,
  RefreshCcw,
  Repeat,
  Shield,
  Star,
  User,
  Users,
} from 'lucide-react';

const dateFmt = new Intl.DateTimeFormat('en-IN', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});
const dateTimeFmt = new Intl.DateTimeFormat('en-IN', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '—' : dateFmt.format(date);
}

function formatDateTime(iso?: string | null) {
  if (!iso) return '—';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '—' : dateTimeFmt.format(date);
}

function toDateInputValue(date: Date) {
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return shifted.toISOString().slice(0, 10);
}

function defaultRenewDate() {
  const date = new Date();
  date.setDate(date.getDate() + SUBSCRIPTION.RENEW_DURATION_DAYS);
  return toDateInputValue(date);
}

function daysUntil(iso?: string | null) {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function metadataSummary(meta: Record<string, unknown>) {
  const json = JSON.stringify(meta) ?? '';
  return json.length > 140 ? `${json.slice(0, 140)}...` : json;
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  DEACTIVATED: 'bg-red-100 text-red-700',
};

const SUB_STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  TRIAL: 'bg-sky-100 text-sky-700',
  EXPIRED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-slate-100 text-slate-600',
  SUSPENDED: 'bg-red-100 text-red-700',
};

const AUDIT_ACTION_STYLES: Record<string, string> = {
  STUDENT_CREATED: 'bg-emerald-100 text-emerald-700',
  STUDENT_UPDATED: 'bg-blue-100 text-blue-700',
  STUDENT_DISABLED: 'bg-orange-100 text-orange-700',
  STUDENT_ENABLED: 'bg-green-100 text-green-700',
  STUDENT_TRANSFERRED: 'bg-purple-100 text-purple-700',
  STUDENT_INSTITUTION_CHANGED: 'bg-purple-100 text-purple-700',
  PARENT_LINKED: 'bg-teal-100 text-teal-700',
  PARENT_UNLINKED: 'bg-orange-100 text-orange-700',
  DIRECT_SUBSCRIPTION_CREATED: 'bg-emerald-100 text-emerald-700',
  DIRECT_SUBSCRIPTION_UPDATED: 'bg-blue-100 text-blue-700',
  DIRECT_SUBSCRIPTION_RENEWED: 'bg-green-100 text-green-700',
  DIRECT_SUBSCRIPTION_EXPIRED: 'bg-red-100 text-red-700',
  USER_DISABLED: 'bg-orange-100 text-orange-700',
  USER_ENABLED: 'bg-green-100 text-green-700',
};

function renewChip(directSub?: { endsAt?: string | null } | null) {
  const days = daysUntil(directSub?.endsAt);
  if (days === null || days === undefined) return { label: 'Active', style: 'bg-green-100 text-green-700' };
  if (days < 0) {
    const n = Math.abs(days);
    return { label: `Expired ${n} day${n === 1 ? '' : 's'} ago`, style: 'bg-red-100 text-red-700' };
  }
  if (days === 0) return { label: 'Expiring today', style: 'bg-amber-100 text-amber-700' };
  if (days <= SUBSCRIPTION.EXPIRING_SOON_DAYS) {
    return { label: `Expiring in ${days} day${days === 1 ? '' : 's'}`, style: 'bg-amber-100 text-amber-700' };
  }
  return { label: 'Active', style: 'bg-green-100 text-green-700' };
}

function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  destructive,
  loading,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant={destructive ? 'destructive' : undefined} disabled={loading} onClick={onConfirm}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const TransferSchema = z.object({
  targetInstitutionId: z.string().min(1, 'Select a target institution'),
});
type TransferForm = z.infer<typeof TransferSchema>;

function TransferDialog({
  open,
  onOpenChange,
  student,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: AdminStudentDetail;
}) {
  const institutionsQuery = useInstitutions({ page: 1, pageSize: 100 });
  const institutions = institutionsQuery.data?.items ?? [];
  const transfer = useTransferAdminStudent(student.id);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TransferForm>({
    resolver: zodResolver(TransferSchema),
    defaultValues: { targetInstitutionId: '' },
  });

  function onSubmit(values: TransferForm) {
    transfer.mutate(
      { targetInstitutionId: values.targetInstitutionId },
      {
        onSuccess: () => {
          toast.success('Student transferred');
          onOpenChange(false);
        },
        onError: (e: Error) => toast.error(e.message),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer Student</DialogTitle>
          <DialogDescription>
            Move {student.name} to another institution. Their membership, groups and academic year
            mapping are recreated at the destination.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="transfer-target">Target institution *</Label>
            <Controller
              control={control}
              name="targetInstitutionId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target institution" />
                  </SelectTrigger>
                  <SelectContent>
                    {institutions.map((i) => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.name}
                        {i.id === student.institutionId ? ' (current)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.targetInstitutionId ? (
              <p className="text-sm text-red-500">{errors.targetInstitutionId.message}</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || transfer.isPending}>
              {isSubmitting || transfer.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Transfer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const DirectSubSchema = z
  .object({
    planKey: z.string().min(1, 'Plan is required'),
    status: z.string().min(1, 'Status is required'),
    startsAt: z.string().optional(),
    endsAt: z.string().optional(),
  })
  .refine((v) => !v.startsAt || !v.endsAt || v.endsAt >= v.startsAt, {
    path: ['endsAt'],
    message: 'End date cannot be before start date',
  });
type DirectSubForm = z.infer<typeof DirectSubSchema>;

function DirectSubscriptionDialog({
  open,
  onOpenChange,
  student,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: AdminStudentDetail;
}) {
  const plansQuery = usePlans();
  const plans = plansQuery.data ?? [];
  const setSub = useSetDirectSubscription(student.id);
  const current = student.directSubscription;
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DirectSubForm>({
    resolver: zodResolver(DirectSubSchema),
    defaultValues: {
      planKey: current?.planKey ?? '',
      status: current?.status ?? 'ACTIVE',
      startsAt: current?.startedAt ? toDateInputValue(new Date(current.startedAt)) : toDateInputValue(new Date()),
      endsAt: current?.endsAt ? toDateInputValue(new Date(current.endsAt)) : defaultRenewDate(),
    },
  });

  function onSubmit(values: DirectSubForm) {
    setSub.mutate(
      {
        planKey: values.planKey,
        status: values.status,
        startsAt: values.startsAt || undefined,
        endsAt: values.endsAt || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Direct subscription updated');
          onOpenChange(false);
        },
        onError: (e: Error) => toast.error(e.message),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Renew / Set Direct Subscription</DialogTitle>
          <DialogDescription>
            Configure the Direct SANRO subscription for {student.name}. Setting status to EXPIRED
            and a past end date immediately expires the subscription.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="direct-planKey">Plan *</Label>
            <Controller
              control={control}
              name="planKey"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((p) => (
                      <SelectItem key={p.key} value={p.key}>
                        {p.name} ({p.key})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.planKey ? <p className="text-sm text-red-500">{errors.planKey.message}</p> : null}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="direct-startsAt">Starts at</Label>
              <Input id="direct-startsAt" type="date" {...register('startsAt')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="direct-endsAt">Ends at</Label>
              <Input id="direct-endsAt" type="date" {...register('endsAt')} />
              {errors.endsAt ? <p className="text-sm text-red-500">{errors.endsAt.message}</p> : null}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="direct-status">Status *</Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                    <SelectItem value="TRIAL">TRIAL</SelectItem>
                    <SelectItem value="EXPIRED">EXPIRED</SelectItem>
                    <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || setSub.isPending}>
              {isSubmitting || setSub.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function PeopleStudentDetailPage() {
  const params = useParams();
  const id = (params.id as string) || '';
  const { user: sessionUser } = useAuthStore();
  const isSuperAdmin = sessionUser?.isSuperAdmin ?? sessionUser?.role === 'SUPER_ADMIN';

  const [confirmAction, setConfirmAction] = useState<'DISABLE' | 'ENABLE' | 'EXPIRE' | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [renewOpen, setRenewOpen] = useState(false);

  const { data: student, isLoading, error, refetch } = useAdminStudentDetail(id);
  const disable = useDisableAdminStudent(id);
  const enable = useEnableAdminStudent(id);
  const setDirectSub = useSetDirectSubscription(id);

  if (isLoading || !id) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-surface-100" />
        <div className="h-24 animate-pulse rounded-2xl bg-surface-100" />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-72 animate-pulse rounded-2xl bg-surface-100" />
          <div className="h-72 animate-pulse rounded-2xl bg-surface-100" />
        </div>
      </div>
    );
  }

  if (error || !student) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <User className="mx-auto h-12 w-12 text-surface-300" />
          <p className="mt-4 text-sm font-semibold text-surface-800">
            {notFound ? 'Student not found' : 'Could not load student details'}
          </p>
          <p className="mt-1 text-sm text-surface-500">
            {notFound ? 'This student may have been removed.' : (error as Error).message}
          </p>
          <Button className="mt-4" variant="outline" onClick={() => void refetch()}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  const source = student.source ?? (student.institutionId ? 'INSTITUTION' : 'DIRECT_SANRO');
  const isActive = student.status === 'ACTIVE' && student.isActive !== false;
  const directSub = student.directSubscription ?? student.subscriptions?.[0] ?? null;
  const chip = renewChip(directSub);
  const audits = student.recentAudit ?? [];
  const parents = student.parents ?? [];
  const groups = student.groups ?? [];

  const confirmMeta =
    confirmAction === 'DISABLE'
      ? { title: 'Disable student', description: `Disable ${student.name}? They will be blocked from accessing SANRO.`, label: 'Disable' }
      : confirmAction === 'ENABLE'
        ? { title: 'Enable student', description: `Re-enable ${student.name}? Access is restored.`, label: 'Enable' }
        : confirmAction === 'EXPIRE'
          ? { title: 'Expire direct subscription', description: `Immediately expire the Direct SANRO subscription for ${student.name}.`, label: 'Expire' }
          : null;

  function runConfirm() {
    if (!confirmAction) return;
    if (confirmAction === 'DISABLE') {
      disable.mutate(undefined, {
        onSuccess: () => {
          toast.success('Student disabled');
          setConfirmAction(null);
        },
        onError: (e: Error) => toast.error(e.message),
      });
    } else if (confirmAction === 'ENABLE') {
      enable.mutate(undefined, {
        onSuccess: () => {
          toast.success('Student enabled');
          setConfirmAction(null);
        },
        onError: (e: Error) => toast.error(e.message),
      });
    } else {
      const planKey = directSub?.planKey ?? '';
      setDirectSub.mutate(
        {
          planKey: planKey ? planKey : 'STUDENT_YEARLY',
          status: 'EXPIRED',
          endsAt: new Date().toISOString().slice(0, 10),
        },
        {
          onSuccess: () => {
            toast.success('Direct subscription expired');
            setConfirmAction(null);
          },
          onError: (e: Error) => toast.error(e.message),
        },
      );
    }
  }

  const confirmationPending =
    confirmAction === 'DISABLE' ? disable.isPending : confirmAction === 'EXPIRE' ? setDirectSub.isPending : enable.isPending;

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1 text-sm text-surface-500">
        <Link
          href="/app/people/students"
          className="inline-flex items-center gap-1 transition-colors hover:text-brand-600"
        >
          <ChevronLeft className="h-4 w-4" />
          People / Students
        </Link>
      </nav>

      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 text-lg font-bold text-white">
              {student.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-surface-900">{student.name}</h1>
                <SourceBadge source={source} />
                <Badge className={cn('text-xs', STATUS_STYLES[student.status ?? ''] ?? 'bg-slate-100 text-slate-600')}>
                  {student.status ?? '—'}
                </Badge>
                {student.isActive === false ? (
                  <Badge variant="secondary" className="text-xs">User disabled</Badge>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-surface-500">{student.email ?? 'No email on record'}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {source === 'INSTITUTION' ? (
              <Button variant="outline" onClick={() => setTransferOpen(true)}>
                <Repeat className="h-4 w-4" />
                Transfer
              </Button>
            ) : isSuperAdmin ? (
              <>
                <Button variant="outline" onClick={() => setRenewOpen(true)}>
                  <RefreshCcw className="h-4 w-4" />
                  Renew / Set Direct Subscription
                </Button>
                <Button variant="destructive" onClick={() => setConfirmAction('EXPIRE')}>
                  <Calendar className="h-4 w-4" />
                  Expire
                </Button>
              </>
            ) : null}
            {isActive ? (
              <Button variant="warning" onClick={() => setConfirmAction('DISABLE')}>
                <Shield className="h-4 w-4" />
                Disable
              </Button>
            ) : (
              <Button variant="success" onClick={() => setConfirmAction('ENABLE')}>
                <Shield className="h-4 w-4" />
                Enable
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-brand-500" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="text-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-surface-400">Email</p>
                <p className="mt-1 flex items-center gap-1 text-surface-700">
                  <Mail className="h-3.5 w-3.5 text-surface-400" />
                  {student.email ?? '—'}
                </p>
              </div>
              <div className="text-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-surface-400">Phone</p>
                <p className="mt-1 flex items-center gap-1 text-surface-700">
                  <Phone className="h-3.5 w-3.5 text-surface-400" />
                  {student.phone ?? '—'}
                </p>
              </div>
              <div className="text-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-surface-400">Grade</p>
                <p className="mt-1 flex items-center gap-1 text-surface-700">
                  <GraduationCap className="h-3.5 w-3.5 text-surface-400" />
                  {student.grade ? `Grade ${student.grade}` : '—'}
                </p>
              </div>
              <div className="text-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-surface-400">Roll Number</p>
                <p className="mt-1 text-surface-700">{student.rollNumber ?? '—'}</p>
              </div>
              <div className="text-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-surface-400">Gender</p>
                <p className="mt-1 text-surface-700">{student.gender ?? '—'}</p>
              </div>
              <div className="text-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-surface-400">Date of Birth</p>
                <p className="mt-1 text-surface-700">{formatDate(student.dateOfBirth)}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 border-t border-surface-100 pt-4">
              <div className="text-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-surface-400">Academic Year</p>
                <p className="mt-1 text-surface-700">{student.academicYear?.name ?? student.academicYearId ?? '—'}</p>
              </div>
              <div className="text-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-surface-400">Assessment Attempts</p>
                <p className="mt-1 text-surface-700">{student.assessmentAttemptsCount ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-brand-500" />
                {source === 'DIRECT_SANRO' ? 'Direct SANRO Subscription' : 'Institution Entitlement'}
              </CardTitle>
              <CardDescription className="mt-1">
                {source === 'DIRECT_SANRO'
                  ? 'Access derives from the student-owned direct subscription.'
                  : 'Access derives from the institution subscription.'}
              </CardDescription>
            </div>
            {directSub ? <Badge className={cn('text-xs', chip.style)}>{chip.label}</Badge> : null}
          </CardHeader>
          <CardContent className="space-y-5">
            {source === 'INSTITUTION' ? (
              <>
                <div className="rounded-xl border border-surface-100 p-4">
                  <p className="flex items-center gap-2 font-semibold text-surface-900">
                    <Star className="h-4 w-4 text-brand-500" />
                    {student.institution?.name ?? student.institutionName ?? '—'}
                  </p>
                  <p className="mt-1 text-xs text-surface-500">
                    {student.institution?.type ? `Type ${student.institution.type.replace(/_/g, ' ')}` : ''}
                    {student.institution?.status ? ` · ${student.institution.status}` : ''}
                  </p>
                </div>
                {student.institution ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/app/institutions/${student.institution.id}`} className="inline-flex items-center gap-1">
                      <GraduationCap className="h-4 w-4" />
                      View institution
                    </Link>
                  </Button>
                ) : null}
                {directSub ? (
                  <div className="space-y-1 border-t border-surface-100 pt-4 text-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-surface-400">Direct Subscription (if any)</p>
                    <p className="text-surface-700">
                      {directSub.planKey ?? '—'}
                      <Badge className={cn('ml-2 text-[10px]', SUB_STATUS_STYLES[directSub.status ?? ''] ?? 'bg-slate-100 text-slate-600')}>
                        {directSub.status}
                      </Badge>
                    </p>
                    <p className="text-xs text-surface-500">
                      {formatDate(directSub.startedAt)} → {formatDate(directSub.endsAt)}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-surface-500">No direct subscription on record.</p>
                )}
              </>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-bold text-surface-900">{directSub?.planName ?? directSub?.planKey ?? '—'}</p>
                  {directSub?.planKey ? <Badge className="text-xs">{directSub.planKey}</Badge> : null}
                  {directSub?.status ? (
                    <Badge className={cn('text-xs', SUB_STATUS_STYLES[directSub.status] ?? 'bg-slate-100 text-slate-600')}>
                      {directSub.status}
                    </Badge>
                  ) : null}
                </div>
                {directSub ? (
                  <>
                    <p className="flex flex-wrap items-center gap-2 text-sm text-surface-500">
                      <Calendar className="h-4 w-4 text-surface-400" />
                      {formatDate(directSub.startedAt)} → {formatDate(directSub.endsAt)}
                    </p>
                    <p className="text-xs text-surface-500">
                      Plan ends {daysUntil(directSub.endsAt) === null ? 'not set' : `in ${daysUntil(directSub.endsAt)} day(s)`}.
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-surface-500">No active direct subscription. Users with no entitlement are denied.</p>
                )}
                {isSuperAdmin ? (
                  <div className="flex flex-wrap gap-2 border-t border-surface-100 pt-4">
                    <Button variant="outline" size="sm" onClick={() => setRenewOpen(true)}>
                      <RefreshCcw className="h-4 w-4" />
                      Renew
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => setConfirmAction('EXPIRE')}>
                      <Calendar className="h-4 w-4" />
                      Expire
                    </Button>
                  </div>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-brand-500" />
              Linked Parents
            </CardTitle>
            <CardDescription className="mt-1">{parents.length} parent{parents.length === 1 ? '' : 's'} linked</CardDescription>
          </CardHeader>
          <CardContent>
            {parents.length === 0 ? (
              <p className="text-sm text-surface-500">No parents linked.</p>
            ) : (
              <div className="space-y-3">
                {parents.map((p) => (
                  <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-surface-100 p-4">
                    <div>
                      <p className="font-semibold text-surface-900">{p.name}</p>
                      <p className="text-sm text-surface-500">
                        {p.email ?? 'No email'}
                        {p.phone ? ` · ${p.phone}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <SourceBadge source={p.source} />
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/app/people/parents/${p.id}`}>View</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-brand-500" />
              Groups
            </CardTitle>
            <CardDescription className="mt-1">{groups.length} group{groups.length === 1 ? '' : 's'}</CardDescription>
          </CardHeader>
          <CardContent>
            {groups.length === 0 ? (
              <p className="text-sm text-surface-500">No groups assigned.</p>
            ) : (
              <div className="space-y-2">
                {groups.map((g) => (
                  <div key={g.id} className="flex items-center justify-between rounded-xl border border-surface-100 p-4">
                    <p className="font-semibold text-surface-900">{g.name}</p>
                    <Badge variant="secondary" className="text-[10px]">{g.type ?? g.status ?? ''}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Audits</CardTitle>
          <CardDescription className="mt-1">{audits.length} events</CardDescription>
        </CardHeader>
        <CardContent>
          {audits.length === 0 ? (
            <p className="text-sm text-surface-500">No audit events yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-surface-100 text-xs uppercase tracking-wide text-surface-400">
                    <th className="px-3 py-2 font-semibold">Timestamp</th>
                    <th className="px-3 py-2 font-semibold">Action</th>
                    <th className="px-3 py-2 font-semibold">Metadata</th>
                    <th className="px-3 py-2 font-semibold">Actor</th>
                  </tr>
                </thead>
                <tbody>
                  {audits.map((row) => (
                    <tr key={row.id} className="border-b border-surface-50 align-top">
                      <td className="whitespace-nowrap px-3 py-3 text-xs text-surface-500">
                        {formatDateTime(row.createdAt)}
                      </td>
                      <td className="px-3 py-3">
                        <Badge className={cn('text-[10px]', AUDIT_ACTION_STYLES[row.action] ?? 'bg-surface-100 text-surface-600')}>
                          {row.action}
                        </Badge>
                      </td>
                      <td className="max-w-[240px] px-3 py-3">
                        <TooltipProvider delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="block cursor-default truncate text-xs text-surface-600">
                                {metadataSummary(row.metadata)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-sm break-all">
                              <pre className="whitespace-pre-wrap text-[11px]">
                                {JSON.stringify(row.metadata, null, 2)}
                              </pre>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </td>
                      <td className="px-3 py-3 text-xs text-surface-600">
                        {row.user ? (
                          <>
                            <span className="block font-medium text-surface-800">{row.user.name}</span>
                            <span className="block text-surface-400">{row.user.email}</span>
                          </>
                        ) : (
                          'System'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 text-xs text-surface-400">
        <LogIn className="h-3.5 w-3.5" />
        User {student.userId ?? '—'} · Created {formatDate(student.createdAt)}
      </div>

      <TransferDialog open={transferOpen} onOpenChange={setTransferOpen} student={student} />
      <DirectSubscriptionDialog open={renewOpen} onOpenChange={setRenewOpen} student={student} />

      <ConfirmDialog
        open={confirmAction !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
        title={confirmMeta?.title ?? ''}
        description={confirmMeta?.description ?? ''}
        confirmLabel={confirmMeta?.label ?? ''}
        destructive={confirmAction === 'DISABLE' || confirmAction === 'EXPIRE'}
        loading={confirmationPending}
        onConfirm={runConfirm}
      />
    </div>
  );
}