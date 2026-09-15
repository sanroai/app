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
