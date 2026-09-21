'use client';

import Link from 'next/link';
import {
  BarChart3,
  BookOpen,
  Building2,
  FileText,
  Upload,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

type QuickAction = {
  label: string;
  href: string;
  icon: LucideIcon;
  tint: string;
};

const ACTIONS: QuickAction[] = [
  { label: 'Create Institution', href: '/app/institutions', icon: Building2, tint: 'bg-brand-100 text-brand-600' },
  { label: 'Add Student', href: '/app/people/students', icon: UserPlus, tint: 'bg-green-100 text-green-600' },
  { label: 'Content Ingest', href: '/app/content/ingest', icon: Upload, tint: 'bg-purple-100 text-purple-600' },
  { label: 'Question Papers', href: '/app/papers', icon: FileText, tint: 'bg-amber-100 text-amber-600' },
  { label: 'Curriculum', href: '/app/curriculum', icon: BookOpen, tint: 'bg-sky-100 text-sky-600' },
  { label: 'Reports', href: '/app/reports', icon: BarChart3, tint: 'bg-pink-100 text-pink-600' },
];

export function QuickActionsPanel() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Quick Actions</CardTitle>
      </CardHeader>
      <div className="grid grid-cols-3 gap-2 px-4 pb-4 pt-0">
        {ACTIONS.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="group flex items-center gap-2 rounded-lg border border-surface-100 px-3 py-2 text-xs font-medium text-surface-700 transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
          >
            <div className={`flex h-6 w-6 items-center justify-center rounded-md ${action.tint}`}>
              <action.icon className="h-3.5 w-3.5" />
            </div>
            <span className="truncate">{action.label}</span>
          </Link>
        ))}
      </div>
    </Card>
  );
}