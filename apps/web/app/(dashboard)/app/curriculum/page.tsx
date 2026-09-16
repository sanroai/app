'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner, ErrorBanner } from '@/components/ui';
import { BookOpen, ChevronDown, ChevronRight, Layers, FileText } from 'lucide-react';
import { cn } from '@/lib/cn';

type Board = {
  id: string;
  name: string;
  code: string;
  grades: { id: string; name: string; order: number }[];
  subjects: {
    id: string;
    name: string;
    code: string;
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

  const { data, isLoading, error } = useQuery<Board[]>({
    queryKey: ['admin', 'curriculum'],
    queryFn: () => api<Board[]>('/admin/curriculum', { token }),
    enabled: !!token,
  });

  if (isLoading) return <Spinner label="Loading curriculum..." />;
  if (error) return <ErrorBanner message={(error as Error).message} />;

  const boards = data ?? [];

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

      {boards.length === 0 ? (
        <Card className="py-16 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-surface-300" />
          <p className="mt-4 text-sm font-medium text-surface-500">No curriculum data</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {boards.map((board) => (
            <Card key={board.id}>
              <button
                onClick={() => toggle(expandedBoards, board.id, setExpandedBoards)}
                className="flex w-full items-center gap-3 p-4 text-left hover:bg-surface-50 transition-colors rounded-xl"
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
              </button>

              {expandedBoards.has(board.id) && (
                <div className="px-4 pb-4 space-y-3 ml-12">
                  {board.subjects.map((subject) => (
                    <div key={subject.id} className="rounded-xl border border-surface-100">
                      <button
                        onClick={() => toggle(expandedSubjects, subject.id, setExpandedSubjects)}
                        className="flex w-full items-center gap-3 p-3 text-left hover:bg-surface-50 transition-colors rounded-xl"
                      >
                        {expandedSubjects.has(subject.id) ? <ChevronDown className="h-4 w-4 text-surface-400" /> : <ChevronRight className="h-4 w-4 text-surface-400" />}
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                          <FileText className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-surface-900 text-sm">{subject.name}</p>
                          <p className="text-xs text-surface-500">{subject.code} · {subject.chapters.length} chapters</p>
                        </div>
                      </button>

                      {expandedSubjects.has(subject.id) && (
                        <div className="px-3 pb-3 space-y-2 ml-8">
                          {subject.chapters.map((chapter) => (
                            <div key={chapter.id} className="rounded-lg border border-surface-50">
                              <button
                                onClick={() => toggle(expandedChapters, chapter.id, setExpandedChapters)}
                                className="flex w-full items-center gap-2 p-2 text-left hover:bg-surface-50 transition-colors rounded-lg"
                              >
                                {expandedChapters.has(chapter.id) ? <ChevronDown className="h-3 w-3 text-surface-400" /> : <ChevronRight className="h-3 w-3 text-surface-400" />}
                                <span className="text-sm font-medium text-surface-700">{chapter.name}</span>
                                <Badge variant="outline" className="text-xs ml-auto">{chapter.topics.length} topics</Badge>
                              </button>

                              {expandedChapters.has(chapter.id) && (
                                <div className="px-2 pb-2 ml-6 space-y-1">
                                  {chapter.topics.map((topic) => (
                                    <div key={topic.id} className="rounded bg-surface-50 px-2 py-1">
                                      <p className="text-xs font-medium text-surface-700">{topic.name}</p>
                                      {topic.concepts.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {topic.concepts.map((c) => (
                                            <Badge key={c.id} variant="outline" className="text-xs">{c.name}</Badge>
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
    </div>
  );
}
