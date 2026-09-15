'use client';

import { useState } from 'react';
import { useParents } from '@/lib/people-hooks';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner, ErrorBanner } from '@/components/ui';
import { Users, Mail, Phone, GraduationCap, ChevronDown, ChevronUp } from 'lucide-react';

export default function ParentsPage() {
  const { data: parents, isLoading, error } = useParents();

  if (isLoading) return <Spinner label="Loading parents…" />;
  if (error) return <ErrorBanner message={(error as Error).message} />;

  const list = parents ?? [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-surface-900">Parent Management</h1>
      </div>

      {list.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-surface-300" />
            <p className="mt-4 text-lg font-medium text-surface-600">No parents found</p>
            <p className="mt-1 text-sm text-surface-400">
              Parents will appear here once they are linked to students.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {list.map((parent) => (
            <ParentCard key={parent.id} parent={parent} />
          ))}
        </div>
      )}
    </div>
  );
}

function ParentCard({
  parent,
}: {
  parent: {
    id: string;
    name: string;
    email: string;
    phone: string;
    children: Array<{ studentId: string; studentName: string; grade: string }>;
  };
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white font-semibold text-sm">
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
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                PARENT
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-surface-500">
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
              <span className="text-surface-400">
                {(parent.children?.length ?? 0)} linked {(parent.children?.length ?? 0) === 1 ? 'child' : 'children'}
              </span>
            </div>
          </div>
          {(parent.children?.length ?? 0) > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="rounded-lg p-2 text-surface-400 hover:bg-surface-50 transition-colors"
            >
              {expanded ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>
          )}
        </div>

        {expanded && (parent.children?.length ?? 0) > 0 && (
          <div className="mt-4 rounded-xl bg-surface-50 p-4">
            <p className="text-xs font-medium text-surface-400 mb-2">Linked Children</p>
            <div className="space-y-2">
              {parent.children?.map((child) => (
                <div
                  key={child.studentId}
                  className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-sm"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700 text-xs font-semibold">
                    <GraduationCap className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-surface-900">{child.studentName}</p>
                    <p className="text-xs text-surface-400">Grade {child.grade}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
