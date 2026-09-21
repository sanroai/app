'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  useAdminParentDetail,
  useDisableAdminParent,
  useEnableAdminParent,
} from '@/lib/people-hooks';
import { ApiError } from '@/lib/api';
import { SourceBadge } from '@/components/people/source-badge';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/cn';
import {
  ChevronLeft,
  GraduationCap,
  Loader2,
  Mail,
  Phone,
  Shield,
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
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  DEACTIVATED: 'Deactivated',
};

const AUDIT_ACTION_STYLES: Record<string, string> = {
  PARENT_CREATED: 'bg-emerald-100 text-emerald-700',
  PARENT_UPDATED: 'bg-blue-100 text-blue-700',
  PARENT_DISABLED: 'bg-orange-100 text-orange-700',
  PARENT_ENABLED: 'bg-green-100 text-green-700',
  PARENT_LINKED: 'bg-teal-100 text-teal-700',
  PARENT_UNLINKED: 'bg-orange-100 text-orange-700',
  PARENT_CHILD_LINKED: 'bg-teal-100 text-teal-700',
  PARENT_CHILD_UNLINKED: 'bg-orange-100 text-orange-700',
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

export default function PeopleParentDetailPage() {
  const params = useParams();
  const id = (params.id as string) || '';
  const [confirmAction, setConfirmAction] = useState<'DISABLE' | 'ENABLE' | null>(null);

  const { data: parent, isLoading, error, refetch } = useAdminParentDetail(id);
  const disable = useDisableAdminParent(id);
  const enable = useEnableAdminParent(id);

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

  if (error || !parent) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <User className="mx-auto h-12 w-12 text-surface-300" />
          <p className="mt-4 text-sm font-semibold text-surface-800">
            {notFound ? 'Parent not found' : 'Could not load parent details'}
          </p>
          <p className="mt-1 text-sm text-surface-500">
            {notFound ? 'This parent may have been removed.' : (error as Error).message}
          </p>
          <Button className="mt-4" variant="outline" onClick={() => void refetch()}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  const source = parent.source ?? (parent.institutionId ? 'INSTITUTION' : 'DIRECT_SANRO');
  const isActive = parent.status === 'ACTIVE' && parent.isActive !== false;
  const audits = parent.recentAudit ?? [];
  const children = parent.children ?? [];

  function runConfirm() {
    if (!confirmAction) return;
    if (confirmAction === 'DISABLE') {
      disable.mutate(undefined, {
        onSuccess: () => {
          toast.success('Parent disabled');
          setConfirmAction(null);
        },
        onError: (e: Error) => toast.error(e.message),
      });
    } else {
      enable.mutate(undefined, {
        onSuccess: () => {
          toast.success('Parent enabled');
          setConfirmAction(null);
        },
        onError: (e: Error) => toast.error(e.message),
      });
    }
  }

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex items-center gap-2 text-sm text-surface-500">
          <li>
            <Link href="/app/people/parents" className="hover:text-brand-600">Parents</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-surface-900 font-medium">{parent.name}</li>
        </ol>
      </nav>

      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-lg font-bold text-white">
              {parent.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-surface-900">{parent.name}</h1>
                <SourceBadge source={source} />
                <Badge className={cn('text-xs', STATUS_STYLES[parent.status ?? ''] ?? 'bg-surface-100 text-surface-600')}>
                  {STATUS_LABELS[parent.status ?? ''] ?? parent.status ?? '—'}
                </Badge>
                {parent.isActive === false ? (
                  <Badge variant="secondary" className="text-xs">User disabled</Badge>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-surface-500">
                {parent.email ?? 'No email on record'}
                {parent.phone ? ` · ${parent.phone}` : ''}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
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
                  {parent.email ?? '—'}
                </p>
              </div>
              <div className="text-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-surface-400">Phone</p>
                <p className="mt-1 flex items-center gap-1 text-surface-700">
                  <Phone className="h-3.5 w-3.5 text-surface-400" />
                  {parent.phone ?? '—'}
                </p>
              </div>
            </div>
            {parent.institution ? (
              <div className="grid gap-3 sm:grid-cols-2 border-t border-surface-100 pt-4">
                <div className="text-sm">
                  <p className="text-xs font-medium uppercase tracking-wide text-surface-400">Institution</p>
                  <p className="mt-1 flex items-center gap-1 text-surface-700">
                    <GraduationCap className="h-3.5 w-3.5 text-surface-400" />
                    {parent.institution.name}
                  </p>
                  <p className="mt-0.5 text-xs text-surface-500">
                    {parent.institution.type ? parent.institution.type.replace(/_/g, ' ') : ''}
                    {parent.institution.status ? ` · ${parent.institution.status}` : ''}
                  </p>
                </div>
                <div className="text-sm">
                  <p className="text-xs font-medium uppercase tracking-wide text-surface-400">Created</p>
                  <p className="mt-1 text-surface-700">{formatDate(parent.createdAt)}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-surface-500">Direct SANRO parent — not bound to an institution.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-brand-500" />
              Linked Children
            </CardTitle>
            <CardDescription className="mt-1">
              {children.length} child{children.length === 1 ? '' : 'ren'}. Parent entitlement =
              ANY child with an active entitlement.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {children.length === 0 ? (
              <p className="text-sm text-surface-500">No children linked.</p>
            ) : (
              <div className="space-y-3">
                {children.map((c) => (
                  <div key={c.studentId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-surface-100 p-4">
                    <div>
                      <p className="font-semibold text-surface-900">{c.studentName}</p>
                      <p className="text-sm text-surface-500">
                        {c.grade ? `Grade ${c.grade} · ` : ''}
                        {c.institutionName ?? (c.institutionId ? c.institutionId : 'Direct SANRO')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <SourceBadge source={c.source} />
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/app/people/students/${c.studentId}`}>View</Link>
                      </Button>
                    </div>
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

      <ConfirmDialog
        open={confirmAction !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
        title={confirmAction === 'DISABLE' ? 'Disable parent' : 'Enable parent'}
        description={
          confirmAction === 'DISABLE'
            ? `Disable ${parent.name}? They will be blocked from accessing SANRO.`
            : `Re-enable ${parent.name}? Access is restored.`
        }
        confirmLabel={confirmAction === 'DISABLE' ? 'Disable' : 'Enable'}
        destructive={confirmAction === 'DISABLE'}
        loading={confirmAction === 'DISABLE' ? disable.isPending : enable.isPending}
        onConfirm={runConfirm}
      />
    </div>
  );
}