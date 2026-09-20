'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast, Toaster } from 'sonner';
import { z } from 'zod';
import { SUBSCRIPTION } from '@sanro/config';
import {
  InstitutionStatus,
  SubscriptionStatus,
  type InstitutionDetail,
  type SubscriptionHistoryEntry,
  type SubscriptionView,
} from '@sanro/types';
import {
  useInstitutionDetail,
  useInstitutionUsers,
  useInstitutionSubscriptionHistory,
  useInstitutionAudit,
  usePlans,
  useActivateInstitution,
  useSuspendInstitution,
  useArchiveInstitution,
  useRestoreInstitution,
  useExpireInstitution,
  useSetSubscription,
  useRenewSubscription,
  useChangeUserLimit,
  useChangeAdmin,
  useDisableInstitutionUser,
  useEnableInstitutionUser,
  type InstitutionUser,
} from '@/lib/institution-hooks';
import { ApiError } from '@/lib/api';
import { InstitutionProfileFormDialog } from '@/components/institution/institution-profile-form-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
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
  AlertTriangle,
  Archive,
  Building2,
  Calendar,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CreditCard,
  FileText,
  Globe,
  GraduationCap,
  HelpCircle,
  Loader2,
  Lock,
  Mail,
  Pencil,
  Phone,
  PlayCircle,
  RefreshCcw,
  RotateCcw,
  Search,
  Shield,
  User,
  UserCheck,
  UserPlus,
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

const INSTITUTION_STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  PENDING: 'bg-amber-100 text-amber-700',
  SUSPENDED: 'bg-red-100 text-red-700',
  ARCHIVED: 'bg-slate-100 text-slate-600',
  EXPIRED: 'bg-red-200 text-red-800',
};

const SUBSCRIPTION_STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  TRIAL: 'bg-blue-100 text-blue-700',
  EXPIRED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-slate-100 text-slate-600',
  PAST_DUE: 'bg-amber-100 text-amber-700',
  SUSPENDED: 'bg-red-100 text-red-700',
};

const SUBSCRIPTION_ACTION_STYLES: Record<string, string> = {
  CREATED: 'bg-emerald-100 text-emerald-700',
  UPDATED: 'bg-blue-100 text-blue-700',
  RENEWED: 'bg-green-100 text-green-700',
  PLAN_CHANGED: 'bg-purple-100 text-purple-700',
  LIMIT_CHANGED: 'bg-amber-100 text-amber-700',
  CANCELLED: 'bg-slate-100 text-slate-600',
  EXPIRED: 'bg-red-100 text-red-700',
  ACTIVATED: 'bg-green-100 text-green-700',
  SUSPENDED: 'bg-orange-100 text-orange-700',
};

const AUDIT_ACTION_STYLES: Record<string, string> = {
  INSTITUTION_CREATED: 'bg-emerald-100 text-emerald-700',
  INSTITUTION_UPDATED: 'bg-blue-100 text-blue-700',
  INSTITUTION_ACTIVATED: 'bg-green-100 text-green-700',
  INSTITUTION_SUSPENDED: 'bg-orange-100 text-orange-700',
  INSTITUTION_EXPIRED: 'bg-red-100 text-red-700',
  INSTITUTION_ARCHIVED: 'bg-slate-100 text-slate-600',
  INSTITUTION_RESTORED: 'bg-green-100 text-green-700',
  SUBSCRIPTION_CREATED: 'bg-emerald-100 text-emerald-700',
  SUBSCRIPTION_UPDATED: 'bg-blue-100 text-blue-700',
  SUBSCRIPTION_RENEWED: 'bg-green-100 text-green-700',
  PLAN_CHANGED: 'bg-purple-100 text-purple-700',
  USER_LIMIT_CHANGED: 'bg-amber-100 text-amber-700',
  ADMIN_CHANGED: 'bg-purple-100 text-purple-700',
  USER_DISABLED: 'bg-orange-100 text-orange-700',
  USER_ENABLED: 'bg-green-100 text-green-700',
};

const ROLE_STYLES: Record<string, string> = {
  STUDENT: 'bg-violet-100 text-violet-700',
  TEACHER: 'bg-indigo-100 text-indigo-700',
  PARENT: 'bg-teal-100 text-teal-700',
  INSTITUTION_ADMIN: 'bg-blue-100 text-blue-700',
};

type StatusAction = 'ACTIVATE' | 'SUSPEND' | 'ARCHIVE' | 'RESTORE' | 'EXPIRE';

const STATUS_ACTION_META: Record<
  StatusAction,
  { label: string; destructive: boolean; title: string; description: string; success: string; reasonLabel?: string }
