import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected paths that require authentication
const protectedPaths = [
  '/admin',
  '/dashboard',
  '/profile',
  '/exam',
  '/practices',
  '/results',
];

// Define admin-only paths
const adminPaths = [
  '/admin/questions',
  '/admin/tests',
  '/admin/analytics',
  '/admin/settings',
];

// Define public paths that should redirect to dashboard if already authenticated
const authPaths = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
];

// Define paths that should be accessible without authentication
const publicPaths = [
  '/',
  '/about',
  '/contact',
  '/api/auth',
  '/_next',
  '/static',
  '/images',
  '/favicon.ico',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public paths
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Get tokens from cookies
  const accessToken = request.cookies.get('accessToken')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;
  const lastTokenRefresh = request.cookies.get('lastTokenRefresh')?.value;

  // Check if the path is protected
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));
  const isAdminPath = adminPaths.some(path => pathname.startsWith(path));
  const isAuthPath = authPaths.some(path => pathname.startsWith(path));

  // If accessing auth pages while logged in, redirect to dashboard
  if (isAuthPath && accessToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If accessing protected routes without token, redirect to login
  if (isProtectedPath && !accessToken) {
    const response = NextResponse.redirect(new URL('/auth/login', request.url));
    response.cookies.set({
      name: 'redirectTo',
      value: pathname,
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    return response;
  }

  // For admin paths, verify admin role from token
  if (isAdminPath) {
    try {
      if (!accessToken) {
        const response = NextResponse.redirect(new URL('/auth/login', request.url));
        response.cookies.set({
          name: 'redirectTo',
          value: pathname,
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
        });
        return response;
      }

      // Check if token needs refresh (e.g., if it's older than 30 minutes)
      const shouldRefresh = lastTokenRefresh && 
        (Date.now() - parseInt(lastTokenRefresh)) > 30 * 60 * 1000;

      if (shouldRefresh) {
        try {
          const refreshResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/refresh-token`, {
            method: 'POST',
            credentials: 'include',
            headers: {
              Cookie: request.headers.get('cookie') || '',
            },
          });

          if (!refreshResponse.ok) {
            throw new Error('Token refresh failed');
          }

          const data = await refreshResponse.json();
          if (data.data?.accessToken) {
            const response = NextResponse.next();
            response.cookies.set({
              name: 'accessToken',
              value: data.data.accessToken,
              path: '/',
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
            });
            response.cookies.set({
              name: 'lastTokenRefresh',
              value: Date.now().toString(),
              path: '/',
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
            });
            return response;
          }
        } catch (error) {
          console.error('Token refresh failed:', error);
          const response = NextResponse.redirect(new URL('/auth/login', request.url));
          response.cookies.set({
            name: 'redirectTo',
            value: pathname,
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
          });
          return response;
        }
      }
    } catch (error) {
      console.error('Admin path verification failed:', error);
      const response = NextResponse.redirect(new URL('/auth/login', request.url));
      response.cookies.set({
        name: 'redirectTo',
        value: pathname,
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 