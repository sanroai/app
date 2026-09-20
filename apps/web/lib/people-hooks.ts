'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

function useToken() {
  return useAuthStore((s) => s.token);
}

export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  rollNumber: string;
  grade: string;
  status: string;
  group?: { id: string; name: string };
  user?: { id: string; name: string; email: string };
}

export interface StudentsResponse {
  students: Student[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Teacher {
  id: string;
  userId: string;
  employeeId: string;
  status: string;
  user: { id: string; name: string; email: string; phone: string };
  subjects: Array<{ id: string; name: string }>;
  groups: Array<{ id: string; name: string }>;
}

export interface Parent {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  children: Array<{ studentId: string; studentName: string; grade: string }>;
}

export function useStudents(params: {
  search?: string;
  status?: string;
  page?: number;
  groupId?: string;
}) {
  const token = useToken();
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set('search', params.search);
  if (params.status) searchParams.set('status', params.status);
  if (params.page) searchParams.set('page', String(params.page));
  if (params.groupId) searchParams.set('groupId', params.groupId);
  const qs = searchParams.toString();
  return useQuery<StudentsResponse>({
    queryKey: ['students', params],
    queryFn: () => api<StudentsResponse>(`/students${qs ? `?${qs}` : ''}`, { token }),
    enabled: !!token,
  });
}

export function useStudentDetail(id: string | null) {
  const token = useToken();
  return useQuery<Student>({
    queryKey: ['student', id],
    queryFn: () => api<Student>(`/students/${id}`, { token }),
    enabled: !!token && !!id,
  });
}

export function useDeactivateStudent() {
  const queryClient = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/students/${id}/deactivate`, { method: 'POST', token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

export function useActivateStudent() {
  const queryClient = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/students/${id}/activate`, { method: 'POST', token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

export function useTeachers() {
  const token = useToken();
  return useQuery<Teacher[]>({
    queryKey: ['teachers'],
    queryFn: () => api<Teacher[]>('/teachers', { token }),
    enabled: !!token,
  });
}

export function useParents() {
  const token = useToken();
  return useQuery<Parent[]>({
    queryKey: ['parents'],
    queryFn: () => api<Parent[]>('/parents', { token }),
    enabled: !!token,
  });
}

// ---- Super-admin People (apps/web/app/people) --------------------------------
// Target endpoints under POST/GET /admin/people/* (see docs/PEOPLE_MANAGEMENT_CONTRACT.md §5).

export type PeopleSource = 'INSTITUTION' | 'DIRECT_SANRO';

export interface AdminPagedMeta {
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminAuditRow {
  id: string;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  user?: { name: string; email: string } | null;
}

export interface AdminDirectSubscription {
  id?: string;
  planKey?: string | null;
  planName?: string | null;
  status?: string | null;
  startedAt?: string | null;
  endsAt?: string | null;
}

export interface AdminLinkedChild {
  studentId: string;
  studentName: string;
  grade?: string | null;
  institutionId?: string | null;
  institutionName?: string | null;
  source?: PeopleSource | null;
  status?: string | null;
}

// ---- Students ---------------------------------------------------------------

export interface AdminStudentListItem {
  id: string;
  userId?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  rollNumber?: string | null;
  grade?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  status?: string | null;
  isActive?: boolean;
  source?: PeopleSource | null;
  institutionId?: string | null;
  institutionName?: string | null;
  academicYearId?: string | null;
  subscriptionStatus?: string | null;
  subscription?: AdminDirectSubscription | null;
  createdAt?: string | null;
}

export interface AdminStudentsResponse extends AdminPagedMeta {
  items: AdminStudentListItem[];
}

export interface AdminStudentDetail extends AdminStudentListItem {
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    isActive: boolean;
    createdAt?: string | null;
  } | null;
  institution?: {
    id: string;
    name: string;
    type?: string;
    status?: string;
  } | null;
  academicYear?: {
    id: string;
    name: string;
  } | null;
  groups?: Array<{ id: string; name: string; type?: string; status?: string }>;
  parents?: Array<{
    id: string;
    userId?: string | null;
    name: string;
    email?: string | null;
    phone?: string | null;
    source?: PeopleSource | null;
    institutionId?: string | null;
    institutionName?: string | null;
    childrenCount?: number;
  }>;
  directSubscription?: AdminDirectSubscription | null;
  subscriptions?: Array<{
    id: string;
    planKey?: string | null;
    planName?: string | null;
    status?: string | null;
    startedAt?: string | null;
    endsAt?: string | null;
  }>;
  assessmentAttemptsCount?: number;
  recentAudit?: AdminAuditRow[];
}

export interface AdminStudentQuery {
  source?: string;
  institutionId?: string;
  status?: string;
  grade?: string;
  subscriptionStatus?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

// ---- Teachers ---------------------------------------------------------------

export interface AdminTeacherListItem {
  id: string;
  userId?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  employeeId?: string | null;
  status?: string | null;
  isActive?: boolean;
  institutionId?: string | null;
  institutionName?: string | null;
  subjects?: Array<{ id: string; name: string }>;
  groups?: Array<{ id: string; name: string }>;
  createdAt?: string | null;
}

export interface AdminTeachersResponse extends AdminPagedMeta {
  items: AdminTeacherListItem[];
}

export interface AdminTeacherDetail extends AdminTeacherListItem {
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    isActive: boolean;
    createdAt?: string | null;
  } | null;
  institution?: {
    id: string;
    name: string;
    type?: string;
    status?: string;
  } | null;
  academicYearId?: string | null;
  recentAudit?: AdminAuditRow[];
}

export interface AdminTeacherQuery {
  institutionId?: string;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

// ---- Parents ----------------------------------------------------------------

export interface AdminParentListItem {
  id: string;
  userId?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  status?: string | null;
  isActive?: boolean;
  source?: PeopleSource | null;
  institutionId?: string | null;
  institutionName?: string | null;
  childrenCount?: number;
  children?: AdminLinkedChild[];
  createdAt?: string | null;
}

export interface AdminParentsResponse extends AdminPagedMeta {
  items: AdminParentListItem[];
}

export interface AdminParentDetail extends AdminParentListItem {
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    isActive: boolean;
    createdAt?: string | null;
  } | null;
  institution?: {
    id: string;
    name: string;
    type?: string;
    status?: string;
  } | null;
  recentAudit?: AdminAuditRow[];
}

export interface AdminParentQuery {
  source?: string;
  institutionId?: string;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

// ---- Query builders ---------------------------------------------------------

function toQueryString(params: object): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const v = value as string | number | boolean | null | undefined;
    if (v === undefined || v === null || v === '') continue;
    sp.set(key, String(v));
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

// ---- Students queries/mutations ----------------------------------------------

export function useAdminStudents(params: AdminStudentQuery) {
  const token = useToken();
  const qs = toQueryString(params);
  return useQuery<AdminStudentsResponse>({
    queryKey: ['admin', 'people', 'students', params],
    queryFn: () => api<AdminStudentsResponse>(`/admin/people/students${qs}`, { token }),
    enabled: !!token,
  });
}

export function useAdminStudentDetail(id: string | null) {
  const token = useToken();
  return useQuery<AdminStudentDetail>({
    queryKey: ['admin', 'people', 'students', 'detail', id],
    queryFn: () => api<AdminStudentDetail>(`/admin/people/students/${id}`, { token }),
    enabled: !!token && !!id,
  });
}

export function useAdminStudentSearch(query: string) {
  const token = useToken();
  return useQuery<Array<{ id: string; name: string; email?: string | null; grade?: string | null; institutionId?: string | null; source?: string | null }>>({
    queryKey: ['admin', 'people', 'students', 'search', query],
    queryFn: () => api(`/admin/people/students/search?search=${encodeURIComponent(query)}`, { token }),
    enabled: !!token && query.trim().length > 0,
  });
}

function useAdminStudentAction(id: string | null, path: string) {
  const qc = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: (body?: Record<string, unknown>) =>
      api<{ ok: boolean }>(`/admin/people/students/${id}${path}`, { method: 'POST', body: body ?? {}, token }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'people', 'students'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'people', 'students', 'detail', id] });
      void qc.invalidateQueries({ queryKey: ['admin', 'people', 'students', 'search'] });
    },
  });
}

