'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import {
  useImportPreview,
  useCommitImport,
  type ImportPreviewResponse,
  type ImportRowStatus,
} from '@/lib/admin-curriculum-hooks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  Upload,
  X,
} from 'lucide-react';
import { cn } from '@/lib/cn';

const NODE_KINDS = ['boards', 'grades', 'subjects', 'chapters', 'topics', 'concepts'] as const;

const STATUS_STYLES: Record<ImportRowStatus, string> = {
  VALID: 'bg-green-100 text-green-700 border-green-200',
  INVALID: 'bg-red-100 text-red-700 border-red-200',
  DUPLICATE: 'bg-amber-100 text-amber-700 border-amber-200',
  EXISTING: 'bg-sky-100 text-sky-700 border-sky-200',
};

const ENTITY_LABELS: Record<string, string> = {
  BOARD: 'Board',
  GRADE: 'Grade',
  SUBJECT: 'Subject',
  CHAPTER: 'Chapter',
  TOPIC: 'Topic',
  CONCEPT: 'Concept',
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['csv', 'xlsx', 'xls'];

function validateFile(file: File): string | null {
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) return 'Only CSV/XLSX/XLS files are allowed.';
  if (file.size > MAX_FILE_SIZE) return 'File exceeds the 10MB limit.';
  return null;
}

function SummaryChip({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border px-5 py-3">
      <span className="text-2xl font-bold text-surface-900">{value}</span>
      <span className="text-xs font-medium uppercase tracking-wide text-surface-500">{label}</span>
      {className ? <span className={cn('h-1 w-8 rounded-full', className)} /> : null}
    </div>
  );
}