> = {
  ACTIVATE: {
    label: 'Activate',
    destructive: false,
    title: 'Activate institution',
    description: 'Make this institution accessible to its members again.',
    success: 'Institution activated',
  },
  SUSPEND: {
    label: 'Suspend',
    destructive: true,
    title: 'Suspend institution',
    description: 'Access will be blocked for all members until it is reactivated.',
    success: 'Institution suspended',
    reasonLabel: 'Reason (optional)',
  },
  ARCHIVE: {
    label: 'Archive',
    destructive: true,
    title: 'Archive institution',
    description: 'Archive this institution. No data is deleted and access is frozen for everyone.',
    success: 'Institution archived',
    reasonLabel: 'Reason (optional)',
  },
  RESTORE: {
    label: 'Restore',
    destructive: false,
    title: 'Restore institution',
    description: 'Bring the archived institution back to an active state.',
    success: 'Institution restored',
  },
  EXPIRE: {
    label: 'Expire',
    destructive: true,
    title: 'Expire institution',
    description: 'Immediately expire this institution. All student data and history are preserved.',
    success: 'Institution expired',
    reasonLabel: 'Reason (optional)',
  },
};

function historySummary(row: SubscriptionHistoryEntry) {
  const parts: string[] = [];
  if (row.oldPlan || row.newPlan) {
    parts.push(`${row.oldPlan?.name ?? 'none'} -> ${row.newPlan?.name ?? 'none'}`);
  }
  if (row.oldSeatLimit != null || row.newSeatLimit != null) {
    parts.push(`Seats ${row.oldSeatLimit ?? 'none'} -> ${row.newSeatLimit ?? 'none'}`);
  }
  if (row.oldStatus || row.newStatus) {
    parts.push(`${row.oldStatus ?? 'none'} -> ${row.newStatus ?? 'none'}`);
  }
  if (row.oldStartsAt || row.newStartsAt) {
    parts.push(`Start ${formatDate(row.oldStartsAt)} -> ${formatDate(row.newStartsAt)}`);
  }
  if (row.oldEndsAt || row.newEndsAt) {
    parts.push(`Ends ${formatDate(row.oldEndsAt)} -> ${formatDate(row.newEndsAt)}`);
  }
  if (parts.length === 0) {
    parts.push(row.action.replace(/_/g, ' '));
  }
  return parts.join('  |  ');
}

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel: string;
  destructive?: boolean;
  loading?: boolean;
  reasonLabel?: string;
  reasonRequired?: boolean;
  onConfirm: (reason?: string) => void;
}

