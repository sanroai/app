'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock,
  Users,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  humanizeCode,
  useSuperAdminAttention,
  type AttentionItem,
  type SuperAdminAttention,
} from '@/lib/super-admin-hooks';
import { cn } from '@/lib/cn';

type GroupKey = keyof SuperAdminAttention;

const GROUP_CONFIG: {
  key: GroupKey;
  label: string;
  icon: LucideIcon;
  tone: 'warning' | 'destructive' | 'info' | 'neutral';
}[] = [
  { key: 'expiringSoon', label: 'Expiring Soon', icon: Clock, tone: 'warning' },
  { key: 'suspended', label: 'Suspended', icon: Ban, tone: 'destructive' },
  { key: 'expired', label: 'Expired', icon: AlertTriangle, tone: 'destructive' },
  { key: 'overSeatLimit', label: 'Over Seat Limit', icon: Users, tone: 'destructive' },
  { key: 'pastDue', label: 'Past Due', icon: AlertCircle, tone: 'destructive' },
  { key: 'noSubscription', label: 'No Subscription', icon: XCircle, tone: 'neutral' },
];

function toneClasses(tone: 'warning' | 'destructive' | 'info' | 'neutral') {
  switch (tone) {
    case 'warning':
      return 'bg-amber-100 text-amber-600';
    case 'destructive':
      return 'bg-red-100 text-red-600';
    case 'info':
      return 'bg-sky-100 text-sky-600';
    default:
      return 'bg-surface-100 text-surface-500';
  }
}

export function AttentionPanel() {
  const { data, isLoading, error } = useSuperAdminAttention();

  const groups = GROUP_CONFIG
    .map((group) => ({ ...group, items: (data?.[group.key] as AttentionItem[]) ?? [] }))
    .filter((group) => group.items.length > 0);

  const totalIssues =
    data
      ? GROUP_CONFIG.reduce((sum, group) => sum + ((data[group.key] as AttentionItem[] | undefined)?.length ?? 0), 0)
      : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          Attention Required
          {totalIssues > 0 && (
            <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-100 px-1.5 text-[10px] font-semibold text-red-700">
              {totalIssues}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      {isLoading ? (
        <div className="px-4 pb-4 pt-0 space-y-2" aria-hidden>
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-8 animate-pulse rounded-lg bg-surface-100" />
          ))}
        </div>
      ) : error ? (
        <div className="px-4 pb-4 pt-0">
          <AttentionEmpty icon={<AlertCircle className="h-6 w-6 text-surface-300" />} message="Unable to load." />
        </div>
      ) : groups.length === 0 ? (
        <div className="px-4 pb-4 pt-0">
          <AttentionEmpty
            icon={<CheckCircle2 className="h-6 w-6 text-green-300" />}
            message="All healthy."
          />
        </div>
      ) : (
        <div className="px-4 pb-4 pt-0">
          {groups.map((group) => (
            <div key={group.key} className="mb-3 last:mb-0">
              <div className="mb-1.5 flex items-center gap-1.5">
                <div className={cn('flex h-5 w-5 items-center justify-center rounded', toneClasses(group.tone))}>
                  <group.icon className="h-3 w-3" />
                </div>
                <p className="text-[11px] font-semibold text-surface-700">{group.label}</p>
                <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[9px]">
                  {group.items.length}
                </Badge>
              </div>
              <div className="space-y-1">
                {group.items.slice(0, 4).map((item) => (
                  <Link
                    key={item.id}
                    href={`/app/institutions/${item.id}`}
                    className="flex items-center justify-between rounded-lg border border-surface-100 bg-surface-50 px-2.5 py-1.5 text-xs transition-colors hover:border-brand-200 hover:bg-brand-50"
                  >
                    <span className="min-w-0 truncate font-medium text-surface-900">{item.name}</span>
                    <Badge variant="outline" className="ml-2 shrink-0 text-[9px] px-1.5 py-0">
                      {humanizeCode(item.type)}
                    </Badge>
                  </Link>
                ))}
                {group.items.length > 4 && (
                  <p className="px-1 text-[10px] text-surface-400">+{group.items.length - 4} more</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function AttentionEmpty({ icon, message }: { icon: ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl bg-surface-50 px-4 py-6 text-center">
      {icon}
      <p className="mt-1.5 text-xs text-surface-500">{message}</p>
    </div>
  );
}