export default function CurriculumImportPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null);
  const [commitError, setCommitError] = useState<string | null>(null);

  const previewMutation = useImportPreview();
  const commitMutation = useCommitImport();

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) {
      router.replace('/login');
    } else if (user.role !== 'SUPER_ADMIN') {
      router.replace('/app');
    }
  }, [hasHydrated, user, router]);

  if (!hasHydrated || !user) return null;
  if (user.role !== 'SUPER_ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
        <p className="font-medium text-surface-800">Access restricted</p>
        <p className="mt-1 text-sm text-surface-500">Only SUPER_ADMIN can import curriculum data.</p>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    setPreview(null);
    setCommitError(null);
    if (!selected) {
      setFile(null);
      setFileError(null);
      return;
    }
    const error = validateFile(selected);
    if (error) {
      setFile(null);
      setFileError(error);
      return;
    }
    setFile(selected);
    setFileError(null);
  };

  const handlePreview = () => {
    if (!file) return;
    setCommitError(null);
    previewMutation.mutate(file, {
      onSuccess: (data) => setPreview(data),
    });
  };

  const handleCommit = () => {
    if (!preview) return;
    setCommitError(null);
    commitMutation.mutate(preview.jobId, {
      onError: (err) => setCommitError(err instanceof Error ? err.message : 'Commit failed'),
    });
  };

  const handleReset = () => {
    setFile(null);
    setFileError(null);
    setPreview(null);
    setCommitError(null);
    previewMutation.reset();
    commitMutation.reset();
  };

  const previewError = previewMutation.error;
  const summary = preview?.summary;
  const committed = commitMutation.data?.committed;
  const invalidCount = summary?.invalidRows ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Curriculum Import</h1>
          <p className="mt-1 text-sm text-surface-500">Upload a CSV/XLSX file of boards, grades, subjects, chapters, topics and concepts. Preview the parsed rows, then commit valid ones.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-2 text-surface-800">
              <FileSpreadsheet className="h-5 w-5 text-brand-600" />
              <p className="font-semibold">Step 1 — Upload file</p>
            </div>
            <div className="space-y-2">
              <Input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} />
              {file ? (
                <div className="flex items-center justify-between rounded-xl border border-surface-200 bg-surface-50 px-3 py-2 text-sm">
                  <span className="truncate font-medium text-surface-800">{file.name}</span>
                  <span className="ml-2 shrink-0 text-xs text-surface-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              ) : null}
              {fileError ? (
                <p className="text-sm text-red-600">{fileError}</p>
              ) : null}
              {previewError ? (
                <p className="text-sm text-red-600">{previewError.message}</p>
              ) : null}
            </div>
            <div className="flex gap-2">
              <Button onClick={handlePreview} disabled={!file || previewMutation.isPending}>
                {previewMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Preview import
              </Button>
              {(file || preview) ? (
                <Button variant="outline" onClick={handleReset}>
                  <X className="h-4 w-4" />
                  Reset
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center gap-2 text-surface-800">
              <CheckCircle2 className="h-5 w-5 text-brand-600" />
              <p className="font-semibold">File format</p>
            </div>
            <p className="text-sm text-surface-600">
              First row must be headers. Supported columns:{' '}
              <code className="rounded bg-surface-100 px-1.5 py-0.5 text-xs">type</code>,{' '}
              <code className="rounded bg-surface-100 px-1.5 py-0.5 text-xs">name</code>,{' '}
              <code className="rounded bg-surface-100 px-1.5 py-0.5 text-xs">code</code>,{' '}
              <code className="rounded bg-surface-100 px-1.5 py-0.5 text-xs">board</code>,{' '}
              <code className="rounded bg-surface-100 px-1.5 py-0.5 text-xs">grade</code>,{' '}
              <code className="rounded bg-surface-100 px-1.5 py-0.5 text-xs">subject</code>,{' '}
              <code className="rounded bg-surface-100 px-1.5 py-0.5 text-xs">chapter</code>,{' '}
              <code className="rounded bg-surface-100 px-1.5 py-0.5 text-xs">topic</code>,{' '}
              <code className="rounded bg-surface-100 px-1.5 py-0.5 text-xs">order</code>,{' '}
              <code className="rounded bg-surface-100 px-1.5 py-0.5 text-xs">description</code>.
            </p>
            <p className="text-sm text-surface-600">
              <code className="rounded bg-surface-100 px-1.5 py-0.5 text-xs">type</code> must be one of{' '}
              {NODE_KINDS.map((k) => k.slice(0, -1).toUpperCase()).join(', ')}. Nested rows reference parents by name or code, e.g. a chapter row needs the subject it belongs to.
            </p>
          </CardContent>
        </Card>
      </div>

      {preview ? (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <SummaryChip label="Total" value={summary?.totalRows ?? 0} className="" />
            <SummaryChip label="Valid" value={summary?.validRows ?? 0} className="bg-green-500" />
            <SummaryChip label="Invalid" value={summary?.invalidRows ?? 0} className="bg-red-500" />
            <SummaryChip label="Duplicates" value={summary?.duplicateRows ?? 0} className="bg-amber-500" />
            <SummaryChip label="Already exist" value={summary?.existingRows ?? 0} className="bg-sky-500" />
          </div>

          {invalidCount > 0 ? (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                {invalidCount} row{invalidCount === 1 ? ' has' : 's have'} errors and will be skipped on commit. Only rows marked VALID are committed.
              </p>
            </div>
          ) : null}

          {committed ? (
            <div className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Import committed — <strong>{committed.created}</strong> created, <strong>{committed.updated}</strong> updated, <strong>{committed.skipped}</strong> skipped.
              </p>
            </div>
          ) : null}

          {commitError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {commitError}
            </div>
          ) : null}

          <Card>
            <div className="flex items-center justify-between border-b border-surface-200 px-4 py-3">
              <p className="text-sm font-medium text-surface-800">{preview.fileName} — first {preview.previewRows.length} rows</p>
              {!committed && !commitMutation.isPending ? (
                <Button onClick={handleCommit} variant={invalidCount > 0 ? 'warning' : 'default'} disabled={commitMutation.isPending || (summary?.validRows ?? 0) === 0}>
                  {commitMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Commit import
                </Button>
              ) : null}
              {commitMutation.isPending ? (
                <span className="inline-flex items-center gap-2 text-sm text-surface-500">
                  <Loader2 className="h-4 w-4 animate-spin" /> Committing…
                </span>
              ) : null}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead>
                  <tr className="border-b border-surface-200 text-xs uppercase tracking-wide text-surface-500">
                    <th className="px-4 py-3 font-medium">Row</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Entity</th>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Code</th>
                    <th className="px-4 py-3 font-medium">Board</th>
                    <th className="px-4 py-3 font-medium">Grade</th>
                    <th className="px-4 py-3 font-medium">Subject</th>
                    <th className="px-4 py-3 font-medium">Chapter</th>
                    <th className="px-4 py-3 font-medium">Topic</th>
                    <th className="px-4 py-3 font-medium">Order</th>
                    <th className="px-4 py-3 font-medium">Errors</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.previewRows.map((row) => (
                    <tr
                      key={row.rowNumber}
                      className={cn(
                        'border-b border-surface-100 last:border-0',
                        row.status === 'INVALID' ? 'bg-red-50/60' : 'hover:bg-surface-50/70',
                      )}
                    >
                      <td className="px-4 py-3 text-surface-500">{row.rowNumber}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={cn('text-xs', STATUS_STYLES[row.status] ?? 'bg-surface-100 text-surface-500')}>
                          {row.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-surface-700">{row.entity ? ENTITY_LABELS[row.entity] ?? row.entity : '—'}</td>
                      <td className="px-4 py-3 font-medium text-surface-900">{row.name || '—'}</td>
                      <td className="px-4 py-3 text-surface-700">{row.code || '—'}</td>
                      <td className="px-4 py-3 text-surface-700">{row.board || '—'}</td>
                      <td className="px-4 py-3 text-surface-700">{row.grade || '—'}</td>
                      <td className="px-4 py-3 text-surface-700">{row.subject || '—'}</td>
                      <td className="px-4 py-3 text-surface-700">{row.chapter || '—'}</td>
                      <td className="px-4 py-3 text-surface-700">{row.topic || '—'}</td>
                      <td className="px-4 py-3 text-surface-700">{row.order ?? '—'}</td>
                      <td className="px-4 py-3">
                        {row.errors && row.errors.length > 0 ? (
                          <ul className="list-disc space-y-0.5 pl-4 text-xs text-red-600">
                            {row.errors.map((err, i) => (
                              <li key={i}>{err}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-xs text-surface-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}