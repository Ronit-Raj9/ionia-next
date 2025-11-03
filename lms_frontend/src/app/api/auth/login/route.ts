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
    // Validate environment variables
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not configured');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Server configuration error',
          details: process.env.NODE_ENV === 'development' ? 'JWT_SECRET is not configured in environment variables' : undefined
        },
        { status: 500 }
      );
    }

    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI is not configured');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Server configuration error',
          details: process.env.NODE_ENV === 'development' ? 'MONGODB_URI is not configured in environment variables' : undefined
        },
        { status: 500 }
      );
    }

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

    let usersCollection;
    try {
      usersCollection = await getCollection(COLLECTIONS.USERS);
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database connection error',
          details: process.env.NODE_ENV === 'development' ? (dbError instanceof Error ? dbError.message : 'Unable to connect to database') : undefined
        },
        { status: 500 }
      );
    }

    // Find user by email
    let user;
    try {
      user = await usersCollection.findOne({ email: email });
    } catch (queryError) {
      console.error('Database query error:', queryError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database query error',
          details: process.env.NODE_ENV === 'development' ? (queryError instanceof Error ? queryError.message : 'Failed to query database') : undefined
        },
        { status: 500 }
      );
    }

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

    // Update last login (non-blocking - don't fail login if this fails)
    try {
      await usersCollection.updateOne(
        { _id: user._id },
        { 
          $set: { 
            lastLogin: new Date(),
            updatedAt: new Date()
          }
        }
      );
    } catch (updateError) {
      console.warn('Failed to update last login timestamp:', updateError);
      // Continue with login even if update fails
    }

    // Create session data (minimal, non-sensitive data only)
    const sessionData = {
      userId: user.userId || user._id?.toString() || '',
      email: user.email,
      role: user.role,
      schoolId: user.schoolId?.toString(),
      name: user.name || user.displayName || user.email,
    };

    // Validate required session fields
    if (!sessionData.userId || !sessionData.email || !sessionData.role || !sessionData.name) {
      console.error('Invalid user data for session creation:', sessionData);
      return NextResponse.json(
        { 
          success: false, 
          error: 'User data validation failed',
          details: process.env.NODE_ENV === 'development' ? 'User record is missing required fields' : undefined
        },
        { status: 500 }
      );
    }

    // Create secure HTTP-only cookie session and return response
    try {
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
    } catch (sessionError) {
      console.error('Session creation error:', sessionError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to create session',
          details: process.env.NODE_ENV === 'development' ? (sessionError instanceof Error ? sessionError.message : 'Session creation failed') : undefined
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error during login:', error);
    
    // Provide more helpful error messages
    let errorMessage = 'Login failed';
    let errorDetails = error instanceof Error ? error.message : 'Unknown error';
    
    // Check for common issues
    if (error instanceof Error) {
      if (error.message.includes('MongoClient') || error.message.includes('MongoDB')) {
        errorMessage = 'Database connection error';
        errorDetails = 'Unable to connect to database. Please check your MongoDB connection.';
      } else if (error.message.includes('JWT_SECRET')) {
        errorMessage = 'Server configuration error';
        errorDetails = 'JWT secret is not configured. Please check server environment variables.';
      }
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
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