export function useDisableAdminStudent(id: string) {
  return useAdminStudentAction(id, '/disable');
}
export function useEnableAdminStudent(id: string) {
  return useAdminStudentAction(id, '/enable');
}
export function useTransferAdminStudent(id: string) {
  return useAdminStudentAction(id, '/transfer');
}

export function useSetDirectSubscription(id: string) {
  const qc = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: (body: { planKey: string; status: string; startsAt?: string; endsAt?: string; reason?: string }) =>
      api<{ subscription: AdminDirectSubscription }>(`/admin/people/students/${id}/direct-subscription`, {
        method: 'POST',
        body,
        token,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'people', 'students'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'people', 'students', 'detail', id] });
    },
  });
}

// ---- Teachers queries/mutations ----------------------------------------------

export function useAdminTeachers(params: AdminTeacherQuery) {
  const token = useToken();
  const qs = toQueryString(params);
  return useQuery<AdminTeachersResponse>({
    queryKey: ['admin', 'people', 'teachers', params],
    queryFn: () => api<AdminTeachersResponse>(`/admin/people/teachers${qs}`, { token }),
    enabled: !!token,
  });
}

export function useAdminTeacherDetail(id: string | null) {
  const token = useToken();
  return useQuery<AdminTeacherDetail>({
    queryKey: ['admin', 'people', 'teachers', 'detail', id],
    queryFn: () => api<AdminTeacherDetail>(`/admin/people/teachers/${id}`, { token }),
    enabled: !!token && !!id,
  });
}

