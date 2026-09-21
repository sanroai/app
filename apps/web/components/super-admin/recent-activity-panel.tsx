'use client';

import Link from 'next/link';
import { Activity, Building2, UserRound } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="space-y-2 px-4 pb-4" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-8 animate-pulse rounded-lg bg-surface-100" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
            <Activity className="h-6 w-6 text-surface-300" />
            <p className="mt-1.5 text-xs text-surface-500">No activity in this range.</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-100">
            {items.slice(0, 6).map((item) => (
              <div key={item.id} className="flex items-center gap-2.5 px-4 py-2 hover:bg-surface-50 transition-colors">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand-100">
                  <Activity className="h-3 w-3 text-brand-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-surface-900 truncate">{humanizeCode(item.action)}</p>
                  <div className="flex items-center gap-2 text-[10px] text-surface-500">
                    <span className="inline-flex items-center gap-0.5 truncate">
                      <UserRound className="h-2.5 w-2.5 shrink-0" />
                      {item.actorName || item.actorEmail}
                    </span>
                    {item.institutionId && item.institutionName && (
                      <Link
                        href={`/app/institutions/${item.institutionId}`}
                        className="inline-flex items-center gap-0.5 truncate transition-colors hover:text-brand-600"
                      >
                        <Building2 className="h-2.5 w-2.5 shrink-0" />
                        {item.institutionName}
                      </Link>
                    )}
                  </div>
                </div>
                <span className="shrink-0 text-[10px] text-surface-400">{formatRelative(item.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}