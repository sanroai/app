'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAdminParents, type AdminParentQuery } from '@/lib/people-hooks';
import { useInstitutions } from '@/lib/institution-hooks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SourceBadge } from '@/components/people/source-badge';
import { cn } from '@/lib/cn';
import {
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  RefreshCw,
  Search,
  Users,
} from 'lucide-react';

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700 border-green-200',
  DEACTIVATED: 'bg-red-100 text-red-700 border-red-200',
};

const SOURCE_FILTERS = ['INSTITUTION', 'DIRECT_SANRO'];

export default function PeopleParentsPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [source, setSource] = useState('');
  const [institutionId, setInstitutionId] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search), 400);
    return () => window.clearTimeout(t);
  }, [search]);

  const params: AdminParentQuery = {
    search: debouncedSearch || undefined,
    source: source || undefined,
    institutionId: institutionId || undefined,
    status: status || undefined,
    page,
    pageSize,
  };

  const { data, isLoading, isFetching, error, refetch } = useAdminParents(params);

  const institutionsQuery = useInstitutions({ page: 1, pageSize: 100 });
  const institutions = institutionsQuery.data?.items ?? [];
  const institutionOptions = useMemo(() => {
    const map = new Map(institutions.map((i) => [i.id, i.name]));
    return map;
  }, [institutions]);

  const rows = data?.items ?? [];

  const resetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setSource('');
    setInstitutionId('');
    setStatus('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Parents</h1>
          <p className="mt-1 text-sm text-surface-500">
            {isLoading ? 'Loading parents...' : `${data?.total ?? 0} parents`}
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search name, email, phone..."
                className="pl-9"
              />
            </div>
            <div className="w-40">
              <Select
                value={source || 'ALL'}
                onValueChange={(v) => {
                  setSource(v === 'ALL' ? '' : v);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All sources</SelectItem>
                  {SOURCE_FILTERS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s === 'DIRECT_SANRO' ? 'Direct SANRO' : s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-44">
              <Select
                value={institutionId || 'ALL'}
                onValueChange={(v) => {
                  setInstitutionId(v === 'ALL' ? '' : v);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All institutions</SelectItem>
                  {institutions.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-36">
              <Select
                value={status || 'ALL'}
                onValueChange={(v) => {
                  setStatus(v === 'ALL' ? '' : v);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All statuses</SelectItem>
                  <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                  <SelectItem value="DEACTIVATED">DEACTIVATED</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Reset
            </Button>
            <Button variant="ghost" size="icon" onClick={() => void refetch()} aria-label="Refresh">
              <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : error ? (
        <Card className="py-12 text-center">
          <p className="font-medium text-surface-800">Could not load parents</p>
          <p className="mt-1 text-sm text-surface-500">{(error as Error).message}</p>
          <Button className="mt-4" variant="outline" onClick={() => void refetch()}>Retry</Button>
        </Card>
      ) : rows.length === 0 ? (
        <Card className="py-16 text-center">
          <Users className="mx-auto h-12 w-12 text-surface-300" />
          <p className="mt-4 text-sm font-medium text-surface-500">No parents match your filters</p>
          <Button className="mt-4" variant="outline" onClick={resetFilters}>Reset filters</Button>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-surface-500">
                  <th className="px-4 py-3 font-medium">Parent</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Institution</th>
                  <th className="px-4 py-3 font-medium">Children</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-2 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const children = row.children ?? [];
                  return (
                    <tr key={row.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <p className="font-medium text-surface-900">
                          <a
                            href={`/app/people/parents/${row.id}`}
                            className="hover:text-brand-700 hover:underline"
                          >
                            {row.name}
                          </a>
                        </p>
                        <p className="text-xs text-surface-500">
                          {row.email ?? '—'}
                          {row.phone ? ` · ${row.phone}` : ''}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <SourceBadge source={row.source} />
                      </td>
                      <td className="px-4 py-3 text-surface-700">
                        {institutionOptions.get(row.institutionId ?? '') ?? row.institutionName ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-surface-700">
                        {children.length === 0 ? (
                          <span className="text-surface-400">0 children</span>
                        ) : (
                          <div className="space-y-1">
                            {children.map((c) => (
                              <div key={c.studentId} className="flex items-center gap-2">
                                <span className="text-surface-700">{c.studentName}</span>
                                <SourceBadge source={c.source} className="text-[9px]" />
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={cn('text-xs', STATUS_STYLES[row.status ?? ''] ?? 'bg-slate-100 text-slate-600')}>
                          {row.status ?? '—'}
                        </Badge>
                      </td>
                      <td className="px-2 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Actions">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem asChild>
                              <a href={`/app/people/parents/${row.id}`}>View details</a>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
            <p className="text-xs text-surface-500">
              Showing {(data?.total ?? 0) === 0 ? 0 : (page - 1) * pageSize + 1}–
              {Math.min(page * pageSize, data?.total ?? 0)} of {data?.total ?? 0}
            </p>
            <div className="flex items-center gap-3">
              <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 50, 100].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n} / page</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" disabled={page <= 1 || isLoading} onClick={() => setPage((p) => p - 1)} aria-label="Previous page">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium text-surface-700">{page}</span>
              <Button
                variant="outline"
                size="icon"
                disabled={isLoading || (data?.items?.length ?? 0) < pageSize}
                onClick={() => setPage((p) => p + 1)}
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}