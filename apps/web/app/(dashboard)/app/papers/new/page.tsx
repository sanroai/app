'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useBoards, useGrades, useSubjects, type Board, type Subject } from '@/lib/api-hooks';
import { useAuthStore } from '@/lib/auth-store';
import { api, ApiError } from '@/lib/api';
import { Button, Card, ErrorBanner, Input, Label } from '@/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Wand2 } from 'lucide-react';

const TYPE_LABELS = ['MCQ', 'SHORT', 'LONG'] as const;

export default function NewPaperPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const { data: boards } = useBoards();
  const [boardId, setBoardId] = useState('');
  const { data: grades } = useGrades(boardId);
  const [grade, setGrade] = useState('');
  const { data: subjects } = useSubjects(boardId, grade || undefined);

  const [title, setTitle] = useState('');
  const [examName, setExamName] = useState('Unit Test 1');
  const [subjectId, setSubjectId] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('120');
  const [dist, setDist] = useState([
    { type: 'MCQ', count: '10', marks: '1' },
    { type: 'SHORT', count: '5', marks: '2' },
    { type: 'LONG', count: '3', marks: '5' },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // The bank always answers first; the AI only writes the questions the bank is
  // short of (and they are saved as drafts for review, never silently published).
  const [useAI, setUseAI] = useState(false);

  const totalMarks = dist.reduce((sum, d) => sum + (Number(d.count) || 0) * (Number(d.marks) || 0), 0);

  async function generate() {
    setError(null);
    setSubmitting(true);
    try {
      const distribution = Object.fromEntries(
        dist.map((d) => [d.type, { count: Number(d.count), marks: Number(d.marks) }]),
      ) as Record<'MCQ' | 'SHORT' | 'LONG', { count: number; marks: number }>;
      const res = await api<{ paper: { id: string } }>('/papers', {
        method: 'POST',
        token,
        body: {
          title,
          examName,
          boardId,
          grade,
          subjectId,
          totalMarks,
          durationMinutes: Number(durationMinutes),
          distribution,
          language: 'EN',
          autoGenerateWithAI: useAI,
        },
      });
      router.push(`/app/papers/${res.paper.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Generate a question paper</h1>
      <Card className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="title">Paper title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Class 8 Science - Unit Test 1" />
          </div>
          <div>
            <Label htmlFor="examName">Exam name</Label>
            <Input id="examName" value={examName} onChange={(e) => setExamName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input id="duration" type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} />
          </div>
          <div>
            <Label>Board</Label>
            <Select value={boardId || 'NONE'} onValueChange={(v) => { const val = v === 'NONE' ? '' : v; setBoardId(val); setGrade(''); setSubjectId(''); }}>
              <SelectTrigger>
                <SelectValue placeholder="Select board…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Select board…</SelectItem>
                {(boards ?? []).map((b: Board) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Grade</Label>
            <Select value={grade || 'NONE'} onValueChange={(v) => { const val = v === 'NONE' ? '' : v; setGrade(val); setSubjectId(''); }} disabled={!boardId}>
              <SelectTrigger>
                <SelectValue placeholder="Select grade…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Select grade…</SelectItem>
                {(grades ?? []).map((g) => (
                  <SelectItem key={g} value={g}>Class {g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label>Subject</Label>
            <Select value={subjectId || 'NONE'} onValueChange={(v) => setSubjectId(v === 'NONE' ? '' : v)} disabled={!grade}>
              <SelectTrigger>
                <SelectValue placeholder="Select subject…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Select subject…</SelectItem>
                {(subjects ?? []).map((s: Subject) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>Question distribution</Label>
          <div className="mt-1 space-y-2">
            {dist.map((d, i) => (
              <div key={d.type} className="flex items-center gap-3">
                <span className="w-24 text-sm font-medium text-surface-700">{d.type}</span>
                <Input
                  type="number"
                  aria-label={`${d.type} count`}
                  value={d.count}
                  onChange={(e) => {
                    const next = [...dist];
                    next[i] = { ...next[i], count: e.target.value };
                    setDist(next);
                  }}
                />
                <span className="text-sm text-surface-500">marks</span>
                <Input
                  type="number"
                  aria-label={`${d.type} marks`}
                  value={d.marks}
                  onChange={(e) => {
                    const next = [...dist];
                    next[i] = { ...next[i], marks: e.target.value };
                    setDist(next);
                  }}
                />
              </div>
            ))}
          </div>
          <p className="mt-2 text-sm text-surface-500">Total marks: <span className="font-semibold text-surface-800">{totalMarks}</span></p>
        </div>

        <div className="rounded-xl border border-surface-200 bg-surface-50 p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={useAI}
              onChange={(e) => setUseAI(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-brand-600"
            />
            <span>
              <span className="block text-sm font-semibold text-surface-900">
                Let AI write the questions the bank is short of
              </span>
              <span className="mt-0.5 block text-xs text-surface-500">
                The question bank is always used first. Only the gap is generated, from the
                chapter you are closest to, and every generated question is saved as a{' '}
                <strong>draft</strong> for you to review before it reaches a student.
              </span>
            </span>
          </label>
        </div>

        <ErrorBanner message={error} />

        <Button onClick={generate} loading={submitting} className="w-full" disabled={!title || !boardId || !grade || !subjectId || totalMarks <= 0}>
          <Wand2 className="h-4 w-4" />
          Generate paper
        </Button>
      </Card>
    </div>
  );
}