import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS, User } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/sessionManager';

/**
 * POST - Block a user (set status to 'inactive' or 'suspended')
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

    // Only superadmin and admin can block users
    if (!['superadmin', 'admin'].includes(session.role)) {
      return NextResponse.json(
        { success: false, error: 'Only superadmin and admin can block users' },
        { status: 403 }
      );
    }

    const { userId, reason, status = 'inactive' } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    // Validate status
    if (!['inactive', 'suspended'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status. Must be "inactive" or "suspended"' },
        { status: 400 }
      );
    }

    const usersCollection = await getCollection(COLLECTIONS.USERS);

    // Prevent blocking superadmin accounts
    const user = await usersCollection.findOne({ userId });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.role === 'superadmin') {
      return NextResponse.json(
        { success: false, error: 'Cannot block superadmin accounts' },
        { status: 403 }
      );
    }

    // Admin can only block users from their own school
    if (session.role === 'admin') {
      if (!session.schoolId) {
        return NextResponse.json(
          { success: false, error: 'Admin must be assigned to a school' },
          { status: 403 }
        );
      }
      
      if (!user.schoolId || user.schoolId.toString() !== session.schoolId) {
        return NextResponse.json(
          { success: false, error: 'You can only block users from your own school' },
          { status: 403 }
        );
      }

      // Admin cannot block other admins
      if (user.role === 'admin') {
        return NextResponse.json(
          { success: false, error: 'You cannot block admin accounts' },
          { status: 403 }
        );
      }
    }

    // Update user status
    const result = await usersCollection.updateOne(
      { userId },
      { 
        $set: {
          status,
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
      message: `User blocked successfully (status: ${status})`,
      data: updatedUser
    });

  } catch (error) {
    console.error('Error blocking user:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to block user',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

