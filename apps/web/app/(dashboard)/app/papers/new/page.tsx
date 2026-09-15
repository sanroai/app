'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useBoards, useGrades, useSubjects } from '@/lib/api-hooks';
import { useAuthStore } from '@/lib/auth-store';
import { api, ApiError } from '@/lib/api';
import { Button, Card, ErrorBanner, Input, Label, Select } from '@/components/ui';
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
            <Label htmlFor="board">Board</Label>
            <Select id="board" value={boardId} onChange={(e) => { setBoardId(e.target.value); setGrade(''); setSubjectId(''); }}>
              <option value="">Select board…</option>
              {(boards ?? []).map((b: any) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="grade">Grade</Label>
            <Select id="grade" value={grade} onChange={(e) => { setGrade(e.target.value); setSubjectId(''); }} disabled={!boardId}>
              <option value="">Select grade…</option>
              {(grades ?? []).map((g) => (
                <option key={g} value={g}>Class {g}</option>
              ))}
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="subject">Subject</Label>
            <Select id="subject" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} disabled={!grade}>
              <option value="">Select subject…</option>
              {(subjects ?? []).map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <Label>Question distribution</Label>
          <div className="mt-1 space-y-2">
            {dist.map((d, i) => (
              <div key={d.type} className="flex items-center gap-3">
                <span className="w-24 text-sm font-medium text-slate-700">{d.type}</span>
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
                <span className="text-sm text-slate-500">marks</span>
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
          <p className="mt-2 text-sm text-slate-500">Total marks: <span className="font-semibold text-slate-800">{totalMarks}</span></p>
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