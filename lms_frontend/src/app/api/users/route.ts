import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS } from '@/lib/db';

/**
 * GET - Fetch all users or filter by role
 * Used by admin dashboard and teacher class management
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role'); // Filter by role
    const schoolId = searchParams.get('schoolId'); // Filter by school
    const requestingRole = searchParams.get('requestingRole'); // Who is making the request

    // Only teachers and admins can access user lists
    if (requestingRole !== 'teacher' && requestingRole !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const usersCollection = await getCollection(COLLECTIONS.USERS);
    const studentProfilesCollection = await getCollection(COLLECTIONS.STUDENT_PROFILES);

    // Build query
    const query: any = {};
    if (role) {
      query.role = role;
    }
    if (schoolId) {
      query.schoolId = schoolId;
    }

    // Fetch users
    const users = await usersCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    // If fetching students, join with student profiles
    if (role === 'student' || !role) {
      const profiles = await studentProfilesCollection.find({}).toArray();
      const profileMap = new Map();
      profiles.forEach((profile: any) => {
        profileMap.set(profile.studentMockId, profile);
      });

      const enrichedUsers = users.map(user => {
        if (user.role === 'student') {
          const profile = profileMap.get(user.mockUserId);
          return {
            ...user,
            studentProfile: profile ? {
              personalityTestCompleted: profile.personalityTestCompleted,
              oceanTraits: profile.oceanTraits,
              learningPreferences: profile.learningPreferences
            } : null
          };
        }
        return user;
      });

      return NextResponse.json({
        success: true,
        count: enrichedUsers.length,
        data: enrichedUsers
      });
    }

    return NextResponse.json({
      success: true,
      count: users.length,
      data: users
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch users',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update user information
 */
export async function PUT(request: NextRequest) {
  try {
    const { userId, mockUserId, updates, requestingRole } = await request.json();

    // Only admins can update user information
    if (requestingRole !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Only admins can update user information' },
        { status: 403 }
      );
    }

    if (!userId && !mockUserId) {
      return NextResponse.json(
        { success: false, error: 'userId or mockUserId is required' },
        { status: 400 }
      );
    }

    const usersCollection = await getCollection(COLLECTIONS.USERS);

    // Build query
    const query: any = {};
    if (userId) {
      query.userId = userId;
    } else {
      query.mockUserId = mockUserId;
    }

    // Update user
    const result = await usersCollection.updateOne(
      query,
      { 
        $set: {
          ...updates,
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
    const updatedUser = await usersCollection.findOne(query);

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a user
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const mockUserId = searchParams.get('mockUserId');
    const requestingRole = searchParams.get('requestingRole');

    // Only admins can delete users
    if (requestingRole !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Only admins can delete users' },
        { status: 403 }
      );
    }

    if (!userId && !mockUserId) {
      return NextResponse.json(
        { success: false, error: 'userId or mockUserId is required' },
        { status: 400 }
      );
    }

    const usersCollection = await getCollection(COLLECTIONS.USERS);
    const studentProfilesCollection = await getCollection(COLLECTIONS.STUDENT_PROFILES);

    // Build query
    const query: any = {};
    if (userId) {
      query.userId = userId;
    } else {
      query.mockUserId = mockUserId;
    }

    // Get user to check role
    const user = await usersCollection.findOne(query);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete user
    const result = await usersCollection.deleteOne(query);

    // If student, also delete profile
    if (user.role === 'student') {
      await studentProfilesCollection.deleteOne({ studentMockId: user.mockUserId });
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
      deletedUser: {
        mockUserId: user.mockUserId,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
