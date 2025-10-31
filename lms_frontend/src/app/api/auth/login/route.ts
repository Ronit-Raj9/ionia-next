import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS } from '@/lib/db';
import { verifyPassword } from '@/lib/authUtils';
import { createSessionResponse } from '@/lib/sessionManager';

/**
 * Login endpoint - Authenticate user with email and password
 * Creates secure HTTP-only cookie session
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email and password are required' 
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const usersCollection = await getCollection(COLLECTIONS.USERS);

    // Find user by email
    const user = await usersCollection.findOne({ email: email });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password (if user has password field)
    if (user.password) {
      if (!verifyPassword(password, user.password)) {
        return NextResponse.json(
          { success: false, error: 'Invalid email or password' },
          { status: 401 }
      );
      }
    } else {
      // Legacy user without password - for backward compatibility
      // In production, you might want to force password reset for these users
      console.warn(`User ${user.email} has no password set - legacy account`);
    }

    // Check if user is active
    if (user.status === 'inactive' || user.status === 'suspended') {
      return NextResponse.json(
        { success: false, error: `Your account is ${user.status}. Please contact support.` },
        { status: 403 }
      );
    }

    // Update last login
    await usersCollection.updateOne(
      { _id: user._id },
      { 
        $set: { 
          lastLogin: new Date(),
          updatedAt: new Date()
        }
      }
    );

    // Create session data (minimal, non-sensitive data only)
    const sessionData = {
      userId: user.userId,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId?.toString(),
      name: user.name,
    };

    // Create secure HTTP-only cookie session and return response
    return await createSessionResponse(sessionData, {
      success: true,
      message: 'Login successful',
      user: {
        _id: user._id?.toString(),
        role: user.role,
        userId: user.userId,
        name: user.name,
        email: user.email,
        displayName: user.displayName,
        classId: user.classId,
        schoolId: user.schoolId?.toString(),
        profileImage: user.profileImage,
        status: user.status,
        // Note: Sensitive data like password is NEVER returned
      }
    });

  } catch (error) {
    console.error('Error during login:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Login failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint removed for security reasons
 * 
 * SECURITY ISSUE: This endpoint allowed querying user data without authentication
 * 
 * Use /api/auth/session instead to get current authenticated user's data
 */
