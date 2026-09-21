'use client';

import { useMemo, useState } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import {
  useAdminArList,
  useAdminArDetail,
  useArUsage,
  useCreateAr,
  useDeleteAr,
  useTransitionAr,
  useUpdateAr,
  useUploadArModel,
  useUploadArPreview,
  type ArAdminRecord,
} from '@/lib/ar-hooks';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Spinner, ErrorBanner } from '@/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertCircle,
  Boxes,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileUp,
  Loader2,
  Trash2,
  Upload,
} from 'lucide-react';
import { cn } from '@/lib/cn';

const STATUSES = ['DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED'] as const;

const NEXT_STATUS: Record<string, string[]> = {
  DRAFT: ['REVIEW', 'ARCHIVED'],
  REVIEW: ['APPROVED', 'DRAFT', 'ARCHIVED'],
  APPROVED: ['PUBLISHED', 'REVIEW', 'ARCHIVED'],
  PUBLISHED: ['ARCHIVED', 'APPROVED'],
  ARCHIVED: ['DRAFT'],
};

const STATUS_STYLE: Record<string, string> = {
  DRAFT: 'bg-surface-100 text-surface-600',
  REVIEW: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-blue-100 text-blue-700',
  PUBLISHED: 'bg-green-100 text-green-700',
  ARCHIVED: 'bg-surface-200 text-surface-600',
};

const VALIDATION_STYLE: Record<string, string> = {
  VALID: 'bg-green-100 text-green-700',
  WARNINGS: 'bg-amber-100 text-amber-700',
  INVALID: 'bg-red-100 text-red-700',
  INCOMPLETE: 'bg-orange-100 text-orange-700',
  PENDING: 'bg-surface-100 text-surface-600',
};

