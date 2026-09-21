'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
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
    <div className="space-y-2 px-4 pb-4 pt-0">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-8 rounded-lg bg-surface-100" />
      ))}
    </div>
  );
}

export function InstitutionHealthPanel({ range }: { range: SuperAdminRange }) {
  const router = useRouter();
  const { data, isLoading, error } = useSuperAdminHealth(range, false);

  const rows = data?.rows ?? [];
  const statusCounts = rows.reduce((acc, row) => {
    acc[row.status] = (acc[row.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-sm">Institution Health</CardTitle>
          <Link href="/app/institutions">
            <Button variant="outline" size="sm" className="h-7 text-xs shrink-0">
              Manage <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
        {Object.keys(statusCounts).length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {Object.entries(statusCounts).map(([status, count]) => (
              <Link
                key={status}
                href={`/app/institutions?status=${status}`}
                className="inline-flex items-center gap-1 text-xs hover:underline"
              >
                <Badge variant={statusVariant(status)} className="text-[10px] px-1.5 py-0">
                  {count}
                </Badge>
                <span className="text-surface-600">{humanizeCode(status)}</span>
              </Link>
            ))}
          </div>
        )}
      </CardHeader>

      {error ? (
        <CardContentEmpty message="Could not load institution health." />
      ) : isLoading ? (
        <CardContentSkeleton />
      ) : rows.length === 0 ? (
        <CardContentEmpty message="No institutions found." />
      ) : (
        <div className="overflow-x-auto px-4 pb-4">
          <table className="w-full min-w-[680px] border-collapse text-xs">
            <thead>
              <tr className="border-b border-surface-200 text-left text-[10px] font-semibold text-surface-500 uppercase tracking-wider">
                <th className="py-2 pr-3">Institution</th>
                <th className="py-2 pr-3">Students</th>
                <th className="py-2 pr-3">Seats</th>
                <th className="py-2 pr-3">Subscription</th>
                <th className="py-2 pr-3">Last Active</th>
                <th className="py-2">Issues</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 8).map((row) => (
                <HealthRow key={row.id} row={row} onOpen={() => router.push(`/app/institutions/${row.id}`)} />
              ))}
            </tbody>
          </table>
          {rows.length > 8 && (
            <Link href="/app/institutions" className="block pt-2 text-center text-xs text-brand-600 hover:underline">
              +{rows.length - 8} more institutions
            </Link>
          )}
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
      <td className="py-2 pr-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-100">
            <Building2 className="h-3.5 w-3.5 text-brand-600" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-surface-900 text-xs">
              {row.name}
              {row.isSystemInstitution && (
                <Badge variant="purple" className="ml-1.5 text-[9px] px-1 py-0 align-middle">
                  Sys
                </Badge>
              )}
            </p>
            <p className="text-[10px] text-surface-500">{humanizeCode(row.status)}</p>
          </div>
        </div>
      </td>
      <td className="py-2 pr-3">
        <p className="font-medium text-surface-900 text-xs">{row.studentCount}</p>
        <p className="text-[10px] text-surface-500">{row.memberCount} members</p>
      </td>
      <td className="py-2 pr-3">
        <p className={cn('font-medium text-xs', seatsOver ? 'text-red-600' : 'text-surface-900')}>
          {row.seatsUsed}/{row.seatLimit ?? '∞'}
        </p>
      </td>
      <td className="py-2 pr-3">
        {row.planName ? (
          <p className="text-xs text-surface-700 truncate max-w-[100px]">{row.planName}</p>
        ) : (
          <span className="text-[10px] text-surface-400">—</span>
        )}
      </td>
      <td className="py-2 pr-3">
        <p className="text-xs text-surface-600">{formatRelative(row.lastActivityAt)}</p>
      </td>
      <td className="py-2">
        {row.attention.length > 0 ? (
          <div className="flex flex-wrap gap-0.5">
            {row.attention.slice(0, 2).map((item) => (
              <Badge key={item} variant="warning" className="text-[9px] px-1 py-0">
                {attentionLabel(item)}
              </Badge>
            ))}
            {row.attention.length > 2 && (
              <Badge variant="outline" className="text-[9px] px-1 py-0">
                +{row.attention.length - 2}
              </Badge>
            )}
          </div>
        ) : (
          <span className="text-[10px] text-surface-400">—</span>
        )}
      </td>
    </tr>
  );
}

function CardContentEmpty({ message }: { message: string }) {
  return (
    <div className="px-4 pb-4 pt-0">
      <div className="flex flex-col items-center justify-center rounded-xl bg-surface-50 px-4 py-8 text-center">
        <Building2 className="h-8 w-8 text-surface-300" />
        <p className="mt-2 text-xs text-surface-500">{message}</p>
      </div>
    </div>
  );
}