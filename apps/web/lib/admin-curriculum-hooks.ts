'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

function useToken() {
  return useAuthStore((s) => s.token);
}

export type NodeKind = 'boards' | 'grades' | 'subjects' | 'chapters' | 'topics' | 'concepts';

// ---------- Node list types (scoped curriculum endpoints) --------------------

export interface AdminBoardNode {
  id: string;
  name: string;
  code: string;
  active: boolean;
  createdAt?: string;
}

export interface AdminGradeNode {
  id: string;
  boardId: string;
  boardName: string;
  name: string;
  order: number;
}

export interface AdminSubjectNode {
  id: string;
  boardId: string;
  code: string;
  name: string;
  icon?: string | null;
  color?: string | null;
  order: number;
  description?: string | null;
  active: boolean;
}

export interface AdminChapterNode {
  id: string;
  subjectId: string;
  name: string;
  code: string;
  grade: string;
  order: number;
  description?: string | null;
}

export interface AdminTopicNode {
  id: string;
  chapterId: string;
  name: string;
  order: number;
  concepts?: Array<{ id: string; name: string; order: number }>;
}

export interface AdminConceptNode {
  id: string;
  topicId: string;
  name: string;
  order: number;
  description?: string | null;
}

export type CurriculumNode =
  | AdminBoardNode
  | AdminGradeNode
  | AdminSubjectNode
  | AdminChapterNode
  | AdminTopicNode
  | AdminConceptNode;

interface AdminTreeBoard {
  id: string;
  name: string;
  code: string;
  grades: Array<{ id: string; name: string; order: number }>;
}

// ---------- Node queries ------------------------------------------------------

export function useBoardNodes() {
  const token = useToken();
  return useQuery<AdminBoardNode[]>({
    queryKey: ['admin', 'curriculum', 'nodes', 'boards'],
    queryFn: () => api<AdminBoardNode[]>('/curriculum/boards', { token }),
    enabled: !!token,
  });
}

export function useGradeNodes() {
  const token = useToken();
  return useQuery<AdminGradeNode[]>({
    queryKey: ['admin', 'curriculum', 'nodes', 'grades'],
    queryFn: async () => {
      const tree = await api<AdminTreeBoard[]>('/admin/curriculum', { token });
      const rows: AdminGradeNode[] = [];
      for (const board of tree) {
        for (const grade of board.grades) {
          rows.push({ id: grade.id, boardId: board.id, boardName: board.name, name: grade.name, order: grade.order });
        }
      }
      return rows;
    },
    enabled: !!token,
  });
}

export function useSubjectNodes(boardId?: string, grade?: string) {
  const token = useToken();
  const q = new URLSearchParams();
  if (boardId) q.set('boardId', boardId);
  if (grade) q.set('grade', grade);
  const qs = q.toString();
  return useQuery<AdminSubjectNode[]>({
    queryKey: ['admin', 'curriculum', 'nodes', 'subjects', boardId, grade],
    queryFn: () => api<AdminSubjectNode[]>(`/curriculum/subjects?${qs}`, { token }),
    enabled: !!token && !!boardId,
  });
}

export function useChapterNodes(subjectId?: string) {
  const token = useToken();
  return useQuery<AdminChapterNode[]>({
    queryKey: ['admin', 'curriculum', 'nodes', 'chapters', subjectId],
    queryFn: () => api<AdminChapterNode[]>(`/curriculum/chapters?subjectId=${subjectId}`, { token }),
    enabled: !!token && !!subjectId,
  });
}

export function useTopicNodes(chapterId?: string) {
  const token = useToken();
  return useQuery<AdminTopicNode[]>({
    queryKey: ['admin', 'curriculum', 'nodes', 'topics', chapterId],
    queryFn: () => api<AdminTopicNode[]>(`/curriculum/topics?chapterId=${chapterId}`, { token }),
    enabled: !!token && !!chapterId,
  });
}

export function useConceptNodes(topicId?: string) {
  const token = useToken();
  return useQuery<AdminConceptNode[]>({
    queryKey: ['admin', 'curriculum', 'nodes', 'concepts', topicId],
    queryFn: () => api<AdminConceptNode[]>(`/curriculum/concepts?topicId=${topicId}`, { token }),
    enabled: !!token && !!topicId,
  });
}

export function useCurriculumNodes(kind: NodeKind, params: { boardId?: string; grade?: string; subjectId?: string; chapterId?: string; topicId?: string }) {
  const token = useToken();
  const enabled =
    !!token &&
    (kind === 'boards' ||
      kind === 'grades' ||
      (kind === 'subjects' && !!params.boardId) ||
      (kind === 'chapters' && !!params.subjectId) ||
      (kind === 'topics' && !!params.chapterId) ||
      (kind === 'concepts' && !!params.topicId));
  return useQuery<CurriculumNode[]>({
    queryKey: ['admin', 'curriculum', 'nodes', kind, params],
    queryFn: async () => {
      switch (kind) {
        case 'boards':
          return api<AdminBoardNode[]>('/curriculum/boards', { token });
        case 'grades':
          return flattenGrades(await api<AdminTreeBoard[]>('/admin/curriculum', { token }));
        case 'subjects': {
          const q = new URLSearchParams();
          q.set('boardId', params.boardId ?? '');
          if (params.grade) q.set('grade', params.grade);
          return api<AdminSubjectNode[]>(`/curriculum/subjects?${q.toString()}`, { token });
        }
        case 'chapters':
          return api<AdminChapterNode[]>(`/curriculum/chapters?subjectId=${params.subjectId}`, { token });
        case 'topics':
          return api<AdminTopicNode[]>(`/curriculum/topics?chapterId=${params.chapterId}`, { token });
        case 'concepts':
          return api<AdminConceptNode[]>(`/curriculum/concepts?topicId=${params.topicId}`, { token });
      }
    },
    enabled,
  });
}

