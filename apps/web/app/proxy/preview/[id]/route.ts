import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
  ) {
  const { id } = await ctx.params;
  const token = req.nextUrl.searchParams.get('token');
  const kind = req.nextUrl.searchParams.get('kind') ?? 'STUDENT';
  const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.sanroai.com/api/v1';
  const res = await fetch(`${API}/papers/${id}/preview?kind=${kind}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  });
  if (!res.ok) {
    return NextResponse.json({ error: `Preview failed with status ${res.status}` }, { status: res.status });
  }
  const html = await res.text();
  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}