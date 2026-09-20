'use client';

import Link from 'next/link';
import { Activity, Building2, UserRound } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  formatRelative,
  humanizeCode,
  useSuperAdminActivity,
  type SuperAdminRange,
} from '@/lib/super-admin-hooks';

export function RecentActivityPanel({ range }: { range: SuperAdminRange }) {
  const { data, isLoading } = useSuperAdminActivity(range);

  const items = data?.items ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Platform Activity</CardTitle>
        <CardDescription>
          {isLoading ? 'Loading latest activity…' : `${items.length} recent event${items.length === 1 ? '' : 's'}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-surface-100" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-surface-50 px-4 py-10 text-center">
            <Activity className="h-8 w-8 text-surface-300" />
            <p className="mt-2 text-sm text-surface-500">No platform activity yet in this range.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.slice(0, 10).map((item) => (
              <div key={item.id} className="flex items-start gap-3 rounded-xl bg-surface-50 p-3">
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-100">
                  <Activity className="h-4 w-4 text-brand-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-surface-900">{humanizeCode(item.action)}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-surface-500">
                    <span className="inline-flex items-center gap-1 truncate">
                      <UserRound className="h-3 w-3 shrink-0" />
                      {item.actorName || item.actorEmail}
                    </span>
                    {item.institutionId && item.institutionName && (
                      <Link
                        href={`/app/institutions/${item.institutionId}`}
                        className="inline-flex items-center gap-1 truncate transition-colors hover:text-brand-600"
                      >
                        <Building2 className="h-3 w-3 shrink-0" />
                        {item.institutionName}
                      </Link>
                    )}
                  </div>
                </div>
                <span className="shrink-0 text-xs text-surface-400">{formatRelative(item.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}