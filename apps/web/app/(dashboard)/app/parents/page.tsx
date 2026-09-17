'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useParents } from '@/lib/people-hooks';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Spinner, ErrorBanner } from '@/components/ui';
import { Users, Mail, Phone, GraduationCap, UserPlus, Search } from 'lucide-react';

export default function ParentsPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'INSTITUTION_ADMIN' || user?.role === 'SUPER_ADMIN';

  if (!isAdmin) {
    return (
      <div className="text-center py-12 text-surface-500">
        You do not have permission to view this page.
      </div>
    );
  }

  return <ParentsList />;
}

function ParentsList() {
  const [search, setSearch] = useState('');
  const { data: parents, isLoading, error } = useParents();

  if (isLoading) return <Spinner label="Loading parents…" />;
  if (error) return <ErrorBanner message={(error as Error).message} />;

  const list = (parents ?? []).filter((p) =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase()) ||
    p.phone?.includes(search)
  );

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-surface-900">Parent Management</h1>
        <Button asChild>
          <Link href="/app/parents/new">
            <UserPlus className="h-4 w-4" />
            Add Parent
          </Link>
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
          <Input
            placeholder="Search parents by name, email, or phone…"
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {list.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-surface-300" />
            <p className="mt-4 text-lg font-medium text-surface-600">No parents found</p>
            <p className="mt-1 text-sm text-surface-400">
              {search ? 'Try adjusting your search.' : 'Parents will appear here once they are linked to students.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {list.map((parent) => (
            <Card key={parent.id} className="cursor-default">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white font-semibold text-sm">
                  {parent.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-surface-900 truncate">{parent.name}</h2>
                    <span className="inline-flex items-center rounded-full bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-700">
                      PARENT
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-surface-500">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" />
                      {parent.email}
                    </span>
                    {parent.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" />
                        {parent.phone}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-surface-400">
                      <GraduationCap className="h-3.5 w-3.5" />
                      {(parent.children?.length ?? 0)} linked {(parent.children?.length ?? 0) === 1 ? 'child' : 'children'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
