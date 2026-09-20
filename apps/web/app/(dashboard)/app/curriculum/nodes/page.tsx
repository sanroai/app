'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import {
  useBoardNodes,
  useGradeNodes,
  useSubjectNodes,
  useChapterNodes,
  useTopicNodes,
  useConceptNodes,
  useUpdateCurriculumNode,
  useDeleteCurriculumNode,
  type NodeKind,
  type CurriculumNode,
  type AdminBoardNode,
  type AdminGradeNode,
  type AdminSubjectNode,
  type AdminChapterNode,
  type AdminTopicNode,
  type AdminConceptNode,
} from '@/lib/admin-curriculum-hooks';
import { useGrades } from '@/lib/api-hooks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertCircle,
  ChevronRight,
  FolderTree,
  Loader2,
  Pencil,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/cn';

const NONE = '__none__';

const KIND_LABELS: Record<NodeKind, { singular: string; plural: string }> = {
  boards: { singular: 'Board', plural: 'Boards' },
  grades: { singular: 'Grade', plural: 'Grades' },
  subjects: { singular: 'Subject', plural: 'Subjects' },
  chapters: { singular: 'Chapter', plural: 'Chapters' },
  topics: { singular: 'Topic', plural: 'Topics' },
  concepts: { singular: 'Concept', plural: 'Concepts' },
};

type EditField = { key: string; label: string; type: 'text' | 'number' | 'textarea' | 'boolean' };

const KIND_EDIT_FIELDS: Record<NodeKind, EditField[]> = {
  boards: [
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'active', label: 'Status', type: 'boolean' },
  ],
  grades: [
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'order', label: 'Order', type: 'number' },
  ],
  subjects: [
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'icon', label: 'Icon (emoji/name)', type: 'text' },
    { key: 'color', label: 'Color (hex / tailwind)', type: 'text' },
    { key: 'order', label: 'Order', type: 'number' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'active', label: 'Status', type: 'boolean' },
  ],
  chapters: [
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'grade', label: 'Grade', type: 'text' },
    { key: 'order', label: 'Order', type: 'number' },
    { key: 'description', label: 'Description', type: 'textarea' },
  ],
  topics: [
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'order', label: 'Order', type: 'number' },
  ],
  concepts: [
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'order', label: 'Order', type: 'number' },
    { key: 'description', label: 'Description', type: 'textarea' },
  ],
};

const HEADERS: Record<NodeKind, string[]> = {
  boards: ['Board', 'Code', 'Status', ''],
  grades: ['Board', 'Grade', 'Order', ''],
  subjects: ['Path', 'Code', 'Subject', 'Order', 'Status', ''],
  chapters: ['Path', 'Code', 'Chapter', 'Grade', 'Order', ''],
  topics: ['Path', 'Topic', 'Order', ''],
  concepts: ['Path', 'Concept', 'Order', ''],
};

const PARENT_LABEL: Record<string, string> = {
  boardId: 'a board',
  subjectId: 'a subject',
  chapterId: 'a chapter',
  topicId: 'a topic',
};