export default function ArManagementPage() {
  const { user } = useAuthStore();
  const isManager = user?.role === 'SUPER_ADMIN' || user?.role === 'INSTITUTION_ADMIN';

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const list = useAdminArList({ search: search || undefined, status: status === 'ALL' ? undefined : status });
  const usage = useArUsage();
  const create = useCreateAr();
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    learningObjective: '',
    instructions: '',
    difficulty: 'MEDIUM',
    conceptId: '',
    grade: '',
    source: '',
    license: '',
    attribution: '',
  });

  const records = useMemo(() => list.data ?? [], [list.data]);

  if (!isManager) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold">Access Denied</h2>
        <p className="text-surface-500">AR content management is restricted to institution managers.</p>
      </div>
    );
  }

  const onCreate = () => {
    setFormError(null);
    if (!form.title.trim()) {
      setFormError('A title is required.');
      return;
    }
    if (!form.conceptId.trim()) {
      setFormError('A concept mapping is required before AR content can be published.');
      return;
    }
    create.mutate(
      {
        title: form.title.trim(),
        description: form.description || undefined,
        learningObjective: form.learningObjective || undefined,
        instructions: form.instructions || undefined,
        difficulty: form.difficulty,
        conceptId: form.conceptId.trim(),
        grade: form.grade || undefined,
        source: form.source || undefined,
        license: form.license || undefined,
        attribution: form.attribution || undefined,
      },
      {
        onSuccess: (created) => {
          setShowCreate(false);
          setExpandedId(created.id);
          setForm({
            title: '',
            description: '',
            learningObjective: '',
            instructions: '',
            difficulty: 'MEDIUM',
            conceptId: '',
            grade: '',
            source: '',
            license: '',
            attribution: '',
          });
        },
        onError: (err) => setFormError((err as Error).message),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AR / 3D Content</h1>
          <p className="text-surface-500">
            Author, validate and publish curriculum-linked 3D models for concept pages.
          </p>
        </div>
        <Button className="rounded-xl" onClick={() => setShowCreate((v) => !v)}>
          {showCreate ? 'Cancel' : 'New AR content'}
        </Button>
      </div>

      {usage.data && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Total" value={usage.data.total} />
          <StatCard label="Published" value={usage.data.byStatus.PUBLISHED ?? 0} tone="green" />
          <StatCard label="In review" value={(usage.data.byStatus.REVIEW ?? 0) + (usage.data.byStatus.APPROVED ?? 0)} tone="amber" />
          <StatCard label="AR sessions" value={usage.data.activityByType.AR_STARTED ?? 0} tone="brand" />
        </div>
      )}

      {showCreate && (
        <Card className="rounded-3xl border-surface-200">
          <CardContent className="space-y-4 p-5">
            <h2 className="font-poppins font-semibold text-surface-900">New AR content</h2>
            {formError && <ErrorBanner message={formError} />}
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Title">
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Human Heart" />
              </Field>
              <Field label="Concept ID (required to publish)">
                <Input value={form.conceptId} onChange={(e) => setForm({ ...form, conceptId: e.target.value })} placeholder="concept uuid" />
              </Field>
              <Field label="Difficulty">
                <Select value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['EASY', 'MEDIUM', 'HARD'].map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Class / grade">
                <Input value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} placeholder="10" />
              </Field>
              <Field label="Learning objective" className="md:col-span-2">
                <Input value={form.learningObjective} onChange={(e) => setForm({ ...form, learningObjective: e.target.value })} />
              </Field>
              <Field label="Description" className="md:col-span-2">
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
              </Field>
              <Field label="How to use" className="md:col-span-2">
                <Textarea value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} rows={3} />
              </Field>
              <Field label="Source">
                <Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="Sanro original / Wikimedia" />
              </Field>
              <Field label="License">
                <Input value={form.license} onChange={(e) => setForm({ ...form, license: e.target.value })} placeholder="CC BY 4.0" />
              </Field>
              <Field label="Attribution" className="md:col-span-2">
                <Input value={form.attribution} onChange={(e) => setForm({ ...form, attribution: e.target.value })} />
              </Field>
            </div>
            <Button className="rounded-xl" disabled={create.isPending} onClick={onCreate}>
              {create.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Create draft
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search AR content..."
          className="max-w-xs"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {list.isLoading && (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      )}
      {list.isError && <ErrorBanner message="Could not load AR content. Please retry." />}
      {!list.isLoading && !list.isError && records.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-surface-300 py-16 dark:border-surface-700 dark:bg-surface-900/50">
          <Boxes className="h-9 w-9 text-surface-400" />
          <p className="text-sm font-medium text-surface-700">No AR content yet</p>
          <p className="text-xs text-surface-500">Create a draft, upload a .glb model and map it to a concept.</p>
        </div>
      )}

      <div className="space-y-3">
        {records.map((record) => (
          <ArRow
            key={record.id}
            record={record}
            expanded={expandedId === record.id}
            onToggle={() => setExpandedId((id) => (id === record.id ? null : record.id))}
          />
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, tone = 'surface' }: { label: string; value: number; tone?: string }) {
  const tones: Record<string, string> = {
    surface: 'text-surface-900',
    green: 'text-green-600',
    amber: 'text-amber-600',
    brand: 'text-brand-600',
  };
  return (
    <Card className="rounded-2xl border-surface-200">
      <CardContent className="p-4">
        <p className="text-xs text-surface-500">{label}</p>
        <p className={cn('text-2xl font-bold', tones[tone])}>{value}</p>
      </CardContent>
    </Card>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-xs font-medium text-surface-600">{label}</Label>
      {children}
    </div>
  );
}

function ArRow({ record, expanded, onToggle }: { record: ArAdminRecord; expanded: boolean; onToggle: () => void }) {
  const detail = useAdminArDetail(expanded ? record.id : undefined);
  const update = useUpdateAr(record.id);
  const transition = useTransitionAr(record.id);
  const uploadModel = useUploadArModel(record.id);
  const uploadPreview = useUploadArPreview(record.id);
  const remove = useDeleteAr();
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [draft, setDraft] = useState({
    title: record.title,
    description: record.description ?? '',
    learningObjective: record.learningObjective ?? '',
    instructions: record.instructions ?? '',
  });

  const nextStatuses = NEXT_STATUS[record.status] ?? [];
  const report = record.validationReport;

  const run = (fn: () => void) => {
    setActionError(null);
    fn();
  };

  return (
    <Card className="rounded-3xl border-surface-200">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {record.previewUrl ? (
              <img
                src={record.previewUrl}
                alt={record.title}
                className="h-12 w-12 shrink-0 rounded-xl border border-surface-200 object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                <Boxes className="h-5 w-5 text-indigo-600" />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate font-medium text-surface-900">{record.title}</p>
              <p className="truncate text-xs text-surface-500">
                {record.conceptId ? `Concept ${record.conceptId.slice(0, 8)}...` : 'No concept mapped'}
                {record.grade ? ` - Class ${record.grade}` : ''}
              </p>
            </div>
          </div>
          <Badge className={cn('rounded-full', STATUS_STYLE[record.status])}>{record.status}</Badge>
          <Badge className={cn('rounded-full', VALIDATION_STYLE[record.validationStatus])}>
            {record.validationStatus}
          </Badge>
          <Button size="sm" variant="ghost" onClick={onToggle} aria-label="Toggle details">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        {expanded && (
          <div className="mt-4 space-y-4 border-t border-surface-100 pt-4">
            {actionError && <ErrorBanner message={actionError} />}

            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Title">
                <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
              </Field>
              <Field label="Learning objective">
                <Input
                  value={draft.learningObjective}
                  onChange={(e) => setDraft({ ...draft, learningObjective: e.target.value })}
                />
              </Field>
              <Field label="Description">
                <Textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} rows={3} />
              </Field>
              <Field label="How to use">
                <Textarea value={draft.instructions} onChange={(e) => setDraft({ ...draft, instructions: e.target.value })} rows={3} />
              </Field>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl"
                disabled={update.isPending}
                onClick={() =>
                  run(() =>
                    update.mutate(draft, { onError: (err) => setActionError((err as Error).message) }),
                  )
                }
              >
                Save metadata
              </Button>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-surface-200 px-3 py-1.5 text-sm font-medium text-surface-700 hover:bg-surface-50">
                <FileUp className="h-4 w-4" />
                {record.hasModel ? 'Replace model' : 'Upload model'}
                <input
                  type="file"
                  accept=".glb,.gltf,.usdz"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) run(() => uploadModel.mutate(file, { onError: (err) => setActionError((err as Error).message) }));
                    e.target.value = '';
                  }}
                />
              </label>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-surface-200 px-3 py-1.5 text-sm font-medium text-surface-700 hover:bg-surface-50">
                <Upload className="h-4 w-4" />
                {record.previewUrl ? 'Replace preview' : 'Upload preview'}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) run(() => uploadPreview.mutate(file, { onError: (err) => setActionError((err as Error).message) }));
                    e.target.value = '';
                  }}
                />
              </label>
              {(uploadModel.isPending || uploadPreview.isPending) && <Spinner />}
            </div>

            {report && (
              <div className="rounded-2xl bg-surface-50 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-surface-500">Validation report</p>
                <div className="space-y-1">
                  {(report.checks ?? []).map((check) => (
                    <div key={check.name} className="flex items-center gap-2 text-xs text-surface-700">
                      {check.passed ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                      )}
                      {check.name}
                      {check.detail ? <span className="text-surface-400">- {check.detail}</span> : null}
                    </div>
                  ))}
                </div>
                {(report.errors ?? []).length > 0 && (
                  <p className="mt-2 text-xs text-red-600">{(report.errors ?? []).join('; ')}</p>
                )}
                {(report.warnings ?? []).length > 0 && (
                  <p className="mt-1 text-xs text-amber-600">{(report.warnings ?? []).join('; ')}</p>
                )}
              </div>
            )}

            {detail.data && (
              <div className="grid gap-3 text-xs text-surface-600 md:grid-cols-3">
                <div className="rounded-2xl bg-surface-50 p-3">
                  <p className="font-semibold text-surface-700">Version</p>
                  <p>{detail.data.version}</p>
                </div>
                <div className="rounded-2xl bg-surface-50 p-3">
                  <p className="font-semibold text-surface-700">AR sessions</p>
                  <p>{detail.data.activity.AR_STARTED ?? 0}</p>
                </div>
                <div className="rounded-2xl bg-surface-50 p-3">
                  <p className="font-semibold text-surface-700">Quick checks</p>
                  <p>{detail.data.activity.AR_QUICK_CHECK_COMPLETED ?? 0}</p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {nextStatuses.map((next) => (
                <Button
                  key={next}
                  size="sm"
                  variant={next === 'PUBLISHED' ? 'default' : 'outline'}
                  className="rounded-xl"
                  disabled={transition.isPending}
                  onClick={() =>
                    run(() => transition.mutate(next, { onError: (err) => setActionError((err as Error).message) }))
                  }
                >
                  {next}
                </Button>
              ))}
              {confirmDelete ? (
                <div className="ml-auto flex gap-1">
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={remove.isPending}
                    onClick={() => {
                      run(() => remove.mutate(record.id, { onError: (err) => setActionError((err as Error).message), onSettled: () => setConfirmDelete(false) }));
                    }}
                  >
                    Confirm delete
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setConfirmDelete(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  className="ml-auto rounded-xl text-red-600 hover:bg-red-50"
                  disabled={remove.isPending}
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
