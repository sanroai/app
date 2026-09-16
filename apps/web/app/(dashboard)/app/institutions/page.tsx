'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Spinner, ErrorBanner } from '@/components/ui';
import { GraduationCap, Users, Search, Plus, Building2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

type Institution = {
  id: string;
  name: string;
  code: string;
  status: string;
  city?: string;
  state?: string;
  seatLimit?: number;
  _count: { students: number; teachers: number };
  subscriptions: { planKey: string; status: string }[];
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  SUSPENDED: 'bg-red-100 text-red-700',
  ARCHIVED: 'bg-slate-100 text-slate-600',
};

export default function InstitutionsPage() {
  const token = useAuthStore((s) => s.token);
  const [search, setSearch] = useState('');
  const { data, isLoading, error } = useQuery<Institution[]>({
    queryKey: ['admin', 'institutions', search],
    queryFn: () => api<Institution[]>(`/admin/institutions${search ? `?search=${encodeURIComponent(search)}` : ''}`, { token }),
    enabled: !!token,
  });

  if (isLoading) return <Spinner label="Loading institutions..." />;
  if (error) return <ErrorBanner message={(error as Error).message} />;

  const institutions = data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Institutions</h1>
          <p className="mt-1 text-sm text-surface-500">{institutions.length} institutions registered</p>
        </div>
        <Button className="bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-700 hover:to-purple-700">
          <Plus className="mr-2 h-4 w-4" />
          Add Institution
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
        <Input
          placeholder="Search institutions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {institutions.length === 0 ? (
        <Card className="py-16 text-center">
          <Building2 className="mx-auto h-12 w-12 text-surface-300" />
          <p className="mt-4 text-sm font-medium text-surface-500">No institutions found</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {institutions.map((inst) => (
            <Card key={inst.id} className="group cursor-pointer hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600">
                    <GraduationCap className="h-6 w-6 text-white" />
                  </div>
                  <Badge className={cn('text-xs', STATUS_COLORS[inst.status] ?? 'bg-slate-100 text-slate-600')}>
                    {inst.status}
                  </Badge>
                </div>
                <h3 className="mt-4 font-bold text-surface-900 group-hover:text-brand-700 transition-colors">{inst.name}</h3>
                <p className="text-xs text-surface-500 mt-1">{inst.code}{inst.city ? ` · ${inst.city}` : ''}</p>
                <div className="mt-4 flex items-center gap-4 text-sm text-surface-600">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {inst._count.students} students
                  </span>
                  <span>{inst._count.teachers} teachers</span>
                </div>
                {inst.subscriptions.length > 0 && (
                  <div className="mt-3">
                    <Badge variant="secondary" className="text-xs">{inst.subscriptions[0].planKey}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
