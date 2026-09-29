'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Spinner, ErrorBanner } from '@/components/ui';
import { BookOpen, ChevronDown, ChevronRight, Layers, FileText, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  useCreateCurriculumNode,
  useUpdateCurriculumNode,
  useDeleteCurriculumNode,
} from '@/lib/admin-curriculum-hooks';
import type { NodeKind } from '@/lib/admin-curriculum-hooks';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Board = {
  id: string;
  name: string;
  code: string;
  grades: { id: string; name: string; order: number }[];
  subjects: {
    id: string;
    name: string;
    code: string;
    grade?: string;
    chapters: {
      id: string;
      name: string;
      code: string;
      grade: string;
      topics: {
        id: string;
        name: string;
        concepts: { id: string; name: string }[];
      }[];
    }[];
  }[];
};

export default function CurriculumPage() {
  const token = useAuthStore((s) => s.token);
  const [expandedBoards, setExpandedBoards] = useState<Set<string>>(new Set());
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [dialogKind, setDialogKind] = useState<NodeKind>('subjects');
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [parentId, setParentId] = useState('');
  const [editingId, setEditingId] = useState('');
  const [editingGrade, setEditingGrade] = useState('');

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [deletingKind, setDeletingKind] = useState<NodeKind>('subjects');

  const [filterBoard, setFilterBoard] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const createMut = useCreateCurriculumNode(dialogKind);
  const updateMut = useUpdateCurriculumNode(dialogKind);
  const deleteMut = useDeleteCurriculumNode(deletingKind);

  function openCreate(kind: NodeKind, parentIdValue: string, grade?: string) {
    setDialogMode('create');
    setDialogKind(kind);
    setFormName('');
    setFormCode('');
    setParentId(parentIdValue);
    setEditingGrade(grade ?? '');
    setEditingId('');
    setDialogOpen(true);
  }

  function openEdit(kind: NodeKind, item: { id: string; name: string; code?: string; grade?: string }) {
    setDialogMode('edit');
    setDialogKind(kind);
    setFormName(item.name);
    setFormCode(item.code ?? '');
    setEditingId(item.id);
    setEditingGrade(item.grade ?? '');
    setDialogOpen(true);
  }

  function handleDialogSubmit() {
    if (!formName.trim()) return;

    if (dialogMode === 'create') {
      const body: Record<string, unknown> = { name: formName.trim() };
      if (dialogKind === 'subjects') {
        body.boardId = parentId;
        body.code = formCode.trim() || formName.trim().slice(0, 4).toUpperCase();
      } else if (dialogKind === 'chapters') {
        body.subjectId = parentId;
        body.code = formCode.trim() || formName.trim().slice(0, 6).toUpperCase();
        body.grade = editingGrade;
      } else if (dialogKind === 'topics') {
        body.chapterId = parentId;
      } else if (dialogKind === 'concepts') {
        body.topicId = parentId;
      }
      createMut.mutate(body, {
        onSuccess: () => setDialogOpen(false),
      });
    } else {
      const body: Record<string, unknown> = { name: formName.trim() };
      if (dialogKind === 'subjects' || dialogKind === 'chapters') {
        body.code = formCode.trim();
      }
      updateMut.mutate({ id: editingId, body }, {
        onSuccess: () => setDialogOpen(false),
      });
    }
  }

  function handleDelete() {
    if (!deletingId) return;
    deleteMut.mutate(deletingId, {
      onSuccess: () => setDeleteDialogOpen(false),
    });
  }

  const isMutLoading = createMut.isPending || updateMut.isPending || deleteMut.isPending;

  const { data, isLoading, error } = useQuery<Board[]>({
    queryKey: ['admin', 'curriculum'],
    queryFn: () => api<Board[]>('/admin/curriculum', { token }),
    enabled: !!token,
  });

  if (isLoading) return <Spinner label="Loading curriculum..." />;
  if (error) return <ErrorBanner message={(error as Error).message} />;

  const boards = data ?? [];

  const selectedBoard = filterBoard ? boards.find((b) => b.id === filterBoard) : null;
  const gradesForBoard = selectedBoard?.grades ?? [];
  const subjectsForGrade = selectedBoard?.subjects.filter(
    (s) => !filterGrade || s.chapters.some((c) => c.grade === filterGrade)
  ) ?? [];

  const filteredBoards = boards
    .filter((b) => !filterBoard || b.id === filterBoard)
    .map((board) => ({
      ...board,
      subjects: board.subjects
        .filter((s) => !filterGrade || s.chapters.some((c) => c.grade === filterGrade))
        .filter((s) => !filterSubject || s.id === filterSubject)
        .filter((s) => !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase())),
    }))
    .filter((b) => !searchQuery || b.name.toLowerCase().includes(searchQuery.toLowerCase()) || b.subjects.length > 0);

  function toggle(set: Set<string>, id: string, setter: (s: Set<string>) => void) {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setter(next);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Curriculum</h1>
        <p className="mt-1 text-sm text-surface-500">Manage boards, grades, subjects, chapters and concepts</p>
      </div>

      {boards.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <Select value={filterBoard} onValueChange={(v) => { setFilterBoard(v); setFilterGrade(''); setFilterSubject(''); }}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Boards" />
            </SelectTrigger>
            <SelectContent>
              {boards.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterGrade} onValueChange={(v) => { setFilterGrade(v); setFilterSubject(''); }} disabled={!filterBoard}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All Grades" />
            </SelectTrigger>
            <SelectContent>
              {gradesForBoard.map((g) => (
                <SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterSubject} onValueChange={setFilterSubject} disabled={!filterGrade}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Subjects" />
            </SelectTrigger>
            <SelectContent>
              {subjectsForGrade.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="pl-9 w-48"
            />
          </div>

          {(filterBoard || filterGrade || filterSubject || searchQuery) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setFilterBoard(''); setFilterGrade(''); setFilterSubject(''); setSearchQuery(''); }}
            >
              Clear filters
            </Button>
          )}
        </div>
      )}

      {boards.length === 0 ? (
        <Card className="py-16 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-surface-300" />
          <p className="mt-4 text-sm font-medium text-surface-500">No curriculum data</p>
        </Card>
      ) : filteredBoards.length === 0 ? (
        <Card className="py-16 text-center">
          <Search className="mx-auto h-12 w-12 text-surface-300" />
          <p className="mt-4 text-sm font-medium text-surface-500">No matching results</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredBoards.map((board) => (
            <Card key={board.id}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => toggle(expandedBoards, board.id, setExpandedBoards)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggle(expandedBoards, board.id, setExpandedBoards);
                  }
                }}
                className="flex w-full cursor-pointer items-center gap-3 p-4 text-left hover:bg-surface-50 transition-colors rounded-xl"
              >
                {expandedBoards.has(board.id) ? <ChevronDown className="h-5 w-5 text-surface-400" /> : <ChevronRight className="h-5 w-5 text-surface-400" />}
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-purple-600">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-surface-900">{board.name}</p>
                  <p className="text-xs text-surface-500">{board.code} · {board.grades.length} grades · {board.subjects.length} subjects</p>
                </div>
                <Badge variant="secondary">{board.subjects.reduce((a, s) => a + s.chapters.length, 0)} chapters</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2 h-8 w-8 p-0"
                  onClick={(e) => { e.stopPropagation(); openCreate('subjects', board.id); }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {expandedBoards.has(board.id) && (
                <div className="px-4 pb-4 space-y-3 ml-12">
                  {board.subjects.map((subject) => (
                    <div key={subject.id} className="rounded-xl border border-surface-100">
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => toggle(expandedSubjects, subject.id, setExpandedSubjects)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggle(expandedSubjects, subject.id, setExpandedSubjects);
                          }
                        }}
                        className="flex w-full cursor-pointer items-center gap-3 p-3 text-left hover:bg-surface-50 transition-colors rounded-xl"
                      >
                        {expandedSubjects.has(subject.id) ? <ChevronDown className="h-4 w-4 text-surface-400" /> : <ChevronRight className="h-4 w-4 text-surface-400" />}
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                          <FileText className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-surface-900 text-sm">{subject.name}</p>
                          <p className="text-xs text-surface-500">{subject.code} · {subject.chapters.length} chapters</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => { e.stopPropagation(); openCreate('chapters', subject.id, subject.grade); }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => { e.stopPropagation(); openEdit('subjects', subject); }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingKind('subjects');
                            setDeletingId(subject.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {expandedSubjects.has(subject.id) && (
                        <div className="px-3 pb-3 space-y-2 ml-8">
                          {subject.chapters.map((chapter) => (
                            <div key={chapter.id} className="rounded-lg border border-surface-50">
                              <div
                                role="button"
                                tabIndex={0}
                                onClick={() => toggle(expandedChapters, chapter.id, setExpandedChapters)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    toggle(expandedChapters, chapter.id, setExpandedChapters);
                                  }
                                }}
                                className="flex w-full cursor-pointer items-center gap-2 p-2 text-left hover:bg-surface-50 transition-colors rounded-lg"
                              >
                                {expandedChapters.has(chapter.id) ? <ChevronDown className="h-3 w-3 text-surface-400" /> : <ChevronRight className="h-3 w-3 text-surface-400" />}
                                <span className="text-sm font-medium text-surface-700">{chapter.name}</span>
                                <Badge variant="outline" className="text-xs ml-auto">{chapter.topics.length} topics</Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={(e) => { e.stopPropagation(); openCreate('topics', chapter.id); }}
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={(e) => { e.stopPropagation(); openEdit('chapters', chapter); }}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeletingKind('chapters');
                                    setDeletingId(chapter.id);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>

                              {expandedChapters.has(chapter.id) && (
                                <div className="px-2 pb-2 ml-6 space-y-1">
                                  {chapter.topics.map((topic) => (
                                    <div key={topic.id} className="rounded bg-surface-50 px-2 py-1">
                                      <div className="flex items-center gap-1">
                                        <p className="text-xs font-medium text-surface-700 flex-1">{topic.name}</p>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-5 w-5 p-0"
                                          onClick={() => openCreate('concepts', topic.id)}
                                        >
                                          <Plus className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-5 w-5 p-0"
                                          onClick={() => openEdit('topics', topic)}
                                        >
                                          <Pencil className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-5 w-5 p-0 text-red-500 hover:text-red-600"
                                          onClick={() => {
                                            setDeletingKind('topics');
                                            setDeletingId(topic.id);
                                            setDeleteDialogOpen(true);
                                          }}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                      {topic.concepts.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {topic.concepts.map((c) => (
                                            <Badge
                                              key={c.id}
                                              variant="outline"
                                              className="text-xs group cursor-pointer hover:bg-surface-100"
                                              onClick={() => openEdit('concepts', c)}
                                            >
                                              {c.name}
                                            </Badge>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                  {chapter.topics.length === 0 && (
                                    <p className="text-xs text-surface-400 italic">No topics yet</p>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'create' ? `Add ${dialogKind.charAt(0).toUpperCase() + dialogKind.slice(1, -1)}` : `Edit ${dialogKind.charAt(0).toUpperCase() + dialogKind.slice(1, -1)}`}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === 'create'
                ? `Create a new ${dialogKind.charAt(0).toUpperCase() + dialogKind.slice(1, -1).toLowerCase()} entry`
                : `Update the name and details`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="item-name">Name</Label>
              <Input
                id="item-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Enter name"
                onKeyDown={(e) => { if (e.key === 'Enter') handleDialogSubmit(); }}
              />
            </div>
            {(dialogKind === 'subjects' || dialogKind === 'chapters') && (
              <div className="space-y-2">
                <Label htmlFor="item-code">Code</Label>
                <Input
                  id="item-code"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="Auto-generated if empty"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isMutLoading}>Cancel</Button>
            <Button onClick={handleDialogSubmit} disabled={isMutLoading || !formName.trim()}>
              {createMut.isPending || updateMut.isPending ? 'Saving...' : dialogMode === 'create' ? 'Create' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deletingKind.charAt(0).toUpperCase() + deletingKind.slice(1, -1)}</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete this item.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isMutLoading}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isMutLoading}>
              {deleteMut.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
