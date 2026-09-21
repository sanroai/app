'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useBoards, useGrades, useSubjects, type Board, type Subject } from '@/lib/api-hooks';
import { useCreateQuestion } from '@/lib/question-hooks';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api';
import { Button, Card, ErrorBanner, Input, Label, Select } from '@/components/ui';
import { Textarea } from '@/components/ui/textarea';
import {
  Select as RadixSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';

type OptionDraft = { text: string; isCorrect: boolean };

const QUESTION_TYPES = [
  { value: 'MCQ', label: 'Multiple Choice (MCQ)' },
  { value: 'TRUE_FALSE', label: 'True / False' },
  { value: 'MULTI_SELECT', label: 'Multi Select' },
  { value: 'FILL_BLANK', label: 'Fill in the Blank' },
  { value: 'VERY_SHORT_ANSWER', label: 'Very Short Answer' },
  { value: 'SHORT_ANSWER', label: 'Short Answer' },
  { value: 'LONG_ANSWER', label: 'Long Answer' },
  { value: 'NUMERICAL', label: 'Numerical' },
];

const DIFFICULTIES = [
  { value: 'EASY', label: 'Easy' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HARD', label: 'Hard' },
];

function useChaptersList(subjectId: string | undefined) {
  const token = useAuthStore((s) => s.token);
  return useQuery<Array<{ id: string; name: string; grade: string }>>({
    queryKey: ['curriculum', 'chapters', subjectId],
    queryFn: () => api(`/curriculum/chapters?subjectId=${subjectId}`, { token }),
    enabled: !!token && !!subjectId,
  });
}

function useTopicsList(chapterId: string | undefined) {
  const token = useAuthStore((s) => s.token);
  return useQuery<Array<{ id: string; name: string; concepts: Array<{ id: string; name: string }> }>>({
    queryKey: ['curriculum', 'topics', chapterId],
    queryFn: () => api(`/curriculum/topics?chapterId=${chapterId}`, { token }),
    enabled: !!token && !!chapterId,
  });
}

export default function NewQuestionPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const createMutation = useCreateQuestion();

  const [boardId, setBoardId] = useState('');
  const [grade, setGrade] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [conceptId, setConceptId] = useState('');
  const [type, setType] = useState('MCQ');
  const [text, setText] = useState('');
  const [answer, setAnswer] = useState('');
  const [explanation, setExplanation] = useState('');
  const [hint, setHint] = useState('');
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [marks, setMarks] = useState('1');
  const [options, setOptions] = useState<OptionDraft[]>([
    { text: '', isCorrect: true },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ]);
  const [error, setError] = useState<string | null>(null);

  const { data: boards } = useBoards();
  const { data: grades } = useGrades(boardId || undefined);
  const { data: subjects } = useSubjects(boardId || undefined, grade || undefined);
  const { data: chapters } = useChaptersList(subjectId || undefined);
  const { data: topics } = useTopicsList(chapterId || undefined);

  const isObjective = ['MCQ', 'TRUE_FALSE', 'MULTI_SELECT'].includes(type);
  const needsOptions = type === 'MCQ' || type === 'MULTI_SELECT';

  function updateOption(index: number, field: keyof OptionDraft, value: string | boolean) {
    setOptions((prev) => prev.map((o, i) => (i === index ? { ...o, [field]: value } : o)));
  }

  function addOption() {
    setOptions((prev) => [...prev, { text: '', isCorrect: false }]);
  }

  function removeOption(index: number) {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!boardId || !grade || !subjectId || !chapterId) {
      setError('Please select board, grade, subject, and chapter.');
      return;
    }
    if (!text.trim()) {
      setError('Question text is required.');
      return;
    }
    if (isObjective && !answer.trim()) {
      setError('Answer is required.');
      return;
    }
    if (needsOptions) {
      const filled = options.filter((o) => o.text.trim());
      if (filled.length < 2) {
        setError('At least 2 options are required.');
        return;
      }
      if (!filled.some((o) => o.isCorrect)) {
        setError('At least one option must be marked as correct.');
        return;
      }
    }

    const concepts = topics?.flatMap((t) => t.concepts) ?? [];
    const selectedConcept = conceptId || concepts[0]?.id;

    const payload: Record<string, unknown> = {
      type,
      boardId,
      grade,
      subjectId,
      chapterId,
      conceptId: selectedConcept || undefined,
      difficulty,
      marks: Number(marks) || 1,
      text: text.trim(),
      answer: answer.trim() || (isObjective ? options.find((o) => o.isCorrect)?.text ?? '' : ''),
      explanation: explanation.trim() || undefined,
      hint: hint.trim() || undefined,
    };

    if (needsOptions) {
      payload.options = options
        .filter((o) => o.text.trim())
        .map((o) => ({ text: o.text.trim(), isCorrect: o.isCorrect }));
    }

    createMutation.mutate(payload, {
      onSuccess: () => router.push('/app/questions'),
      onError: (err: Error) => setError(err.message),
    });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/app/questions" className="mb-4 inline-flex items-center gap-1 text-sm text-surface-500 hover:text-surface-900">
        <ArrowLeft className="h-4 w-4" />
        Back to Question Bank
      </Link>

      <h1 className="mb-6 text-2xl font-bold">Create Question</h1>

      <form onSubmit={handleSubmit}>
        <Card className="space-y-5">
          {/* Curriculum selectors */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="board">Board</Label>
              <Select id="board" value={boardId} onChange={(e) => { setBoardId(e.target.value); setGrade(''); setSubjectId(''); setChapterId(''); setConceptId(''); }}>
                <option value="">Select board...</option>
                {(boards ?? []).map((b: Board) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="grade">Grade</Label>
              <Select id="grade" value={grade} onChange={(e) => { setGrade(e.target.value); setSubjectId(''); setChapterId(''); setConceptId(''); }} disabled={!boardId}>
                <option value="">Select grade...</option>
                {(grades ?? []).map((g) => (
                  <option key={g} value={g}>Class {g}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Select id="subject" value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setChapterId(''); setConceptId(''); }} disabled={!grade}>
                <option value="">Select subject...</option>
                {(subjects ?? []).map((s: Subject) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="chapter">Chapter</Label>
              <Select id="chapter" value={chapterId} onChange={(e) => { setChapterId(e.target.value); setConceptId(''); }} disabled={!subjectId}>
                <option value="">Select chapter...</option>
                {(chapters ?? []).map((c: { id: string; name: string }) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </div>
            {topics && topics.length > 0 && (
              <div className="sm:col-span-2">
                <Label htmlFor="concept">Concept (optional)</Label>
                <Select id="concept" value={conceptId} onChange={(e) => setConceptId(e.target.value)} disabled={!chapterId}>
                  <option value="">Select concept...</option>
                  {topics.flatMap((t) => t.concepts).map((c: { id: string; name: string }) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              </div>
            )}
          </div>

          {/* Question type & meta */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>Question Type</Label>
              <RadixSelect value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUESTION_TYPES.map((qt) => (
                    <SelectItem key={qt.value} value={qt.value}>{qt.label}</SelectItem>
                  ))}
                </SelectContent>
              </RadixSelect>
            </div>
            <div>
              <Label>Difficulty</Label>
              <RadixSelect value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map((d) => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </RadixSelect>
            </div>
            <div>
              <Label htmlFor="marks">Marks</Label>
              <Input id="marks" type="number" min={1} value={marks} onChange={(e) => setMarks(e.target.value)} />
            </div>
          </div>

          {/* Question text */}
          <div>
            <Label htmlFor="text">Question Text</Label>
            <Textarea
              id="text"
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type the question here..."
              className="mt-1"
            />
          </div>

          {/* Options (MCQ / Multi Select) */}
          {needsOptions && (
            <div>
              <Label>Options</Label>
              <p className="mb-2 text-xs text-surface-500">Select the radio button next to the correct answer.</p>
              <div className="space-y-2">
                {options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={opt.isCorrect}
                      onChange={() => setOptions((prev) => prev.map((o, j) => ({ ...o, isCorrect: j === i })))}
                      className="h-4 w-4 text-brand-600"
                    />
                    <Input
                      placeholder={`Option ${String.fromCharCode(65 + i)}`}
                      value={opt.text}
                      onChange={(e) => updateOption(i, 'text', e.target.value)}
                    />
                    {options.length > 2 && (
                      <Button type="button" variant="ghost" className="h-9 w-9 shrink-0 px-0 text-surface-400 hover:text-red-600" onClick={() => removeOption(i)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button type="button" variant="ghost" className="mt-2" onClick={addOption}>
                <Plus className="h-4 w-4" />
                Add option
              </Button>
            </div>
          )}

          {/* Answer */}
          <div>
            <Label htmlFor="answer">Answer</Label>
            <Textarea
              id="answer"
              rows={3}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={isObjective ? 'Correct answer text...' : 'Type the model answer...'}
              className="mt-1"
            />
          </div>

          {/* Explanation & Hint */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="explanation">Explanation (optional)</Label>
              <Textarea
                id="explanation"
                rows={3}
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Explain why this is the correct answer..."
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="hint">Hint (optional)</Label>
              <Textarea
                id="hint"
                rows={3}
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                placeholder="A hint for students..."
                className="mt-1"
              />
            </div>
          </div>

          <ErrorBanner message={error} />

          <div className="flex items-center gap-3">
            <Button type="submit" loading={createMutation.isPending}>
              Create Question
            </Button>
            <Link href="/app/questions">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
          </div>
        </Card>
      </form>
    </div>
  );
}
