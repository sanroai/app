'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import {
  useKnowledgeBaseStats,
  useKnowledgeBases,
  useProcessingJobs,
  useCreateKnowledgeBase,
  useProcessKnowledgeBase,
  useDeleteKnowledgeBase,
  useKnowledgeBase,
} from '@/lib/knowledge-base-hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner, ErrorBanner } from '@/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, FileText, Video, Globe, BookOpen, AlertCircle, CheckCircle2, Clock, Loader2, Trash2, RefreshCw } from 'lucide-react';

function KnowledgeBaseChunks({ id }: { id: string }) {
  const { data, isLoading, error } = useKnowledgeBase(id);
  if (isLoading) return <Spinner />;
  if (error) return <ErrorBanner message={(error as Error).message} />;
  if (!data) return null;
  if (data.chunks.length === 0) {
    return <p className="text-sm text-surface-500">No chunks yet.</p>;
  }
  return (
    <div className="space-y-2 mt-3">
      {data.chunks.slice(0, 10).map((chunk) => (
        <div key={chunk.id} className="rounded-lg bg-surface-50 p-3 text-sm text-surface-700">
          {chunk.content}
        </div>
      ))}
      {data.chunks.length > 10 && (
        <p className="text-xs text-surface-400">Showing 10 of {data.chunks.length} chunks</p>
      )}
    </div>
  );
}

export default function ContentProcessingPage() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState('overview');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [sourceType, setSourceType] = useState('PDF_BOOK');
  const [sourceUrl, setSourceUrl] = useState('');

  const stats = useKnowledgeBaseStats();
  const list = useKnowledgeBases();
  const jobs = useProcessingJobs();
  const createKb = useCreateKnowledgeBase();
  const processKb = useProcessKnowledgeBase();
  const deleteKb = useDeleteKnowledgeBase();

  if (user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold">Access Denied</h2>
        <p className="text-muted-foreground">This page is restricted to Super Administrators.</p>
      </div>
    );
  }

  const statsData = stats.data;
  const knowledgeBases = list.data ?? [];
  const totalForChart = statsData?.totalKnowledgeBases || 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Content Processing</h1>
        <p className="text-muted-foreground">Manage knowledge bases, process content, and generate curriculum materials.</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge Bases</TabsTrigger>
          <TabsTrigger value="processing">Processing Jobs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {stats.isLoading ? (
            <Spinner />
          ) : stats.error ? (
            <ErrorBanner message={(stats.error as Error).message} />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Knowledge Bases</CardTitle>
                    <Database className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{statsData?.totalKnowledgeBases ?? 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Chunks</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{statsData?.totalChunks ?? 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Processing</CardTitle>
                    <Loader2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{statsData?.byStatus?.PROCESSING ?? 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Published</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{statsData?.byStatus?.PUBLISHED ?? 0}</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Source Types</CardTitle>
                  <CardDescription>Content distribution by source</CardDescription>
                </CardHeader>
                <CardContent>
                  {Object.keys(statsData?.bySourceType ?? {}).length === 0 ? (
                    <p className="text-sm text-surface-500">No knowledge bases yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(statsData?.bySourceType ?? {}).map(([type, count]) => (
                        <div key={type} className="flex items-center gap-3">
                          {type === 'PDF_BOOK' && <BookOpen className="h-4 w-4 text-blue-500" />}
                          {type === 'VIDEO' && <Video className="h-4 w-4 text-red-500" />}
                          {type === 'NOTES' && <FileText className="h-4 w-4 text-green-500" />}
                          {type === 'WEBSITE' && <Globe className="h-4 w-4 text-purple-500" />}
                          {type === 'YOUTUBE' && <Video className="h-4 w-4 text-red-600" />}
                          <span className="text-sm font-medium flex-1">{type.replace('_', ' ')}</span>
                          <Progress value={(count / totalForChart) * 100} className="w-24" />
                          <span className="text-sm text-muted-foreground">{count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="knowledge" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Create Knowledge Base</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-1">
                  <Label htmlFor="kb-name">Name</Label>
                  <Input id="kb-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="NCERT Science Class 10" />
                </div>
                <div className="space-y-1">
                  <Label>Source type</Label>
                  <Select value={sourceType} onValueChange={setSourceType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PDF_BOOK">PDF Book</SelectItem>
                      <SelectItem value="VIDEO">Video</SelectItem>
                      <SelectItem value="NOTES">Notes</SelectItem>
                      <SelectItem value="WEBSITE">Website</SelectItem>
                      <SelectItem value="YOUTUBE">YouTube</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="kb-url">Source URL (optional)</Label>
                  <Input id="kb-url" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://..." />
                </div>
              </div>
              <Button
                disabled={!name.trim() || createKb.isPending}
                onClick={() => {
                  createKb.mutate(
                    { name: name.trim(), sourceType, sourceUrl: sourceUrl.trim() || undefined },
                    {
                      onSuccess: () => {
                        setName('');
                        setSourceUrl('');
                      },
                    },
                  );
                }}
              >
                {createKb.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Create Knowledge Base
              </Button>
              {createKb.error && <ErrorBanner message={(createKb.error as Error).message} />}
            </CardContent>
          </Card>

          {list.isLoading ? (
            <Spinner />
          ) : list.error ? (
            <ErrorBanner message={(list.error as Error).message} />
          ) : knowledgeBases.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-surface-500">
                No knowledge bases yet. Create one above to get started.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {knowledgeBases.map((kb) => (
                <Card key={kb.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{kb.name}</CardTitle>
                      <Badge variant={kb.status === 'PUBLISHED' ? 'default' : kb.status === 'PROCESSING' ? 'secondary' : 'outline'}>
                        {kb.status}
                      </Badge>
                    </div>
                    <CardDescription>
                      {kb.sourceType.replace('_', ' ')} • {kb._count.chunks} chunks • {kb._count.jobs} jobs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExpandedId(expandedId === kb.id ? null : kb.id)}
                      >
                        {expandedId === kb.id ? 'Hide Chunks' : 'View Chunks'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={processKb.isPending}
                        onClick={() => processKb.mutate(kb.id)}
                      >
                        Process
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600"
                        disabled={deleteKb.isPending}
                        onClick={() => {
                          if (window.confirm(`Delete "${kb.name}"?`)) deleteKb.mutate(kb.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> Delete
                      </Button>
                    </div>
                    {expandedId === kb.id && <KnowledgeBaseChunks id={kb.id} />}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="processing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Processing Queue</CardTitle>
              <CardDescription>Background content processing jobs</CardDescription>
            </CardHeader>
            <CardContent>
              {jobs.isLoading ? (
                <Spinner />
              ) : jobs.error ? (
                <ErrorBanner message={(jobs.error as Error).message} />
              ) : (jobs.data?.queue?.length ?? 0) === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2" />
                  <p>No active processing jobs</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {jobs.data?.queue.map((job) => (
                    <div key={job.id} className="flex items-center justify-between rounded-lg border border-surface-200 p-3">
                      <div>
                        <p className="text-sm font-medium">{job.type.replace('_', ' ')}</p>
                        <p className="text-xs text-surface-400">{job.id}</p>
                      </div>
                      <Badge variant={job.status === 'COMPLETED' ? 'default' : job.status === 'FAILED' ? 'destructive' : 'secondary'}>
                        {job.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
