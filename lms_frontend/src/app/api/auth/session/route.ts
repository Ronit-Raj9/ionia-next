import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/sessionManager';
import { getCollection, COLLECTIONS } from '@/lib/db';

/**
 * Get current session
 * Returns user data if session is valid
 */
export async function GET(request: NextRequest) {
  try {
    // Get session from cookie
    const session = await getSessionFromRequest(request);

    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated'
      }, { status: 401 });
    }

    // Fetch fresh user data from database
    const usersCollection = await getCollection(COLLECTIONS.USERS);
    const user = await usersCollection.findOne({ userId: session.userId });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // Check if account is still active
    if (user.status === 'inactive' || user.status === 'suspended') {
      return NextResponse.json({
        success: false,
        error: `Account is ${user.status}`
      }, { status: 403 });
    }

    // Return user data (no password!)
    return NextResponse.json({
      success: true,
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
        dashboardPreferences: user.dashboardPreferences,
      }
    });

  } catch (error) {
    console.error('Error getting session:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get session'
    }, { status: 500 });
  }
}

