import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = process.env.JWT_SECRET || 'technext-super-secret-key-2026';
const encodedKey = new TextEncoder().encode(SECRET_KEY);

const publicRoutes = ['/login', '/api/sync/receive-aronium', '/api/sync-enquiries', '/api/cron/reminders'];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Allow public routes and public tracking links
  if (publicRoutes.includes(path) || path.startsWith('/track/')) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionCookie = request.cookies.get('session')?.value;

  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Verify JWT in Edge environment
    await jwtVerify(sessionCookie, encodedKey, {
      algorithms: ['HS256'],
    });
    return NextResponse.next();
  } catch (err) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
