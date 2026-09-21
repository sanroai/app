'use client';

import { Fragment, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  useContentIngests,
  useContentIngest,
  useCreateContentIngest,
  useApproveContentIngest,
  useRejectContentIngest,
  useChapters,
  useTopics,
  useConcepts,
  type IngestCreateJson,
  type IngestCreateResult,
  type IngestJob,
} from '@/lib/content-ingest-hooks';
import { useBoards, useGrades, useSubjects } from '@/lib/api-hooks';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/cn';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  FileText,
  Loader2,
  RefreshCw,
  Upload,
  XCircle,
  Youtube,
} from 'lucide-react';

const ALLOWED_ROLES = ['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'TEACHER'];
const ROLE_HOME: Record<string, string> = {
  STUDENT: '/app',
  PARENT: '/app',
};

const STAGES = [
  'VALIDATING',
  'EXTRACTING',
  'PARSING',
  'MAPPING',
  'CHUNKING',
  'EMBEDDING',
  'GENERATING',
  'REVIEW',
  'COMPLETED',
] as const;
type PipelineStage = (typeof STAGES)[number];

const STATUS_FILTERS = ['PROCESSING', 'PROCESSED', 'DRAFT', 'PUBLISHED'];

const STAGE_STYLES: Record<string, string> = {
  UPLOADED: 'bg-surface-100 text-surface-600 border-surface-200',
  VALIDATING: 'bg-sky-100 text-sky-700 border-sky-200',
  EXTRACTING: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  PARSING: 'bg-blue-100 text-blue-700 border-blue-200',
  MAPPING: 'bg-violet-100 text-violet-700 border-violet-200',
  CHUNKING: 'bg-purple-100 text-purple-700 border-purple-200',
  EMBEDDING: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
  GENERATING: 'bg-amber-100 text-amber-700 border-amber-200',
  REVIEW: 'bg-orange-100 text-orange-700 border-orange-200',
  COMPLETED: 'bg-green-100 text-green-700 border-green-200',
  FAILED: 'bg-red-100 text-red-700 border-red-200',
  PARTIAL: 'bg-red-100 text-red-700 border-red-200',
};

const STATUS_STYLES: Record<string, string> = {
  PROCESSING: 'bg-sky-100 text-sky-700 border-sky-200',
  PROCESSED: 'bg-blue-100 text-blue-700 border-blue-200',
  DRAFT: 'bg-surface-100 text-surface-600 border-surface-200',
  REVIEW: 'bg-orange-100 text-orange-700 border-orange-200',
  APPROVED: 'bg-green-100 text-green-700 border-green-200',
  PUBLISHED: 'bg-green-100 text-green-700 border-green-200',
};

const JOB_STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-surface-100 text-surface-600 border-surface-200',
  PROCESSING: 'bg-sky-100 text-sky-700 border-sky-200',
  COMPLETED: 'bg-green-100 text-green-700 border-green-200',
  FAILED: 'bg-red-100 text-red-700 border-red-200',
};

