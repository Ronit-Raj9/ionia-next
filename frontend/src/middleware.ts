import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// JWT helper function for server-side token validation
function parseJWT(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Invalid JWT token:', error);
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const payload = parseJWT(token);
  if (!payload?.exp) return true;
  
  // Add 30-second buffer for network latency
  return Date.now() >= (payload.exp * 1000) - 30000;
}

// Define protected paths that require authentication
const protectedPaths = [
  '/admin',
  '/dashboard',
  '/profile',
  '/exam',
  '/practices',
  '/results',
];

// Define role-based path restrictions
const rolePaths = {
  superadmin: ['/admin'], // Can access everything
  admin: ['/admin'], // Can access admin routes
  user: [], // Can only access general protected routes
};

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
  '/manifest.json',
];

// Security headers for production
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

// CSP for enhanced security
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https:;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`.replace(/\s{2,}/g, ' ').trim();

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Add security headers to all responses
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Add CSP header in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Content-Security-Policy', cspHeader);
  }

  // Skip middleware for public paths
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return response;
  }

  // Get tokens from cookies (refresh token) and check for access token in request
  const refreshToken = request.cookies.get('refreshToken')?.value;

  // Check if the path requires authentication
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));
  const isAuthPath = authPaths.some(path => pathname.startsWith(path));
  const isAdminPath = pathname.startsWith('/admin');

  // Handle authentication paths
  if (isAuthPath) {
    // If user has valid refresh token, redirect to dashboard
    if (refreshToken && !isTokenExpired(refreshToken)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
    return response;
  }

  // Handle protected paths
  if (isProtectedPath) {
    // Check if user has valid refresh token
    if (!refreshToken || isTokenExpired(refreshToken)) {
      const loginResponse = NextResponse.redirect(new URL('/auth/login', request.url));
      
      // Set redirect cookie to return user to intended page after login
      loginResponse.cookies.set({
          name: 'redirectTo',
          value: pathname,
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 300, // 5 minutes
        });
      
      return loginResponse;
      }

    // For admin paths, verify admin role from refresh token
    if (isAdminPath) {
        try {
        const payload = parseJWT(refreshToken);
        const userRole = payload?.role || 'user';

        // Check if user has admin or superadmin role
        if (!['admin', 'superadmin'].includes(userRole)) {
          console.warn(`Access denied: User with role ${userRole} attempted to access ${pathname}`);
          
          const unauthorizedResponse = NextResponse.redirect(new URL('/dashboard', request.url));
          
          // Set error message cookie
          unauthorizedResponse.cookies.set({
            name: 'authError',
            value: 'Insufficient permissions to access this page',
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 10, // 10 seconds
          });
          
          return unauthorizedResponse;
      }
    } catch (error) {
        console.error('Role verification failed:', error);
        
        const errorResponse = NextResponse.redirect(new URL('/auth/login', request.url));
        errorResponse.cookies.set({
        name: 'redirectTo',
        value: pathname,
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 300,
      });
        
        return errorResponse;
    }
    }
  }

  // Add request tracking headers for debugging
  if (process.env.NODE_ENV === 'development') {
    response.headers.set('X-Middleware-Processed', 'true');
    response.headers.set('X-Request-Path', pathname);
    response.headers.set('X-Auth-Status', refreshToken ? 'authenticated' : 'unauthenticated');
  }

  return response;
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