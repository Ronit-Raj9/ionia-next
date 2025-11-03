import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/sessionManager';

/**
 * Logout endpoint - Clear session cookie
 */
export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    // Clear the session cookie
    return clearSessionCookie(response);

  } catch (error) {
    console.error('Error during logout:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Logout failed'
      },
      { status: 500 }
    );
  }
}

