'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

export type SuperAdminRange = 'today' | '7d' | '30d' | 'month';

export type SuperAdminOverview = {
  range: SuperAdminRange;
  generatedAt: string;
  institutions: {
    total: number;
    active: number;
    suspended: number;
    expiringSoon: number;
    systemCount: number;
    newInRange?: number;
  };
  users: { total: number; newInRange: number };
  students: { active: number; newInRange: number };
  assessments: { total: number; conductedInRange: number; gradedInRange: number };
  seats: { used: number; capacity: number; utilizationPct: number };
};

export type InstitutionHealthRow = {
  id: string;
  name: string;
  type: string;
  status: string;
  isSystemInstitution: boolean;
  memberCount: number;
  studentCount: number;
  teacherCount: number;
  parentCount: number;
  seatLimit: number | null;
  seatsUsed: number;
  planKey: string | null;
  planName: string | null;
  subscriptionStatus: string | null;
  nextRenewalAt: string | null;
  lastActivityAt: string | null;
  attention: string[];
};

export type SuperAdminHealth = {
  range: SuperAdminRange;
  generatedAt: string;
  rows: InstitutionHealthRow[];
};

export type AttentionItem = {
  id: string;
  name: string;
  type: string;
  status: string;
};

export type SuperAdminAttention = {
  expiringSoon: AttentionItem[];
  suspended: AttentionItem[];
  expired: AttentionItem[];
  overSeatLimit: AttentionItem[];
  pastDue: AttentionItem[];
  noSubscription: AttentionItem[];
};

export type ActivityItem = {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  actorEmail: string;
  actorName: string | null;
  institutionId: string | null;
  institutionName: string | null;
  createdAt: string;
  metadata: Record<string, unknown> | null;
};

export type SuperAdminActivity = {
  limit: number;
  range: SuperAdminRange;
  generatedAt?: string;
  items: ActivityItem[];
};

function useToken() {
  return useAuthStore((s) => s.token);
}

function useAuthedQuery<T>(key: unknown[], path: string, enabled = true) {
  const token = useToken();
  return useQuery<T>({
    queryKey: key,
    queryFn: () => api<T>(path, { token }),
    enabled: enabled && !!token,
  });
}

export function useSuperAdminOverview(range: SuperAdminRange) {
  return useAuthedQuery<SuperAdminOverview>(
    ['super-admin', 'overview', range],
    `/admin/super-admin/dashboard/overview?range=${range}`,
  );
}

export function useSuperAdminHealth(range: SuperAdminRange, includeSystem: boolean) {
  return useAuthedQuery<SuperAdminHealth>(
    ['super-admin', 'health', range, includeSystem],
    `/admin/super-admin/dashboard/health?range=${range}&includeSystem=${includeSystem}`,
  );
}

export function useSuperAdminAttention() {
  return useAuthedQuery<SuperAdminAttention>(
    ['super-admin', 'attention'],
    '/admin/super-admin/dashboard/attention',
  );
}

export function useSuperAdminActivity(range: SuperAdminRange, limit = 20) {
  return useAuthedQuery<SuperAdminActivity>(
    ['super-admin', 'activity', range, limit],
    `/admin/super-admin/dashboard/activity?limit=${limit}&range=${range}`,
  );
}

export function formatRelative(iso?: string | null): string {
  if (!iso) return 'Never';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function humanizeCode(value: string | null | undefined): string {
  if (!value) return '—';
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim();
}