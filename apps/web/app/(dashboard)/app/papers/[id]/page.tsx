'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { usePaper } from '@/lib/api-hooks';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api';
import { Badge, Button, Card, ErrorBanner, Spinner } from '@/components/ui';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, ExternalLink, Download, Printer, FileText } from 'lucide-react';

export default function PaperDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const { data: paper, isLoading, error } = usePaper(id);
  const [creating, setCreating] = useState(false);
  const [exporting, setExporting] = useState(false);

  const validate = useQuery({
    queryKey: ['paper', id, 'validate'],
    queryFn: () => api<any>(`/papers/${id}/validate`, { token }),
    enabled: !!token && !!id,
  });

  if (isLoading) return <Spinner label="Loading paper…" />;
  if (error) return <ErrorBanner message={(error as Error).message} />;
  if (!paper) return null;

  const previewUrl = `/proxy/preview/${id}?token=${encodeURIComponent(token ?? '')}&kind=STUDENT`;
  const answerKeyUrl = `/proxy/preview/${id}?token=${encodeURIComponent(token ?? '')}&kind=ANSWER_KEY`;

  async function createAssessment() {
    setCreating(true);
    try {
      await router.push(`/app/assessments/new?paper=${id}`);
    } finally {
      setCreating(false);
    }
  }

  async function downloadPdf(kind: 'STUDENT' | 'ANSWER_KEY' = 'STUDENT') {
    setExporting(true);
    try {
      const result = await api<{ url: string; html?: string; engine?: string }>(`/papers/${id}/export`, {
        method: 'POST',
        token,
        body: { kind },
      });
      if (result.engine === 'html-fallback' && result.html) {
        const blob = new Blob([result.html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${paper.title.replace(/[^a-z0-9]/gi, '_')}_${kind}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else if (result.url) {
        if (result.url.endsWith('.pdf')) {
          const a = document.createElement('a');
          a.href = result.url;
          a.download = `${paper.title.replace(/[^a-z0-9]/gi, '_')}_${kind}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } else {
          window.open(result.url, '_blank');
        }
      }
    } catch (e) {
      toast.error('Unable to generate PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  function printPreview() {
    const iframe = document.querySelector('iframe[title="Paper preview"]') as HTMLIFrameElement;
    if (iframe?.contentWindow) {
      iframe.contentWindow.print();
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{paper.title}</h1>
          <p className="mt-1 text-sm text-surface-500">
            {paper.examName ?? ''} · {paper.subject?.name ?? '—'} · {paper.totalMarks ?? '—'} marks · {paper.durationMinutes ?? '—'} min ·{' '}
            <Badge>{paper.status}</Badge>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {validate.data ? (
            <span className="text-sm text-surface-500 mr-2">
              {validate.data.valid ? '✓ Valid' : '⚠ Needs attention'} · {validate.data.totalMarks ?? '—'} marks
            </span>
          ) : null}
          <Button onClick={createAssessment} loading={creating}>
            <ClipboardList className="h-4 w-4 mr-1" />
            Create Assessment
          </Button>
          <Button variant="outline" onClick={() => downloadPdf('STUDENT')} disabled={exporting}>
            <Download className="h-4 w-4 mr-1" />
            Download PDF
          </Button>
          <Button variant="outline" onClick={() => downloadPdf('ANSWER_KEY')} disabled={exporting}>
            <FileText className="h-4 w-4 mr-1" />
            Answer Key
          </Button>
          <Button variant="outline" onClick={printPreview}>
            <Printer className="h-4 w-4 mr-1" />
            Print
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <iframe src={previewUrl} title="Paper preview" className="h-[70vh] w-full" />
      </Card>
    </div>
  );
}