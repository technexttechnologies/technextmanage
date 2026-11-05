import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = process.env.JWT_SECRET || 'technext-super-secret-key-2026';
const encodedKey = new TextEncoder().encode(SECRET_KEY);

const publicRoutes = ['/login', '/forgot-password', '/reset-password', '/api/sync/receive-aronium', '/api/sync-enquiries', '/api/cron/reminders', '/support'];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Allow public routes, public tracking links, customer portal, public bills/quotations, and API sync endpoints
  if (
    publicRoutes.includes(path) ||
    path.startsWith('/track/') ||
    path.startsWith('/portal/') ||
    path.startsWith('/request/') ||
    path.startsWith('/quotation/') ||
    path.startsWith('/api/sync') ||
    path.startsWith('/api/erp/aronium') ||
    path.startsWith('/api/razorpay')
  ) {
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
    const userEmail = ((payload.email as string) || '').toLowerCase().trim();
    const userName = ((payload.name as string) || '').toLowerCase().trim();
    const userId = (payload.userId as string) || '';

    const isTestUser =
      userEmail === 'test@technext' ||
      userEmail.startsWith('test@technext') ||
      userName === 'test' ||
      userId === 'cmw2z6xpa0001y5xm4g9lp30w';

    // TEST USER RESTRICTION (test@technext):
    // Completely hide and block all Company Financials, Company Assets, HR/Employees, and Settings
    if (isTestUser) {
      if (path === '/') {
        return NextResponse.redirect(new URL('/billing', request.url));
      }

      const testForbiddenPrefixes = [
        '/erp',
        '/employees',
        '/settings',
        '/users',
        '/reseller',
        '/integration',
        '/campaigns',
        '/sales',
      ];

      const isForbidden = testForbiddenPrefixes.some(
        prefix => path === prefix || path.startsWith(`${prefix}/`)
      );

      if (isForbidden) {
        return NextResponse.redirect(new URL('/billing', request.url));
      }
    }

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
