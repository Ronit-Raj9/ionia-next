import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Session configuration
const SESSION_COOKIE_NAME = 'ionia_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Lazy initialization - don't check JWT_SECRET at module load time
// This allows the module to be imported during build without requiring JWT_SECRET
// SECURITY: JWT_SECRET will be validated when functions are actually called
function getJwtSecret(): Uint8Array {
  if (!process.env.JWT_SECRET) {
    throw new Error(
      '❌ CRITICAL: JWT_SECRET not configured!\n' +
      '⚠️  Add JWT_SECRET to your .env.local file\n' +
      '💡 Generate one with: openssl rand -base64 32'
    );
  }
  return new TextEncoder().encode(process.env.JWT_SECRET);
}

export interface SessionData {
  userId: string;
  email: string;
  role: 'superadmin' | 'admin' | 'teacher' | 'student';
  schoolId?: string;
  name: string;
  exp?: number;
}

/**
 * Create a new session token
 */
export async function createSession(userData: SessionData): Promise<string> {
  const jwtSecret = getJwtSecret();
  const token = await new SignJWT({
    userId: userData.userId,
    email: userData.email,
    role: userData.role,
    schoolId: userData.schoolId,
    name: userData.name,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(jwtSecret);

  return token;
}

/**
 * Verify and decode a session token
 */
export async function verifySession(token: string): Promise<SessionData | null> {
  try {
    const jwtSecret = getJwtSecret();
    const verified = await jwtVerify(token, jwtSecret);
    const payload = verified.payload;
    
    // Validate payload has required fields
    if (!payload.userId || !payload.email || !payload.role || !payload.name) {
      console.error('Invalid session payload:', payload);
      return null;
    }
    
    return payload as unknown as SessionData;
  } catch (error) {
    console.error('Session verification failed:', error);
    return null;
  }
}

/**
 * Set session cookie (Server-side only)
 */
export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000, // Convert to seconds
    path: '/',
  });
  return response;
}

/**
 * Clear session cookie
 */
export function clearSessionCookie(response: NextResponse) {
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}

/**
 * Get session from request (Server-side)
 */
export async function getSessionFromRequest(request: NextRequest): Promise<SessionData | null> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  
  if (!token) {
    return null;
  }

  return await verifySession(token);
}

/**
 * Get session from cookies (Server Component)
 */
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  
  if (!token) {
    return null;
  }

  return await verifySession(token);
}

/**
 * Create session response helper
 */
export async function createSessionResponse(
  userData: SessionData,
  responseData: any
): Promise<NextResponse> {
  const token = await createSession(userData);
  const response = NextResponse.json(responseData);
  return setSessionCookie(response, token);
}

