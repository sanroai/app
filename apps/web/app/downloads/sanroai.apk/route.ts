import { readFile } from 'fs/promises';
import { join } from 'path';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const filePath = join(process.cwd(), 'public', 'downloads', 'sanroai.apk');
  const fileBuffer = await readFile(filePath);

  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': 'application/vnd.android.package-archive',
      'Content-Disposition': 'attachment; filename="sanroai.apk"',
      'Content-Length': String(fileBuffer.length),
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
}