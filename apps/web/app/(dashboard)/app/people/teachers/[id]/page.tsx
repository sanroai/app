'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  useAdminTeacherDetail,
  useDisableAdminTeacher,
  useEnableAdminTeacher,
  useTransferAdminTeacher,
} from '@/lib/people-hooks';
import { useInstitutions } from '@/lib/institution-hooks';
import { ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  BookOpen,
  ChevronLeft,
  GraduationCap,
  Loader2,
  Mail,
  Phone,
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

function metadataSummary(meta: Record<string, unknown>) {
  const json = JSON.stringify(meta) ?? '';
  return json.length > 140 ? `${json.slice(0, 140)}...` : json;
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  DEACTIVATED: 'bg-red-100 text-red-700',
  INVITED: 'bg-amber-100 text-amber-700',
};

const AUDIT_ACTION_STYLES: Record<string, string> = {
  TEACHER_CREATED: 'bg-emerald-100 text-emerald-700',
  TEACHER_UPDATED: 'bg-blue-100 text-blue-700',
  TEACHER_DISABLED: 'bg-orange-100 text-orange-700',
  TEACHER_ENABLED: 'bg-green-100 text-green-700',
  TEACHER_TRANSFERRED: 'bg-purple-100 text-purple-700',
  TEACHER_INSTITUTION_CHANGED: 'bg-purple-100 text-purple-700',
  USER_DISABLED: 'bg-orange-100 text-orange-700',
  USER_ENABLED: 'bg-green-100 text-green-700',
};

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
  teacherId,
  teacherName,
  currentInstitutionId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacherId: string;
  teacherName: string;
  currentInstitutionId?: string | null;
}) {
  const institutionsQuery = useInstitutions({ page: 1, pageSize: 100 });
  const institutions = institutionsQuery.data?.items ?? [];
  const transfer = useTransferAdminTeacher(teacherId);
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
          toast.success('Teacher transferred');
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
          <DialogTitle>Transfer Teacher</DialogTitle>
          <DialogDescription>
            Move {teacherName} to another institution.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="transfer-target" className="text-sm font-medium text-surface-800">
              Target institution *
            </label>
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
                        {i.id === currentInstitutionId ? ' (current)' : ''}
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

export default function PeopleTeacherDetailPage() {
  const params = useParams();
  const id = (params.id as string) || '';
  const [confirmAction, setConfirmAction] = useState<'DISABLE' | 'ENABLE' | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);

  const { data: teacher, isLoading, error, refetch } = useAdminTeacherDetail(id);
  const disable = useDisableAdminTeacher(id);
  const enable = useEnableAdminTeacher(id);

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

  if (error || !teacher) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <User className="mx-auto h-12 w-12 text-surface-300" />
          <p className="mt-4 text-sm font-semibold text-surface-800">
            {notFound ? 'Teacher not found' : 'Could not load teacher details'}
          </p>
          <p className="mt-1 text-sm text-surface-500">
            {notFound ? 'This teacher may have been removed.' : (error as Error).message}
          </p>
          <Button className="mt-4" variant="outline" onClick={() => void refetch()}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  const isActive = teacher.status === 'ACTIVE' && teacher.isActive !== false;
  const audits = teacher.recentAudit ?? [];
  const subjects = teacher.subjects ?? [];
  const groups = teacher.groups ?? [];

  function runConfirm() {
    if (!confirmAction) return;
    if (confirmAction === 'DISABLE') {
      disable.mutate(undefined, {
        onSuccess: () => {
          toast.success('Teacher disabled');
          setConfirmAction(null);
        },
        onError: (e: Error) => toast.error(e.message),
      });
    } else {
      enable.mutate(undefined, {
        onSuccess: () => {
          toast.success('Teacher enabled');
          setConfirmAction(null);
        },
        onError: (e: Error) => toast.error(e.message),
      });
    }
  }

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1 text-sm text-surface-500">
        <Link
          href="/app/people/teachers"
          className="inline-flex items-center gap-1 transition-colors hover:text-brand-600"
        >
          <ChevronLeft className="h-4 w-4" />
          People / Teachers
        </Link>
      </nav>

      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-lg font-bold text-white">
              {teacher.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-surface-900">{teacher.name}</h1>
                <Badge className={cn('text-xs', STATUS_STYLES[teacher.status ?? ''] ?? 'bg-slate-100 text-slate-600')}>
                  {teacher.status ?? '—'}
                </Badge>
                {teacher.isActive === false ? (
                  <Badge variant="secondary" className="text-xs">User disabled</Badge>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-surface-500">{teacher.email ?? 'No email on record'}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => setTransferOpen(true)}>
              <Repeat className="h-4 w-4" />
              Transfer
            </Button>
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
                  {teacher.email ?? '—'}
                </p>
              </div>
              <div className="text-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-surface-400">Phone</p>
                <p className="mt-1 flex items-center gap-1 text-surface-700">
                  <Phone className="h-3.5 w-3.5 text-surface-400" />
                  {teacher.phone ?? '—'}
                </p>
              </div>
              <div className="text-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-surface-400">Employee ID</p>
                <p className="mt-1 text-surface-700">{teacher.employeeId ?? '—'}</p>
              </div>
              <div className="text-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-surface-400">Joined</p>
                <p className="mt-1 text-surface-700">{formatDate(teacher.createdAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-brand-500" />
              Institution
            </CardTitle>
            <CardDescription className="mt-1">Teachers are institution-bound.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-surface-100 p-4">
              <p className="flex items-center gap-2 font-semibold text-surface-900">
                <GraduationCap className="h-4 w-4 text-brand-500" />
                {teacher.institution?.name ?? teacher.institutionName ?? '—'}
              </p>
              <p className="mt-1 text-xs text-surface-500">
                {teacher.institution?.type ? `Type ${teacher.institution.type.replace(/_/g, ' ')}` : ''}
                {teacher.institution?.status ? ` · ${teacher.institution.status}` : ''}
              </p>
            </div>
            {teacher.institution ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/app/institutions/${teacher.institution.id}`} className="inline-flex items-center gap-1">
                  <GraduationCap className="h-4 w-4" />
                  View institution
                </Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-brand-500" />
              Subjects
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subjects.length === 0 ? (
              <p className="text-sm text-surface-500">No subjects assigned.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {subjects.map((s) => (
                  <Badge key={s.id} variant="secondary" className="text-xs">{s.name}</Badge>
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
          </CardHeader>
          <CardContent>
            {groups.length === 0 ? (
              <p className="text-sm text-surface-500">No groups assigned.</p>
            ) : (
              <div className="space-y-2">
                {groups.map((g) => (
                  <div key={g.id} className="flex items-center justify-between rounded-xl border border-surface-100 p-4">
                    <p className="font-semibold text-surface-900">{g.name}</p>
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

      <TransferDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        teacherId={teacher.id}
        teacherName={teacher.name}
        currentInstitutionId={teacher.institutionId}
      />

      <ConfirmDialog
        open={confirmAction !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
        title={confirmAction === 'DISABLE' ? 'Disable teacher' : 'Enable teacher'}
        description={
          confirmAction === 'DISABLE'
            ? `Disable ${teacher.name}? They will be blocked from accessing SANRO.`
            : `Re-enable ${teacher.name}? Access is restored.`
        }
        confirmLabel={confirmAction === 'DISABLE' ? 'Disable' : 'Enable'}
        destructive={confirmAction === 'DISABLE'}
        loading={confirmAction === 'DISABLE' ? disable.isPending : enable.isPending}
        onConfirm={runConfirm}
      />
    </div>
  );
}