function PathText({ nodes }: { nodes: Array<{ id: string; name: string }> }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {nodes.map((n, i) => (
        <span key={n.id} className="inline-flex items-center gap-1 text-xs text-surface-500">
          {i > 0 && <ChevronRight className="h-3 w-3 text-surface-300" />}
          {n.name}
        </span>
      ))}
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <Badge variant="outline" className={cn('text-xs', active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-surface-100 text-surface-500')}>
      {active ? 'Active' : 'Inactive'}
    </Badge>
  );
}

function ParentSelect({
  label,
  value,
  onValueChange,
  placeholder,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onValueChange: (v: string) => void;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs uppercase tracking-wide text-surface-500">{label}</Label>
      <Select value={value || NONE} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className="min-w-[190px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>{placeholder}</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface EditNodeDialogProps {
  kind: NodeKind;
  node: CurriculumNode | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (body: Record<string, unknown>) => void;
  isSaving: boolean;
  saveError: Error | null;
}

function EditNodeDialog({ kind, node, open, onOpenChange, onSave, isSaving, saveError }: EditNodeDialogProps) {
  const fields = KIND_EDIT_FIELDS[kind];
  const [form, setForm] = useState<Record<string, string | boolean>>({});

  useEffect(() => {
    if (!node) return;
    const next: Record<string, string | boolean> = {};
    for (const f of fields) {
      const raw = (node as unknown as Record<string, unknown>)[f.key];
      if (f.type === 'boolean') next[f.key] = Boolean(raw);
      else next[f.key] = raw == null ? '' : String(raw);
    }
    setForm(next);
  }, [node, fields]);

  const setFormValue = (key: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    const body: Record<string, unknown> = {};
    for (const f of fields) {
      const value = form[f.key];
      if (f.type === 'boolean') {
        body[f.key] = value === true;
      } else if (f.type === 'number') {
        const n = Number(value);
        body[f.key] = Number.isFinite(n) ? n : 0;
      } else {
        body[f.key] = String(value ?? '').trim();
      }
    }
    onSave(body);
  };

  const label = KIND_LABELS[kind].singular.toLowerCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit {label}</DialogTitle>
          <DialogDescription>
            {node && 'name' in node ? `Updating "${String(node.name)}"` : 'Update the node fields below.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {fields.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label>{f.label}</Label>
              {f.type === 'boolean' ? (
                <Select value={String(form[f.key] ?? false)} onValueChange={(v) => setFormValue(f.key, v === 'true')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              ) : f.type === 'textarea' ? (
                <Textarea rows={3} value={String(form[f.key] ?? '')} onChange={(e) => setFormValue(f.key, e.target.value)} />
              ) : (
                <Input type={f.type === 'number' ? 'number' : 'text'} value={String(form[f.key] ?? '')} onChange={(e) => setFormValue(f.key, e.target.value)} />
              )}
            </div>
          ))}
          {saveError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {saveError.message}
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function CurriculumNodesPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  const [kind, setKind] = useState<NodeKind>('boards');
  const [boardId, setBoardId] = useState('');
  const [grade, setGrade] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [editTarget, setEditTarget] = useState<CurriculumNode | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CurriculumNode | null>(null);

  const boardsQ = useBoardNodes();
  const gradesQ = useGradeNodes();
  const subjectsQ = useSubjectNodes(boardId || undefined, grade || undefined);
  const chaptersQ = useChapterNodes(subjectId || undefined);
  const topicsQ = useTopicNodes(chapterId || undefined);
  const conceptsQ = useConceptNodes(topicId || undefined);
  const gradeOptionsQ = useGrades(boardId || undefined);
  const updateNode = useUpdateCurriculumNode(kind);
  const deleteNode = useDeleteCurriculumNode(kind);

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
        <p className="mt-1 text-sm text-surface-500">Only SUPER_ADMIN can manage the canonical curriculum.</p>
      </div>
    );
  }

  const activeQ =
    {
      boards: boardsQ,
      grades: gradesQ,
      subjects: subjectsQ,
      chapters: chaptersQ,
      topics: topicsQ,
      concepts: conceptsQ,
    }[kind] ?? boardsQ;

  const rows: CurriculumNode[] = activeQ.data ?? [];

  const boards = boardsQ.data ?? [];
  const boardMap = new Map(boards.map((b) => [b.id, b.name]));
  const subjectMap = new Map((subjectsQ.data ?? []).map((s) => [s.id, s.name]));
  const chapterMap = new Map((chaptersQ.data ?? []).map((c) => [c.id, c.name]));
  const topicMap = new Map((topicsQ.data ?? []).map((t) => [t.id, t.name]));
  const gradeNames = gradeOptionsQ.data ?? [];

  const boardSelect = kind !== 'boards';
  const gradeSelect = kind === 'subjects' || kind === 'chapters' || kind === 'topics' || kind === 'concepts';
  const subjectSelect = kind === 'chapters' || kind === 'topics' || kind === 'concepts';
  const chapterSelect = kind === 'topics' || kind === 'concepts';
  const topicSelect = kind === 'concepts';

  const missingParent =
    kind === 'subjects'
      ? !boardId
      : kind === 'chapters'
        ? !subjectId
        : kind === 'topics'
          ? !chapterId
          : kind === 'concepts'
            ? !topicId
            : null;

  const changeKind = (k: NodeKind) => {
    setKind(k);
    setBoardId('');
    setGrade('');
    setSubjectId('');
    setChapterId('');
    setTopicId('');
    setDeleteTarget(null);
    setEditTarget(null);
    setEditOpen(false);
  };

  const changeBoard = (v: string) => {
    setBoardId(v === NONE ? '' : v);
    setGrade('');
    setSubjectId('');
    setChapterId('');
    setTopicId('');
  };

  const changeGrade = (v: string) => {
    setGrade(v === NONE ? '' : v);
    setSubjectId('');
    setChapterId('');
    setTopicId('');
  };

  const changeSubject = (v: string) => {
    setSubjectId(v === NONE ? '' : v);
    setChapterId('');
    setTopicId('');
  };

  const changeChapter = (v: string) => {
    setChapterId(v === NONE ? '' : v);
    setTopicId('');
  };

  const changeTopic = (v: string) => {
    setTopicId(v === NONE ? '' : v);
  };

  const startEdit = (node: CurriculumNode) => {
    setEditTarget(node);
    setEditOpen(true);
  };

  const handleSaveNode = (body: Record<string, unknown>) => {
    if (!editTarget) return;
    updateNode.mutate(
      { id: editTarget.id, body },
      {
        onSuccess: () => {
          setEditOpen(false);
          setEditTarget(null);
        },
      },
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteNode.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  const parentPath = (): Array<{ id: string; name: string }> => {
    const nodes: Array<{ id: string; name: string }> = [];
    if (boardId && boardMap.has(boardId)) nodes.push({ id: boardId, name: boardMap.get(boardId) ?? '' });
    if (grade) nodes.push({ id: `grade-${grade}`, name: `Grade ${grade}` });
    if (subjectId && subjectMap.has(subjectId)) nodes.push({ id: subjectId, name: subjectMap.get(subjectId) ?? '' });
    if (chapterId && chapterMap.has(chapterId)) nodes.push({ id: chapterId, name: chapterMap.get(chapterId) ?? '' });
    if (topicId && topicMap.has(topicId)) nodes.push({ id: topicId, name: topicMap.get(topicId) ?? '' });
    return nodes;
  };

  const renderActions = (node: CurriculumNode) => (
    <td className="px-4 py-3 text-right">
      <div className="flex items-center justify-end gap-1">
        <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => startEdit(node)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Delete"
          onClick={() => setDeleteTarget(node)}
          className="text-red-500 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </td>
  );

  const renderRow = (node: CurriculumNode, index: number) => {
    const key = `${kind}-${node.id}`;
    switch (kind) {
      case 'boards': {
        const row = node as AdminBoardNode;
        return (
          <tr key={key} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">
            <td className="px-4 py-3">
              <p className="font-medium text-surface-900">{row.name}</p>
            </td>
            <td className="px-4 py-3">
              <Badge variant="outline" className="text-xs font-mono">{row.code}</Badge>
            </td>
            <td className="px-4 py-3">
              <StatusBadge active={row.active} />
            </td>
            {renderActions(node)}
          </tr>
        );
      }
      case 'grades': {
        const row = node as AdminGradeNode;
        const path = [{ id: row.boardId, name: row.boardName }];
        return (
          <tr key={key} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">
            <td className="px-4 py-3">
              <PathText nodes={path} />
            </td>
            <td className="px-4 py-3 font-medium text-surface-900">{row.name}</td>
            <td className="px-4 py-3 text-surface-700">{row.order}</td>
            {renderActions(node)}
          </tr>
        );
      }
      case 'subjects': {
        const row = node as AdminSubjectNode;
        return (
          <tr key={key} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">
            <td className="px-4 py-3">
              <PathText nodes={parentPath()} />
            </td>
            <td className="px-4 py-3">
              <Badge variant="outline" className="text-xs font-mono">{row.code}</Badge>
            </td>
            <td className="px-4 py-3 font-medium text-surface-900">{row.name}</td>
            <td className="px-4 py-3 text-surface-700">{row.order}</td>
            <td className="px-4 py-3">
              <StatusBadge active={row.active} />
            </td>
            {renderActions(node)}
          </tr>
        );
      }
      case 'chapters': {
        const row = node as AdminChapterNode;
        return (
          <tr key={key} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">
            <td className="px-4 py-3">
              <PathText nodes={parentPath()} />
            </td>
            <td className="px-4 py-3">
              <Badge variant="outline" className="text-xs font-mono">{row.code}</Badge>
            </td>
            <td className="px-4 py-3 font-medium text-surface-900">{row.name}</td>
            <td className="px-4 py-3 text-surface-700">Grade {row.grade}</td>
            <td className="px-4 py-3 text-surface-700">{row.order}</td>
            {renderActions(node)}
          </tr>
        );
      }
      case 'topics': {
        const row = node as AdminTopicNode;
        return (
          <tr key={key} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">
            <td className="px-4 py-3">
              <PathText nodes={parentPath()} />
            </td>
            <td className="px-4 py-3">
              <p className="font-medium text-surface-900">{row.name}</p>
              {row.concepts && row.concepts.length > 0 ? (
                <p className="mt-0.5 text-xs text-surface-400">{row.concepts.length} concepts</p>
              ) : null}
            </td>
            <td className="px-4 py-3 text-surface-700">{row.order}</td>
            {renderActions(node)}
          </tr>
        );
      }
      case 'concepts': {
        const row = node as AdminConceptNode;
        return (
          <tr key={key} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">
            <td className="px-4 py-3">
              <PathText nodes={parentPath()} />
            </td>
            <td className="px-4 py-3 font-medium text-surface-900">{row.name}</td>
            <td className="px-4 py-3 text-surface-700">{row.order}</td>
            {renderActions(node)}
          </tr>
        );
      }
    }
    return <tr key={index} />;
  };

  const labels = KIND_LABELS[kind];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Curriculum Nodes</h1>
          <p className="mt-1 text-sm text-surface-500">Edit or remove canonical curriculum nodes across boards, grades, subjects, chapters, topics and concepts.</p>
        </div>
        <div className="w-56">
          <Select value={kind} onValueChange={(v) => changeKind(v as NodeKind)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="boards">Boards</SelectItem>
              <SelectItem value="grades">Grades</SelectItem>
              <SelectItem value="subjects">Subjects</SelectItem>
              <SelectItem value="chapters">Chapters</SelectItem>
              <SelectItem value="topics">Topics</SelectItem>
              <SelectItem value="concepts">Concepts</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            {boardSelect && (
              <ParentSelect
                label="Board"
                value={boardId}
                onValueChange={changeBoard}
                placeholder="Select board"
                options={boards.map((b) => ({ value: b.id, label: b.name }))}
              />
            )}
            {gradeSelect && boardId && (
              <ParentSelect
                label="Grade"
                value={grade}
                onValueChange={changeGrade}
                placeholder="All grades"
                options={gradeNames.map((g) => ({ value: g, label: `Grade ${g}` }))}
              />
            )}
            {subjectSelect && boardId && (
              <ParentSelect
                label="Subject"
                value={subjectId}
                onValueChange={changeSubject}
                placeholder="Select subject"
                options={(subjectsQ.data ?? []).map((s) => ({ value: s.id, label: s.name }))}
              />
            )}
            {chapterSelect && subjectId && (
              <ParentSelect
                label="Chapter"
                value={chapterId}
                onValueChange={changeChapter}
                placeholder="Select chapter"
                options={(chaptersQ.data ?? []).map((c) => ({ value: c.id, label: `${c.code} · ${c.name}` }))}
              />
            )}
            {topicSelect && chapterId && (
              <ParentSelect
                label="Topic"
                value={topicId}
                onValueChange={changeTopic}
                placeholder="Select topic"
                options={(topicsQ.data ?? []).map((t) => ({ value: t.id, label: t.name }))}
              />
            )}
            <Button variant="outline" size="icon" onClick={() => void activeQ.refetch()} aria-label="Refresh">
              <RefreshCw className={cn('h-4 w-4', activeQ.isFetching && 'animate-spin')} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {missingParent ? (
        <Card className="py-14 text-center">
          <FolderTree className="mx-auto h-10 w-10 text-surface-300" />
          <p className="mt-4 text-sm font-medium text-surface-600">
            Select {PARENT_LABEL[kind === 'subjects' ? 'boardId' : kind === 'chapters' ? 'subjectId' : kind === 'topics' ? 'chapterId' : 'topicId']} to load {labels.plural.toLowerCase()}
          </p>
          <p className="mt-1 text-xs text-surface-400">Use the filters above to narrow the curriculum tree.</p>
        </Card>
      ) : activeQ.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : activeQ.error ? (
        <Card className="py-12 text-center">
          <p className="font-medium text-surface-800">Could not load {labels.plural.toLowerCase()}</p>
          <p className="mt-1 text-sm text-surface-500">{(activeQ.error as Error).message}</p>
          <Button className="mt-4" variant="outline" onClick={() => void activeQ.refetch()}>Retry</Button>
        </Card>
      ) : rows.length === 0 ? (
        <Card className="py-14 text-center">
          <FolderTree className="mx-auto h-10 w-10 text-surface-300" />
          <p className="mt-4 text-sm font-medium text-surface-500">No {labels.plural.toLowerCase()} found</p>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-surface-500">
                  {HEADERS[kind].map((h) => (
                    <th key={h || 'actions'} className={cn('px-4 py-3 font-medium', h === '' && 'text-right')}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((node, i) => renderRow(node, i))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-200 px-4 py-3">
            <p className="text-xs text-surface-500">
              {rows.length} {labels.plural.toLowerCase()} — {kind === 'grades' ? 'loaded from the super-admin curriculum tree for management' : 'from the scoped curriculum endpoints'}
            </p>
          </div>
        </Card>
      )}

      <EditNodeDialog
        kind={kind}
        node={editTarget}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSave={handleSaveNode}
        isSaving={updateNode.isPending}
        saveError={updateNode.error}
      />

      <Dialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {labels.singular.toLowerCase()}?</DialogTitle>
            <DialogDescription>
              {deleteTarget ? `"${deleteTarget.name}"` : 'This node'} will be permanently removed. Nodes that still contain children cannot be deleted.
            </DialogDescription>
          </DialogHeader>
          {deleteNode.error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {deleteNode.error.message}
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleteNode.isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteNode.isPending}>
              {deleteNode.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}