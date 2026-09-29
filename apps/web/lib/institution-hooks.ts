'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiUrl } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import type {
  InstitutionListResponse,
  InstitutionDetail,
  InstitutionListItem,
  SubscriptionView,
  SubscriptionHistoryEntry,
  Plan,
  SuperAdminDashboard,
} from '@sanro/types';

function useToken() {
  return useAuthStore((s) => s.token);
}

export interface InstitutionQuery {
  search?: string;
  type?: string;
  status?: string;
  subscriptionStatus?: string;
  plan?: string;
  limitExceeded?: boolean;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface InstitutionUser {
  userId: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  status: string;
  isActive: boolean;
  joinedAt: string;
  lastLoginAt?: string | null;
}

export interface InstitutionUsersResponse {
  users: InstitutionUser[];
}

export interface PagedAuditRow {
  id: string;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  user?: { name: string; email: string } | null;
}

export interface InstitutionAuditResponse {
  total: number;
  page: number;
  pageSize: number;
  rows: PagedAuditRow[];
}

export interface AdminCreateInstitutionInput {
  name: string;
  type: string;
  code?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  website?: string;
  contactPerson?: string;
  primaryPhone?: string;
  primaryEmail?: string;
  seatLimit?: number;
  gracePeriodDays?: number;
  adminName?: string;
  adminEmail?: string;
  adminPhone?: string;
  adminPassword?: string;
  assignUserId?: string;
  status?: string;
  planKey?: string;
  startsAt?: string;
  endsAt?: string;
}

export interface AdminUpdateInstitutionInput {
  name?: string;
  type?: string;
  code?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  website?: string;
  contactPerson?: string;
  primaryPhone?: string;
  primaryEmail?: string;
  seatLimit?: number;
  gracePeriodDays?: number;
}

export interface SetSubscriptionInput {
  planKey: string;
  status?: string;
  startsAt?: string;
  endsAt?: string;
  seatLimit?: number;
  reason?: string;
}

export interface RenewSubscriptionInput {
  endDate: string;
  planKey?: string;
  seatLimit?: number;
  startsAt?: string;
  reason?: string;
}

// ---------- Queries ----------

export function useInstitutions(params: InstitutionQuery) {
  const token = useToken();
  const isSuperAdmin = useAuthStore((s) => s.user?.role === 'SUPER_ADMIN');
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set('search', params.search);
  if (params.type) searchParams.set('type', params.type);
  if (params.status) searchParams.set('status', params.status);
  if (params.subscriptionStatus) searchParams.set('subscriptionStatus', params.subscriptionStatus);
  if (params.plan) searchParams.set('plan', params.plan);
  if (params.limitExceeded != null) searchParams.set('limitExceeded', String(params.limitExceeded));
  if (params.from) searchParams.set('from', params.from);
  if (params.to) searchParams.set('to', params.to);
  if (params.page) searchParams.set('page', String(params.page));
  if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));
  if (params.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params.sortDir) searchParams.set('sortDir', params.sortDir);
  const qs = searchParams.toString();
  return useQuery<InstitutionListResponse>({
    queryKey: ['institutions', params],
    queryFn: () => api<InstitutionListResponse>(`/admin/institutions${qs ? `?${qs}` : ''}`, { token }),
    enabled: !!token && isSuperAdmin,
  });
}

export function useInstitutionDetail(id: string | null) {
  const token = useToken();
  return useQuery<InstitutionDetail>({
    queryKey: ['institutions', 'detail', id],
    queryFn: () => api<InstitutionDetail>(`/admin/institutions/${id}`, { token }),
    enabled: !!token && !!id,
  });
}

export function useInstitutionUsers(id: string | null) {
  const token = useToken();
  return useQuery<InstitutionUsersResponse>({
    queryKey: ['institutions', 'users', id],
    queryFn: () => api<InstitutionUsersResponse>(`/admin/institutions/${id}/users`, { token }),
    enabled: !!token && !!id,
  });
}

export function useInstitutionSubscriptionHistory(id: string | null) {
  const token = useToken();
  return useQuery<{ rows: SubscriptionHistoryEntry[] }>({
    queryKey: ['institutions', 'subscription-history', id],
    queryFn: () => api<{ rows: SubscriptionHistoryEntry[] }>(`/admin/institutions/${id}/subscription-history`, { token }),
    enabled: !!token && !!id,
  });
}

export function useInstitutionAudit(id: string | null, page = 1, pageSize = 25) {
  const token = useToken();
  return useQuery<InstitutionAuditResponse>({
    queryKey: ['institutions', 'audit', id, page, pageSize],
    queryFn: () =>
      api<InstitutionAuditResponse>(
        `/admin/institutions/${id}/audit?page=${page}&pageSize=${pageSize}`,
        { token },
      ),
    enabled: !!token && !!id,
  });
}

export function usePlans() {
  const token = useToken();
  return useQuery<Plan[]>({
    queryKey: ['admin', 'plans'],
    queryFn: () => api<Plan[]>('/admin/plans', { token }),
    enabled: !!token,
  });
}

