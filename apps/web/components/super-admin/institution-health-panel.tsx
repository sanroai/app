'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  formatRelative,
  humanizeCode,
  useSuperAdminHealth,
  type InstitutionHealthRow,
  type SuperAdminRange,
} from '@/lib/super-admin-hooks';
import { cn } from '@/lib/cn';

const STATUS_VARIANT: Record<string, 'success' | 'destructive' | 'warning' | 'secondary' | 'purple'> = {
  ACTIVE: 'success',
  TRIAL: 'purple',
  PENDING: 'warning',
  SUSPENDED: 'destructive',
  EXPIRED: 'destructive',
  ARCHIVED: 'secondary',
};

const ATTENTION_LABELS: Record<string, string> = {
  EXPIRING_SOON: 'Expiring',
  SUSPENDED: 'Suspended',
  EXPIRED: 'Expired',
  OVER_SEAT_LIMIT: 'Over seats',
  PAST_DUE: 'Past due',
  NO_SUBSCRIPTION: 'No plan',
};

function statusVariant(status: string) {
  return STATUS_VARIANT[status] ?? 'secondary';
}

function attentionLabel(attention: string) {
  return ATTENTION_LABELS[attention] ?? humanizeCode(attention);
}

function CardContentSkeleton() {
  return (
    <div className="space-y-3 p-6 pt-0">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="h-10 rounded-xl bg-surface-100" />
      ))}
    </div>
  );
}

export function InstitutionHealthPanel({ range }: { range: SuperAdminRange }) {
  const router = useRouter();
  const { data, isLoading, error } = useSuperAdminHealth(range, false);

  const rows = data?.rows ?? [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Institution Health</CardTitle>
            <CardDescription>
              {isLoading || !data ? 'Loading institutional status…' : `${rows.length} institutions across the platform`}
            </CardDescription>
          </div>
          <Link href="/app/institutions">
            <Button variant="outline" size="sm" className="shrink-0">
              Manage <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>

      {error ? (
        <CardContentEmpty message="Could not load institution health. Please retry." />
      ) : isLoading ? (
        <CardContentSkeleton />
      ) : rows.length === 0 ? (
        <CardContentEmpty message="No institutions found for this range." />
      ) : (
        <div className="overflow-x-auto px-6 pb-6">
          <table className="w-full min-w-[820px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-surface-200 text-left text-xs font-semibold text-surface-500">
                <th className="py-3 pr-4">Institution</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Students / Members</th>
                <th className="py-3 pr-4">Seats</th>
                <th className="py-3 pr-4">Subscription</th>
                <th className="py-3 pr-4">Last Activity</th>
                <th className="py-3">Attention</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <HealthRow key={row.id} row={row} onOpen={() => router.push(`/app/institutions/${row.id}`)} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function HealthRow({ row, onOpen }: { row: InstitutionHealthRow; onOpen: () => void }) {
  const seatsOver = row.seatLimit != null && row.seatLimit > 0 && row.seatsUsed > row.seatLimit;

  return (
    <tr
      onClick={onOpen}
      className="cursor-pointer border-b border-surface-100 align-middle transition-colors last:border-0 hover:bg-surface-50"
    >
      <td className="py-3 pr-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-100">
            <Building2 className="h-4 w-4 text-brand-600" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-surface-900">
              {row.name}
              {row.isSystemInstitution && (
                <Badge variant="purple" className="ml-2 text-[10px] px-1.5 py-0 align-middle">
                  System
                </Badge>
              )}
            </p>
            <p className="text-xs text-surface-500">{humanizeCode(row.type)}</p>
          </div>
        </div>
      </td>
      <td className="py-3 pr-4">
        <Badge variant={statusVariant(row.status)}>{humanizeCode(row.status)}</Badge>
      </td>
      <td className="py-3 pr-4">
        <p className="font-semibold text-surface-900">{row.studentCount}</p>
        <p className="text-xs text-surface-500">{row.memberCount} total members</p>
      </td>
      <td className="py-3 pr-4">
        <p className={cn('font-semibold', seatsOver ? 'text-red-600' : 'text-surface-900')}>
          {row.seatsUsed} / {row.seatLimit ?? '∞'}
        </p>
        {seatsOver && <p className="text-xs text-red-500">Over seat limit</p>}
      </td>
      <td className="py-3 pr-4">
        {row.planName ? (
          <>
            <p className="font-semibold text-surface-900">{row.planName}</p>
            <Badge variant={statusVariant(row.subscriptionStatus ?? '')} className="mt-1">
              {humanizeCode(row.subscriptionStatus)}
            </Badge>
          </>
        ) : (
          <Badge variant="outline">{row.subscriptionStatus ? humanizeCode(row.subscriptionStatus) : 'No plan'}</Badge>
        )}
      </td>
      <td className="py-3 pr-4">
        <p className="text-surface-700">{formatRelative(row.lastActivityAt)}</p>
      </td>
      <td className="py-3">
        {row.attention.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {row.attention.slice(0, 3).map((item) => (
              <Badge key={item} variant="warning" className="text-[10px] px-2 py-0.5">
                {attentionLabel(item)}
              </Badge>
            ))}
            {row.attention.length > 3 && (
              <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                +{row.attention.length - 3}
              </Badge>
            )}
          </div>
        ) : (
          <span className="text-xs text-surface-400">—</span>
        )}
      </td>
    </tr>
  );
}

function CardContentEmpty({ message }: { message: string }) {
  return (
    <div className="px-6 pb-6 pt-0">
      <div className="flex flex-col items-center justify-center rounded-2xl bg-surface-50 px-4 py-12 text-center">
        <Building2 className="h-10 w-10 text-surface-300" />
        <p className="mt-3 text-sm text-surface-500">{message}</p>
      </div>
    </div>
  );
}