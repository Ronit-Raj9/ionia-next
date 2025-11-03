import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/sessionManager';

/**
 * POST - Unblock a user (set status to 'active')
 * SECURE: Requires superadmin authentication
 */
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Validate session from HTTP-only cookie
    const session = await getSessionFromRequest(request);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only superadmin and admin can unblock users
    if (!['superadmin', 'admin'].includes(session.role)) {
      return NextResponse.json(
        { success: false, error: 'Only superadmin and admin can unblock users' },
        { status: 403 }
      );
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    const usersCollection = await getCollection(COLLECTIONS.USERS);

    // Check if user exists
    const user = await usersCollection.findOne({ userId });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Admin can only unblock users from their own school
    if (session.role === 'admin') {
      if (!session.schoolId) {
        return NextResponse.json(
          { success: false, error: 'Admin must be assigned to a school' },
          { status: 403 }
        );
      }
      
      if (!user.schoolId || user.schoolId.toString() !== session.schoolId) {
        return NextResponse.json(
          { success: false, error: 'You can only unblock users from your own school' },
          { status: 403 }
        );
      }

      // Admin cannot unblock other admins (they should be managed by superadmin)
      if (user.role === 'admin') {
        return NextResponse.json(
          { success: false, error: 'You cannot unblock admin accounts' },
          { status: 403 }
        );
      }
    }

    // Update user status to active
    const result = await usersCollection.updateOne(
      { userId },
      { 
        $set: {
          status: 'active',
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Fetch updated user
    const updatedUser = await usersCollection.findOne(
      { userId },
      { projection: { password: 0 } }
    );

    return NextResponse.json({
      success: true,
      message: 'User unblocked successfully',
      data: updatedUser
    });

  } catch (error) {
    console.error('Error unblocking user:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to unblock user',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

