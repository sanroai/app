'use client';

import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Building2,
  FileText,
  Upload,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common administrative tasks</CardDescription>
      </CardHeader>
      <div className="space-y-1 px-3 pb-6 pt-0">
        {ACTIONS.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="group flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-surface-50"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${action.tint}`}>
              <action.icon className="h-5 w-5" />
            </div>
            <span className="flex-1 text-sm font-medium text-surface-900">{action.label}</span>
            <ArrowRight className="h-4 w-4 text-surface-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-500" />
          </Link>
        ))}
      </div>
    </Card>
  );
}