function useAdminTeacherAction(id: string | null, path: string) {
  const qc = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: (body?: Record<string, unknown>) =>
      api<{ ok: boolean }>(`/admin/people/teachers/${id}${path}`, { method: 'POST', body: body ?? {}, token }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'people', 'teachers'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'people', 'teachers', 'detail', id] });
    },
  });
}

export function useDisableAdminTeacher(id: string) {
  return useAdminTeacherAction(id, '/disable');
}
export function useEnableAdminTeacher(id: string) {
  return useAdminTeacherAction(id, '/enable');
}
export function useTransferAdminTeacher(id: string) {
  return useAdminTeacherAction(id, '/transfer');
}

// ---- Parents queries/mutations -----------------------------------------------

export function useAdminParents(params: AdminParentQuery) {
  const token = useToken();
  const qs = toQueryString(params);
  return useQuery<AdminParentsResponse>({
    queryKey: ['admin', 'people', 'parents', params],
    queryFn: () => api<AdminParentsResponse>(`/admin/people/parents${qs}`, { token }),
    enabled: !!token,
  });
}

export function useAdminParentDetail(id: string | null) {
  const token = useToken();
  return useQuery<AdminParentDetail>({
    queryKey: ['admin', 'people', 'parents', 'detail', id],
    queryFn: () => api<AdminParentDetail>(`/admin/people/parents/${id}`, { token }),
    enabled: !!token && !!id,
  });
}

function useAdminParentAction(id: string | null, path: string) {
  const qc = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: (body?: Record<string, unknown>) =>
      api<{ ok: boolean }>(`/admin/people/parents/${id}${path}`, { method: 'POST', body: body ?? {}, token }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'people', 'parents'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'people', 'parents', 'detail', id] });
    },
  });
}

export function useDisableAdminParent(id: string) {
  return useAdminParentAction(id, '/disable');
}
export function useEnableAdminParent(id: string) {
  return useAdminParentAction(id, '/enable');
}
