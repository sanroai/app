import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPaths = ['/', '/login', '/register', '/forgot-password', '/about', '/features', '/for-students', '/for-teachers', '/for-schools', '/for-parents', '/pricing', '/contact', '/download', '/privacy', '/terms'];
const authPaths = ['/login', '/register', '/forgot-password'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths, API routes, static files, and assets
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/proxy/') ||
    pathname.includes('.') ||
    publicPaths.includes(pathname)
  ) {
    return NextResponse.next();
  }

  // For dashboard routes, check for auth token in cookie/localStorage
  // Since we use Zustand + localStorage (not cookies), we can't check server-side.
  // The dashboard layout handles client-side auth guard.
  // This middleware only prevents obvious unauthenticated access to known auth paths.
  if (authPaths.includes(pathname)) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};
