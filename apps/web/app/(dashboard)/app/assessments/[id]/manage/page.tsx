'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAssessment, useGroups, type Group } from '@/lib/api-hooks';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api';
import { Badge, Button, Card, ErrorBanner, Spinner } from '@/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDate, titleCase } from '@/lib/format';
import { ArrowLeft, ClipboardCheck, Send } from 'lucide-react';

export default function ManageAssessmentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const { data, isLoading, error } = useAssessment(id);
  const { data: groups } = useGroups();
  const [groupId, setGroupId] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishMsg, setPublishMsg] = useState<string | null>(null);
  const queryClient = useQueryClient();

  if (isLoading) return <Spinner label="Loading assessment…" />;
  if (error) return <ErrorBanner message={(error as Error).message} />;
  if (!data) return null;

  const assessment = data.assessment;
  const questions = data.questions ?? [];

  async function publish() {
    if (!groupId) return;
    setPublishing(true);
    setPublishMsg(null);
    try {
      await api(`/assessments/${id}/publish`, {
        method: 'POST',
        token,
        body: { assessmentId: id, groupIds: [groupId], studentIds: [] },
      });
      await queryClient.invalidateQueries({ queryKey: ['assessment', id] });
      setPublishMsg('Published to the group.');
    } catch (e) {
      setPublishMsg(e instanceof Error ? e.message : 'Publish failed');
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <button onClick={() => router.push('/app/assessments')} className="mb-3 inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-800">
          <ArrowLeft className="h-4 w-4" />
          Back to Assessments
        </button>
        <h1 className="text-2xl font-bold">{assessment.title}</h1>
        <p className="mt-1 text-sm text-surface-500">
          {assessment.subject?.name ?? '—'} · {assessment.totalMarks} marks · {assessment.durationMinutes} min ·{' '}
          <Badge>{assessment.status}</Badge>
        </p>
        <div className="mt-3">
          <Button variant="outline" onClick={() => router.push(`/app/assessments/${id}/grading`)}>
            <ClipboardCheck className="h-4 w-4" />
            Grade attempts
          </Button>
        </div>
      </div>

      <Card>
        <h2 className="mb-3 text-lg font-semibold">Publish</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-56 flex-1">
            <label className="mb-1 block text-sm font-medium text-surface-700">Assign to group</label>
            <Select value={groupId || 'NONE'} onValueChange={(v) => setGroupId(v === 'NONE' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a group…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Select a group…</SelectItem>
                {(groups ?? []).map((g: Group) => (
                  <SelectItem key={g.id} value={g.id}>{g.name}{g.grade ? ` (Class ${g.grade})` : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={publish} loading={publishing} disabled={!groupId}>
            <Send className="h-4 w-4" />
            Publish
          </Button>
        </div>
        {publishMsg ? (
          <p className={`mt-2 text-sm ${publishMsg === 'Published to the group.' ? 'text-green-600' : 'text-red-600'}`}>{publishMsg}</p>
        ) : null}
        {assessment.createdAt ? <p className="mt-2 text-xs text-surface-400">Created {formatDate(assessment.createdAt)}</p> : null}
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Questions ({questions.length})</h2>
        <div className="space-y-2">
          {questions.map((q: { id: string; text: string; type: string; marks: number; options?: Array<{ id: string; text: string; isCorrect?: boolean }>; conceptId?: string }, idx: number) => (
            <Card key={q.id} className="py-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-surface-800">
                  <span className="mr-2 text-surface-400">{idx + 1}.</span>
                  {q.text}
                </p>
                <Badge className="shrink-0 bg-surface-100 text-surface-600">{q.type} · {q.marks}</Badge>
              </div>
              {q.options && Array.isArray(q.options) && q.options.length > 0 ? (
                <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                  {q.options.map((o, oi) => (
                    <li key={oi} className="truncate text-xs text-surface-500">
                      {String.fromCharCode(65 + oi)}. {o.text}
                    </li>
                  ))}
                </ul>
              ) : null}
              {q.conceptId ? <p className="mt-2 text-xs text-surface-400">Concept: {q.conceptId}</p> : null}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}