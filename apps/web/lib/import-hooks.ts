'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

export type UploadResponse = {
  jobId: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  entityType: string;
  errors: string[];
  requiresCommit: boolean;
};

export type CommitResponse = {
  imported: number;
  duplicates: number;
  errors: string[];
};

export type ImportJob = {
  id: string;
  entityType: string;
  fileName: string;
  status: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  importedRows: number;
  duplicateRows: number;
  createdAt: string;
  createdBy: { name: string };
  _count: { rows: number };
};

export type AcademicYear = {
  id: string;
  institutionId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
};

export function useAcademicYears() {
  const token = useAuthStore((s) => s.token);
  return useQuery<AcademicYear[]>({
    queryKey: ['academic-years'],
    queryFn: () => api<AcademicYear[]>('/academics/academic-years', { token }),
    enabled: !!token,
  });
}

export function useImportUpload() {
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: async (data: { file: File; entityType: string; academicYearId: string; institutionId: string }) => {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('entityType', data.entityType);
      formData.append('academicYearId', data.academicYearId);
      formData.append('institutionId', data.institutionId);
      return api<UploadResponse>('/imports/upload', { method: 'POST', token, body: formData });
    },
  });
}

export function useImportCommit() {
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: (jobId: string) =>
      api<CommitResponse>(`/imports/${jobId}/commit`, { method: 'POST', token }),
  });
}

export function useImportHistory() {
  const token = useAuthStore((s) => s.token);
  return useQuery<ImportJob[]>({
    queryKey: ['import-history'],
    queryFn: () => api<ImportJob[]>('/imports', { token }),
    enabled: !!token,
  });
}
