'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useQuestionList, useDeleteQuestion, type Question } from '@/lib/question-hooks';
import { useBoards, useGrades, useSubjects, type Board, type Subject } from '@/lib/api-hooks';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner, ErrorBanner } from '@/components/ui';
import { titleCase } from '@/lib/format';
import { Search, Plus, Trash2, ChevronLeft, ChevronRight, BookOpen, HelpCircle } from 'lucide-react';

const TYPE_COLORS: Record<string, string> = {
  MCQ: 'bg-blue-100 text-blue-700',
  TRUE_FALSE: 'bg-emerald-100 text-emerald-700',
  MULTI_SELECT: 'bg-violet-100 text-violet-700',
  FILL_BLANK: 'bg-amber-100 text-amber-700',
  VERY_SHORT_ANSWER: 'bg-pink-100 text-pink-700',
  SHORT_ANSWER: 'bg-orange-100 text-orange-700',
  LONG_ANSWER: 'bg-red-100 text-red-700',
  NUMERICAL: 'bg-cyan-100 text-cyan-700',
};

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: 'bg-green-100 text-green-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  HARD: 'bg-red-100 text-red-700',
};

function useChaptersList(subjectId: string | undefined) {
  const token = useAuthStore((s) => s.token);
  return useQuery<Array<{ id: string; name: string; grade: string }>>({
    queryKey: ['curriculum', 'chapters', subjectId],
    queryFn: () => api(`/curriculum/chapters?subjectId=${subjectId}`, { token }),
    enabled: !!token && !!subjectId,
  });
}

