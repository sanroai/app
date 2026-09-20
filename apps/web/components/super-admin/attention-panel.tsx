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
      <CardHeader>
        <CardTitle>Attention Required</CardTitle>
        <CardDescription>
          {error
            ? 'Could not load attention list.'
            : isLoading
              ? 'Scanning institutions…'
              : totalIssues === 0
                ? 'All institutions look healthy'
                : `${totalIssues} item${totalIssues === 1 ? '' : 's'} need attention`}
        </CardDescription>
      </CardHeader>
      {isLoading ? (
        <div className="px-6 pb-6 pt-0 space-y-3" aria-hidden>
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-100" />
          ))}
        </div>
      ) : error ? (
        <div className="px-6 pb-6 pt-0">
          <AttentionEmpty icon={<AlertCircle className="h-8 w-8 text-surface-300" />} message="Unable to load." />
        </div>
      ) : groups.length === 0 ? (
        <div className="px-6 pb-6 pt-0">
          <AttentionEmpty
            icon={<CheckCircle2 className="h-8 w-8 text-green-300" />}
            message="Nothing needs your attention right now."
          />
        </div>
      ) : (
        <div className="space-y-4 px-6 pb-6 pt-0">
          {groups.map((group) => (
            <div key={group.key}>
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg', toneClasses(group.tone))}>
                    <group.icon className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-semibold text-surface-900">{group.label}</p>
                </div>
                <Badge variant="outline" className="rounded-full px-2 py-0">
                  {group.items.length}
                </Badge>
              </div>
              <div className="space-y-1.5">
                {group.items.slice(0, 4).map((item) => (
                  <Link
                    key={item.id}
                    href={`/app/institutions/${item.id}`}
                    className="flex items-center justify-between rounded-xl border border-surface-100 bg-surface-50 px-3 py-2 transition-colors hover:border-brand-200 hover:bg-brand-50"
                  >
                    <span className="min-w-0 truncate text-sm font-medium text-surface-900">{item.name}</span>
                    <Badge variant="outline" className="ml-2 shrink-0 text-[10px] px-2 py-0">
                      {humanizeCode(item.type)}
                    </Badge>
                  </Link>
                ))}
                {group.items.length > 4 && (
                  <p className="px-1 text-xs text-surface-400">+{group.items.length - 4} more</p>
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
    <div className="flex flex-col items-center justify-center rounded-2xl bg-surface-50 px-4 py-8 text-center">
      {icon}
      <p className="mt-2 text-sm text-surface-500">{message}</p>
    </div>
  );
}