const dateTimeFmt = new Intl.DateTimeFormat('en-IN', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

function formatDateTime(iso?: string | null) {
  if (!iso) return '—';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '—' : dateTimeFmt.format(date);
}

function sourceLabel(type: string) {
  switch (type) {
    case 'YOUTUBE':
      return 'YouTube';
    case 'PDF_BOOK':
      return 'PDF Book';
    case 'VIDEO':
      return 'Video';
    case 'NOTES':
      return 'Notes';
    default:
      return type.replace(/_/g, ' ');
  }
}

const IngestFormSchema = z
  .object({
    source: z.enum(['YOUTUBE', 'FILE']),
    sourceType: z.enum(['PDF_BOOK', 'NOTES', 'VIDEO']),
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(300),
    description: z.string().trim().max(3000).optional(),
    sourceUrl: z.string().trim().url('Enter a valid URL').or(z.literal('')).optional(),
    boardId: z.string().optional(),
    grade: z.string().optional(),
    subjectId: z.string().optional(),
    chapterId: z.string().optional(),
    topicId: z.string().optional(),
    conceptId: z.string().optional(),
    directSanroAvailable: z.boolean(),
    autoApprove: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (value.source === 'YOUTUBE' && !value.sourceUrl) {
      ctx.addIssue({ code: 'custom', path: ['sourceUrl'], message: 'YouTube URL is required' });
    }
  });
type IngestFormValues = z.infer<typeof IngestFormSchema>;

function CurriculumSelect({
  label,
  value,
  onValueChange,
  placeholder,
  disabled,
  isLoading,
  options,
}: {
  label: string;
  value?: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  isLoading?: boolean;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-surface-600">{label}</Label>
      <Select
        value={value || 'NONE'}
        onValueChange={(v) => onValueChange(v === 'NONE' ? '' : v)}
        disabled={disabled || isLoading}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="NONE">{isLoading ? 'Loading...' : placeholder}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function IngestFormCard({
  onCreated,
  onError,
}: {
  onCreated: (result: IngestCreateResult) => void;
  onError: (error: Error) => void;
}) {
  const create = useCreateContentIngest();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<IngestFormValues>({
    resolver: zodResolver(IngestFormSchema),
    defaultValues: {
      source: 'FILE',
      sourceType: 'PDF_BOOK',
      title: '',
      description: '',
      sourceUrl: '',
      boardId: '',
      grade: '',
      subjectId: '',
      chapterId: '',
      topicId: '',
      conceptId: '',
      directSanroAvailable: false,
      autoApprove: false,
    },
  });

  const source = watch('source');
  const sourceType = watch('sourceType');
  const boardId = watch('boardId');
  const grade = watch('grade');
  const subjectId = watch('subjectId');
  const chapterId = watch('chapterId');
  const topicId = watch('topicId');
  const conceptId = watch('conceptId');

  const boardsQuery = useBoards();
  const gradesQuery = useGrades(boardId || undefined);
  const subjectsQuery = useSubjects(boardId || undefined, grade || undefined);
  const chaptersQuery = useChapters(subjectId);
  const topicsQuery = useTopics(chapterId);
  const conceptsQuery = useConcepts(topicId);

  function clearFrom(from: 'board' | 'grade' | 'subject' | 'chapter' | 'topic') {
    if (from === 'board') {
      setValue('grade', '');
      setValue('subjectId', '');
      setValue('chapterId', '');
      setValue('topicId', '');
      setValue('conceptId', '');
    } else if (from === 'grade') {
      setValue('subjectId', '');
      setValue('chapterId', '');
      setValue('topicId', '');
      setValue('conceptId', '');
    } else if (from === 'subject') {
      setValue('chapterId', '');
      setValue('topicId', '');
      setValue('conceptId', '');
    } else if (from === 'chapter') {
      setValue('topicId', '');
      setValue('conceptId', '');
    } else {
      setValue('conceptId', '');
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setFileError(null);
    if (file && file.size > 10 * 1024 * 1024) setFileError('File exceeds the 10 MB limit');
  }

  function onSubmit(values: IngestFormValues) {
    setFileError(null);
    if (values.source === 'FILE') {
      if (!selectedFile) {
        setFileError('Select a file to upload');
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        setFileError('File exceeds the 10 MB limit');
        return;
      }
    }
    create.mutate(
      buildPayload(values, selectedFile),
      {
        onSuccess: (result) => {
          toast.success('Content added to the ingest queue');
          setSelectedFile(null);
          setFileError(null);
          reset();
          onCreated(result);
        },
        onError: (e: Error) => onError(e),
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-brand-500" />
          New content ingest
        </CardTitle>
        <CardDescription className="mt-1">
          Add a book, notes document, video or YouTube lesson. Content flows through a
          validation-to-review pipeline before publication.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="ingest-title">Title *</Label>
              <Input
                id="ingest-title"
                placeholder="NCERT Science Class 10 Chapter 5"
                {...register('title')}
              />
              {errors.title ? <p className="text-sm text-red-500">{errors.title.message}</p> : null}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="ingest-description">Description</Label>
              <Textarea
                id="ingest-description"
                placeholder="Short description (optional)"
                {...register('description')}
              />
              {errors.description ? (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              ) : null}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Source type *</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setValue('source', 'FILE')}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-colors',
                    source === 'FILE'
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-surface-200 bg-white text-surface-500 hover:border-surface-300',
                  )}
                >
                  <Upload className="h-4 w-4" />
                  File upload
                </button>
                <button
                  type="button"
                  onClick={() => setValue('source', 'YOUTUBE')}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-colors',
                    source === 'YOUTUBE'
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-surface-200 bg-white text-surface-500 hover:border-surface-300',
                  )}
                >
                  <Youtube className="h-4 w-4" />
                  YouTube URL
                </button>
              </div>
            </div>

            {source === 'FILE' ? (
              <div className="space-y-2 sm:col-span-2">
                <Label>File *</Label>
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-surface-200 bg-surface-50/50 px-6 py-8 text-center transition-colors hover:border-brand-300 hover:bg-brand-50/40 dark:border-surface-700 dark:bg-surface-900/50">
                  <Upload className="h-8 w-8 text-surface-300" />
                  {selectedFile ? (
                    <>
                      <p className="text-sm font-medium text-surface-800">{selectedFile.name}</p>
                      <p className="text-xs text-surface-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-surface-600">Choose a file</p>
                      <p className="text-xs text-surface-400">
                        PDF book, notes document or video (max 10 MB)
                      </p>
                    </>
                  )}
                  <input
                    type="file"
                    className="sr-only"
                    accept=".pdf,.txt,.md,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.mp4,.webm,.mov,.mkv"
                    onChange={handleFileChange}
                  />
                </label>
                {fileError ? <p className="text-sm text-red-500">{fileError}</p> : null}
                <div className="space-y-1.5 pt-1">
                  <Label>Kind of document</Label>
                  <Select
                    value={sourceType}
                    onValueChange={(v) => setValue('sourceType', v as IngestFormValues['sourceType'])}
                  >
                    <SelectTrigger className="w-full sm:max-w-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PDF_BOOK">PDF Book</SelectItem>
                      <SelectItem value="NOTES">Notes</SelectItem>
                      <SelectItem value="VIDEO">Video</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="ingest-sourceUrl">YouTube URL *</Label>
                <Input
                  id="ingest-sourceUrl"
                  placeholder="https://www.youtube.com/watch?v=..."
                  {...register('sourceUrl')}
                />
                {errors.sourceUrl ? (
                  <p className="text-sm text-red-500">{errors.sourceUrl.message}</p>
                ) : null}
              </div>
            )}

            <div className="rounded-xl border border-surface-100 bg-surface-50/50 p-4 sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-surface-400">
                Map to curriculum (optional)
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <CurriculumSelect
                  label="Board"
                  value={boardId}
                  onValueChange={(v) => {
                    setValue('boardId', v);
                    clearFrom('board');
                  }}
                  placeholder="Select board"
                  isLoading={boardsQuery.isLoading}
                  options={(boardsQuery.data ?? []).map((b) => ({ value: b.id, label: b.name }))}
                />
                <CurriculumSelect
                  label="Grade"
                  value={grade}
                  onValueChange={(v) => {
                    setValue('grade', v);
                    clearFrom('grade');
                  }}
                  placeholder="Select grade"
                  disabled={!boardId}
                  isLoading={gradesQuery.isLoading}
                  options={(gradesQuery.data ?? []).map((g) => ({ value: g, label: `Grade ${g}` }))}
                />
                <CurriculumSelect
                  label="Subject"
                  value={subjectId}
                  onValueChange={(v) => {
                    setValue('subjectId', v);
                    clearFrom('subject');
                  }}
                  placeholder="Select subject"
                  disabled={!boardId || !grade}
                  isLoading={subjectsQuery.isLoading}
                  options={(subjectsQuery.data ?? []).map((s) => ({ value: s.id, label: s.name }))}
                />
                <CurriculumSelect
                  label="Chapter (optional)"
                  value={chapterId}
                  onValueChange={(v) => {
                    setValue('chapterId', v);
                    clearFrom('chapter');
                  }}
                  placeholder="Select chapter"
                  disabled={!subjectId}
                  isLoading={chaptersQuery.isLoading}
                  options={(chaptersQuery.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
                />
                <CurriculumSelect
                  label="Topic (optional)"
                  value={topicId}
                  onValueChange={(v) => {
                    setValue('topicId', v);
                    clearFrom('topic');
                  }}
                  placeholder="Select topic"
                  disabled={!chapterId}
                  isLoading={topicsQuery.isLoading}
                  options={(topicsQuery.data ?? []).map((t) => ({ value: t.id, label: t.name }))}
                />
                <CurriculumSelect
                  label="Concept (optional)"
                  value={conceptId}
                  onValueChange={(v) => setValue('conceptId', v)}
                  placeholder="Select concept"
                  disabled={!topicId}
                  isLoading={conceptsQuery.isLoading}
                  options={(conceptsQuery.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 sm:col-span-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-surface-700">
                <Checkbox
                  checked={watch('directSanroAvailable')}
                  onCheckedChange={(checked) => setValue('directSanroAvailable', checked === true)}
                />
                Direct SANRO available
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-surface-700">
                <Checkbox
                  checked={watch('autoApprove')}
                  onCheckedChange={(checked) => setValue('autoApprove', checked === true)}
                />
                Auto-approve (skip review)
              </label>
            </div>

            {create.error ? (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
                <span>{create.error.message}</span>
              </div>
            ) : null}

            <div className="sm:col-span-2">
              <Button type="submit" variant="gradient" size="lg" disabled={create.isPending || isSubmitting}>
                {create.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {create.isPending ? 'Ingesting...' : 'Start ingest'}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function buildPayload(
  values: IngestFormValues,
  selectedFile: File | null,
): FormData | IngestCreateJson {
  if (values.source === 'FILE') {
    const form = new FormData();
    if (selectedFile) form.append('file', selectedFile);
    form.append('title', values.title);
    form.append('sourceType', values.sourceType);
    if (values.description) form.append('description', values.description);
    if (values.grade) form.append('grade', values.grade);
    if (values.boardId) form.append('boardId', values.boardId);
    if (values.subjectId) form.append('subjectId', values.subjectId);
    if (values.chapterId) form.append('chapterId', values.chapterId);
    if (values.topicId) form.append('topicId', values.topicId);
    if (values.conceptId) form.append('conceptId', values.conceptId);
    if (values.directSanroAvailable) form.append('directSanroAvailable', 'true');
    if (values.autoApprove) form.append('autoApprove', 'true');
    return form;
  }
  return {
    sourceType: 'YOUTUBE',
    sourceUrl: (values.sourceUrl ?? '').trim(),
    title: values.title,
    description: values.description || undefined,
    grade: values.grade || undefined,
    boardId: values.boardId || undefined,
    subjectId: values.subjectId || undefined,
    chapterId: values.chapterId || undefined,
    topicId: values.topicId || undefined,
    conceptId: values.conceptId || undefined,
    directSanroAvailable: values.directSanroAvailable,
    autoApprove: values.autoApprove,
  };
}

function RejectDialog({
  id,
  open,
  onOpenChange,
}: {
  id: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const reject = useRejectContentIngest(id);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<{ reason: string }>({
    resolver: zodResolver(
      z.object({
        reason: z.string().trim().min(3, 'Reason must be at least 3 characters').max(500),
      }),
    ),
    defaultValues: { reason: '' },
  });

  function onSubmit(values: { reason: string }) {
    reject.mutate(values.reason, {
      onSuccess: () => {
        toast.success('Ingest rejected');
        reset();
        onOpenChange(false);
      },
      onError: (e: Error) => toast.error(e.message),
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject ingest</DialogTitle>
          <DialogDescription>
            The knowledge base stays available but is moved to a rejected (FAILED) state and will
            not be published.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Reason *</Label>
            <Textarea
              id="reject-reason"
              placeholder="Why is this content being rejected?"
              {...register('reason')}
            />
            {errors.reason ? <p className="text-sm text-red-500">{errors.reason.message}</p> : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting || reject.isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={isSubmitting || reject.isPending}>
              {reject.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Reject ingest
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmApproveDialog({
  id,
  open,
  onOpenChange,
}: {
  id: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const approve = useApproveContentIngest(id);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Approve content</DialogTitle>
          <DialogDescription>
            This publishes the ingested content as a ContentItem, making it available to learners.
            Continue?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" disabled={approve.isPending} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="success"
            disabled={approve.isPending}
            onClick={() =>
              approve.mutate(undefined, {
                onSuccess: () => {
                  toast.success('Content approved and published');
                  onOpenChange(false);
                },
                onError: (e: Error) => toast.error(e.message),
              })
            }
          >
            {approve.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function IngestDetailPanel({ id }: { id: string }) {
  const { data: detail, isLoading, error, refetch } = useContentIngest(id);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  if (isLoading || !detail) {
    return (
      <div className="space-y-3">
        <div className="h-5 w-44 animate-pulse rounded bg-surface-100" />
        <div className="h-9 animate-pulse rounded-lg bg-surface-100" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
        <p className="text-sm text-red-700">{(error as Error).message}</p>
        <Button size="sm" variant="outline" onClick={() => void refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const currentIdx = STAGES.indexOf(detail.stage as PipelineStage);
  const isReview = detail.stage === 'REVIEW';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className={cn('text-xs', STAGE_STYLES[detail.stage] ?? 'bg-surface-50 text-surface-600')}
        >
          {detail.stage}
        </Badge>
        <Badge
          variant="outline"
          className={cn('text-xs', STATUS_STYLES[detail.status] ?? 'bg-surface-50 text-surface-600')}
        >
          {detail.status}
        </Badge>
        <Badge variant="outline" className="text-xs bg-brand-50 text-brand-700 border-brand-200">
          {detail.chunks} chunk{detail.chunks === 1 ? '' : 's'}
        </Badge>
        <Badge variant="outline" className="text-xs bg-surface-50 text-surface-600">
          {detail.jobs.length} job{detail.jobs.length === 1 ? '' : 's'}
        </Badge>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-surface-400">Pipeline</p>
        <div className="mt-2 flex flex-wrap items-center gap-1">
          {STAGES.map((stage, i) => {
            const reached = currentIdx >= 0 && i < currentIdx;
            const current = i === currentIdx;
            return (
              <Fragment key={stage}>
                {i > 0 ? <ChevronRight className="h-3 w-3 text-surface-300" /> : null}
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px]',
                    current
                      ? 'border-transparent bg-brand-600 text-white ring-2 ring-brand-300'
                      : reached
                        ? 'bg-brand-100 text-brand-700 border-brand-200'
                        : 'bg-surface-50 text-surface-400 border-surface-200',
                  )}
                >
                  {stage}
                </Badge>
              </Fragment>
            );
          })}
        </div>
      </div>

      {detail.jobs.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-surface-100">
          <table className="w-full min-w-[560px] text-left text-xs">
            <thead>
              <tr className="border-b border-surface-100 text-[10px] uppercase tracking-wide text-surface-400">
                <th className="px-3 py-2 font-semibold">Stage</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Error</th>
                <th className="px-3 py-2 font-semibold">Created</th>
                <th className="px-3 py-2 font-semibold">Completed</th>
              </tr>
            </thead>
            <tbody>
              {detail.jobs.map((job: IngestJob) => (
                <tr key={job.id} className="border-b border-surface-50 align-top last:border-0">
                  <td className="px-3 py-2 font-medium text-surface-700">
                    {job.stage ?? job.inputType}
                  </td>
                  <td className="px-3 py-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px]',
                        JOB_STATUS_STYLES[job.status] ?? 'bg-surface-50 text-surface-600',
                      )}
                    >
                      {job.status}
                    </Badge>
                  </td>
                  <td className="max-w-[220px] px-3 py-2 text-surface-500">{job.error ?? '—'}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-surface-500">
                    {formatDateTime(job.createdAt)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-surface-500">
                    {formatDateTime(job.completedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-surface-400">No processing jobs recorded yet.</p>
      )}

      {isReview ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-surface-100 pt-4">
          <Button variant="success" size="sm" onClick={() => setApproveOpen(true)}>
            <CheckCircle2 className="h-4 w-4" />
            Approve
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setRejectOpen(true)}>
            <XCircle className="h-4 w-4" />
            Reject
          </Button>
        </div>
      ) : null}

      <ConfirmApproveDialog id={id} open={approveOpen} onOpenChange={setApproveOpen} />
      <RejectDialog id={id} open={rejectOpen} onOpenChange={setRejectOpen} />
    </div>
  );
}

export default function ContentIngestPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const [status, setStatus] = useState('ALL');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [lastCreated, setLastCreated] = useState<IngestCreateResult | null>(null);

  const allowed = !!user && ALLOWED_ROLES.includes(user.role);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!allowed) {
      router.replace(user ? (ROLE_HOME[user.role] ?? '/app') : '/login');
    }
  }, [hasHydrated, allowed, user, router]);

  const { data, isLoading, isFetching, error, refetch } = useContentIngests(
    status === 'ALL' ? undefined : status,
  );
  const rows = data ?? [];

  function handleCreated(result: IngestCreateResult) {
    setStatus('ALL');
    setDetailId(result.id);
    setLastCreated(result);
  }

  if (!hasHydrated) return null;
  if (!allowed) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Content Ingest</h1>
          <p className="mt-1 text-sm text-surface-500">
            Ingest books, notes and video lessons into the knowledge base pipeline.
          </p>
        </div>
      </div>

      {lastCreated ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3">
          <CheckCircle2 className="h-5 w-5 flex-none text-green-600" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-green-800">
              Ingest started — {lastCreated.name}
            </p>
            <p className="text-xs text-green-700">
              Knowledge Base {lastCreated.id} · status {lastCreated.status} · stage{' '}
              {lastCreated.stage}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-green-300 bg-white text-green-700 hover:bg-green-100"
            onClick={() => setDetailId(lastCreated.id)}
          >
            Track it
          </Button>
        </div>
      ) : null}

      <IngestFormCard onCreated={handleCreated} onError={(e) => toast.error(e.message)} />

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Recent ingests</CardTitle>
            <CardDescription className="mt-1">
              Click a row to inspect pipeline progress and review.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                {STATUS_FILTERS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => void refetch()} aria-label="Refresh">
              <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-surface-100" />
              ))}
            </div>
          ) : error ? (
            <div className="px-6 pb-8 pt-2 text-center">
              <p className="font-medium text-surface-800">Could not load ingests</p>
              <p className="mt-1 text-sm text-surface-500">{(error as Error).message}</p>
              <Button className="mt-4" variant="outline" onClick={() => void refetch()}>
                Retry
              </Button>
            </div>
          ) : rows.length === 0 ? (
            <div className="px-6 pb-8 pt-2 text-center">
              <FileText className="mx-auto h-10 w-10 text-surface-300" />
              <p className="mt-3 text-sm font-medium text-surface-500">No ingests yet</p>
              <p className="text-xs text-surface-400">
                Use the form above to add your first knowledge base.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead>
                  <tr className="border-b border-surface-200 text-xs uppercase tracking-wide text-surface-500">
                    <th className="px-4 py-3 font-medium">Title</th>
                    <th className="px-4 py-3 font-medium">Source</th>
                    <th className="px-4 py-3 font-medium">Stage</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Chunks</th>
                    <th className="px-4 py-3 font-medium">Created</th>
                    <th className="px-2 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const expanded = detailId === row.id;
                    return (
                      <Fragment key={row.id}>
                        <tr
                          onClick={() => setDetailId(expanded ? null : row.id)}
                          className="cursor-pointer border-b border-surface-100 last:border-0 hover:bg-surface-50/70"
                        >
                          <td className="px-4 py-3">
                            <p className="font-medium text-surface-900">{row.name}</p>
                            <p className="text-xs text-surface-400">{row.id}</p>
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant="outline"
                              className="bg-surface-50 text-surface-600 text-xs"
                            >
                              {sourceLabel(row.sourceType)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-xs',
                                STAGE_STYLES[row.stage] ?? 'bg-surface-50 text-surface-600',
                              )}
                            >
                              {row.stage}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-xs',
                                STATUS_STYLES[row.status] ?? 'bg-surface-50 text-surface-600',
                              )}
                            >
                              {row.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-surface-700">{row._count?.chunks ?? 0}</td>
                          <td className="px-4 py-3 text-xs text-surface-500">
                            {formatDateTime(row.createdAt)}
                          </td>
                          <td className="px-2 py-3 text-right">
                            {expanded ? (
                              <ChevronUp className="ml-auto h-4 w-4 text-surface-400" />
                            ) : (
                              <ChevronDown className="ml-auto h-4 w-4 text-surface-400" />
                            )}
                          </td>
                        </tr>
                        {expanded ? (
                          <tr className="border-b border-surface-100 bg-surface-50/50 last:border-0">
                            <td colSpan={7} className="px-4 py-4">
                              <IngestDetailPanel id={row.id} />
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}