export default function QuestionsPage() {
  const user = useAuthStore((s) => s.user);
  const canManage = user?.role === 'TEACHER' || user?.role === 'INSTITUTION_ADMIN' || user?.role === 'SUPER_ADMIN';

  const [search, setSearch] = useState('');
  const [boardId, setBoardId] = useState('');
  const [grade, setGrade] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [type, setType] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [page, setPage] = useState(1);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const pageSize = 12;

  const { data: boards } = useBoards();
  const { data: grades } = useGrades(boardId || undefined);
  const { data: subjects } = useSubjects(boardId || undefined, grade || undefined);
  const { data: chapters } = useChaptersList(subjectId || undefined);

  const filters = useMemo(
    () => ({
      search: search || undefined,
      boardId: boardId || undefined,
      grade: grade || undefined,
      subjectId: subjectId || undefined,
      chapterId: chapterId || undefined,
      type: type || undefined,
      difficulty: difficulty || undefined,
      page,
      pageSize,
    }),
    [search, boardId, grade, subjectId, chapterId, type, difficulty, page],
  );

  const { data, isLoading, error } = useQuestionList(filters);
  const deleteMutation = useDeleteQuestion();

  function handleDelete(id: string) {
    setConfirmDeleteId(id);
  }

  function confirmDelete() {
    if (confirmDeleteId) {
      deleteMutation.mutate(confirmDeleteId);
      setConfirmDeleteId(null);
    }
  }

  function cancelDelete() {
    setConfirmDeleteId(null);
  }

  function resetFilters() {
    setSearch('');
    setBoardId('');
    setGrade('');
    setSubjectId('');
    setChapterId('');
    setType('');
    setDifficulty('');
    setPage(1);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Question Bank</h1>
          <p className="mt-1 text-sm text-surface-500">
            Browse and manage your question library
          </p>
        </div>
        {canManage && (
          <Link href="/app/questions/new">
            <Button>
              <Plus className="h-4 w-4" />
              Add Question
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
              <Input
                placeholder="Search questions..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>

            <Select value={boardId} onValueChange={(v) => { setBoardId(v); setGrade(''); setSubjectId(''); setChapterId(''); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="Board" />
              </SelectTrigger>
              <SelectContent>
                {(boards ?? []).map((b: Board) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={grade} onValueChange={(v) => { setGrade(v); setSubjectId(''); setChapterId(''); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="Grade" />
              </SelectTrigger>
              <SelectContent>
                {(grades ?? []).map((g: string) => (
                  <SelectItem key={g} value={g}>Grade {g}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={subjectId} onValueChange={(v) => { setSubjectId(v); setChapterId(''); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                {(subjects ?? []).map((s: Subject) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={chapterId} onValueChange={(v) => { setChapterId(v); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="Chapter" />
              </SelectTrigger>
              <SelectContent>
                {(chapters ?? []).map((c: { id: string; name: string }) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={type} onValueChange={(v) => { setType(v); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MCQ">MCQ</SelectItem>
                <SelectItem value="TRUE_FALSE">True / False</SelectItem>
                <SelectItem value="MULTI_SELECT">Multi Select</SelectItem>
                <SelectItem value="FILL_BLANK">Fill in the Blank</SelectItem>
                <SelectItem value="VERY_SHORT_ANSWER">Very Short Answer</SelectItem>
                <SelectItem value="SHORT_ANSWER">Short Answer</SelectItem>
                <SelectItem value="LONG_ANSWER">Long Answer</SelectItem>
                <SelectItem value="NUMERICAL">Numerical</SelectItem>
              </SelectContent>
            </Select>

            <Select value={difficulty} onValueChange={(v) => { setDifficulty(v); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EASY">Easy</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HARD">Hard</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={resetFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && <Spinner label="Loading questions..." />}
      {error && <ErrorBanner message={(error as Error).message} />}

      {!isLoading && !error && (
        <>
          {data && data.total === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <HelpCircle className="h-12 w-12 text-surface-300 mb-4" />
                <h3 className="text-lg font-semibold text-surface-700">No questions found</h3>
                <p className="mt-1 text-sm text-surface-500">
                  Try adjusting your filters or add a new question.
                </p>
                {canManage && (
                  <Link href="/app/questions/new" className="mt-4">
                    <Button>
                      <Plus className="h-4 w-4" />
                      Add Question
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              <p className="mb-3 text-sm text-surface-500">
                {data?.total ?? 0} question{(data?.total ?? 0) !== 1 ? 's' : ''} found
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(data?.data ?? []).map((q: Question) => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    canManage={canManage}
                    onDelete={handleDelete}
                    isConfirming={confirmDeleteId === q.id}
                    onConfirm={confirmDelete}
                    onCancel={cancelDelete}
                  />
                ))}
              </div>

              {data && data.pages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </Button>
                  <span className="text-sm text-surface-600">
                    Page {data.page} of {data.pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= data.pages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

function QuestionCard({
  question: q,
  canManage,
  onDelete,
  isConfirming,
  onConfirm,
  onCancel,
}: {
  question: Question;
  canManage: boolean;
  onDelete: (id: string) => void;
  isConfirming: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const isObjective = ['MCQ', 'TRUE_FALSE', 'MULTI_SELECT'].includes(q.type);

  return (
    <Card className="group relative">
      <CardContent className="p-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${TYPE_COLORS[q.type] ?? 'bg-surface-100 text-surface-700'}`}
          >
            {titleCase(q.type)}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${DIFFICULTY_COLORS[q.difficulty] ?? 'bg-surface-100 text-surface-700'}`}
          >
            {titleCase(q.difficulty)}
          </span>
          {q.marks != null && (
            <span className="text-xs text-surface-500">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
          )}
        </div>

        <p className="mb-3 line-clamp-2 text-sm text-surface-800">{q.text}</p>

        {isObjective && q.options.length > 0 && (
          <div className="mb-3 space-y-1">
            {q.options.slice(0, 2).map((opt, i) => (
              <div key={opt.id} className="flex items-start gap-2 text-xs text-surface-600">
                <span className="font-medium text-surface-400">{String.fromCharCode(65 + i)}.</span>
                <span className="line-clamp-1">{opt.text}</span>
              </div>
            ))}
            {q.options.length > 2 && (
              <span className="text-xs text-surface-400">
                +{q.options.length - 2} more option{q.options.length - 2 !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          {q.chapter && (
            <Badge variant="secondary" className="text-[10px]">
              <BookOpen className="mr-1 h-3 w-3" />
              {q.chapter.name}
            </Badge>
          )}
          {q.subject && (
            <Badge variant="secondary" className="text-[10px]">{q.subject.name}</Badge>
          )}
          {q.concept && (
            <Badge variant="secondary" className="text-[10px]">{q.concept.name}</Badge>
          )}
        </div>

        {canManage && (
          <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100">
            {isConfirming ? (
              <div className="flex items-center gap-1">
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={onConfirm}
                >
                  Confirm
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={onCancel}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-surface-400 hover:text-red-600"
                onClick={() => onDelete(q.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
