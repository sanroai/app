'use client';

import { useState, useCallback, useRef } from 'react';
import { useImportUpload, useImportCommit, useImportHistory } from '@/lib/import-hooks';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  X,
  Loader2,
  Download,
  Users,
} from 'lucide-react';

const ENTITY_TYPES = [
  { value: 'STUDENTS', label: 'Students' },
  { value: 'TEACHERS', label: 'Teachers' },
] as const;

type ImportResult = {
  jobId: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  entityType: string;
  errors: string[];
};

type CommitResult = {
  imported: number;
  duplicates: number;
  errors: string[];
};

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [entityType, setEntityType] = useState<string>('STUDENTS');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [commitResult, setCommitResult] = useState<CommitResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useImportUpload();
  const commitMutation = useImportCommit();
  const { data: history } = useImportHistory();

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      const ext = dropped.name.split('.').pop()?.toLowerCase();
      if (ext === 'xlsx' || ext === 'csv' || ext === 'xls') {
        setFile(dropped);
      }
    }
  }, []);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  }

  function handleUpload() {
    if (!file) return;
    uploadMutation.mutate(
      { file, entityType, academicYearId: '' },
      {
        onSuccess: (data) => setResult(data),
      },
    );
  }

  function handleCommit() {
    if (!result?.jobId) return;
    commitMutation.mutate(result.jobId, {
      onSuccess: (data) => setCommitResult(data),
    });
  }

  function handleReset() {
    setFile(null);
    setResult(null);
    setCommitResult(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 flex items-center gap-2">
          <Upload className="h-6 w-6 text-brand-500" />
          Bulk Import
        </h1>
        <p className="text-surface-500 text-sm mt-1">
          Import students or teachers from an XLSX/CSV file
        </p>
      </div>

      {/* Commit success */}
      {commitResult && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900">Import Complete</p>
                <p className="text-sm text-green-700 mt-1">
                  {commitResult.imported} imported, {commitResult.duplicates} duplicates
                  {commitResult.errors.length > 0 && `, ${commitResult.errors.length} errors`}
                </p>
                {commitResult.errors.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {commitResult.errors.slice(0, 5).map((e, i) => (
                      <p key={i} className="text-xs text-red-600">{e}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload zone */}
      {!commitResult && (
        <Card>
          <CardHeader>
            <CardTitle>Upload File</CardTitle>
            <CardDescription>Select an XLSX or CSV file to import</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Entity type selector */}
            <div>
              <label className="text-sm font-medium text-surface-700 mb-2 block">Entity Type</label>
              <div className="flex gap-2">
                {ENTITY_TYPES.map((et) => (
                  <Button
                    key={et.value}
                    variant={entityType === et.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEntityType(et.value)}
                  >
                    <Users className="mr-1 h-4 w-4" />
                    {et.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 cursor-pointer transition-all ${
                dragOver
                  ? 'border-brand-500 bg-brand-50'
                  : file
                    ? 'border-green-300 bg-green-50'
                    : 'border-surface-300 hover:border-brand-400 hover:bg-surface-50'
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.csv,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              {file ? (
                <>
                  <FileSpreadsheet className="h-10 w-10 text-green-500 mb-2" />
                  <p className="font-medium text-surface-900">{file.name}</p>
                  <p className="text-sm text-surface-500 mt-1">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                  >
                    <X className="mr-1 h-4 w-4" />
                    Remove
                  </Button>
                </>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-surface-400 mb-2" />
                  <p className="font-medium text-surface-900">Drop your file here</p>
                  <p className="text-sm text-surface-500 mt-1">or click to browse</p>
                  <p className="text-xs text-surface-400 mt-2">Supports XLSX, XLS, CSV</p>
                </>
              )}
            </div>

            {/* Upload button */}
            <div className="flex justify-end gap-2">
              {result && (
                <Button variant="outline" onClick={handleReset}>
                  Reset
                </Button>
              )}
              <Button
                onClick={handleUpload}
                disabled={!file || uploadMutation.isPending}
              >
                {uploadMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Upload & Validate
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview / Results */}
      {result && !commitResult && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Validation Results</CardTitle>
                <CardDescription>
                  {result.totalRows} rows found in {result.entityType.toLowerCase()} file
                </CardDescription>
              </div>
              <Badge variant={result.invalidRows === 0 ? 'success' : 'warning'}>
                {result.validRows} valid, {result.invalidRows} invalid
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl bg-surface-50 p-4 text-center">
                <p className="text-2xl font-bold text-surface-900">{result.totalRows}</p>
                <p className="text-xs text-surface-500">Total Rows</p>
              </div>
              <div className="rounded-xl bg-green-50 p-4 text-center">
                <p className="text-2xl font-bold text-green-700">{result.validRows}</p>
                <p className="text-xs text-green-600">Valid</p>
              </div>
              <div className="rounded-xl bg-red-50 p-4 text-center">
                <p className="text-2xl font-bold text-red-700">{result.invalidRows}</p>
                <p className="text-xs text-red-600">Invalid</p>
              </div>
            </div>

            {/* Errors */}
            {result.errors.length > 0 && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                <p className="text-sm font-semibold text-red-900 mb-2 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  Validation Errors
                </p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {result.errors.map((err, i) => (
                    <p key={i} className="text-xs text-red-700">{err}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Commit button */}
            <div className="flex justify-end">
              <Button
                onClick={handleCommit}
                disabled={result.validRows === 0 || commitMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {commitMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Commit {result.validRows} Records
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import History */}
      {history && history.length > 0 && !commitResult && (
        <Card>
          <CardHeader>
            <CardTitle>Import History</CardTitle>
            <CardDescription>Recent import jobs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {history.slice(0, 5).map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between rounded-xl bg-surface-50 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-brand-100 flex items-center justify-center">
                      <FileSpreadsheet className="h-5 w-5 text-brand-600" />
                    </div>
                    <div>
                      <p className="font-medium text-surface-900 text-sm">{job.fileName}</p>
                      <p className="text-xs text-surface-500">
                        {job.entityType} · {job.totalRows} rows ·{' '}
                        {new Date(job.createdAt).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      job.status === 'COMMITTED'
                        ? 'success'
                        : job.status === 'VALIDATED'
                          ? 'warning'
                          : 'secondary'
                    }
                  >
                    {job.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
