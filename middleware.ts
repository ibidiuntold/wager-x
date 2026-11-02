// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;
    
    // Check maintenance mode (except for admin routes and maintenance page)
    if (!pathname.startsWith('/admin') && pathname !== '/maintenance') {
      if (process.env.APP_MAINTENANCE === 'true') {
        return NextResponse.redirect(new URL('/maintenance', request.url));
      }
    }

    // For admin routes, let the client handle the auth logic completely
    // This prevents redirect loops and allows RoleGuard to work properly
    if (pathname.startsWith('/admin')) {
      // Don't do any redirects in middleware for admin routes
      // This fixes the redirect loop issue
      return NextResponse.next();
    }

    // For all other routes
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    // Match all admin routes
    '/admin/:path*',
    // Match all routes except _next, api, static files, etc.
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ]
}