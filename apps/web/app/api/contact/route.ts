import { NextResponse } from 'next/server';
import { ContactLeadSchema } from '@sanro/validation';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'https://api.sanroai.com/api/v1';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = ContactLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const payload = {
    name: parsed.data.name,
    email: parsed.data.email,
    role: parsed.data.role,
    message: parsed.data.message,
    source: 'website',
  };

  try {
    const res = await fetch(`${API_URL}/site/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
      cache: 'no-store',
    });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { message: `Upstream error ${res.status}` },
        { status: 502 },
      );
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { message: 'Contact service unavailable' },
      { status: 503 },
    );
  }
}