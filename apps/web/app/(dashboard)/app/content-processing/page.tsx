'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, FileText, Video, Globe, BookOpen, AlertCircle, CheckCircle2, Clock, Loader2 } from 'lucide-react';

const MOCK_STATS = {
  totalKnowledgeBases: 3,
  totalChunks: 847,
  byStatus: { DRAFT: 1, PROCESSING: 1, PUBLISHED: 1 },
  bySourceType: { PDF_BOOK: 1, VIDEO: 1, NOTES: 1 },
};

const MOCK_KBS = [
  { id: '1', name: 'NCERT Science Class 10', sourceType: 'PDF_BOOK', status: 'PUBLISHED', _count: { chunks: 423, jobs: 2 } },
  { id: '2', name: 'Physics Video Lectures', sourceType: 'VIDEO', status: 'PROCESSING', _count: { chunks: 234, jobs: 1 } },
  { id: '3', name: 'Math Formula Notes', sourceType: 'NOTES', status: 'DRAFT', _count: { chunks: 190, jobs: 0 } },
];

export default function ContentProcessingPage() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState('overview');

  if (user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold">Access Denied</h2>
        <p className="text-muted-foreground">This page is restricted to Super Administrators.</p>
      </div>
    );
  }

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
          <TabsTrigger value="import">Bulk Import</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Knowledge Bases</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{MOCK_STATS.totalKnowledgeBases}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Chunks</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{MOCK_STATS.totalChunks}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Processing</CardTitle>
                <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{MOCK_STATS.byStatus.PROCESSING || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Published</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{MOCK_STATS.byStatus.PUBLISHED || 0}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Source Types</CardTitle>
              <CardDescription>Content distribution by source</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(MOCK_STATS.bySourceType).map(([type, count]) => (
                  <div key={type} className="flex items-center gap-3">
                    {type === 'PDF_BOOK' && <BookOpen className="h-4 w-4 text-blue-500" />}
                    {type === 'VIDEO' && <Video className="h-4 w-4 text-red-500" />}
                    {type === 'NOTES' && <FileText className="h-4 w-4 text-green-500" />}
                    {type === 'WEBSITE' && <Globe className="h-4 w-4 text-purple-500" />}
                    <span className="text-sm font-medium flex-1">{type.replace('_', ' ')}</span>
                    <Progress value={(count / MOCK_STATS.totalKnowledgeBases) * 100} className="w-24" />
                    <span className="text-sm text-muted-foreground">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="knowledge" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Knowledge Bases</h2>
            <Button>Create Knowledge Base</Button>
          </div>
          <div className="grid gap-4">
            {MOCK_KBS.map((kb) => (
              <Card key={kb.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{kb.name}</CardTitle>
                    <Badge variant={kb.status === 'PUBLISHED' ? 'default' : kb.status === 'PROCESSING' ? 'secondary' : 'outline'}>
                      {kb.status}
                    </Badge>
                  </div>
                  <CardDescription>{kb.sourceType.replace('_', ' ')} • {kb._count.chunks} chunks • {kb._count.jobs} jobs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">View Chunks</Button>
                    <Button variant="outline" size="sm">Process</Button>
                    <Button variant="outline" size="sm" className="text-red-600">Delete</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="processing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Processing Queue</CardTitle>
              <CardDescription>Background content processing jobs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2" />
                <p>No active processing jobs</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Content Import</CardTitle>
              <CardDescription>Import PDF books, videos, and notes for processing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground mb-2">Drag and drop files here, or click to browse</p>
                <p className="text-xs text-muted-foreground">Supports PDF, MP4, DOCX, TXT up to 50MB</p>
                <Button className="mt-4" variant="outline">Select Files</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