function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  destructive,
  loading,
  reasonLabel,
  reasonRequired,
  onConfirm,
}: ConfirmDialogProps) {
  const [reason, setReason] = useState('');
  useEffect(() => {
    if (!open) setReason('');
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        {reasonLabel ? (
          <div className="space-y-2">
            <Label htmlFor="confirm-reason">{reasonLabel}</Label>
            <Textarea
              id="confirm-reason"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Optional"
            />
          </div>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant={destructive ? 'destructive' : undefined}
            disabled={Boolean(loading) || (reasonRequired && !reason.trim())}
            onClick={() => onConfirm(reason.trim() || undefined)}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const RenewSchema = z.object({
  endDate: z
    .string()
    .min(1, 'End date is required')
    .refine((v) => {
      const ms = new Date(`${v}T23:59:59`).getTime();
      return !Number.isNaN(ms) && ms > Date.now();
    }, 'Must be a future date'),
  planKey: z.string().optional(),
  seatLimit: z.coerce.number().int().positive('Seat limit must be a positive number').optional().or(z.literal('')),
  reason: z.string().optional(),
});
type RenewForm = z.infer<typeof RenewSchema>;

function RenewDialog({
  open,
  onOpenChange,
  institution,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  institution: InstitutionDetail;
}) {
  const renew = useRenewSubscription(institution.id);
  const plans = usePlans();
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RenewForm>({
    resolver: zodResolver(RenewSchema),
    defaultValues: { endDate: defaultRenewDate(), planKey: '', seatLimit: '', reason: '' },
  });

  function onSubmit(values: RenewForm) {
    renew.mutate(
      {
        endDate: values.endDate,
        planKey: values.planKey || undefined,
        seatLimit: values.seatLimit ? Number(values.seatLimit) : undefined,
        reason: values.reason || undefined,
      },
      {
        onSuccess: (res) => {
          toast.success(`Subscription renewed until ${formatDate(res.newExpiry)}`);
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
          <DialogTitle>Renew Subscription</DialogTitle>
          <DialogDescription>
            Extend the subscription validity. Default is {SUBSCRIPTION.RENEW_DURATION_DAYS} days from today.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="renew-endDate">Renew until *</Label>
            <Input id="renew-endDate" type="date" {...register('endDate')} />
            {errors.endDate ? <p className="text-sm text-red-500">{errors.endDate.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="renew-planKey">Plan (optional)</Label>
            <Controller
              control={control}
              name="planKey"
              render={({ field }) => (
                <Select value={field.value || 'none'} onValueChange={(v) => field.onChange(v === 'none' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Keep current plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Keep current plan</SelectItem>
                    {(plans.data ?? []).map((p) => (
                      <SelectItem key={p.id} value={p.key}>
                        {p.name} ({p.key})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="renew-seatLimit">Seat limit (optional)</Label>
            <Input id="renew-seatLimit" type="number" min={1} placeholder="Keep current limit" {...register('seatLimit')} />
            {errors.seatLimit ? <p className="text-sm text-red-500">{errors.seatLimit.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="renew-reason">Reason (optional)</Label>
            <Textarea id="renew-reason" rows={2} placeholder="Optional" {...register('reason')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || renew.isPending}>
              {isSubmitting || renew.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Renew Subscription
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const SetSubscriptionSchema = z
  .object({
    planKey: z.string().min(1, 'Plan is required'),
    status: z.string().min(1, 'Status is required'),
    startsAt: z.string().optional(),
    endsAt: z.string().optional(),
    seatLimit: z.coerce.number().int().positive('Seat limit must be a positive number').optional().or(z.literal('')),
    reason: z.string().optional(),
  })
  .refine((v) => !v.startsAt || !v.endsAt || v.endsAt >= v.startsAt, {
    path: ['endsAt'],
    message: 'End date cannot be before start date',
  });
type SetSubscriptionForm = z.infer<typeof SetSubscriptionSchema>;

const SUBSCRIPTION_STATUS_OPTIONS = Object.values(SubscriptionStatus);

function SetSubscriptionDialog({
  open,
  onOpenChange,
  institution,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  institution: InstitutionDetail;
}) {
  const setSub = useSetSubscription(institution.id);
  const plans = usePlans();
  const current = institution.subscription;
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SetSubscriptionForm>({
    resolver: zodResolver(SetSubscriptionSchema),
    defaultValues: {
      planKey: current?.plan.key ?? '',
      status: current?.status ?? '',
      startsAt: current?.startedAt ? toDateInputValue(new Date(current.startedAt)) : '',
      endsAt: current?.endsAt ? toDateInputValue(new Date(current.endsAt)) : '',
      seatLimit: current?.seatLimit ?? '',
      reason: '',
    },
  });

  function onSubmit(values: SetSubscriptionForm) {
    setSub.mutate(
      {
        planKey: values.planKey,
        status: values.status,
        startsAt: values.startsAt || undefined,
        endsAt: values.endsAt || undefined,
        seatLimit: values.seatLimit ? Number(values.seatLimit) : undefined,
        reason: values.reason || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Subscription updated');
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
          <DialogTitle>Change Plan / Set Subscription</DialogTitle>
          <DialogDescription>Override the subscription plan, status and validity window.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="set-planKey">Plan *</Label>
            <Controller
              control={control}
              name="planKey"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {(plans.data ?? []).map((p) => (
                      <SelectItem key={p.id} value={p.key}>
                        {p.name} ({p.key})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.planKey ? <p className="text-sm text-red-500">{errors.planKey.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="set-status">Status *</Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBSCRIPTION_STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.status ? <p className="text-sm text-red-500">{errors.status.message}</p> : null}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="set-startsAt">Starts at</Label>
              <Input id="set-startsAt" type="date" {...register('startsAt')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="set-endsAt">Ends at</Label>
              <Input id="set-endsAt" type="date" {...register('endsAt')} />
              {errors.endsAt ? <p className="text-sm text-red-500">{errors.endsAt.message}</p> : null}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="set-seatLimit">Seat limit</Label>
            <Input id="set-seatLimit" type="number" min={1} placeholder="e.g. 500" {...register('seatLimit')} />
            {errors.seatLimit ? <p className="text-sm text-red-500">{errors.seatLimit.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="set-reason">Reason (optional)</Label>
            <Textarea id="set-reason" rows={2} placeholder="Optional" {...register('reason')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || setSub.isPending}>
              {isSubmitting || setSub.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save Subscription
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const SeatLimitSchema = z.object({
  seatLimit: z.coerce.number().int().positive('Seat limit must be a positive number'),
  reason: z.string().optional(),
});
type SeatLimitForm = z.infer<typeof SeatLimitSchema>;

function SeatLimitDialog({
  open,
  onOpenChange,
  institution,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  institution: InstitutionDetail;
}) {
  const changeLimit = useChangeUserLimit(institution.id);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SeatLimitForm>({
    resolver: zodResolver(SeatLimitSchema),
    defaultValues: {
      seatLimit: institution.subscription?.seatLimit ?? institution.seatLimit ?? undefined,
      reason: '',
    },
  });

  function onSubmit(values: SeatLimitForm) {
    changeLimit.mutate(
      { seatLimit: Number(values.seatLimit), reason: values.reason || undefined },
      {
        onSuccess: (res) => {
          toast.success(`Seat limit updated to ${res.seatLimit}. Current usage is ${res.usage} seats.`);
          if (res.exceeded) toast.warning('Usage now exceeds the seat limit.');
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
          <DialogTitle>Adjust Seat Limit</DialogTitle>
          <DialogDescription>Change the maximum number of billable seats for this institution.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="limit-seatLimit">Seat limit *</Label>
            <Input id="limit-seatLimit" type="number" min={1} placeholder="e.g. 500" {...register('seatLimit')} />
            {errors.seatLimit ? <p className="text-sm text-red-500">{errors.seatLimit.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="limit-reason">Reason (optional)</Label>
            <Textarea id="limit-reason" rows={2} placeholder="Optional" {...register('reason')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || changeLimit.isPending}>
              {isSubmitting || changeLimit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Update Seat Limit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const ChangeAdminSchema = z
  .object({
    mode: z.enum(['existing', 'create']),
    assignUserId: z.string().optional(),
    adminName: z.string().optional(),
    adminEmail: z.string().optional(),
    adminPhone: z.string().optional(),
    adminPassword: z.string().optional(),
    reason: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.mode === 'existing' && !v.assignUserId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['assignUserId'], message: 'Select an institution user' });
    }
    if (v.mode === 'create') {
      if (!v.adminName || v.adminName.trim().length < 2) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['adminName'], message: 'Admin name is required' });
      }
      if (!v.adminEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.adminEmail)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['adminEmail'], message: 'A valid email is required' });
      }
      if (v.adminPassword && v.adminPassword.length < 8) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['adminPassword'], message: 'Password must be at least 8 characters' });
      }
    }
  });
type ChangeAdminForm = z.infer<typeof ChangeAdminSchema>;

function ChangeAdminDialog({
  open,
  onOpenChange,
  institution,
  users,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  institution: InstitutionDetail;
  users: InstitutionUser[];
}) {
  const changeAdmin = useChangeAdmin(institution.id);
  const [search, setSearch] = useState('');
  const {
    setValue,
    watch,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangeAdminForm>({
    resolver: zodResolver(ChangeAdminSchema),
    defaultValues: { mode: 'existing', assignUserId: '', adminName: '', adminEmail: '', adminPhone: '', adminPassword: '', reason: '' },
  });

  const mode = watch('mode');
  const adminIds = new Set(institution.admins.map((a) => a.userId));
  const candidates = users
    .filter((u) => !adminIds.has(u.userId))
    .filter((u) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.phone ?? '').toLowerCase().includes(q);
    });

  useEffect(() => {
    if (!open) {
      setSearch('');
      setValue('assignUserId', '');
      setValue('adminName', '');
      setValue('adminEmail', '');
      setValue('adminPhone', '');
      setValue('adminPassword', '');
      setValue('reason', '');
    }
  }, [open, setValue]);

  function onSubmit(values: ChangeAdminForm) {
    changeAdmin.mutate(
      {
        assignUserId: values.mode === 'existing' ? values.assignUserId : undefined,
        adminName: values.mode === 'create' ? values.adminName : undefined,
        adminEmail: values.mode === 'create' ? values.adminEmail : undefined,
        reason: values.reason || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Primary admin updated');
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
          <DialogTitle>Change Primary Admin</DialogTitle>
          <DialogDescription>Assign an existing user or create a new institution admin.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setValue('mode', 'existing')}
              className={cn(
                'rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition-all',
                mode === 'existing' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-surface-200 text-surface-600',
              )}
            >
              Assign existing user
            </button>
            <button
              type="button"
              onClick={() => setValue('mode', 'create')}
              className={cn(
                'rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition-all',
                mode === 'create' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-surface-200 text-surface-600',
              )}
            >
              Create new admin
            </button>
          </div>

          {mode === 'existing' ? (
            <div className="space-y-2">
              <Label htmlFor="admin-search">Search institution users</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                <Input id="admin-search" className="pl-9" placeholder="Search by name, email or phone" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-surface-200 p-2">
                {candidates.length === 0 ? (
                  <p className="px-2 py-3 text-center text-sm text-surface-400">No matching users</p>
                ) : (
                  candidates.slice(0, 50).map((u) => {
                    const selected = watch('assignUserId') === u.userId;
                    return (
                      <button
                        key={u.userId}
                        type="button"
                        onClick={() => setValue('assignUserId', u.userId === watch('assignUserId') ? '' : u.userId)}
                        className={cn(
                          'flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-all',
                          selected ? 'bg-brand-50 text-brand-800' : 'hover:bg-surface-50',
                        )}
                      >
                        <span>
                          <span className="block font-medium">{u.name}</span>
                          <span className="block text-xs text-surface-500">{u.email}{u.phone ? ` · ${u.phone}` : ''}</span>
                        </span>
                        <Badge variant={selected ? 'default' : 'secondary'} className="shrink-0 text-[10px]">
                          {selected ? 'Selected' : u.role.replace(/_/g, ' ')}
                        </Badge>
                      </button>
                    );
                  })
                )}
              </div>
              {errors.assignUserId ? <p className="text-sm text-red-500">{errors.assignUserId.message}</p> : null}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-name">Admin name *</Label>
                <Input id="admin-name" placeholder="e.g. Rohan Verma" {...register('adminName')} />
                {errors.adminName ? <p className="text-sm text-red-500">{errors.adminName.message}</p> : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-email">Admin email *</Label>
                <Input id="admin-email" type="email" placeholder="admin@school.com" {...register('adminEmail')} />
                {errors.adminEmail ? <p className="text-sm text-red-500">{errors.adminEmail.message}</p> : null}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="admin-phone">Phone (optional)</Label>
                  <Input id="admin-phone" placeholder="+91..." {...register('adminPhone')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Password (optional)</Label>
                  <Input id="admin-password" type="password" placeholder="Min 8 characters" {...register('adminPassword')} />
                  {errors.adminPassword ? <p className="text-sm text-red-500">{errors.adminPassword.message}</p> : null}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="admin-reason">Reason (optional)</Label>
            <Textarea id="admin-reason" rows={2} placeholder="Optional" {...register('reason')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || changeAdmin.isPending}>
              {isSubmitting || changeAdmin.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save Primary Admin
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const COUNT_ITEMS: { key: keyof InstitutionDetail['counts']; label: string; icon: typeof Users }[] = [
  { key: 'students', label: 'Students', icon: Users },
  { key: 'teachers', label: 'Teachers', icon: UserCheck },
  { key: 'parents', label: 'Parents', icon: GraduationCap },
  { key: 'groups', label: 'Groups', icon: Users },
  { key: 'questions', label: 'Questions', icon: HelpCircle },
  { key: 'papers', label: 'Papers', icon: FileText },
  { key: 'assessments', label: 'Assessments', icon: ClipboardList },
];

export default function InstitutionDetailPage() {
  const params = useParams();
  const id = (params.id as string) || '';
  const [profileOpen, setProfileOpen] = useState(false);
  const [action, setAction] = useState<StatusAction | null>(null);
  const [renewOpen, setRenewOpen] = useState(false);
  const [setSubOpen, setSetSubOpen] = useState(false);
  const [seatLimitOpen, setSeatLimitOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [restrictUser, setRestrictUser] = useState<{ user: InstitutionUser; target: 'DISABLE' | 'ENABLE' } | null>(null);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [userSearch, setUserSearch] = useState('');
  const [auditPage, setAuditPage] = useState(1);

  const { data: detail, isLoading, error, refetch } = useInstitutionDetail(id);
  const usersQuery = useInstitutionUsers(id);
  const historyQuery = useInstitutionSubscriptionHistory(id);
  const auditQuery = useInstitutionAudit(id, auditPage, 5);

  const activate = useActivateInstitution(id);
  const suspend = useSuspendInstitution(id);
  const archive = useArchiveInstitution(id);
  const restore = useRestoreInstitution(id);
  const expire = useExpireInstitution(id);
  const disableUser = useDisableInstitutionUser(id);
  const enableUser = useEnableInstitutionUser(id);

  const statusMutations: Record<StatusAction, ReturnType<typeof useActivateInstitution>> = {
    ACTIVATE: activate,
    SUSPEND: suspend,
    ARCHIVE: archive,
    RESTORE: restore,
    EXPIRE: expire,
  };

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

  if (error || !detail) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Building2 className="mx-auto h-12 w-12 text-surface-300" />
          <p className="mt-4 text-sm font-semibold text-surface-800">
            {notFound ? 'Institution not found' : 'Could not load institution details'}
          </p>
          <p className="mt-1 text-sm text-surface-500">
            {notFound ? 'This institution may have been removed.' : (error as Error).message}
          </p>
          <Button className="mt-4" variant="outline" onClick={() => void refetch()}>
            <RefreshCcw className="h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const status = detail.status as InstitutionStatus;
  const isActive = status === 'ACTIVE';
  const isPending = status === 'PENDING';
  const isArchived = status === 'ARCHIVED';
  const isExpiredStatus = status === 'EXPIRED';

  const sub = detail.subscription;
  const seatLimit = sub?.seatLimit ?? detail.seatLimit;
  const usage = detail.billableUsers ?? 0;
  const usagePct =
    seatLimit && seatLimit > 0
      ? typeof detail.usagePct === 'number'
        ? Math.min(100, Math.round(detail.usagePct))
        : Math.min(100, Math.round((usage / seatLimit) * 100))
      : 0;

  function expiryChip(currentSub: SubscriptionView | null | undefined) {
    if (!currentSub) return null;
    const days = daysUntil(currentSub.endsAt);
    if (days === null) return { label: 'Active', style: 'bg-green-100 text-green-700' };
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
  const chip = expiryChip(sub);

  const allUsers = usersQuery.data?.users ?? [];
  const nonAdminUsers = allUsers.filter((u) => u.role !== 'INSTITUTION_ADMIN');
  const filteredUsers = nonAdminUsers
    .filter((u) => roleFilter === 'ALL' || u.role === roleFilter)
    .filter((u) => {
      const q = userSearch.trim().toLowerCase();
      if (!q) return true;
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    });

  const auditTotalPages = auditQuery.data ? Math.max(1, Math.ceil(auditQuery.data.total / 5)) : 1;
  const historyRows = historyQuery.data?.rows ?? [];

  function confirmStatusAction(reason?: string) {
    if (!action) return;
    const meta = STATUS_ACTION_META[action];
    statusMutations[action].mutate(reason ? { reason } : undefined, {
      onSuccess: () => {
        toast.success(meta.success);
        setAction(null);
      },
      onError: (e: Error) => toast.error(e.message),
    });
  }

  function confirmRestrict(reason?: string) {
    if (!restrictUser) return;
    const body = { userId: restrictUser.user.userId, reason: reason || undefined };
    if (restrictUser.target === 'DISABLE') {
      disableUser.mutate(body, {
        onSuccess: () => {
          toast.success(`${restrictUser.user.name} disabled`);
          setRestrictUser(null);
        },
        onError: (e: Error) => toast.error(e.message),
      });
    } else {
      enableUser.mutate(body, {
        onSuccess: () => {
          toast.success(`${restrictUser.user.name} enabled`);
          setRestrictUser(null);
        },
        onError: (e: Error) => toast.error(e.message),
      });
    }
  }

  const activeMutation = action ? statusMutations[action] : null;

  return (
    <div className="space-y-6">
      <Toaster position="top-right" richColors />

      <nav className="flex items-center gap-1 text-sm text-surface-500">
        <Link
          href="/app/institutions"
          className="inline-flex items-center gap-1 transition-colors hover:text-brand-600"
        >
          <ChevronLeft className="h-4 w-4" />
          Institutions
        </Link>
      </nav>

      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-surface-900">{detail.name}</h1>
              <Badge variant="secondary" className="text-xs">{detail.code ?? '—'}</Badge>
              <Badge variant="outline" className="text-xs">{detail.type.replace(/_/g, ' ')}</Badge>
              <Badge className={cn('text-xs', INSTITUTION_STATUS_STYLES[status] ?? 'bg-surface-100 text-surface-600')}>
                {status}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-surface-500">
              Created {formatDate(detail.createdAt)} · Last activity {formatDate(detail.lastActivityAt)}
            </p>
          </div>
          <Button variant="outline" onClick={() => setProfileOpen(true)}>
            <Pencil className="h-4 w-4" />
            Edit Profile
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {!isActive ? (
            <Button variant="success" onClick={() => setAction('ACTIVATE')}>
              <PlayCircle className="h-4 w-4" />
              Activate
            </Button>
          ) : null}
          {isActive || isPending ? (
            <Button variant="warning" onClick={() => setAction('SUSPEND')}>
              <Shield className="h-4 w-4" />
              Suspend
            </Button>
          ) : null}
          {!isArchived ? (
            <Button variant="destructive" onClick={() => setAction('ARCHIVE')}>
              <Archive className="h-4 w-4" />
              Archive
            </Button>
          ) : (
            <Button variant="success" onClick={() => setAction('RESTORE')}>
              <RotateCcw className="h-4 w-4" />
              Restore
            </Button>
          )}
          {!isExpiredStatus ? (
            <Button variant="destructive" onClick={() => setAction('EXPIRE')}>
              <CalendarClock className="h-4 w-4" />
              Expire
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {detail.description ? (
              <p className="text-sm text-surface-600">{detail.description}</p>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="text-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-surface-400">Address</p>
                <p className="mt-1 text-surface-700">
                  {[detail.address, detail.city, detail.state, detail.country].filter(Boolean).join(', ') || '—'}
                </p>
              </div>
              <div className="text-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-surface-400">Website</p>
                {detail.website ? (
                  <a
                    href={detail.website}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-brand-600 hover:underline"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    {detail.website.replace(/^https?:\/\//, '')}
                  </a>
                ) : (
                  <p className="mt-1 text-surface-500">—</p>
                )}
              </div>
              <div className="text-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-surface-400">Contact Person</p>
                <p className="mt-1 flex items-center gap-1 text-surface-700">
                  <User className="h-3.5 w-3.5 text-surface-400" />
                  {detail.contactPerson ?? '—'}
                </p>
              </div>
              <div className="text-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-surface-400">Primary Phone</p>
                <p className="mt-1 flex items-center gap-1 text-surface-700">
                  <Phone className="h-3.5 w-3.5 text-surface-400" />
                  {detail.primaryPhone ?? '—'}
                </p>
              </div>
              <div className="text-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-surface-400">Primary Email</p>
                <p className="mt-1 flex items-center gap-1 text-surface-700">
                  <Mail className="h-3.5 w-3.5 text-surface-400" />
                  {detail.primaryEmail ?? '—'}
                </p>
              </div>
              <div className="text-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-surface-400">Grace Period</p>
                <p className="mt-1 text-surface-700">
                  {detail.gracePeriodDays} day{detail.gracePeriodDays === 1 ? '' : 's'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {COUNT_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.key} className="rounded-xl bg-surface-50 p-3 text-center">
                    <Icon className="mx-auto h-4 w-4 text-brand-500" />
                    <p className="mt-1 text-lg font-bold text-surface-900">{detail.counts[item.key]}</p>
                    <p className="text-[11px] text-surface-400">{item.label}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-brand-500" />
                Subscription
              </CardTitle>
              <CardDescription className="mt-1">Plan, validity and seat usage</CardDescription>
            </div>
            {chip ? (
              <Badge className={cn('text-xs', chip.style)}>{chip.label}</Badge>
            ) : null}
          </CardHeader>

          <CardContent className="space-y-5">
            {sub ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-bold text-surface-900">{sub.plan.name}</p>
                  <Badge className="text-xs">{sub.plan.key}</Badge>
                  <Badge variant="outline" className="text-xs">
                    {sub.plan.perSeat} per seat
                  </Badge>
                  <Badge className={cn('text-xs', SUBSCRIPTION_STATUS_STYLES[sub.status] ?? 'bg-surface-100 text-surface-600')}>
                    {sub.status}
                  </Badge>
                </div>

                <p className="flex flex-wrap items-center gap-2 text-sm text-surface-500">
                  <Calendar className="h-4 w-4 text-surface-400" />
                  {formatDate(sub.startedAt)} → {formatDate(sub.endsAt)}
                </p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-surface-500">
                      {usage} / {seatLimit ?? '∞'} seats
                    </span>
                    {detail.limitExceeded ? (
                      <span className="flex items-center gap-1 font-semibold text-red-600">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Limit exceeded
                      </span>
                    ) : null}
                  </div>
                  {seatLimit && seatLimit > 0 ? (
                    <Progress
                      value={usagePct}
                      className="h-2.5"
                      indicatorClassName={
                        detail.limitExceeded
                          ? 'bg-gradient-to-r from-red-500 to-red-600'
                          : undefined
                      }
                    />
                  ) : null}
                </div>
              </>
            ) : (
              <p className="text-sm text-surface-500">No subscription configured yet.</p>
            )}

            <div className="flex flex-wrap gap-2 border-t border-surface-100 pt-4">
              <Button className="bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-700 hover:to-purple-700" onClick={() => setRenewOpen(true)}>
                <RefreshCcw className="h-4 w-4" />
                Renew Now
              </Button>
              <Button variant="outline" onClick={() => setSetSubOpen(true)}>
                <Pencil className="h-4 w-4" />
                Change Plan / Set Subscription
              </Button>
              <Button variant="outline" onClick={() => setSeatLimitOpen(true)}>
                <Users className="h-4 w-4" />
                Adjust Seat Limit
              </Button>
              <Button variant="destructive" onClick={() => setAction('EXPIRE')}>
                <CalendarClock className="h-4 w-4" />
                Expire Subscription
              </Button>
            </div>

            {historyRows.length > 0 ? (
              <div className="space-y-3 border-t border-surface-100 pt-4">
                <p className="text-sm font-semibold text-surface-700">Subscription History</p>
                {historyRows.map((row) => (
                  <div key={row.id} className="flex gap-3">
                    <Badge className={cn('shrink-0 text-[10px]', SUBSCRIPTION_ACTION_STYLES[row.action] ?? 'bg-surface-100 text-surface-600')}>
                      {row.action}
                    </Badge>
                    <div className="min-w-0">
                      <p className="text-sm text-surface-700">{historySummary(row)}</p>
                      {row.reason ? <p className="text-xs text-surface-500">Reason: {row.reason}</p> : null}
                      <p className="text-xs text-surface-400">
                        {formatDateTime(row.createdAt)} ·{' '}
                        {row.changedBy ? `${row.changedBy.name} <${row.changedBy.email}>` : 'System'}
                      </p>
                    </div>
                  </div>
                ))}
                {historyQuery.isLoading ? <p className="text-sm text-surface-400">Loading history...</p> : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Admins</CardTitle>
            <CardDescription className="mt-1">{detail.admins.length} administrator{detail.admins.length === 1 ? '' : 's'}</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setAdminOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Change Primary Admin
          </Button>
        </CardHeader>
        <CardContent>
          {detail.admins.length === 0 ? (
            <p className="text-sm text-surface-500">No admins assigned yet.</p>
          ) : (
            <div className="space-y-3">
              {detail.admins.map((admin) => {
                const isPrimary =
                  detail.primaryAdmin?.id === admin.userId || detail.primaryAdmin?.id === admin.id;
                return (
                  <div key={admin.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-surface-100 p-4">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 font-semibold text-surface-900">
                        {admin.name}
                        {isPrimary ? <Badge className="text-[10px]">Primary</Badge> : null}
                      </p>
                      <p className="text-sm text-surface-500">{admin.email}</p>
                      <p className="text-xs text-surface-400">
                        {admin.phone ?? 'No phone'} · Last login {formatDateTime(admin.lastLoginAt)}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">{admin.status}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription className="mt-1">
            {nonAdminUsers.length} non-admin user{nonAdminUsers.length === 1 ? '' : 's'} in this institution
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
              <Input
                className="pl-9"
                placeholder="Search users..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All roles</SelectItem>
                  <SelectItem value="STUDENT">Students</SelectItem>
                  <SelectItem value="TEACHER">Teachers</SelectItem>
                  <SelectItem value="PARENT">Parents</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {usersQuery.isLoading ? (
            <p className="py-6 text-center text-sm text-surface-400">Loading users...</p>
          ) : filteredUsers.length === 0 ? (
            <div className="py-10 text-center">
              <Users className="mx-auto h-10 w-10 text-surface-300" />
              <p className="mt-3 text-sm font-medium text-surface-500">No users yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-surface-100 text-xs uppercase tracking-wide text-surface-400">
                    <th className="px-3 py-2 font-semibold">User</th>
                    <th className="px-3 py-2 font-semibold">Role</th>
                    <th className="px-3 py-2 font-semibold">Status</th>
                    <th className="px-3 py-2 font-semibold">Joined</th>
                    <th className="px-3 py-2 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.userId} className="border-b border-surface-50">
                      <td className="px-3 py-3">
                        <p className="font-medium text-surface-900">{u.name}</p>
                        <p className="text-xs text-surface-500">{u.email}</p>
                      </td>
                      <td className="px-3 py-3">
                        <Badge className={cn('text-[10px]', ROLE_STYLES[u.role] ?? 'bg-surface-100 text-surface-600')}>
                          {u.role}
                        </Badge>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-xs text-surface-600">{u.status}</span>
                        {u.isActive ? null : (
                          <span className="ml-2 text-xs font-medium text-red-600">Disabled</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs text-surface-500">{formatDate(u.joinedAt)}</td>
                      <td className="px-3 py-3 text-right">
                        {u.isActive ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRestrictUser({ user: u, target: 'DISABLE' })}
                          >
                            <Lock className="h-3.5 w-3.5" />
                            Disable
                          </Button>
                        ) : (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => setRestrictUser({ user: u, target: 'ENABLE' })}
                          >
                            <PlayCircle className="h-3.5 w-3.5" />
                            Enable
                          </Button>
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

      <Card>
        <CardHeader>
          <CardTitle>Audit History</CardTitle>
          <CardDescription className="mt-1">
            {auditQuery.data?.total ?? 0} events · showing page {auditPage} of {auditTotalPages}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {auditQuery.isLoading ? (
            <p className="py-6 text-center text-sm text-surface-400">Loading audit events...</p>
          ) : auditQuery.data && auditQuery.data.rows.length === 0 ? (
            <p className="py-6 text-center text-sm text-surface-500">No audit events yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-surface-100 text-xs uppercase tracking-wide text-surface-400">
                    <th className="px-3 py-2 font-semibold">Timestamp</th>
                    <th className="px-3 py-2 font-semibold">Action</th>
                    <th className="px-3 py-2 font-semibold">Entity</th>
                    <th className="px-3 py-2 font-semibold">Metadata</th>
                    <th className="px-3 py-2 font-semibold">Actor</th>
                  </tr>
                </thead>
                <tbody>
                  {(auditQuery.data?.rows ?? []).map((row) => (
                    <tr key={row.id} className="border-b border-surface-50 align-top">
                      <td className="whitespace-nowrap px-3 py-3 text-xs text-surface-500">
                        {formatDateTime(row.createdAt)}
                      </td>
                      <td className="px-3 py-3">
                        <Badge className={cn('text-[10px]', AUDIT_ACTION_STYLES[row.action] ?? 'bg-surface-100 text-surface-600')}>
                          {row.action}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-xs text-surface-600">
                        {row.entityType ? (
                          <span className="block">{row.entityType}</span>
                        ) : null}
                        {row.entityId ? (
                          <span className="block font-mono text-[10px] text-surface-400">{row.entityId}</span>
                        ) : null}
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

          <div className="flex items-center justify-between">
            <span className="text-xs text-surface-400">
              {auditQuery.data ? `${(auditPage - 1) * 5 + 1}-${Math.min(auditPage * 5, auditQuery.data.total)} of ${auditQuery.data.total}` : ''}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={auditPage <= 1 || auditQuery.isFetching}
                onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={auditPage >= auditTotalPages || auditQuery.isFetching}
                onClick={() => setAuditPage((p) => p + 1)}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isArchived || isExpiredStatus ? (
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-surface-600">
              Archiving or expiring an institution never deletes data. All student data, assessments and history
              are preserved.
            </p>
            <Button variant="success" onClick={() => setAction(isArchived ? 'RESTORE' : 'ACTIVATE')}>
              <RotateCcw className="h-4 w-4" />
              {isArchived ? 'Restore' : 'Re-activate'}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <InstitutionProfileFormDialog
        open={profileOpen}
        onOpenChange={setProfileOpen}
        institution={detail}
      />

      <ConfirmDialog
        open={action !== null}
        onOpenChange={(open) => {
          if (!open) setAction(null);
        }}
        title={action ? STATUS_ACTION_META[action].title : ''}
        description={action ? STATUS_ACTION_META[action].description : ''}
        confirmLabel={action ? STATUS_ACTION_META[action].label : ''}
        destructive={action ? STATUS_ACTION_META[action].destructive : false}
        loading={activeMutation?.isPending}
        reasonLabel={action ? STATUS_ACTION_META[action].reasonLabel : undefined}
        onConfirm={confirmStatusAction}
      />

      <ConfirmDialog
        open={restrictUser !== null}
        onOpenChange={(open) => {
          if (!open) setRestrictUser(null);
        }}
        title={restrictUser ? (restrictUser.target === 'DISABLE' ? 'Disable user' : 'Enable user') : ''}
        description={
          restrictUser
            ? `${restrictUser.target === 'DISABLE' ? 'Disable' : 'Enable'} ${restrictUser.user.name} (${restrictUser.user.email}) for this institution.`
            : ''
        }
        confirmLabel={restrictUser ? (restrictUser.target === 'DISABLE' ? 'Disable' : 'Enable') : ''}
        destructive={restrictUser?.target === 'DISABLE'}
        loading={restrictUser?.target === 'DISABLE' ? disableUser.isPending : enableUser.isPending}
        reasonLabel="Reason (optional)"
        onConfirm={confirmRestrict}
      />

      <RenewDialog open={renewOpen} onOpenChange={setRenewOpen} institution={detail} />
      <SetSubscriptionDialog open={setSubOpen} onOpenChange={setSetSubOpen} institution={detail} />
      <SeatLimitDialog open={seatLimitOpen} onOpenChange={setSeatLimitOpen} institution={detail} />
      <ChangeAdminDialog open={adminOpen} onOpenChange={setAdminOpen} institution={detail} users={allUsers} />
    </div>
  );
}