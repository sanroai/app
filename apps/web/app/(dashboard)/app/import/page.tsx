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
  UserPlus,
  GraduationCap,
} from 'lucide-react';

const ENTITY_TYPES = [
  { value: 'STUDENTS', label: 'Students', icon: GraduationCap },
  { value: 'TEACHERS', label: 'Teachers', icon: UserPlus },
  { value: 'PARENTS', label: 'Parents', icon: Users },
] as const;

const SAMPLE_FILES: Record<string, { filename: string; columns: string }> = {
  STUDENTS: {
    filename: 'sample-students.csv',
    columns: 'name, email, phone, rollNumber, parentName, parentPhone, grade',
  },
  TEACHERS: {
    filename: 'sample-teachers.csv',
    columns: 'name, email, phone, employeeId',
  },
  PARENTS: {
    filename: 'sample-parents.csv',
    columns: 'name, email, phone',
  },
};

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
  const [showConfirm, setShowConfirm] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useImportUpload();
  const commitMutation = useImportCommit();
  const { data: history, isLoading: historyLoading } = useImportHistory();

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      const ext = dropped.name.split('.').pop()?.toLowerCase();
      if (ext === 'xlsx' || ext === 'csv' || ext === 'xls') {
        setFile(dropped);
        setUploadError(null);
      }
    }
  }, []);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setUploadError(null);
    }
  }

  function handleUpload() {
    if (!file) return;
    setUploadError(null);
    uploadMutation.mutate(
      { file, entityType, academicYearId: '' },
      {
        onSuccess: (data) => setResult(data),
        onError: (err) => setUploadError(err.message),
      },
    );
  }

  function handleCommit() {
    setShowConfirm(true);
  }

  function confirmCommit() {
    if (!result?.jobId) return;
    setShowConfirm(false);
    commitMutation.mutate(result.jobId, {
      onSuccess: (data) => setCommitResult(data),
      onError: (err) => setUploadError(err.message),
    });
  }

  function handleReset() {
    setFile(null);
    setResult(null);
    setCommitResult(null);
    setUploadError(null);
  }

  function downloadSample(type: string) {
    const sample = SAMPLE_FILES[type as keyof typeof SAMPLE_FILES];
    if (!sample) return;
    const header = sample.columns;
    const row = type === 'STUDENTS'
      ? 'Aarav Sharma,aarav@example.com,9876543210,101,Sunita Sharma,9876543211,10'
      : type === 'TEACHERS'
        ? 'Priya Patel,priya@school.com,9876543212,T001'
        : 'Rahul Verma,rahul@example.com,9876543213';
    const csv = `${header}\n${row}\n`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = sample.filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 flex items-center gap-2">
          <Upload className="h-6 w-6 text-brand-500" />
          Bulk Import
        </h1>
        <p className="text-surface-500 text-sm mt-1">
          Import students, teachers, or parents from an XLSX/CSV file
        </p>
      </div>

      {/* Error display */}
      {uploadError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-red-900">Import Error</p>
                <p className="text-sm text-red-700 mt-1">{uploadError}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setUploadError(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
                <Button variant="outline" size="sm" className="mt-3" onClick={handleReset}>
                  Import Another File
                </Button>
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
              <div className="flex flex-wrap gap-2">
                {ENTITY_TYPES.map((et) => (
                  <Button
                    key={et.value}
                    variant={entityType === et.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEntityType(et.value)}
                  >
                    <et.icon className="mr-1 h-4 w-4" />
                    {et.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Sample file download */}
            <div className="flex items-center gap-2 text-sm">
              <Download className="h-4 w-4 text-surface-400" />
              <span className="text-surface-500">Need a template?</span>
              <button
                onClick={() => downloadSample(entityType)}
                className="text-brand-600 hover:text-brand-700 font-medium underline underline-offset-2"
              >
                Download sample {entityType.toLowerCase()} CSV
              </button>
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
                  <p className="text-xs text-surface-400 mt-2">Supports XLSX, XLS, CSV (max 10 MB)</p>
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
              <Badge variant={result.invalidRows === 0 ? 'default' : 'destructive'}>
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

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="max-w-md mx-4">
            <CardContent className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-amber-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-surface-900">Confirm Import</h3>
                  <p className="text-sm text-surface-600 mt-1">
                    This will create {result?.validRows} new {result?.entityType.toLowerCase()} records.
                    This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowConfirm(false)}>
                  Cancel
                </Button>
                <Button onClick={confirmCommit} className="bg-green-600 hover:bg-green-700">
                  Yes, Import
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Import History */}
      {!commitResult && (
        <Card>
          <CardHeader>
            <CardTitle>Import History</CardTitle>
            <CardDescription>Recent import jobs</CardDescription>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-surface-400" />
              </div>
            ) : !history || history.length === 0 ? (
              <div className="text-center py-8">
                <FileSpreadsheet className="h-10 w-10 text-surface-300 mx-auto mb-3" />
                <p className="text-sm text-surface-500">No import history yet.</p>
                <p className="text-xs text-surface-400 mt-1">Your import jobs will appear here.</p>
              </div>
            ) : (
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
                          ? 'default'
                          : job.status === 'VALIDATED'
                            ? 'secondary'
                            : 'outline'
                      }
                    >
                      {job.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
