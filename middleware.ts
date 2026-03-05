import { auth } from '@/auth';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function middleware(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;

  // Public routes
  if (pathname === '/login' || pathname === '/signup') {
    if (session?.user) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Protected routes
  if (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/students') ||
    pathname.startsWith('/attendance') ||
    pathname.startsWith('/reports') ||
    pathname.startsWith('/admin')
  ) {
    if (!session?.user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