export function useSuperAdminDashboard() {
  const token = useToken();
  return useQuery<SuperAdminDashboard>({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => api<SuperAdminDashboard>('/admin/dashboard', { token }),
    enabled: !!token,
  });
}

// ---------- Mutations ----------

function useInvalidate(keys: string[][]) {
  const qc = useQueryClient();
  return () => {
    for (const k of keys) void qc.invalidateQueries({ queryKey: k });
  };
}

export function useCreateInstitution() {
  const qc = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: (body: AdminCreateInstitutionInput) =>
      api<{ institution: InstitutionDetail }>('/admin/institutions', { method: 'POST', body, token }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['institutions'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
}

export function useUpdateInstitution(id: string) {
  const qc = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: (body: AdminUpdateInstitutionInput) =>
      api<{ institution: InstitutionDetail }>(`/admin/institutions/${id}`, { method: 'PATCH', body, token }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['institutions'] });
      void qc.invalidateQueries({ queryKey: ['institutions', 'detail', id] });
      void qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
}

function useInstitutionAction(id: string, path: string, keys: string[][]) {
  const qc = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: (body?: { reason?: string }) =>
      api<{ institution: InstitutionDetail }>(`/admin/institutions/${id}${path}`, { method: 'POST', body: body ?? {}, token }),
    onSuccess: () => {
      for (const k of keys) void qc.invalidateQueries({ queryKey: k });
    },
  });
}

export function useActivateInstitution(id: string) {
  return useInstitutionAction(id, '/activate', [['institutions'], ['admin', 'dashboard']]);
}
export function useSuspendInstitution(id: string) {
  return useInstitutionAction(id, '/suspend', [['institutions'], ['admin', 'dashboard']]);
}
export function useArchiveInstitution(id: string) {
  return useInstitutionAction(id, '/archive', [['institutions'], ['admin', 'dashboard']]);
}
export function useRestoreInstitution(id: string) {
  return useInstitutionAction(id, '/restore', [['institutions'], ['admin', 'dashboard']]);
}
export function useExpireInstitution(id: string) {
  return useInstitutionAction(id, '/expire', [['institutions'], ['admin', 'dashboard']]);
}

export function useSetSubscription(id: string) {
  const qc = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: (body: SetSubscriptionInput) =>
      api<{ subscription: SubscriptionView }>(`/admin/institutions/${id}/subscription`, {
        method: 'POST',
        body,
        token,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['institutions'] });
      void qc.invalidateQueries({ queryKey: ['institutions', 'detail', id] });
      void qc.invalidateQueries({ queryKey: ['institutions', 'subscription-history', id] });
      void qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
}

export function useRenewSubscription(id: string) {
  const qc = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: (body: RenewSubscriptionInput) =>
      api<{ subscription: SubscriptionView; previousExpiry: string | null; newExpiry: string }>(
        `/admin/institutions/${id}/subscription/renew`,
        { method: 'POST', body, token },
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['institutions'] });
      void qc.invalidateQueries({ queryKey: ['institutions', 'detail', id] });
      void qc.invalidateQueries({ queryKey: ['institutions', 'subscription-history', id] });
      void qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
}

export function useChangeUserLimit(id: string) {
  const qc = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: (body: { seatLimit: number; reason?: string }) =>
      api<{ seatLimit: number; usage: number; exceeded: boolean }>(`/admin/institutions/${id}/user-limit`, {
        method: 'PATCH',
        body,
        token,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['institutions'] });
      void qc.invalidateQueries({ queryKey: ['institutions', 'detail', id] });
      void qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
}

export function useChangeAdmin(id: string) {
  const qc = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: (body: { assignUserId?: string; adminEmail?: string; adminName?: string; reason?: string }) =>
      api<{ admin: { userId: string; name: string; email: string } }>(`/admin/institutions/${id}/admin`, {
        method: 'PATCH',
        body,
        token,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['institutions', 'detail', id] });
      void qc.invalidateQueries({ queryKey: ['institutions', 'users', id] });
    },
  });
}

function useRestrictUser(id: string, path: string) {
  const qc = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: (body: { userId: string; reason?: string }) =>
      api<{ ok: boolean }>(`/admin/institutions/${id}/users/${body.userId}/${path}`, {
        method: 'POST',
        body,
        token,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['institutions', 'users', id] });
      void qc.invalidateQueries({ queryKey: ['institutions', 'detail', id] });
    },
  });
}

export function useDisableInstitutionUser(id: string) {
  return useRestrictUser(id, 'disable');
}
export function useEnableInstitutionUser(id: string) {
  return useRestrictUser(id, 'enable');
}

export function downloadInstitutionsCsv(
  params: InstitutionQuery,
  token: string | null,
): Promise<string> {
  const searchParams = new URLSearchParams({ ...(params as Record<string, string>) });
  const qs = searchParams.toString();
  return fetch(`${apiUrl()}/admin/institutions/export${qs ? `?${qs}` : ''}`, {
    headers: { Authorization: `Bearer ${token ?? ''}` },
  }).then(async (res) => {
    if (!res.ok) throw new Error('Export failed');
    return res.blob().then((blob) => URL.createObjectURL(blob));
  });
}

export type { InstitutionListItem };