function flattenGrades(tree: AdminTreeBoard[]): AdminGradeNode[] {
  const rows: AdminGradeNode[] = [];
  for (const board of tree) {
    for (const grade of board.grades) {
      rows.push({ id: grade.id, boardId: board.id, boardName: board.name, name: grade.name, order: grade.order });
    }
  }
  return rows;
}

// ---------- Node mutations ----------------------------------------------------

export function useUpdateCurriculumNode(kind: NodeKind) {
  const qc = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      api<CurriculumNode>(`/admin/curriculum/nodes/${kind}/${id}`, { method: 'PATCH', body, token }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'curriculum', 'nodes'] });
    },
  });
}

export function useCreateCurriculumNode(kind: NodeKind) {
  const qc = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api<CurriculumNode>(`/curriculum/${kind}`, { method: 'POST', body, token }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'curriculum', 'nodes'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'curriculum'] });
    },
  });
}

export function useDeleteCurriculumNode(kind: NodeKind) {
  const qc = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: (id: string) =>
      api<{ deleted: boolean; id: string }>(`/admin/curriculum/nodes/${kind}/${id}`, { method: 'DELETE', token }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'curriculum', 'nodes'] });
    },
  });
}

// ---------- Import wizard -----------------------------------------------------

export type ImportRowStatus = 'VALID' | 'INVALID' | 'DUPLICATE' | 'EXISTING';

export interface ImportSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  existingRows: number;
}

export interface ImportPreviewRow {
  rowNumber: number;
  status: ImportRowStatus;
  errors: string[];
  entity: string;
  type?: string;
  name?: string;
  code?: string;
  board?: string;
  grade?: string;
  subject?: string;
  chapter?: string;
  topic?: string;
  order?: string;
  description?: string;
}

export interface ImportPreviewResponse {
  jobId: string;
  fileName: string;
  summary: ImportSummary;
  previewRows: ImportPreviewRow[];
}

export interface ImportCommitResponse {
  committed: { created: number; updated: number; skipped: number };
  summary: ImportSummary;
}

export function useImportPreview() {
  const token = useToken();
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return api<ImportPreviewResponse>('/admin/curriculum/import/preview', { method: 'POST', body: form, token });
    },
  });
}

export function useImportDetail(jobId: string | null) {
  const token = useToken();
  return useQuery<ImportPreviewResponse>({
    queryKey: ['admin', 'curriculum', 'import', jobId],
    queryFn: () => api<ImportPreviewResponse>(`/admin/curriculum/import/${jobId}`, { token }),
    enabled: !!token && !!jobId,
  });
}

export function useCommitImport() {
  const token = useToken();
  return useMutation({
    mutationFn: (jobId: string) =>
      api<ImportCommitResponse>(`/admin/curriculum/import/${jobId}/commit`, { method: 'POST', token }),
  });
}

// ---------- Curriculum access grants ------------------------------------------

export interface CurriculumAccessRow {
  id: string;
  institutionId: string;
  boardId: string;
  grade: string | null;
  subjectId: string | null;
  createdAt: string;
  institution: { id: string; name: string; code: string };
  board: { id: string; name: string };
  subject: { id: string; name: string } | null;
}

export interface GrantAccessInput {
  institutionId: string;
  boardId: string;
  grade?: string;
  subjectId?: string;
}

export function useCurriculumAccess(institutionId?: string) {
  const token = useToken();
  const qs = institutionId ? `?institutionId=${encodeURIComponent(institutionId)}` : '';
  return useQuery<CurriculumAccessRow[]>({
    queryKey: ['admin', 'curriculum', 'access', institutionId],
    queryFn: () => api<CurriculumAccessRow[]>(`/admin/curriculum/access${qs}`, { token }),
    enabled: !!token,
  });
}

export function useGrantCurriculumAccess() {
  const qc = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: (body: GrantAccessInput) =>
      api<CurriculumAccessRow>('/admin/curriculum/access', {
        method: 'POST',
        body: {
          institutionId: body.institutionId,
          boardId: body.boardId,
          grade: body.grade || null,
          subjectId: body.subjectId || null,
        },
        token,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'curriculum', 'access'] });
    },
  });
}

export function useRevokeCurriculumAccess() {
  const qc = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: (id: string) =>
      api<{ deleted: boolean }>(`/admin/curriculum/access/${id}`, { method: 'DELETE', token }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'curriculum', 'access'] });
    },
  });
}