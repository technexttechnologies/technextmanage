import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = process.env.JWT_SECRET || 'technext-super-secret-key-2026';
const encodedKey = new TextEncoder().encode(SECRET_KEY);

const publicRoutes = ['/login', '/api/sync/receive-aronium', '/api/sync-enquiries', '/api/cron/reminders', '/support'];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Allow public routes, public tracking links, customer portal, and API sync endpoints
  if (publicRoutes.includes(path) || path.startsWith('/track/') || path.startsWith('/portal/') || path.startsWith('/api/sync') || path.startsWith('/api/erp/aronium')) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionCookie = request.cookies.get('session')?.value;

  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Verify JWT in Edge environment
    const { payload } = await jwtVerify(sessionCookie, encodedKey, {
      algorithms: ['HS256'],
    });

    const userRole = (payload.role as string) || '';

    // SALE STAFF ACCESS RESTRICTION:
    // If user is SALES, they only have access to the Sales Portal and their operational workspace
    if (userRole === 'SALES') {
      // If sales staff attempts to access the root Admin Dashboard, send to /sales
      if (path === '/') {
        return NextResponse.redirect(new URL('/sales', request.url));
      }

      // Block admin management areas (Employee Directory and Company Attendance Roster)
      if (path === '/employees' || path === '/employees/attendance') {
        return NextResponse.redirect(new URL('/sales', request.url));
      }

      // Block Admin & ERP modules
      const adminOnlyPrefixes = [
        '/settings',
        '/erp',
        '/users',
        '/reseller',
        '/integration',
        '/campaigns',
      ];

      const isForbidden = adminOnlyPrefixes.some(
        prefix => path === prefix || path.startsWith(`${prefix}/`)
      );

      if (isForbidden) {
        return NextResponse.redirect(new URL('/sales', request.url));
      }
    }

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
